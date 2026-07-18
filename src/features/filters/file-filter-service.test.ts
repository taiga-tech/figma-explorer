import { describe, expect, it } from "vitest"

import type { FileAssignment } from "../../domain/organizer-state"
import { countUncategorizedFiles, filterFiles } from "./file-filter-service"

const files = [
  { id: "file-1", name: "Dashboard" },
  { id: "file-2", name: "Landing" },
  { id: "file-3", name: "Settings" }
]

const assignments: Record<string, FileAssignment> = {
  "file-1": {
    fileId: "file-1",
    folderId: "folder-design",
    updatedAt: "2026-07-19T00:00:00.000Z"
  },
  "file-3": {
    fileId: "file-3",
    folderId: null,
    updatedAt: "2026-07-19T00:00:00.000Z"
  }
}

describe("file filter service", () => {
  it("allでは入力順の全ファイルを返す", () => {
    expect(filterFiles(files, assignments, { type: "all" })).toEqual(files)
  })

  it("uncategorizedではassignmentなしとfolderId nullだけを返す", () => {
    expect(
      filterFiles(files, assignments, { type: "uncategorized" }).map(
        (file) => file.id
      )
    ).toEqual(["file-2", "file-3"])
    expect(countUncategorizedFiles(files, assignments)).toBe(2)
  })

  it("folderでは指定フォルダへ分類されたファイルだけを返す", () => {
    expect(
      filterFiles(files, assignments, {
        type: "folder",
        folderId: "folder-design"
      }).map((file) => file.id)
    ).toEqual(["file-1"])
  })
})
