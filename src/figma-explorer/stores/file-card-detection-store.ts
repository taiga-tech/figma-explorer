import {
  detectFileCardElements,
  type DetectFileCardElementsResult
} from "../../features/scan/detect-file-card-elements"

const fileCardDetectionListeners = new Set<() => void>()

let currentFileCardDetectionResult: DetectFileCardElementsResult =
  detectFileCardElements()
let fileCardDetectionMonitorStarted = false
let fileCardDetectionSyncScheduled = false

const syncFileCardDetection = (force = false) => {
  const nextResult = detectFileCardElements()

  if (
    !force &&
    currentFileCardDetectionResult.status === nextResult.status &&
    currentFileCardDetectionResult.elements.length ===
      nextResult.elements.length
  ) {
    return
  }

  currentFileCardDetectionResult = nextResult

  fileCardDetectionListeners.forEach((listener) => {
    listener()
  })
}

const scheduleFileCardDetectionSync = () => {
  if (fileCardDetectionSyncScheduled) {
    return
  }

  fileCardDetectionSyncScheduled = true

  requestAnimationFrame(() => {
    fileCardDetectionSyncScheduled = false
    syncFileCardDetection()
  })
}

const startFileCardDetectionMonitor = () => {
  if (fileCardDetectionMonitorStarted) {
    return
  }

  fileCardDetectionMonitorStarted = true

  const notifyDetectionChange = () => {
    scheduleFileCardDetectionSync()
  }

  document.addEventListener("visibilitychange", notifyDetectionChange)
  window.addEventListener("focus", notifyDetectionChange)

  const fileCardMutationObserver = new MutationObserver(notifyDetectionChange)
  fileCardMutationObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  })

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => syncFileCardDetection(true),
      {
        once: true
      }
    )
  }

  syncFileCardDetection(true)
}

export const rescanFileCards = () => {
  syncFileCardDetection(true)
}

export const subscribeToFileCardDetection = (listener: () => void) => {
  startFileCardDetectionMonitor()
  fileCardDetectionListeners.add(listener)

  return () => {
    fileCardDetectionListeners.delete(listener)
  }
}

export const getFileCardDetectionSnapshot = () => currentFileCardDetectionResult
