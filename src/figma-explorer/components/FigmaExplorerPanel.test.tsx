import { createRoot } from "react-dom/client"
import { renderToStaticMarkup } from "react-dom/server"
import { act } from "react-dom/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { FigmaExplorerPanel } from "./FigmaExplorerPanel"

const mocks = vi.hoisted(() => ({
  detectionResult: { status: "empty", elements: [] } as {
    status: "empty" | "success"
    elements: Element[]
  },
  extractedFiles: {
    files: [] as { name: string; url: string }[],
    skippedCount: 0,
    totalCount: 0
  },
  organizerFolders: {
    status: "loading" as "loading" | "ready",
    folders: {},
    folderTree: [],
    assignments: {},
    storageError: null,
    canRetrySave: false
  } as Record<string, unknown>,
  assignFile: vi.fn()
}))

vi.mock("../hooks/use-file-card-detection", () => ({
  useFileCardDetection: () => mocks.detectionResult
}))

vi.mock("../hooks/use-organizer-folders", () => ({
  useOrganizerFolders: () => mocks.organizerFolders
}))

vi.mock("../../features/scan/extract-file-card-metadata", () => ({
  extractFileCardMetadata: () => mocks.extractedFiles
}))

vi.mock("../stores/file-card-detection-store", () => ({
  rescanFileCards: vi.fn()
}))

vi.mock("../stores/organizer-folders-store", () => ({
  getOrganizerFoldersStore: () => ({
    createFolder: vi.fn(),
    assignFile: mocks.assignFile,
    retrySave: vi.fn(),
    toggleFolderExpanded: vi.fn()
  })
}))

globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe("FigmaExplorerPanel", () => {
  beforeEach(() => {
    mocks.detectionResult = { status: "empty", elements: [] }
    mocks.extractedFiles = { files: [], skippedCount: 0, totalCount: 0 }
    mocks.organizerFolders = {
      status: "loading",
      folders: {},
      folderTree: [],
      assignments: {},
      storageError: null,
      canRetrySave: false
    }
    mocks.assignFile.mockClear()
  })

  it("ファイル抽出前のempty状態でも初回レンダーできる", () => {
    const html = renderToStaticMarkup(
      <FigmaExplorerPanel href="https://www.figma.com/files/team/drafts" />
    )

    expect(html).toContain("0 candidate cards")
    expect(html).toContain("まだ候補カードが見つかっていません。")
  })

  it("保存済み所属名を表示し選択フォルダへ分類する", () => {
    mocks.detectionResult = { status: "success", elements: [] }
    mocks.extractedFiles = {
      files: [
        {
          name: "Dashboard",
          url: "https://www.figma.com/file/AbC123/Dashboard"
        }
      ],
      skippedCount: 0,
      totalCount: 1
    }
    mocks.organizerFolders = {
      status: "ready",
      folders: {
        "folder-design": {
          id: "folder-design",
          name: "Design",
          parentId: null,
          sortOrder: 0,
          createdAt: "2026-07-19T00:00:00.000Z",
          updatedAt: "2026-07-19T00:00:00.000Z",
          isSystem: false
        }
      },
      folderTree: [
        { folderId: "folder-design", expanded: false, children: [] }
      ],
      assignments: {
        AbC123: {
          fileId: "AbC123",
          folderId: "folder-design",
          updatedAt: "2026-07-19T00:00:00.000Z"
        }
      },
      storageError: null,
      canRetrySave: false
    }
    const container = document.createElement("div")
    const root = createRoot(container)

    act(() => {
      root.render(
        <FigmaExplorerPanel href="https://www.figma.com/files/team/drafts" />
      )
    })

    expect(container.textContent).toContain("Dashboard")
    expect(container.textContent).toContain("現在: Design")

    const folderButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Design"
    )

    act(() => folderButton?.click())

    const assignButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("へ分類")
    )

    act(() => assignButton?.click())

    expect(mocks.assignFile).toHaveBeenCalledWith("AbC123", "folder-design")

    const unassignButton = Array.from(
      container.querySelectorAll("button")
    ).find((button) => button.textContent === "未分類へ戻す")

    act(() => unassignButton?.click())

    expect(mocks.assignFile).toHaveBeenCalledWith("AbC123", null)

    act(() => root.unmount())
  })
})
