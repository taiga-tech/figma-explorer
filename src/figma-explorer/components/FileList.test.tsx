import { createElement } from "react"
import { flushSync } from "react-dom"
import { createRoot } from "react-dom/client"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { FileList } from "./FileList"

const files = [
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
]

describe("FileList", () => {
  it("renders list semantics and selected state", () => {
    const html = renderToStaticMarkup(
      createElement(FileList, {
        emptyMessage: null,
        files,
        onSelectFile: () => undefined,
        selectedFileId: "file-2"
      })
    )

    document.body.innerHTML = html

    const list = document.querySelector("[role='list']")
    const items = Array.from(document.querySelectorAll("[role='listitem']"))

    expect(list).not.toBeNull()
    expect(items).toHaveLength(2)
    const selectButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>(
        ".figma-explorer-panel__file-select"
      )
    )

    expect(items[0]?.hasAttribute("aria-current")).toBe(false)
    expect(items[1]?.getAttribute("aria-current")).toBe("true")
    expect(items[0]?.hasAttribute("aria-selected")).toBe(false)
    expect(items[1]?.hasAttribute("aria-selected")).toBe(false)
    expect(selectButtons.map((button) => button.tabIndex)).toEqual([-1, 0])
    expect(items[0]?.textContent).toContain("未分類")
    expect(items[1]?.textContent).toContain("案件A")
  })

  it("ArrowDownで選択とフォーカスを次のファイルへ移し伝播を止める", () => {
    const outer = document.createElement("div")
    const container = document.createElement("div")
    const onSelectFile = vi.fn()
    const onOuterKeyDown = vi.fn()

    outer.append(container)
    document.body.append(outer)
    outer.addEventListener("keydown", onOuterKeyDown)
    const root = createRoot(container)

    flushSync(() => {
      root.render(
        <FileList
          emptyMessage={null}
          files={files}
          onSelectFile={onSelectFile}
          selectedFileId="file-1"
        />
      )
    })

    const selectButtons = Array.from(
      container.querySelectorAll<HTMLButtonElement>(
        ".figma-explorer-panel__file-select"
      )
    )
    const event = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true
    })

    selectButtons[0].focus()
    flushSync(() => selectButtons[0].dispatchEvent(event))

    expect(event.defaultPrevented).toBe(true)
    expect(onOuterKeyDown).not.toHaveBeenCalled()
    expect(onSelectFile).toHaveBeenCalledWith("file-2")
    expect(document.activeElement).toBe(selectButtons[1])

    flushSync(() => root.unmount())
    outer.remove()
  })

  it("ArrowUpとArrowDownは一覧の端を越えない", () => {
    const container = document.createElement("div")
    const onSelectFile = vi.fn()
    const root = createRoot(container)

    document.body.append(container)
    flushSync(() => {
      root.render(
        <FileList
          emptyMessage={null}
          files={files}
          onSelectFile={onSelectFile}
          selectedFileId="file-1"
        />
      )
    })

    let selectButtons = Array.from(
      container.querySelectorAll<HTMLButtonElement>(
        ".figma-explorer-panel__file-select"
      )
    )

    flushSync(() => {
      selectButtons[0].dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true })
      )
    })
    expect(onSelectFile).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(selectButtons[0])

    flushSync(() => {
      root.render(
        <FileList
          emptyMessage={null}
          files={files}
          onSelectFile={onSelectFile}
          selectedFileId="file-2"
        />
      )
    })
    selectButtons = Array.from(
      container.querySelectorAll<HTMLButtonElement>(
        ".figma-explorer-panel__file-select"
      )
    )

    flushSync(() => {
      selectButtons[1].dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })
      )
    })
    expect(onSelectFile).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(selectButtons[1])

    flushSync(() => root.unmount())
    container.remove()
  })

  it("Enterで選択ファイルのリンクを一度だけ開く", () => {
    const outer = document.createElement("div")
    const container = document.createElement("div")
    const onOuterKeyDown = vi.fn()
    const root = createRoot(container)

    outer.append(container)
    document.body.append(outer)
    outer.addEventListener("keydown", onOuterKeyDown)
    flushSync(() => {
      root.render(
        <FileList
          emptyMessage={null}
          files={files}
          onSelectFile={() => undefined}
          selectedFileId="file-2"
        />
      )
    })

    const selectButton = container.querySelectorAll<HTMLButtonElement>(
      ".figma-explorer-panel__file-select"
    )[1]
    const openLink = container.querySelectorAll<HTMLAnchorElement>(
      ".figma-explorer-panel__file-open-link"
    )[1]
    const click = vi
      .spyOn(openLink, "click")
      .mockImplementation(() => undefined)
    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true
    })

    flushSync(() => selectButton.dispatchEvent(event))

    expect(event.defaultPrevented).toBe(true)
    expect(click).toHaveBeenCalledOnce()
    expect(onOuterKeyDown).not.toHaveBeenCalled()

    click.mockClear()
    const nativeLinkEvent = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true
    })

    flushSync(() => openLink.dispatchEvent(nativeLinkEvent))

    expect(nativeLinkEvent.defaultPrevented).toBe(false)
    expect(click).not.toHaveBeenCalled()
    expect(onOuterKeyDown).not.toHaveBeenCalled()

    flushSync(() => root.unmount())
    outer.remove()
  })

  it("対象外キーは親へ伝播する", () => {
    const outer = document.createElement("div")
    const container = document.createElement("div")
    const onOuterKeyDown = vi.fn()
    const root = createRoot(container)

    outer.append(container)
    outer.addEventListener("keydown", onOuterKeyDown)
    flushSync(() => {
      root.render(
        <FileList
          emptyMessage={null}
          files={files}
          onSelectFile={() => undefined}
          selectedFileId="file-1"
        />
      )
    })

    const selectButton = container.querySelector<HTMLButtonElement>(
      ".figma-explorer-panel__file-select"
    )
    const event = new KeyboardEvent("keydown", {
      key: "a",
      bubbles: true,
      cancelable: true
    })

    flushSync(() => selectButton?.dispatchEvent(event))

    expect(event.defaultPrevented).toBe(false)
    expect(onOuterKeyDown).toHaveBeenCalledOnce()

    flushSync(() => root.unmount())
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
