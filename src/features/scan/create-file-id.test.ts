import { describe, expect, it } from "vitest"

import { createFileId } from "./create-file-id"

const expectOk = (url: string) => {
  const result = createFileId(url)

  if (!result.ok) {
    throw new Error(`expected ok for ${url}, got ${result.error.kind}`)
  }

  return result.value
}

describe("createFileId", () => {
  it("designルートからfile keyを抽出する", () => {
    expect(expectOk("https://www.figma.com/design/AbC123/sales-list")).toEqual(
      {
        fileId: "AbC123",
        source: "figma_file_key"
      }
    )
  })

  it("対象パスパターンすべてからfile keyを抽出する", () => {
    const routes = [
      "file",
      "design",
      "board",
      "slides",
      "proto",
      "site",
      "buzz",
      "make"
    ]

    routes.forEach((route) => {
      expect(expectOk(`https://www.figma.com/${route}/Key9/title`)).toEqual({
        fileId: "Key9",
        source: "figma_file_key"
      })
    })
  })

  it("タイトルスラッグ・クエリ・フラグメントの変化でIDが変わらない", () => {
    const base = expectOk("https://www.figma.com/design/AbC123/old-title")
    const renamed = expectOk(
      "https://www.figma.com/design/AbC123/new-title?fuid=99#section"
    )
    const bare = expectOk("https://www.figma.com/design/AbC123")

    expect(renamed.fileId).toBe(base.fileId)
    expect(bare.fileId).toBe(base.fileId)
  })

  it("file keyを持たないFigma URLはhash fallbackになる", () => {
    const value = expectOk("https://www.figma.com/files/drafts")

    expect(value.source).toBe("url_hash")
    expect(value.fileId).toMatch(/^urlhash_[0-9a-f]{8}$/)
  })

  it("hash fallbackもクエリ・末尾スラッシュの変化で安定する", () => {
    const plain = expectOk("https://example.com/path/to/page")
    const noisy = expectOk("https://example.com/path/to/page/?utm=1#top")

    expect(noisy.fileId).toBe(plain.fileId)
    expect(noisy.source).toBe("url_hash")
  })

  it("Figma以外のホストはfile key扱いしない", () => {
    const value = expectOk("https://evil.example/design/AbC123/fake")

    expect(value.source).toBe("url_hash")
  })

  it("URLが無い場合はmissing_urlを返す", () => {
    expect(createFileId(null)).toEqual({
      ok: false,
      error: { kind: "missing_url" }
    })
    expect(createFileId("   ")).toEqual({
      ok: false,
      error: { kind: "missing_url" }
    })
  })

  it("解釈できないURLはunsupported_urlを返す", () => {
    expect(createFileId("not a url")).toEqual({
      ok: false,
      error: { kind: "unsupported_url" }
    })
    expect(createFileId("ftp://example.com/file/AbC123")).toEqual({
      ok: false,
      error: { kind: "unsupported_url" }
    })
  })
})
