import { describe, expect, it } from "vitest"

import { createInitialPersistentState } from "../../domain/organizer-state"
import { assignFileToFolder, unassignFile } from "./file-assignment-service"
import { createFolder } from "./folder-service"

const NOW = "2026-07-19T00:00:00.000Z"
const LATER = "2026-07-19T01:00:00.000Z"

const createStateWithFolder = () => {
  const state = createInitialPersistentState(NOW)
  const result = createFolder(state, {
    name: "Design",
    now: NOW,
    createId: () => "folder-design"
  })

  if (result.ok === false) {
    throw new Error(result.error.kind)
  }

  return result.value.state
}

describe("file assignment service", () => {
  it("ファイルを存在するフォルダへ分類する", () => {
    const state = createStateWithFolder()
    const result = assignFileToFolder(state, {
      fileId: "file-1",
      folderId: "folder-design",
      now: LATER
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.value.assignments["file-1"]).toEqual({
        fileId: "file-1",
        folderId: "folder-design",
        updatedAt: LATER
      })
      expect(result.value.meta.updatedAt).toBe(LATER)
      expect(state.assignments).toEqual({})
    }
  })

  it("存在しないフォルダへの分類を拒否する", () => {
    const state = createInitialPersistentState(NOW)
    const result = assignFileToFolder(state, {
      fileId: "file-1",
      folderId: "folder-missing",
      now: LATER
    })

    expect(result).toEqual({ ok: false, error: { kind: "folder_not_found" } })
    expect(state.assignments).toEqual({})
  })

  it("分類済みファイルを未分類へ戻す", () => {
    const assigned = assignFileToFolder(createStateWithFolder(), {
      fileId: "file-1",
      folderId: "folder-design",
      now: NOW
    })

    if (assigned.ok === false) {
      throw new Error(assigned.error.kind)
    }

    const result = unassignFile(assigned.value, {
      fileId: "file-1",
      now: LATER
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.value.assignments["file-1"]).toEqual({
        fileId: "file-1",
        folderId: null,
        updatedAt: LATER
      })
    }
  })

  it("遅延した古い操作で新しい分類を上書きしない", () => {
    const assigned = assignFileToFolder(createStateWithFolder(), {
      fileId: "file-1",
      folderId: "folder-design",
      now: LATER
    })

    if (assigned.ok === false) {
      throw new Error(assigned.error.kind)
    }

    const result = unassignFile(assigned.value, {
      fileId: "file-1",
      now: NOW
    })

    expect(result).toEqual({ ok: true, value: assigned.value })
  })
})
