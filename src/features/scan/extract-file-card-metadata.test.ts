import { describe, expect, it } from "vitest"

import { extractFileCardMetadata } from "./extract-file-card-metadata"
import { FILE_CARD_ROUTE_ATTRIBUTE } from "./file-card-route-attribute"

const BASE_URL = "https://www.figma.com/files/drafts"

const createCard = (html: string) => {
  const container = document.createElement("div")
  container.innerHTML = html
  const card = container.firstElementChild

  if (!(card instanceof HTMLElement)) {
    throw new Error("test card markup must have a single root element")
  }

  return card
}

describe("extractFileCardMetadata", () => {
  it("aria-labelとhrefから名前とURLを抽出する", () => {
    const card = createCard(`
      <div role="listitem" data-index="0">
        <div role="group" aria-label="売上一覧">
          <a href="/design/AbC123/sales">open</a>
        </div>
      </div>
    `)

    const result = extractFileCardMetadata([card], BASE_URL)

    expect(result.totalCount).toBe(1)
    expect(result.skippedCount).toBe(0)
    expect(result.files).toEqual([
      {
        name: "売上一覧",
        url: "https://www.figma.com/design/AbC123/sales"
      }
    ])
  })

  it("bridgeが解決した属性からURLを取得できる", () => {
    const card = createCard(`
      <div role="listitem" data-index="1"
        ${FILE_CARD_ROUTE_ATTRIBUTE}="https://www.figma.com/design/XyZ789/report">
        <button data-card-main-action aria-label="入金消込"></button>
      </div>
    `)

    const result = extractFileCardMetadata([card], BASE_URL)

    expect(result.files).toEqual([
      {
        name: "入金消込",
        url: "https://www.figma.com/design/XyZ789/report"
      }
    ])
  })

  it("タイムスタンプ様のテキストは名前候補から除外する", () => {
    const card = createCard(`
      <div role="listitem" data-index="2">
        <div role="group" aria-label="Edited 2 hours ago">
          <a href="/design/AbC123/x" title="管理画面">open</a>
        </div>
      </div>
    `)

    const result = extractFileCardMetadata([card], BASE_URL)

    expect(result.files[0]?.name).toBe("管理画面")
  })

  it("名前かURLのどちらかが欠けたカードはスキップして計数する", () => {
    const missingUrl = createCard(`
      <div role="listitem" data-index="3">
        <div role="group" aria-label="URLなしカード"></div>
      </div>
    `)
    const complete = createCard(`
      <div role="listitem" data-index="4">
        <div role="group" aria-label="正常カード">
          <a href="/design/DeF456/ok">open</a>
        </div>
      </div>
    `)

    const result = extractFileCardMetadata([missingUrl, complete], BASE_URL)

    expect(result.totalCount).toBe(2)
    expect(result.skippedCount).toBe(1)
    expect(result.files).toHaveLength(1)
    expect(result.files[0]?.name).toBe("正常カード")
  })

  it("入力0件では空の結果を返す", () => {
    const result = extractFileCardMetadata([], BASE_URL)

    expect(result).toEqual({ files: [], skippedCount: 0, totalCount: 0 })
  })
})
