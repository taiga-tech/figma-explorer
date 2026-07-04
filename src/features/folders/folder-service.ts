import {
  MAX_FOLDER_DEPTH,
  type FolderId,
  type VirtualFolder
} from "../../domain/folder"
import type { PersistentState } from "../../domain/organizer-state"
import { err, ok, type Result } from "../../utils/result"
import {
  createFolderTreeNode,
  findFolderTreeNode,
  insertFolderTreeNode,
  removeFolderTreeNode
} from "./folder-tree-service"

export type FolderOperationError = {
  kind:
    | "empty_folder_name"
    | "folder_not_found"
    | "parent_folder_not_found"
    | "system_folder_not_deletable"
    | "duplicate_folder_id"
    | "circular_reference"
    | "max_depth_exceeded"
}

export type CreateFolderInput = {
  name: string
  parentId?: FolderId | null
  now?: string
  createId?: () => FolderId
}

export type CreateFolderValue = {
  state: PersistentState
  folder: VirtualFolder
}

export type CreateFolderResult = Result<CreateFolderValue, FolderOperationError>

export type FolderOperationResult = Result<
  PersistentState,
  FolderOperationError
>

const createDefaultFolderId = (): FolderId =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? `folder_${crypto.randomUUID()}`
    : `folder_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`

const nextSiblingSortOrder = (
  folders: PersistentState["folders"],
  parentId: FolderId | null
): number => {
  const siblingSortOrders = Object.values(folders)
    .filter((folder) => folder.parentId === parentId)
    .map((folder) => folder.sortOrder)

  return siblingSortOrders.length === 0 ? 0 : Math.max(...siblingSortOrders) + 1
}

/**
 * ルートを1階層目としたフォルダの深さ。visited 判定は破損データで
 * parentId が循環していても無限ループしないための保険。
 */
const folderDepth = (
  folders: PersistentState["folders"],
  folderId: FolderId
): number => {
  const visited = new Set<FolderId>()
  let depth = 0
  let currentId: FolderId | null = folderId

  while (currentId !== null && !visited.has(currentId)) {
    visited.add(currentId)
    depth += 1
    currentId = folders[currentId]?.parentId ?? null
  }

  return depth
}

/** 対象フォルダ自身を1階層と数えたサブツリーの高さ。 */
const folderSubtreeHeight = (
  folders: PersistentState["folders"],
  rootId: FolderId,
  visited: Set<FolderId> = new Set()
): number => {
  if (visited.has(rootId)) {
    return 0
  }

  visited.add(rootId)

  const childHeights = Object.values(folders)
    .filter((folder) => folder.parentId === rootId)
    .map((folder) => folderSubtreeHeight(folders, folder.id, visited))

  return 1 + (childHeights.length === 0 ? 0 : Math.max(...childHeights))
}

/** 対象フォルダ自身と、parentId で辿れる子孫すべての ID を返す。 */
const collectFolderAndDescendantIds = (
  folders: PersistentState["folders"],
  rootId: FolderId
): FolderId[] => {
  const ids = [rootId]

  for (let index = 0; index < ids.length; index += 1) {
    for (const folder of Object.values(folders)) {
      if (folder.parentId === ids[index]) {
        ids.push(folder.id)
      }
    }
  }

  return ids
}

export const createFolder = (
  state: PersistentState,
  input: CreateFolderInput
): CreateFolderResult => {
  const name = input.name.trim()

  if (!name) {
    return err({ kind: "empty_folder_name" })
  }

  const parentId = input.parentId ?? null

  if (parentId !== null && !state.folders[parentId]) {
    return err({ kind: "parent_folder_not_found" })
  }

  const parentDepth =
    parentId === null ? 0 : folderDepth(state.folders, parentId)

  if (parentDepth + 1 > MAX_FOLDER_DEPTH) {
    return err({ kind: "max_depth_exceeded" })
  }

  const now = input.now ?? new Date().toISOString()
  const id = (input.createId ?? createDefaultFolderId)()

  if (state.folders[id]) {
    return err({ kind: "duplicate_folder_id" })
  }

  const folder: VirtualFolder = {
    id,
    name,
    parentId,
    sortOrder: nextSiblingSortOrder(state.folders, parentId),
    createdAt: now,
    updatedAt: now,
    isSystem: false
  }

  return ok({
    state: {
      ...state,
      folders: { ...state.folders, [id]: folder },
      folderTree: insertFolderTreeNode(
        state.folderTree,
        createFolderTreeNode(id),
        parentId
      ),
      meta: { ...state.meta, updatedAt: now }
    },
    folder
  })
}

