const injectConfiguredContentScripts = async () => {
  const contentScripts = chrome.runtime.getManifest().content_scripts ?? []

  await Promise.all(
    contentScripts.map(async ({ css = [], js = [], matches = [] }) => {
      if (matches.length === 0 || (css.length === 0 && js.length === 0)) {
        return
      }

      const tabs = await chrome.tabs.query({ url: matches })

      await Promise.all(
        tabs.map(async ({ id: tabId }) => {
          if (tabId === undefined) {
            return
          }

          try {
            if (css.length > 0) {
              await chrome.scripting.insertCSS({
                files: css,
                target: { tabId }
              })
            }

            if (js.length > 0) {
              await chrome.scripting.executeScript({
                files: js,
                target: { tabId }
              })
            }
          } catch (error) {
            console.warn("Failed to reinject content script into an open tab", {
              error,
              tabId
            })
          }
        })
      )
    })
  )
}

const injectRegisteredContentScripts = async () => {
  const registeredScripts = await chrome.scripting.getRegisteredContentScripts()

  await Promise.all(
    registeredScripts.map(async ({ js = [], matches = [], world }) => {
      if (matches.length === 0 || js.length === 0) {
        return
      }

      const tabs = await chrome.tabs.query({ url: matches })

      await Promise.all(
        tabs.map(async ({ id: tabId }) => {
          if (tabId === undefined) {
            return
          }

          try {
            await chrome.scripting.executeScript({
              files: js,
              target: { tabId },
              world
            })
          } catch (error) {
            console.warn(
              "Failed to reinject registered content script into an open tab",
              { error, tabId }
            )
          }
        })
      )
    })
  )
}

chrome.runtime.onInstalled.addListener(() => {
  void injectConfiguredContentScripts()
  void injectRegisteredContentScripts()
})
