import { beforeEach, describe, expect, it } from "vitest"

import {
  detectFileCardElements,
  toOrganizerScanError
} from "./detect-file-card-elements"

describe("detectFileCardElements", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
  })

  it("ファイルカードを検出してsuccessを返す", () => {
    document.body.innerHTML = `
      <main role="main">
        <div role="list">
          <div role="listitem" data-index="0">card A</div>
          <div role="listitem" data-index="1">card B</div>
        </div>
      </main>
    `

    const result = detectFileCardElements(document)

    expect(result.status).toBe("success")
    expect(result.elements).toHaveLength(2)
  })

  it("リストはあるがカード0件なら空状態を返す", () => {
    document.body.innerHTML = `
      <main role="main">
        <div role="list"></div>
      </main>
    `

    const result = detectFileCardElements(document)

    expect(result).toEqual({ status: "empty", elements: [] })
  })

  it("surface rootが無い場合はエラーを返す", () => {
    document.body.innerHTML = `<div>no main here</div>`

    const result = detectFileCardElements(document)

    expect(result.status).toBe("error")

    if (result.status === "error") {
      expect(result.reason).toBe("file_card_list_not_found")
    }
  })

  it("list rootが無い場合はエラーを返す", () => {
    document.body.innerHTML = `<main role="main"><p>empty</p></main>`

    const result = detectFileCardElements(document)

    expect(result.status).toBe("error")
  })

  it("data-indexを持たないlistitemは対象外", () => {
    document.body.innerHTML = `
      <main role="main">
        <div role="list">
          <div role="listitem">no index</div>
        </div>
      </main>
    `

    const result = detectFileCardElements(document)

    expect(result.status).toBe("empty")
  })
})

describe("toOrganizerScanError", () => {
  it("検出エラーをscan_dom_missingへ分類する", () => {
    document.body.innerHTML = ""

    const result = detectFileCardElements(document)

    if (result.status !== "error") {
      throw new Error("expected error result")
    }

    expect(toOrganizerScanError(result)).toEqual({
      kind: "scan_dom_missing",
      message: result.message
    })
  })
})
