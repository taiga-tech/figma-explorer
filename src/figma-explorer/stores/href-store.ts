import { detectDraftsPage } from "../../features/scan/detect-drafts-page"
import { applyPageInset } from "../utils/apply-page-inset"

const hrefListeners = new Set<() => void>()

let currentHref = window.location.href
let locationMonitorStarted = false

const syncHrefState = () => {
  const nextHref = window.location.href

  if (currentHref === nextHref) {
    return
  }

  currentHref = nextHref
  applyPageInset(detectDraftsPage(currentHref))

  hrefListeners.forEach((listener) => {
    listener()
  })
}

const startLocationMonitor = () => {
  if (locationMonitorStarted) {
    return
  }

  locationMonitorStarted = true

  const notifyHrefChange = () => {
    queueMicrotask(syncHrefState)
  }

  const originalPushState = window.history.pushState.bind(window.history)
  const originalReplaceState = window.history.replaceState.bind(window.history)

  window.history.pushState = (...args) => {
    const result = originalPushState(...args)
    notifyHrefChange()
    return result
  }

  window.history.replaceState = (...args) => {
    const result = originalReplaceState(...args)
    notifyHrefChange()
    return result
  }

  window.addEventListener("popstate", notifyHrefChange)
  window.addEventListener("hashchange", notifyHrefChange)

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncHrefState, { once: true })
  } else {
    applyPageInset(detectDraftsPage(currentHref))
  }
}

export const subscribeToHref = (listener: () => void) => {
  startLocationMonitor()
  hrefListeners.add(listener)

  return () => {
    hrefListeners.delete(listener)
  }
}

export const getHrefSnapshot = () => currentHref