export const renameFolder = (
  state: PersistentState,
  input: { folderId: FolderId; name: string; now?: string }
): FolderOperationResult => {
  const folder = state.folders[input.folderId]

  if (!folder) {
    return err({ kind: "folder_not_found" })
  }

  const name = input.name.trim()

  if (!name) {
    return err({ kind: "empty_folder_name" })
  }

  const now = input.now ?? new Date().toISOString()

  return ok({
    ...state,
    folders: {
      ...state.folders,
      [folder.id]: { ...folder, name, updatedAt: now }
    },
    meta: { ...state.meta, updatedAt: now }
  })
}

/**
 * フォルダをサブツリーごと別の親へ移動する。
 * 自分自身・自分の子孫への移動は循環参照になるため拒否し、
 * 移動後の最深階層が MAX_FOLDER_DEPTH を超える場合も拒否する。
 * ツリー上は既存ノードを取り除いてから挿入するため、同一フォルダが
 * 重複して配置されることはない。
 */
export const moveFolder = (
  state: PersistentState,
  input: { folderId: FolderId; parentId: FolderId | null; now?: string }
): FolderOperationResult => {
  const folder = state.folders[input.folderId]

  if (!folder) {
    return err({ kind: "folder_not_found" })
  }

  if (input.parentId !== null && !state.folders[input.parentId]) {
    return err({ kind: "parent_folder_not_found" })
  }

  if (input.parentId !== null) {
    const subtreeIds = collectFolderAndDescendantIds(state.folders, folder.id)

    if (subtreeIds.includes(input.parentId)) {
      return err({ kind: "circular_reference" })
    }
  }

  const parentDepth =
    input.parentId === null ? 0 : folderDepth(state.folders, input.parentId)

  if (
    parentDepth + folderSubtreeHeight(state.folders, folder.id) >
    MAX_FOLDER_DEPTH
  ) {
    return err({ kind: "max_depth_exceeded" })
  }

  const now = input.now ?? new Date().toISOString()
  const node =
    findFolderTreeNode(state.folderTree, folder.id) ??
    createFolderTreeNode(folder.id)

  return ok({
    ...state,
    folders: {
      ...state.folders,
      [folder.id]: {
        ...folder,
        parentId: input.parentId,
        sortOrder: nextSiblingSortOrder(state.folders, input.parentId),
        updatedAt: now
      }
    },
    folderTree: insertFolderTreeNode(
      removeFolderTreeNode(state.folderTree, folder.id),
      node,
      input.parentId
    ),
    meta: { ...state.meta, updatedAt: now }
  })
}

/**
 * フォルダを配下のサブツリーごと削除する。
 * 削除されたフォルダに属していたファイルは未分類（folderId: null）へ戻す
 * （docs/architecture/state-management.md §9）。
 */
export const deleteFolder = (
  state: PersistentState,
  input: { folderId: FolderId; now?: string }
): FolderOperationResult => {
  const folder = state.folders[input.folderId]

  if (!folder) {
    return err({ kind: "folder_not_found" })
  }

  if (folder.isSystem) {
    return err({ kind: "system_folder_not_deletable" })
  }

  const now = input.now ?? new Date().toISOString()
  const removedIds = new Set(
    collectFolderAndDescendantIds(state.folders, folder.id)
  )

  const folders = Object.fromEntries(
    Object.entries(state.folders).filter(([id]) => !removedIds.has(id))
  )

  const assignments = Object.fromEntries(
    Object.entries(state.assignments).map(([fileId, assignment]) => [
      fileId,
      assignment.folderId !== null && removedIds.has(assignment.folderId)
        ? { ...assignment, folderId: null, updatedAt: now }
        : assignment
    ])
  )

  const folderTree = [...removedIds].reduce(
    (tree, removedId) => removeFolderTreeNode(tree, removedId),
    state.folderTree
  )

  return ok({
    ...state,
    folders,
    folderTree,
    assignments,
    meta: { ...state.meta, updatedAt: now }
  })
}
