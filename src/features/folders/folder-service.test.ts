import { describe, expect, it } from "vitest"

import type { PersistentState } from "../../domain/organizer-state"
import { createInitialPersistentState } from "../../domain/organizer-state"
import {
  createFolder,
  deleteFolder,
  moveFolder,
  renameFolder,
  type CreateFolderInput
} from "./folder-service"
import { collectFolderTreeIds, findFolderTreeNode } from "./folder-tree-service"

const NOW = "2026-07-05T00:00:00.000Z"
const LATER = "2026-07-05T01:00:00.000Z"

const createFolderOrThrow = (
  state: PersistentState,
  input: CreateFolderInput
): PersistentState => {
  const result = createFolder(state, input)

  if (result.ok === false) {
    throw new Error(`createFolder failed: ${result.error.kind}`)
  }

  return result.value.state
}

/** design > design-child と research をもつ状態を作る。 */
const buildStateWithFolders = (): PersistentState => {
  let state = createInitialPersistentState(NOW)

  state = createFolderOrThrow(state, {
    name: "design",
    now: NOW,
    createId: () => "folder-design"
  })
  state = createFolderOrThrow(state, {
    name: "design-child",
    parentId: "folder-design",
    now: NOW,
    createId: () => "folder-design-child"
  })
  state = createFolderOrThrow(state, {
    name: "research",
    now: NOW,
    createId: () => "folder-research"
  })

  return state
}

/** level-1 > level-2 > ... > level-5 の一本鎖（最大深さ）を作る。 */
const buildMaxDepthChainState = (): PersistentState => {
  let state = createInitialPersistentState(NOW)

  for (let level = 1; level <= 5; level += 1) {
    state = createFolderOrThrow(state, {
      name: `level-${level}`,
      parentId: level === 1 ? null : `folder-level-${level - 1}`,
      now: NOW,
      createId: () => `folder-level-${level}`
    })
  }

  return state
}

describe("createFolder", () => {
  it("ルート直下にフォルダを作成できる", () => {
    const result = createFolder(createInitialPersistentState(NOW), {
      name: "design",
      now: NOW,
      createId: () => "folder-design"
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.value.folder).toEqual({
        id: "folder-design",
        name: "design",
        parentId: null,
        sortOrder: 0,
        createdAt: NOW,
        updatedAt: NOW,
        isSystem: false
      })
      expect(result.value.state.folders["folder-design"]).toEqual(
        result.value.folder
      )
      expect(collectFolderTreeIds(result.value.state.folderTree)).toEqual([
        "folder-design"
      ])
      expect(result.value.state.meta.updatedAt).toBe(NOW)
    }
  })

  it("親フォルダを指定して子フォルダを作成できる", () => {
    const state = buildStateWithFolders()

    expect(state.folders["folder-design-child"]?.parentId).toBe("folder-design")
    expect(collectFolderTreeIds(state.folderTree)).toEqual([
      "folder-design",
      "folder-design-child",
      "folder-research"
    ])
  })

  it("名前は前後の空白を除去し、同一親の末尾sortOrderを割り当てる", () => {
    const state = buildStateWithFolders()
    const result = createFolder(state, {
      name: "  handoff  ",
      now: LATER,
      createId: () => "folder-handoff"
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.value.folder.name).toBe("handoff")
      // ルート直下には design(0) と research(1) がいる
      expect(result.value.folder.sortOrder).toBe(2)
    }
  })

  it("空白だけの名前はempty_folder_nameを返す", () => {
    const result = createFolder(createInitialPersistentState(NOW), {
      name: "   "
    })

    expect(result).toEqual({ ok: false, error: { kind: "empty_folder_name" } })
  })

  it("存在しない親はparent_folder_not_foundを返す", () => {
    const result = createFolder(createInitialPersistentState(NOW), {
      name: "design",
      parentId: "missing"
    })

    expect(result).toEqual({
      ok: false,
      error: { kind: "parent_folder_not_found" }
    })
  })

  it("5階層目までは作成できる", () => {
    const state = buildMaxDepthChainState()

    expect(state.folders["folder-level-5"]?.parentId).toBe("folder-level-4")
  })

  it("6階層目の作成はmax_depth_exceededを返す", () => {
    const result = createFolder(buildMaxDepthChainState(), {
      name: "level-6",
      parentId: "folder-level-5"
    })

    expect(result).toEqual({
      ok: false,
      error: { kind: "max_depth_exceeded" }
    })
  })

  it("既存フォルダとIDが衝突したらduplicate_folder_idを返す", () => {
    const result = createFolder(buildStateWithFolders(), {
      name: "design-copy",
      createId: () => "folder-design"
    })

    expect(result).toEqual({
      ok: false,
      error: { kind: "duplicate_folder_id" }
    })
  })

  it("元のstateを変更しない", () => {
    const state = createInitialPersistentState(NOW)
    const snapshot = structuredClone(state)

    createFolder(state, { name: "design" })

    expect(state).toEqual(snapshot)
  })
})

