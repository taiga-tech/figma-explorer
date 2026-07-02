import cssText from "data-text:../figma-explorer/styles/figma-explorer.css"
import type { PlasmoCSConfig } from "plasmo"

import { detectDraftsPage } from "../features/scan/detect-drafts-page"
import { FigmaExplorerPanel } from "../figma-explorer/components/FigmaExplorerPanel"
import { useCurrentHref } from "../figma-explorer/hooks/use-current-href"

export const config: PlasmoCSConfig = {
  // Plasmo の config 解析は import 先の定数を追えないため、ここは literal を保つ。
  matches: ["https://www.figma.com/*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

function FigmaExplorerContent() {
  const href = useCurrentHref()

  if (!detectDraftsPage(href)) {
    return null
  }

  return <FigmaExplorerPanel href={href} />
}

export default FigmaExplorerContent
