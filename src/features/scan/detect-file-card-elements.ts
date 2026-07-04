import { createOrganizerError, type OrganizerError } from "../../utils/result"

const DRAFTS_SURFACE_ROOT_SELECTORS = ["[role='main']", "main"] as const

const FILE_CARD_LIST_ROOT_SELECTORS = ["[role='list']"] as const

const FILE_CARD_ITEM_SELECTORS = ["[role='listitem'][data-index]"] as const

export type DetectFileCardElementsResult =
  | {
      status: "success"
      elements: HTMLElement[]
    }
  | {
      status: "empty"
      elements: []
    }
  | {
      status: "error"
      elements: []
      reason: "file_card_list_not_found"
      message: string
    }

export const toOrganizerScanError = (
  result: Extract<DetectFileCardElementsResult, { status: "error" }>
): OrganizerError => createOrganizerError("scan_dom_missing", result.message)

const getDraftsSurfaceRoot = (root: ParentNode) => {
  for (const selector of DRAFTS_SURFACE_ROOT_SELECTORS) {
    const element = root.querySelector(selector)

    if (element instanceof HTMLElement) {
      return element
    }
  }

  return null
}

const getFileCardListRoot = (draftsSurfaceRoot: ParentNode) => {
  for (const selector of FILE_CARD_LIST_ROOT_SELECTORS) {
    const element = draftsSurfaceRoot.querySelector(selector)

    if (element instanceof HTMLElement) {
      return element
    }
  }

  return null
}

const uniqueCandidateElements = (elements: HTMLElement[]) => {
  const seenElements = new Set<HTMLElement>()

  return elements.flatMap((element) => {
    if (seenElements.has(element)) {
      return []
    }

    seenElements.add(element)

    return [element]
  })
}

export const detectFileCardElements = (
  root: ParentNode = document
): DetectFileCardElementsResult => {
  const draftsSurfaceRoot = getDraftsSurfaceRoot(root)

  if (!draftsSurfaceRoot) {
    return {
      status: "error",
      elements: [],
      reason: "file_card_list_not_found",
      message: "Drafts surface root was not found."
    }
  }

  const fileCardListRoot = getFileCardListRoot(draftsSurfaceRoot)

  if (!fileCardListRoot) {
    return {
      status: "error",
      elements: [],
      reason: "file_card_list_not_found",
      message: "File card list root was not found."
    }
  }

  const fileCardItems = FILE_CARD_ITEM_SELECTORS.flatMap((selector) =>
    Array.from(fileCardListRoot.querySelectorAll(selector))
  ).filter((element): element is HTMLElement => element instanceof HTMLElement)

  const elements = uniqueCandidateElements(fileCardItems)

  if (elements.length === 0) {
    return {
      status: "empty",
      elements: []
    }
  }

  return {
    status: "success",
    elements
  }
}
