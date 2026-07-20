import { createElement, type ComponentProps } from "react"
import { flushSync } from "react-dom"
import { createRoot } from "react-dom/client"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { OrganizerPanel } from "./OrganizerPanel"

const emptyFolderSection: ComponentProps<
  typeof OrganizerPanel
>["folderSection"] = {
  status: "ready",
  folders: {},
  tree: [],
  selectedFolderId: null,
  storageErrorMessage: null,
  canRetrySave: false,
  onSelectFolder: () => undefined,
  onToggleExpanded: () => undefined,
  onCreateFolder: () => null,
  onRetrySave: () => undefined
}

const emptyAssignmentSection: ComponentProps<
  typeof OrganizerPanel
>["assignmentSection"] = {
  selectedFileName: null,
  selectedFolderName: null,
  currentFolderName: null,
  canAssign: false,
  canUnassign: false,
  onAssign: () => undefined,
  onUnassign: () => undefined
}

const enabledExportSection: ComponentProps<
  typeof OrganizerPanel
>["exportSection"] = {
  disabled: false,
  feedback: null,
  onExport: () => undefined
}

describe("OrganizerPanel", () => {
  it("renders summary counts and scan metadata", () => {
    const html = renderToStaticMarkup(
      createElement(OrganizerPanel, {
        activeFilter: { type: "all" },
        assignmentSection: emptyAssignmentSection,
        emptyMessage: null,
        errorBanner: null,
        exportSection: enabledExportSection,
        folderSection: emptyFolderSection,
        files: [
          {
            id: "file-1",
            name: "Dashboard",
            url: "https://www.figma.com/file/AbC123/Dashboard",
            folderName: null
          }
        ],
        onChangeFilter: () => undefined,
        onSearchQueryChange: () => undefined,
        onRescan: () => undefined,
        onSelectFile: () => undefined,
        routeLabel: "/drafts",
        scanSummary: "1 files extracted / 0 skipped",
        searchQuery: "",
        selectedFileId: "file-1",
        targetLabel: "https://www.figma.com/*",
        totalCount: 1,
        uncategorizedCount: 1
      })
    )

    expect(html).toContain("Organizer Panel")
    expect(html).toContain("<aside")
    expect(html).toContain('role="list"')
    expect(html).toContain("1 files extracted / 0 skipped")
    expect(html).toContain("全件")
    expect(html).toContain("未分類")
    expect(html).toContain("Detected files")
    expect(html).toContain("JSON を出力")
  })

  it("renders an alert banner for scan errors", () => {
    const html = renderToStaticMarkup(
      createElement(OrganizerPanel, {
        activeFilter: { type: "all" },
        assignmentSection: emptyAssignmentSection,
        emptyMessage: "候補カードが見つかりません。",
        folderSection: emptyFolderSection,
        errorBanner: {
          kind: "scan_dom_missing",
          message: "File card list root was not found."
        },
        exportSection: { ...enabledExportSection, disabled: true },
        files: [],
        onChangeFilter: () => undefined,
        onSearchQueryChange: () => undefined,
        onRescan: () => undefined,
        onSelectFile: () => undefined,
        routeLabel: "/drafts",
        scanSummary: "scan_dom_missing",
        searchDisabled: true,
        searchQuery: "",
        selectedFileId: null,
        targetLabel: "https://www.figma.com/*",
        totalCount: 0,
        uncategorizedCount: 0
      })
    )

    expect(html).toContain('role="alert"')
    expect(html).toContain("scan_dom_missing")
  })

  it("renders a retry action for an unsaved folder change", () => {
    const html = renderToStaticMarkup(
      createElement(OrganizerPanel, {
        activeFilter: { type: "all" },
        assignmentSection: emptyAssignmentSection,
        emptyMessage: null,
        errorBanner: null,
        exportSection: enabledExportSection,
        folderSection: {
          ...emptyFolderSection,
          storageErrorMessage: "フォルダの保存に失敗しました。",
          canRetrySave: true
        },
        files: [],
        onChangeFilter: () => undefined,
        onSearchQueryChange: () => undefined,
        onRescan: () => undefined,
        onSelectFile: () => undefined,
        routeLabel: "/drafts",
        scanSummary: "0 files extracted / 0 skipped",
        searchQuery: "",
        selectedFileId: null,
        targetLabel: "https://www.figma.com/*",
        totalCount: 0,
        uncategorizedCount: 0
      })
    )

    expect(html).toContain("フォルダの保存に失敗しました。")
    expect(html).toContain("再試行")
  })

  it("パネル内のEscapeで検索をクリアしてフォーカスと伝播を止める", () => {
    const outer = document.createElement("div")
    const container = document.createElement("div")
    const outsideButton = document.createElement("button")
    const onSearchQueryChange = vi.fn()
    const onOuterKeyDown = vi.fn()

    outsideButton.textContent = "Outside"
    outer.append(container, outsideButton)
    outer.addEventListener("keydown", onOuterKeyDown)
    document.body.append(outer)
    const root = createRoot(container)

    flushSync(() => {
      root.render(
        <OrganizerPanel
          activeFilter={{ type: "all" }}
          assignmentSection={emptyAssignmentSection}
          emptyMessage={null}
          errorBanner={null}
          exportSection={enabledExportSection}
          files={[]}
          folderSection={emptyFolderSection}
          onChangeFilter={() => undefined}
          onRescan={() => undefined}
          onSearchQueryChange={onSearchQueryChange}
          onSelectFile={() => undefined}
          routeLabel="/drafts"
          scanSummary="0 files extracted / 0 skipped"
          searchQuery="Dashboard"
          selectedFileId={null}
          targetLabel="https://www.figma.com/*"
          totalCount={0}
          uncategorizedCount={0}
        />
      )
    })

    const searchInput =
      container.querySelector<HTMLInputElement>('[role="searchbox"]')
    const panelEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true
    })

    searchInput?.focus()
    flushSync(() => searchInput?.dispatchEvent(panelEvent))

    expect(panelEvent.defaultPrevented).toBe(true)
    expect(onSearchQueryChange).toHaveBeenCalledOnce()
    expect(onSearchQueryChange).toHaveBeenCalledWith("")
    expect(document.activeElement).not.toBe(searchInput)
    expect(onOuterKeyDown).not.toHaveBeenCalled()

    const outsideEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true
    })

    flushSync(() => outsideButton.dispatchEvent(outsideEvent))

    expect(outsideEvent.defaultPrevented).toBe(false)
    expect(onSearchQueryChange).toHaveBeenCalledOnce()
    expect(onOuterKeyDown).toHaveBeenCalledOnce()

    flushSync(() => root.unmount())
    outer.remove()
  })
})
