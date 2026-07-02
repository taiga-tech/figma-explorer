import { FILE_CARD_ROUTE_ATTRIBUTE } from "./file-card-route-attribute"

const FILE_CARD_ACTION_ROOT_SELECTORS = [
  "[data-card-main-action]",
  "a[href]"
] as const

const FILE_CARD_URL_ATTRIBUTE_NAMES = ["href", "data-href", "data-url"] as const

const FILE_CARD_NAME_ROOT_SELECTORS = [
  "[role='group'][aria-label]",
  "[aria-labelledby]"
] as const

const FILE_CARD_ATTRIBUTE_NAMES = [
  "aria-label",
  "title",
  "data-tooltip"
] as const

const TIMESTAMP_TEXT_PATTERN =
  /\b(ago|updated|edited|today|yesterday|minutes?|hours?|days?|weeks?|months?)\b|分前|時間前|日前|週間前|か月前|今日|昨日/i

export type ExtractedFileCardMetadata = {
  name: string
  url: string
}

export type ExtractFileCardMetadataResult = {
  files: ExtractedFileCardMetadata[]
  skippedCount: number
  totalCount: number
}

const normalizeText = (value: string | null | undefined) =>
  value?.replace(/\s+/g, " ").trim() ?? ""

const uniqueStrings = (values: string[]) => {
  const seenValues = new Set<string>()

  return values.flatMap((value) => {
    if (!value || seenValues.has(value)) {
      return []
    }

    seenValues.add(value)

    return [value]
  })
}

const findFirstMatchingElement = (
  element: ParentNode,
  selectors: readonly string[]
) => {
  if (
    element instanceof HTMLElement &&
    selectors.some((selector) => element.matches(selector))
  ) {
    return element
  }

  for (const selector of selectors) {
    const candidate = element.querySelector(selector)

    if (candidate instanceof HTMLElement) {
      return candidate
    }
  }

  return null
}

const findActionRoot = (element: ParentNode) => {
  return findFirstMatchingElement(element, FILE_CARD_ACTION_ROOT_SELECTORS)
}

const findNameRoot = (element: ParentNode) => {
  return findFirstMatchingElement(element, FILE_CARD_NAME_ROOT_SELECTORS)
}

const findFileCardLink = (element: ParentNode) => {
  const actionRoot = findActionRoot(element)

  if (
    actionRoot instanceof HTMLAnchorElement &&
    actionRoot.getAttribute("href")
  ) {
    return actionRoot
  }

  if (actionRoot) {
    const nestedLink = findFirstMatchingElement(actionRoot, ["a[href]"])

    if (nestedLink instanceof HTMLAnchorElement) {
      return nestedLink
    }
  }

  const fallbackLink = findFirstMatchingElement(element, ["a[href]"])

  if (fallbackLink instanceof HTMLAnchorElement) {
    return fallbackLink
  }

  return null
}

const collectUrlCandidates = (element: Element | null) => {
  if (!element) {
    return []
  }

  const ownUrlCandidates = FILE_CARD_URL_ATTRIBUTE_NAMES.flatMap(
    (attributeName) => {
      const attributeValue = normalizeText(element.getAttribute(attributeName))

      return attributeValue ? [attributeValue] : []
    }
  )

  const descendantUrlCandidates = Array.from(
    element.querySelectorAll("[href], [data-href], [data-url]")
  ).flatMap((candidate) =>
    FILE_CARD_URL_ATTRIBUTE_NAMES.flatMap((attributeName) => {
      const attributeValue = normalizeText(
        candidate.getAttribute(attributeName)
      )

      return attributeValue ? [attributeValue] : []
    })
  )

  return uniqueStrings([...ownUrlCandidates, ...descendantUrlCandidates])
}