describe("moveFolder", () => {
  it("サブツリーごと別の親へ移動できる", () => {
    const state = buildStateWithFolders()
    const result = moveFolder(state, {
      folderId: "folder-design",
      parentId: "folder-research",
      now: LATER
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.value.folders["folder-design"]).toMatchObject({
        parentId: "folder-research",
        updatedAt: LATER
      })
      // 子孫の parentId は変えず、サブツリー構造ごと移動する
      expect(result.value.folders["folder-design-child"]?.parentId).toBe(
        "folder-design"
      )

      const movedNode = findFolderTreeNode(
        result.value.folderTree,
        "folder-design"
      )

      expect(movedNode?.children.map((node) => node.folderId)).toEqual([
        "folder-design-child"
      ])
      expect(collectFolderTreeIds(result.value.folderTree)).toEqual([
        "folder-research",
        "folder-design",
        "folder-design-child"
      ])
    }
  })

  it("ルート直下へ移動できる", () => {
    const state = buildStateWithFolders()
    const result = moveFolder(state, {
      folderId: "folder-design-child",
      parentId: null,
      now: LATER
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.value.folders["folder-design-child"]?.parentId).toBeNull()
      expect(result.value.folderTree.map((node) => node.folderId)).toEqual([
        "folder-design",
        "folder-research",
        "folder-design-child"
      ])
    }
  })

  it("移動後もツリー内のフォルダIDは重複しない", () => {
    const result = moveFolder(buildStateWithFolders(), {
      folderId: "folder-design",
      parentId: "folder-research"
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      const ids = collectFolderTreeIds(result.value.folderTree)

      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it("自分自身への移動はcircular_referenceを返す", () => {
    const result = moveFolder(buildStateWithFolders(), {
      folderId: "folder-design",
      parentId: "folder-design"
    })

    expect(result).toEqual({
      ok: false,
      error: { kind: "circular_reference" }
    })
  })

  it("自分の子孫への移動はcircular_referenceを返す", () => {
    const result = moveFolder(buildStateWithFolders(), {
      folderId: "folder-design",
      parentId: "folder-design-child"
    })

    expect(result).toEqual({
      ok: false,
      error: { kind: "circular_reference" }
    })
  })

  it("移動後の最深階層が5を超える場合はmax_depth_exceededを返す", () => {
    // research（高さ1）を level-5 配下（深さ6になる）へは移動できない
    let state = buildMaxDepthChainState()

    state = createFolderOrThrow(state, {
      name: "research",
      now: NOW,
      createId: () => "folder-research"
    })

    const result = moveFolder(state, {
      folderId: "folder-research",
      parentId: "folder-level-5"
    })

    expect(result).toEqual({
      ok: false,
      error: { kind: "max_depth_exceeded" }
    })
  })

  it("サブツリーの高さを含めて最大階層を判定する", () => {
    // 高さ2の design サブツリーは、深さ4の level-4 配下へは移動できない
    let state = buildMaxDepthChainState()

    state = createFolderOrThrow(state, {
      name: "design",
      now: NOW,
      createId: () => "folder-design"
    })
    state = createFolderOrThrow(state, {
      name: "design-child",
      parentId: "folder-design",
      now: NOW,
      createId: () => "folder-design-child"
    })

    const rejected = moveFolder(state, {
      folderId: "folder-design",
      parentId: "folder-level-4"
    })

    expect(rejected).toEqual({
      ok: false,
      error: { kind: "max_depth_exceeded" }
    })

    // 深さ3の level-3 配下なら 3 + 2 = 5 階層で収まる
    const accepted = moveFolder(state, {
      folderId: "folder-design",
      parentId: "folder-level-3"
    })

    expect(accepted.ok).toBe(true)
  })

  it("parentIdが循環した保存データでも別の親へ移動して循環を解消できる", () => {
    const base = buildStateWithFolders()
    const state: PersistentState = {
      ...base,
      folders: {
        ...base.folders,
        "folder-design": {
          ...base.folders["folder-design"],
          parentId: "folder-design-child"
        }
      }
    }

    const result = moveFolder(state, {
      folderId: "folder-design",
      parentId: "folder-research",
      now: LATER
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.value.folders["folder-design"]?.parentId).toBe(
        "folder-research"
      )
      expect(
        collectFolderTreeIds(result.value.folderTree).filter(
          (id) => id === "folder-design"
        )
      ).toHaveLength(1)
    }
  })

  it("存在しないフォルダはfolder_not_foundを返す", () => {
    const result = moveFolder(buildStateWithFolders(), {
      folderId: "missing",
      parentId: null
    })

    expect(result).toEqual({ ok: false, error: { kind: "folder_not_found" } })
  })

  it("存在しない親はparent_folder_not_foundを返す", () => {
    const result = moveFolder(buildStateWithFolders(), {
      folderId: "folder-design",
      parentId: "missing"
    })

    expect(result).toEqual({
      ok: false,
      error: { kind: "parent_folder_not_found" }
    })
  })

  it("元のstateを変更しない", () => {
    const state = buildStateWithFolders()
    const snapshot = structuredClone(state)

    moveFolder(state, {
      folderId: "folder-design",
      parentId: "folder-research"
    })

    expect(state).toEqual(snapshot)
  })
})

describe("renameFolder", () => {
  it("フォルダ名を変更しupdatedAtを更新する", () => {
    const state = buildStateWithFolders()
    const result = renameFolder(state, {
      folderId: "folder-design",
      name: "design-v2",
      now: LATER
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.value.folders["folder-design"]).toMatchObject({
        name: "design-v2",
        createdAt: NOW,
        updatedAt: LATER
      })
      expect(result.value.meta.updatedAt).toBe(LATER)
    }
  })

  it("存在しないフォルダはfolder_not_foundを返す", () => {
    const result = renameFolder(buildStateWithFolders(), {
      folderId: "missing",
      name: "renamed"
    })

    expect(result).toEqual({ ok: false, error: { kind: "folder_not_found" } })
  })

  it("空白だけの名前はempty_folder_nameを返す", () => {
    const result = renameFolder(buildStateWithFolders(), {
      folderId: "folder-design",
      name: " "
    })

    expect(result).toEqual({ ok: false, error: { kind: "empty_folder_name" } })
  })
})

describe("deleteFolder", () => {
  it("フォルダをサブツリーごと削除する", () => {
    const state = buildStateWithFolders()
    const result = deleteFolder(state, {
      folderId: "folder-design",
      now: LATER
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(Object.keys(result.value.folders)).toEqual(["folder-research"])
      expect(collectFolderTreeIds(result.value.folderTree)).toEqual([
        "folder-research"
      ])
      expect(result.value.meta.updatedAt).toBe(LATER)
    }
  })

  it("削除したフォルダ配下のファイルを未分類へ戻す", () => {
    const state: PersistentState = {
      ...buildStateWithFolders(),
      assignments: {
        "file-1": {
          fileId: "file-1",
          folderId: "folder-design-child",
          updatedAt: NOW
        },
        "file-2": {
          fileId: "file-2",
          folderId: "folder-research",
          updatedAt: NOW
        }
      }
    }

    const result = deleteFolder(state, {
      folderId: "folder-design",
      now: LATER
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.value.assignments["file-1"]).toEqual({
        fileId: "file-1",
        folderId: null,
        updatedAt: LATER
      })
      // 削除対象外のフォルダに属するファイルは変えない
      expect(result.value.assignments["file-2"]).toEqual(
        state.assignments["file-2"]
      )
    }
  })

  it("存在しないフォルダはfolder_not_foundを返す", () => {
    const result = deleteFolder(buildStateWithFolders(), {
      folderId: "missing"
    })

    expect(result).toEqual({ ok: false, error: { kind: "folder_not_found" } })
  })

  it("システムフォルダはsystem_folder_not_deletableを返す", () => {
    const base = buildStateWithFolders()
    const state: PersistentState = {
      ...base,
      folders: {
        ...base.folders,
        "folder-design": { ...base.folders["folder-design"], isSystem: true }
      }
    }

    const result = deleteFolder(state, { folderId: "folder-design" })

    expect(result).toEqual({
      ok: false,
      error: { kind: "system_folder_not_deletable" }
    })
  })

  it("サブツリー内のシステムフォルダを一緒に削除できない", () => {
    const base = buildStateWithFolders()
    const state: PersistentState = {
      ...base,
      folders: {
        ...base.folders,
        "folder-design-child": {
          ...base.folders["folder-design-child"],
          isSystem: true
        }
      }
    }
    const snapshot = structuredClone(state)

    const result = deleteFolder(state, { folderId: "folder-design" })

    expect(result).toEqual({
      ok: false,
      error: { kind: "system_folder_not_deletable" }
    })
    expect(state).toEqual(snapshot)
  })

  it("循環した保存データでも対象IDを重複処理せず削除できる", () => {
    const base = buildStateWithFolders()
    const state: PersistentState = {
      ...base,
      folders: {
        ...base.folders,
        "folder-design": {
          ...base.folders["folder-design"],
          parentId: "folder-design-child"
        }
      }
    }

    const result = deleteFolder(state, {
      folderId: "folder-design",
      now: LATER
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(Object.keys(result.value.folders)).toEqual(["folder-research"])
      expect(collectFolderTreeIds(result.value.folderTree)).toEqual([
        "folder-research"
      ])
    }
  })

  it("元のstateを変更しない", () => {
    const state = buildStateWithFolders()
    const snapshot = structuredClone(state)

    deleteFolder(state, { folderId: "folder-design" })

    expect(state).toEqual(snapshot)
  })
})
