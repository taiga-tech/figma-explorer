import { PAGE_INSET_PX } from "../constants/panel-layout"
import type { BodyStyleSnapshot } from "../types/body-style-snapshot"

let savedBodyStyle: BodyStyleSnapshot | undefined

export const applyPageInset = (enabled: boolean) => {
  const bodyStyle = document.body?.style

  if (!bodyStyle) {
    return
  }

  if (enabled) {
    savedBodyStyle ??= {
      boxSizing: bodyStyle.boxSizing,
      paddingRight: bodyStyle.paddingRight,
      overflowX: bodyStyle.overflowX
    }

    bodyStyle.boxSizing = "border-box"
    bodyStyle.paddingRight = `${PAGE_INSET_PX}px`
    bodyStyle.overflowX = "hidden"

    return
  }

  if (!savedBodyStyle) {
    return
  }

  bodyStyle.boxSizing = savedBodyStyle.boxSizing
  bodyStyle.paddingRight = savedBodyStyle.paddingRight
  bodyStyle.overflowX = savedBodyStyle.overflowX
  savedBodyStyle = undefined
}
