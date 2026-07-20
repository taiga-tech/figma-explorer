import { createRoot } from "react-dom/client"
import { renderToStaticMarkup } from "react-dom/server"
import { act } from "react-dom/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { DetectFileCardElementsResult } from "../../features/scan/detect-file-card-elements"
import { FigmaExplorerPanel } from "./FigmaExplorerPanel"

const mocks = vi.hoisted(() => ({
  detectionResult: {
    status: "empty",
    elements: []
  } as DetectFileCardElementsResult,
  extractedFiles: {
    files: [] as { name: string; url: string }[],
    skippedCount: 0,
    totalCount: 0
  },
  organizerFolders: {
    status: "loading" as "loading" | "ready" | "error",
    folders: {},
    folderTree: [],
    assignments: {},
    storageError: null,
    canRetrySave: false
  } as Record<string, unknown>,
  assignFile: vi.fn(),
  createExportDraftFiles: vi.fn(),
  createExportJsonArtifact: vi.fn(),
  downloadExportJson: vi.fn()
}))

vi.mock("../../features/export-json/export-json-service", () => ({
  createExportDraftFiles: mocks.createExportDraftFiles,
  createExportJsonArtifact: mocks.createExportJsonArtifact,
  downloadExportJson: mocks.downloadExportJson
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
    mocks.createExportDraftFiles.mockReset()
    mocks.createExportDraftFiles.mockReturnValue([])
    mocks.createExportJsonArtifact.mockReset()
    mocks.createExportJsonArtifact.mockReturnValue({
      ok: true,
      value: {
        data: {},
        fileName: "figma-explorer-export.json",
        json: "{}\n"
      }
    })
    mocks.downloadExportJson.mockReset()
    mocks.downloadExportJson.mockReturnValue({ ok: true, value: undefined })
  })

  it("ファイル抽出前のempty状態でも初回レンダーできる", () => {
    const html = renderToStaticMarkup(
      <FigmaExplorerPanel href="https://www.figma.com/files/team/drafts" />
    )

    expect(html).toContain("0 candidate cards")
    expect(html).toContain("まだ候補カードが見つかっていません。")
  })

  it("分類情報の読み込み中は未分類filterを無効にする", () => {
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
    const html = renderToStaticMarkup(
      <FigmaExplorerPanel href="https://www.figma.com/files/team/drafts" />
    )

    document.body.innerHTML = html
    const uncategorizedButton = Array.from(
      document.querySelectorAll("button")
    ).find((button) => button.textContent?.includes("未分類"))

    expect(html).not.toContain("Dashboard")
    expect(html).toContain("分類情報を読み込んでいます…")
    expect(uncategorizedButton?.disabled).toBe(true)
    expect(uncategorizedButton?.textContent).toContain("-")
  })

  it("保存状態とスキャン情報をJSON出力し成功を通知する", () => {
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
    const state = {
      schemaVersion: 1,
      folders: {},
      folderTree: [],
      assignments: {},
      settings: {
        panelPosition: "right",
        panelWidth: 360,
        autoScan: true,
        showFirstRunNotice: true
      },
      meta: {
        createdAt: "2026-07-20T00:00:00.000Z",
        updatedAt: "2026-07-20T00:00:00.000Z"
      }
    }
    mocks.organizerFolders = {
      status: "ready",
      folders: {},
      folderTree: [],
      assignments: {},
      state,
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

    const exportButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "JSON を出力"
    )

    expect(exportButton?.disabled).toBe(false)

    act(() => exportButton?.click())

    expect(mocks.createExportDraftFiles).toHaveBeenCalledWith(
      [
        {
          id: "AbC123",
          name: "Dashboard",
          url: "https://www.figma.com/file/AbC123/Dashboard",
          folderName: null
        }
      ],
      expect.any(String)
    )
    expect(mocks.createExportJsonArtifact).toHaveBeenCalledWith(
      expect.objectContaining({ appVersion: "0.0.1", state })
    )
    expect(mocks.downloadExportJson).toHaveBeenCalled()
    expect(container.textContent).toContain(
      "figma-explorer-export.json を出力しました。"
    )

    act(() => root.unmount())
  })

  it("JSONダウンロード失敗を通知する", () => {
    mocks.detectionResult = { status: "empty", elements: [] }
    mocks.organizerFolders = {
      status: "ready",
      folders: {},
      folderTree: [],
      assignments: {},
      state: {
        schemaVersion: 1,
        folders: {},
        folderTree: [],
        assignments: {},
        settings: {
          panelPosition: "right",
          panelWidth: 360,
          autoScan: true,
          showFirstRunNotice: true
        },
        meta: {
          createdAt: "2026-07-20T00:00:00.000Z",
          updatedAt: "2026-07-20T00:00:00.000Z"
        }
      },
      storageError: null,
      canRetrySave: false
    }
    mocks.downloadExportJson.mockReturnValue({
      ok: false,
      error: { kind: "export_failed", message: "blocked" }
    })
    const container = document.createElement("div")
    const root = createRoot(container)

    act(() => {
      root.render(
        <FigmaExplorerPanel href="https://www.figma.com/files/team/drafts" />
      )
    })

    const exportButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "JSON を出力"
    )

    act(() => exportButton?.click())

    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "JSON出力に失敗しました。"
    )

    act(() => root.unmount())
  })

  it("候補カードのメタデータを全件抽出できない場合はJSON出力を無効にする", () => {
    mocks.detectionResult = { status: "success", elements: [] }
    mocks.extractedFiles = { files: [], skippedCount: 1, totalCount: 1 }
    mocks.organizerFolders = {
      status: "ready",
      folders: {},
      folderTree: [],
      assignments: {},
      state: {
        schemaVersion: 1,
        folders: {},
        folderTree: [],
        assignments: {},
        settings: {
          panelPosition: "right",
          panelWidth: 360,
          autoScan: true,
          showFirstRunNotice: true
        },
        meta: {
          createdAt: "2026-07-20T00:00:00.000Z",
          updatedAt: "2026-07-20T00:00:00.000Z"
        }
      },
      storageError: null,
      canRetrySave: false
    }
    const html = renderToStaticMarkup(
      <FigmaExplorerPanel href="https://www.figma.com/files/team/drafts" />
    )

    document.body.innerHTML = html
    const exportButton = Array.from(
      document.querySelectorAll<HTMLButtonElement>("button")
    ).find((button) => button.textContent === "JSON を出力")

    expect(exportButton?.disabled).toBe(true)
  })

  it("分類情報の読み込み失敗を進行中表示にしない", () => {
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
      status: "error",
      folders: {},
      folderTree: [],
      assignments: {},
      storageError: {
        kind: "storage_load_failed",
        message: "Failed to load organizer state."
      },
      canRetrySave: false
    }
    const html = renderToStaticMarkup(
      <FigmaExplorerPanel href="https://www.figma.com/files/team/drafts" />
    )

    expect(html).toContain(
      "分類情報を読み込めないため、ファイル一覧を表示できません。"
    )
    expect(html).not.toContain("分類情報を読み込んでいます…")
    expect(html).not.toContain("Dashboard")
  })

  it("スキャン失敗中は検索欄を無効にする", () => {
    mocks.detectionResult = {
      status: "error",
      elements: [],
      reason: "file_card_list_not_found",
      message: "File card list root was not found."
    }
    mocks.organizerFolders = {
      status: "ready",
      folders: {},
      folderTree: [],
      assignments: {},
      storageError: null,
      canRetrySave: false
    }
    const html = renderToStaticMarkup(
      <FigmaExplorerPanel href="https://www.figma.com/files/team/drafts" />
    )

    document.body.innerHTML = html

    expect(
      document.querySelector<HTMLInputElement>('[role="searchbox"]')?.disabled
    ).toBe(true)
    expect(html).toContain("scan_dom_missing")
  })

  it("抽出失敗のempty messageを未分類filterでも維持する", () => {
    mocks.detectionResult = { status: "success", elements: [] }
    mocks.extractedFiles = { files: [], skippedCount: 1, totalCount: 1 }
    mocks.organizerFolders = {
      status: "ready",
      folders: {},
      folderTree: [],
      assignments: {},
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

    const uncategorizedButton = Array.from(
      container.querySelectorAll("button")
    ).find((button) => button.textContent?.includes("未分類0"))

    act(() => uncategorizedButton?.click())

    expect(container.textContent).toContain(
      "候補カードは見つかりましたが、名前または URL を抽出できませんでした。"
    )
    expect(container.textContent).not.toContain(
      "未分類のファイルはありません。"
    )

    act(() => root.unmount())
  })

  it("ファイル名を検索し未分類filterと組み合わせてクリアできる", () => {
    mocks.detectionResult = { status: "success", elements: [] }
    mocks.extractedFiles = {
      files: [
        {
          name: "Dashboard",
          url: "https://www.figma.com/file/AbC123/Dashboard"
        },
        {
          name: "Landing",
          url: "https://www.figma.com/file/XyZ987/Landing"
        }
      ],
      skippedCount: 0,
      totalCount: 2
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

    const searchInput =
      container.querySelector<HTMLInputElement>('[role="searchbox"]')
    const setSearchQuery = (query: string) => {
      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      )?.set

      act(() => {
        valueSetter?.call(searchInput, query)
        searchInput?.dispatchEvent(new Event("input", { bubbles: true }))
      })
    }

    setSearchQuery("DASH")

    expect(container.textContent).toContain("Dashboard")
    expect(container.textContent).not.toContain("Landing")
    expect(container.textContent).toContain("表示中1")

    const clearButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "クリア"
    )

    act(() => clearButton?.click())

    expect(container.textContent).toContain("Dashboard")
    expect(container.textContent).toContain("Landing")

    const uncategorizedButton = Array.from(
      container.querySelectorAll("button")
    ).find((button) => button.textContent?.includes("未分類1"))

    act(() => uncategorizedButton?.click())
    setSearchQuery("DASH")

    expect(container.textContent).toContain(
      "検索条件に一致するファイルはありません。"
    )
    expect(container.textContent).not.toContain("Dashboard")
    expect(container.textContent).not.toContain("Landing")

    setSearchQuery("LAND")

    expect(container.textContent).not.toContain("Dashboard")
    expect(container.textContent).toContain("Landing")

    const folderButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Design"
    )

    act(() => folderButton?.click())

    const assignButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("へ分類")
    )

    act(() => assignButton?.click())

    expect(mocks.assignFile).toHaveBeenCalledWith("XyZ987", "folder-design")

    act(() => root.unmount())
  })

  it("未分類だけを表示し分類後に一覧から除外する", () => {
    mocks.detectionResult = { status: "success", elements: [] }
    mocks.extractedFiles = {
      files: [
        {
          name: "Dashboard",
          url: "https://www.figma.com/file/AbC123/Dashboard"
        },
        {
          name: "Landing",
          url: "https://www.figma.com/file/XyZ987/Landing"
        }
      ],
      skippedCount: 0,
      totalCount: 2
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
    expect(container.textContent).toContain("Landing")
    expect(container.textContent).toContain("現在: Design")

    const uncategorizedButton = Array.from(
      container.querySelectorAll("button")
    ).find((button) => button.textContent?.includes("未分類1"))

    act(() => uncategorizedButton?.click())

    expect(container.textContent).not.toContain("Dashboard")
    expect(container.textContent).toContain("Landing")
    expect(container.textContent).toContain("現在: 未分類")

    const folderButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Design"
    )

    act(() => folderButton?.click())

    const assignButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("へ分類")
    )

    act(() => assignButton?.click())

    expect(mocks.assignFile).toHaveBeenCalledWith("XyZ987", "folder-design")

    mocks.organizerFolders = {
      ...mocks.organizerFolders,
      assignments: {
        ...(mocks.organizerFolders.assignments as Record<string, unknown>),
        XyZ987: {
          fileId: "XyZ987",
          folderId: "folder-design",
          updatedAt: "2026-07-19T01:00:00.000Z"
        }
      }
    }

    act(() => {
      root.render(
        <FigmaExplorerPanel href="https://www.figma.com/files/team/drafts" />
      )
    })

    expect(container.textContent).toContain("未分類のファイルはありません。")
    expect(container.textContent).not.toContain("Landing")

    const allButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("全件2")
    )

    act(() => allButton?.click())

    expect(container.textContent).toContain("Dashboard")
    expect(container.textContent).toContain("Landing")

    const unassignButton = Array.from(
      container.querySelectorAll("button")
    ).find((button) => button.textContent === "未分類へ戻す")

    act(() => unassignButton?.click())

    expect(mocks.assignFile).toHaveBeenCalledWith("AbC123", null)

    mocks.organizerFolders = {
      ...mocks.organizerFolders,
      assignments: {
        ...(mocks.organizerFolders.assignments as Record<string, unknown>),
        AbC123: {
          fileId: "AbC123",
          folderId: null,
          updatedAt: "2026-07-19T02:00:00.000Z"
        }
      }
    }

    act(() => {
      root.render(
        <FigmaExplorerPanel href="https://www.figma.com/files/team/drafts" />
      )
    })

    const uncategorizedAgainButton = Array.from(
      container.querySelectorAll("button")
    ).find((button) => button.textContent?.includes("未分類1"))

    act(() => uncategorizedAgainButton?.click())

    expect(container.textContent).toContain("Dashboard")
    expect(container.textContent).not.toContain("Landing")

    act(() => root.unmount())
  })
})
