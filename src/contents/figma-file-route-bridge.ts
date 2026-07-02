import type { PlasmoCSConfig } from "plasmo"

import { annotateFileCardRoutes } from "../features/scan/annotate-file-card-routes"

export const config: PlasmoCSConfig = {
  // Plasmo の config 解析は import 先の定数を追えないため、ここは literal を保つ。
  matches: ["https://www.figma.com/*"],
  world: "MAIN",
  run_at: "document_idle"
}

let annotateScheduled = false

const scheduleAnnotate = () => {
  if (annotateScheduled) {
    return
  }

  annotateScheduled = true

  requestAnimationFrame(() => {
    annotateScheduled = false
    annotateFileCardRoutes(document)
  })
}

scheduleAnnotate()

const fileCardRouteMutationObserver = new MutationObserver(scheduleAnnotate)
fileCardRouteMutationObserver.observe(document.documentElement, {
  childList: true,
  subtree: true
})

window.addEventListener("focus", scheduleAnnotate)
document.addEventListener("visibilitychange", scheduleAnnotate)
