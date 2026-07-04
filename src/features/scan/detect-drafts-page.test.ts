import { describe, expect, it } from "vitest"

import { detectDraftsPage } from "./detect-drafts-page"

describe("detectDraftsPage", () => {
  it("Drafts画面のURLでtrueを返す", () => {
    expect(detectDraftsPage("https://www.figma.com/files/drafts")).toBe(true)
    expect(
      detectDraftsPage("https://www.figma.com/files/team/123/drafts?fuid=1")
    ).toBe(true)
  })

  it("ファイル編集画面でfalseを返す", () => {
    expect(
      detectDraftsPage("https://www.figma.com/design/AbC123/some-title")
    ).toBe(false)
    expect(detectDraftsPage("https://www.figma.com/file/AbC123/title")).toBe(
      false
    )
  })

  it("チームプロジェクト画面でfalseを返す", () => {
    expect(
      detectDraftsPage("https://www.figma.com/files/team/123/project/456")
    ).toBe(false)
  })

  it("Figma以外のURLでfalseを返す", () => {
    expect(detectDraftsPage("https://example.com/drafts")).toBe(false)
    expect(detectDraftsPage("https://figma.com.evil.example/drafts")).toBe(
      false
    )
  })

  it("パス途中の部分一致では反応しない", () => {
    expect(detectDraftsPage("https://www.figma.com/files/drafts-old")).toBe(
      false
    )
  })

  it("不正なURLでfalseを返す", () => {
    expect(detectDraftsPage("not a url")).toBe(false)
    expect(detectDraftsPage("")).toBe(false)
  })
})
