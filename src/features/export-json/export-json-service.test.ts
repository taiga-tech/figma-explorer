import { describe, expect, it, vi } from "vitest"

import { createInitialPersistentState } from "../../domain/organizer-state"
import type { DraftFile } from "../scan/draft-file"
import {
  createExportDraftFiles,
  createExportJsonArtifact,
  downloadExportJson,
  type JsonDownloadAdapter
} from "./export-json-service"

const exportedAt = "2026-07-20T01:02:03.456Z"
const file: DraftFile = {
  id: "file-1",
  name: "Dashboard",
  url: "https://www.figma.com/file/file-1/Dashboard",
  type: "design",
  firstSeenAt: exportedAt,
  lastSeenAt: exportedAt,
  scanStatus: "active"
}

describe("export JSON service", () => {
  it("スキャン済みメタ情報を本文なしのDraftFileへ変換する", () => {
    expect(
      createExportDraftFiles(
        [
          {
            id: "design-1",
            name: "Dashboard",
            url: "https://www.figma.com/design/design-1/Dashboard",
            folderName: "Design"
          } as Pick<DraftFile, "id" | "name" | "url"> & {
            folderName: string
          },
          {
            id: "board-1",
            name: "Workshop",
            url: "https://www.figma.com/board/board-1/Workshop"
          }
        ],
        exportedAt
      )
    ).toEqual([
      {
        id: "design-1",
        name: "Dashboard",
        url: "https://www.figma.com/design/design-1/Dashboard",
        type: "design",
        firstSeenAt: exportedAt,
        lastSeenAt: exportedAt,
        scanStatus: "active"
      },
      {
        id: "board-1",
        name: "Workshop",
        url: "https://www.figma.com/board/board-1/Workshop",
        type: "figjam",
        firstSeenAt: exportedAt,
        lastSeenAt: exportedAt,
        scanStatus: "active"
      }
    ])
  })

  it("スキャン情報と整理状態から安定したJSON成果物を生成する", () => {
    const state = createInitialPersistentState(exportedAt)

    state.folders = {
      "folder-b": {
        id: "folder-b",
        name: "Second",
        parentId: null,
        sortOrder: 2,
        createdAt: exportedAt,
        updatedAt: exportedAt,
        isSystem: false
      },
      "folder-a": {
        id: "folder-a",
        name: "First",
        parentId: null,
        sortOrder: 1,
        createdAt: exportedAt,
        updatedAt: exportedAt,
        isSystem: false
      }
    }
    state.assignments = {
      "file-1": {
        fileId: "file-1",
        folderId: "folder-a",
        updatedAt: exportedAt
      }
    }

    const result = createExportJsonArtifact({
      appVersion: "0.0.1",
      exportedAt,
      files: [file],
      state
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.value.fileName).toBe(
        "figma-explorer-2026-07-20T01-02-03-456Z.json"
      )
      expect(result.value.data.files).toEqual([file])
      expect(result.value.data.folders.map((folder) => folder.id)).toEqual([
        "folder-a",
        "folder-b"
      ])
      expect(result.value.data.assignments).toEqual([
        state.assignments["file-1"]
      ])
      expect(JSON.parse(result.value.json)).toEqual(result.value.data)
      expect(result.value.json).not.toContain("file contents")
    }
  })

  it("循環データをJSONへ変換できない場合はexport_failedを返す", () => {
    const state = createInitialPersistentState(exportedAt)
    const cyclicNode = { folderId: "folder-a", expanded: true, children: [] }

    cyclicNode.children.push(cyclicNode as never)
    state.folderTree = [cyclicNode]

    const result = createExportJsonArtifact({
      appVersion: "0.0.1",
      exportedAt,
      files: [],
      state
    })

    expect(result).toMatchObject({
      ok: false,
      error: { kind: "export_failed" }
    })
  })

  it("Blob URLを使ってダウンロードし成功後にURLを解放する", () => {
    const adapter: JsonDownloadAdapter = {
      createObjectUrl: vi.fn(() => "blob:export"),
      revokeObjectUrl: vi.fn(),
      clickDownload: vi.fn()
    }

    const result = downloadExportJson(
      { fileName: "export.json", json: "{}\n" },
      adapter
    )

    expect(result).toEqual({ ok: true, value: undefined })
    expect(adapter.clickDownload).toHaveBeenCalledWith(
      "blob:export",
      "export.json"
    )
    expect(adapter.revokeObjectUrl).toHaveBeenCalledWith("blob:export")
  })

  it("クリック失敗時もURLを解放してexport_failedを返す", () => {
    const adapter: JsonDownloadAdapter = {
      createObjectUrl: vi.fn(() => "blob:export"),
      revokeObjectUrl: vi.fn(),
      clickDownload: vi.fn(() => {
        throw new Error("blocked")
      })
    }

    const result = downloadExportJson(
      { fileName: "export.json", json: "{}\n" },
      adapter
    )

    expect(result).toMatchObject({
      ok: false,
      error: { kind: "export_failed" }
    })
    expect(adapter.revokeObjectUrl).toHaveBeenCalledWith("blob:export")
  })

  it("Blob URLの解放失敗もexport_failedへ変換する", () => {
    const adapter: JsonDownloadAdapter = {
      createObjectUrl: vi.fn(() => "blob:export"),
      revokeObjectUrl: vi.fn(() => {
        throw new Error("cleanup failed")
      }),
      clickDownload: vi.fn()
    }

    const result = downloadExportJson(
      { fileName: "export.json", json: "{}\n" },
      adapter
    )

    expect(result).toMatchObject({
      ok: false,
      error: { kind: "export_failed" }
    })
  })
})
