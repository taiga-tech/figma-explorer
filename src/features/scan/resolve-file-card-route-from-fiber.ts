const REACT_INTERNAL_KEY_PATTERN = /^__react(?:Props|Fiber)\$/

const FIGMA_ROUTE_FRAGMENT_PATTERN =
  /(?:https?:\/\/www\.figma\.com)?\/(?:(?:file|design|board|slides|buzz|make|proto|site)\/[A-Za-z0-9]+[^\s"'<>]*)/i

const MAX_ROUTE_SCAN_DEPTH = 6
const MAX_ROUTE_SCAN_NODES = 3000
const MAX_ROUTE_SCAN_ENTRIES_PER_NODE = 40
const MAX_FIBER_ANCESTOR_HOPS = 16

const FIBER_STRUCTURAL_KEYS = [
  "owner",
  "return",
  "child",
  "sibling",
  "alternate"
] as const

const normalizeText = (value: string) => value.replace(/\s+/g, " ").trim()

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

const isReactFiberNode = (
  value: unknown
): value is Record<string, unknown> & { return: unknown } =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as Record<string, unknown>).tag === "number" &&
  "return" in (value as Record<string, unknown>)

const collectFiberAncestors = (fiber: Record<string, unknown>) => {
  const ancestors: Record<string, unknown>[] = []
  let current: unknown = fiber.return

  for (
    let hop = 0;
    hop < MAX_FIBER_ANCESTOR_HOPS && isReactFiberNode(current);
    hop += 1
  ) {
    ancestors.push(current)
    current = current.return
  }

  return ancestors
}

/**
 * Figma のカードはクリック領域が `<a href>` ではなく React が管理する `button` のため、
 * この関数は必ずページ本体と同じ JS world（`world: "MAIN"` の content script）から
 * 呼び出す必要がある。isolated world からは `__reactFiber$` / `__reactProps$` の
 * expando プロパティ自体が見えず、常に結果が空になる。
 */
export const findFiberRouteCandidates = (element: Element | null): string[] => {
  if (!(element instanceof HTMLElement)) {
    return []
  }

  const internalValues = Object.getOwnPropertyNames(element)
    .filter((key) => REACT_INTERNAL_KEY_PATTERN.test(key))
    .flatMap((key) => {
      try {
        return [(element as unknown as Record<string, unknown>)[key]]
      } catch {
        return []
      }
    })

  const fiberAncestorValues = internalValues
    .filter(isReactFiberNode)
    .flatMap((fiber) => collectFiberAncestors(fiber))

  const routeCandidates: string[] = []
  const visited = new Set<object>()
  const queue = [...internalValues, ...fiberAncestorValues].map((value) => ({
    depth: 0,
    value
  }))
  let scannedNodes = 0

  while (queue.length > 0 && scannedNodes < MAX_ROUTE_SCAN_NODES) {
    const current = queue.shift()

    if (!current) {
      break
    }

    scannedNodes += 1

    if (typeof current.value === "string") {
      const normalizedValue = normalizeText(current.value)

      if (FIGMA_ROUTE_FRAGMENT_PATTERN.test(normalizedValue)) {
        routeCandidates.push(normalizedValue)
      }

      continue
    }

    if (!current.value || typeof current.value !== "object") {
      continue
    }

    if (visited.has(current.value)) {
      continue
    }

    visited.add(current.value)

    if (current.depth >= MAX_ROUTE_SCAN_DEPTH) {
      continue
    }

    const entries = Array.isArray(current.value)
      ? current.value
          .slice(0, MAX_ROUTE_SCAN_ENTRIES_PER_NODE)
          .map((value) => [null, value] as const)
      : Object.entries(current.value).slice(0, MAX_ROUTE_SCAN_ENTRIES_PER_NODE)

    entries.forEach(([key, value]) => {
      if (
        typeof key === "string" &&
        (FIBER_STRUCTURAL_KEYS as readonly string[]).includes(key)
      ) {
        return
      }

      queue.push({
        depth: current.depth + 1,
        value
      })
    })
  }

  return uniqueStrings(routeCandidates)
}

export const resolveFileCardRouteUrl = (
  actionRoot: Element | null,
  baseUrl: string = window.location.href
): string | null => {
  for (const candidate of findFiberRouteCandidates(actionRoot)) {
    try {
      return new URL(candidate, baseUrl).toString()
    } catch {
      continue
    }
  }

  return null
}
