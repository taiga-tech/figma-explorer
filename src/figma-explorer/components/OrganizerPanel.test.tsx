import { createElement, type ComponentProps } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

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

describe("OrganizerPanel", () => {
  it("renders summary counts and scan metadata", () => {
    const html = renderToStaticMarkup(
      createElement(OrganizerPanel, {
        activeFilter: { type: "all" },
        assignmentSection: emptyAssignmentSection,
        emptyMessage: null,
        errorBanner: null,
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
        onRescan: () => undefined,
        onSelectFile: () => undefined,
        routeLabel: "/drafts",
        scanSummary: "1 files extracted / 0 skipped",
        selectedFileId: "file-1",
        targetLabel: "https://www.figma.com/*",
        totalCount: 1,
        uncategorizedCount: 1
      })
    )

    expect(html).toContain("Organizer Panel")
    expect(html).toContain("1 files extracted / 0 skipped")
    expect(html).toContain("全件")
    expect(html).toContain("未分類")
    expect(html).toContain("Detected files")
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
        files: [],
        onChangeFilter: () => undefined,
        onRescan: () => undefined,
        onSelectFile: () => undefined,
        routeLabel: "/drafts",
        scanSummary: "scan_dom_missing",
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
        folderSection: {
          ...emptyFolderSection,
          storageErrorMessage: "フォルダの保存に失敗しました。",
          canRetrySave: true
        },
        files: [],
        onChangeFilter: () => undefined,
        onRescan: () => undefined,
        onSelectFile: () => undefined,
        routeLabel: "/drafts",
        scanSummary: "0 files extracted / 0 skipped",
        selectedFileId: null,
        targetLabel: "https://www.figma.com/*",
        totalCount: 0,
        uncategorizedCount: 0
      })
    )

    expect(html).toContain("フォルダの保存に失敗しました。")
    expect(html).toContain("再試行")
  })
})