const collectResolvedRouteCandidate = (element: ParentNode) => {
  const resolvedElement =
    element instanceof Element &&
    element.hasAttribute(FILE_CARD_ROUTE_ATTRIBUTE)
      ? element
      : element.querySelector(`[${FILE_CARD_ROUTE_ATTRIBUTE}]`)

  const attributeValue = resolvedElement
    ? normalizeText(resolvedElement.getAttribute(FILE_CARD_ROUTE_ATTRIBUTE))
    : ""

  return attributeValue ? [attributeValue] : []
}

const collectAttributeTextCandidates = (element: Element | null) => {
  if (!element) {
    return []
  }

  const ownAttributeValues = FILE_CARD_ATTRIBUTE_NAMES.flatMap(
    (attributeName) => {
      const attributeValue = normalizeText(element.getAttribute(attributeName))

      return attributeValue ? [attributeValue] : []
    }
  )

  const descendantAttributeValues = Array.from(
    element.querySelectorAll("[aria-label], [title], [data-tooltip], img[alt]")
  ).flatMap((candidate) => {
    const altText =
      candidate instanceof HTMLImageElement
        ? normalizeText(candidate.getAttribute("alt"))
        : ""

    const attributeValues = FILE_CARD_ATTRIBUTE_NAMES.flatMap(
      (attributeName) => {
        const attributeValue = normalizeText(
          candidate.getAttribute(attributeName)
        )

        return attributeValue ? [attributeValue] : []
      }
    )

    return altText ? [altText, ...attributeValues] : attributeValues
  })

  return uniqueStrings([...ownAttributeValues, ...descendantAttributeValues])
}

const collectVisibleTextCandidates = (element: Element | null) => {
  if (!(element instanceof HTMLElement)) {
    return []
  }

  return uniqueStrings(
    element.innerText
      .split(/\n+/)
      .map((value) => normalizeText(value))
      .filter(Boolean)
  )
}

const isTimestampLikeText = (value: string) =>
  TIMESTAMP_TEXT_PATTERN.test(value)

const isUrlLikeText = (value: string) => /^https?:\/\//i.test(value)

const pickFileCardName = (element: ParentNode) => {
  const actionRoot = findActionRoot(element)
  const nameRoot = findNameRoot(element)
  const link = findFileCardLink(element)

  const candidates = uniqueStrings([
    ...collectAttributeTextCandidates(nameRoot),
    ...collectAttributeTextCandidates(actionRoot),
    ...collectAttributeTextCandidates(link),
    ...collectVisibleTextCandidates(
      element instanceof Element ? element : null
    ),
    ...collectVisibleTextCandidates(nameRoot),
    ...collectVisibleTextCandidates(actionRoot),
    ...collectVisibleTextCandidates(link)
  ])

  return (
    candidates.find(
      (candidate) =>
        !isTimestampLikeText(candidate) && !isUrlLikeText(candidate)
    ) ?? null
  )
}

const resolveFileCardUrl = (
  element: ParentNode,
  baseUrl: string
): string | null => {
  const link = findFileCardLink(element)
  const hrefCandidates = uniqueStrings([
    ...(link ? collectUrlCandidates(link) : []),
    ...collectUrlCandidates(element instanceof Element ? element : null),
    ...collectResolvedRouteCandidate(element)
  ])

  for (const href of hrefCandidates) {
    try {
      return new URL(href, baseUrl).toString()
    } catch {
      continue
    }
  }

  return null
}

const getDefaultBaseUrl = () => {
  if (typeof window !== "undefined" && window.location?.href) {
    return window.location.href
  }

  return "https://www.figma.com/"
}

export const extractFileCardMetadata = (
  elements: HTMLElement[],
  baseUrl = getDefaultBaseUrl()
): ExtractFileCardMetadataResult => {
  const files: ExtractedFileCardMetadata[] = []
  let skippedCount = 0

  elements.forEach((element) => {
    const name = pickFileCardName(element)
    const url = resolveFileCardUrl(element, baseUrl)

    if (!name || !url) {
      skippedCount += 1
      return
    }

    files.push({ name, url })
  })

  return {
    files,
    skippedCount,
    totalCount: elements.length
  }
}
