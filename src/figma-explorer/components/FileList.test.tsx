import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { FileList } from "./FileList"

describe("FileList", () => {
  it("renders list semantics and selected state", () => {
    const html = renderToStaticMarkup(
      createElement(FileList, {
        emptyMessage: null,
        files: [
          {
            id: "file-1",
            name: "Dashboard",
            url: "https://www.figma.com/file/AbC123/Dashboard",
            folderName: null
          },
          {
            id: "file-2",
            name: "Landing Page",
            url: "https://www.figma.com/file/XyZ987/Landing-Page",
            folderName: "案件A"
          }
        ],
        onSelectFile: () => undefined,
        selectedFileId: "file-2"
      })
    )

    document.body.innerHTML = html

    const list = document.querySelector("[role='list']")
    const items = Array.from(document.querySelectorAll("[role='listitem']"))

    expect(list).not.toBeNull()
    expect(items).toHaveLength(2)
    expect(items[0]?.getAttribute("aria-selected")).toBe("false")
    expect(items[1]?.getAttribute("aria-selected")).toBe("true")
  })

  it("renders empty message when there are no files", () => {
    const html = renderToStaticMarkup(
      createElement(FileList, {
        emptyMessage: "まだ候補カードが見つかっていません。",
        files: [],
        onSelectFile: () => undefined,
        selectedFileId: null
      })
    )

    expect(html).toContain("まだ候補カードが見つかっていません。")
    expect(html).not.toContain('role="list"')
  })
})
