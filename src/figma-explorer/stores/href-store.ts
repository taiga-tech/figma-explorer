import { detectDraftsPage } from "../../features/scan/detect-drafts-page"
import { applyPageInset } from "../utils/apply-page-inset"

const hrefListeners = new Set<() => void>()
const navigationWithEvents = window as Window & {
  navigation?: EventTarget
}

let currentHref = window.location.href
let locationMonitorStarted = false
let hrefSyncScheduled = false

const syncHrefState = (force = false) => {
  const nextHref = window.location.href

  if (!force && currentHref === nextHref) {
    return
  }

  currentHref = nextHref
  applyPageInset(detectDraftsPage(currentHref))

  hrefListeners.forEach((listener) => {
    listener()
  })
}

const scheduleHrefSync = () => {
  if (hrefSyncScheduled) {
    return
  }

  hrefSyncScheduled = true

  requestAnimationFrame(() => {
    hrefSyncScheduled = false
    syncHrefState()
  })
}

const startLocationMonitor = () => {
  if (locationMonitorStarted) {
    return
  }

  locationMonitorStarted = true

  const notifyHrefChange = () => {
    scheduleHrefSync()
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
  window.addEventListener("focus", notifyHrefChange)
  document.addEventListener("visibilitychange", notifyHrefChange)

  navigationWithEvents.navigation?.addEventListener(
    "currententrychange",
    notifyHrefChange
  )
  navigationWithEvents.navigation?.addEventListener(
    "navigate",
    notifyHrefChange
  )

  const routeMutationObserver = new MutationObserver(notifyHrefChange)
  routeMutationObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  })

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => syncHrefState(true), {
      once: true
    })
  }

  syncHrefState(true)
}

export const subscribeToHref = (listener: () => void) => {
  startLocationMonitor()
  hrefListeners.add(listener)

  return () => {
    hrefListeners.delete(listener)
  }
}

export const getHrefSnapshot = () => currentHref
