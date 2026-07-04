import type { FolderId, VirtualFolder } from "../../domain/folder"
import type { PersistentState } from "../../domain/organizer-state"
import { err, ok, type Result } from "../../utils/result"
import {
  createFolderTreeNode,
  insertFolderTreeNode,
  removeFolderTreeNode
} from "./folder-tree-service"

export type FolderOperationError = {
  kind:
    | "empty_folder_name"
    | "folder_not_found"
    | "parent_folder_not_found"
    | "system_folder_not_deletable"
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

  const now = input.now ?? new Date().toISOString()
  const id = (input.createId ?? createDefaultFolderId)()

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
