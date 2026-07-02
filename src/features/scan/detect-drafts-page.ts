import { DRAFTS_PATH_SEGMENT } from "../../figma-explorer/constants/figma-routes"

export const detectDraftsPage = (href: string) => {
  try {
    const url = new URL(href)
    const pathnameSegments = url.pathname.split("/").filter(Boolean)
    const draftsSegment = DRAFTS_PATH_SEGMENT.slice(1)

    return (
      url.hostname === "www.figma.com" &&
      pathnameSegments.includes(draftsSegment)
    )
  } catch {
    return false
  }
}
