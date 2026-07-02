import { FILE_CARD_ROUTE_ATTRIBUTE } from "./file-card-route-attribute"
import { resolveFileCardRouteUrl } from "./resolve-file-card-route-from-fiber"

const FILE_CARD_ITEM_SELECTOR = "[role='listitem'][data-index]"
const FILE_CARD_ACTION_SELECTOR = "[data-card-main-action]"
const RESOLVED_INDEX_ATTRIBUTE = "data-figma-explorer-resolved-index"

/**
 * Figma の一覧は仮想化されており、同じ DOM ノードが別の行データへ使い回される。
 * `data-index` が前回解決時と同じ間だけ結果を再利用し、変化したら必ず再解決する。
 */
export const annotateFileCardRoutes = (root: ParentNode = document) => {
  root.querySelectorAll(FILE_CARD_ITEM_SELECTOR).forEach((item) => {
    if (!(item instanceof HTMLElement)) {
      return
    }

    const dataIndex = item.getAttribute("data-index")
    const resolvedIndex = item.getAttribute(RESOLVED_INDEX_ATTRIBUTE)
    const alreadyResolved =
      item.hasAttribute(FILE_CARD_ROUTE_ATTRIBUTE) &&
      dataIndex !== null &&
      dataIndex === resolvedIndex

    if (alreadyResolved) {
      return
    }

    const actionRoot = item.querySelector(FILE_CARD_ACTION_SELECTOR)
    const url = resolveFileCardRouteUrl(actionRoot ?? item)

    if (url) {
      item.setAttribute(FILE_CARD_ROUTE_ATTRIBUTE, url)

      if (dataIndex !== null) {
        item.setAttribute(RESOLVED_INDEX_ATTRIBUTE, dataIndex)
      }

      return
    }

    item.removeAttribute(FILE_CARD_ROUTE_ATTRIBUTE)
    item.removeAttribute(RESOLVED_INDEX_ATTRIBUTE)
  })
}
