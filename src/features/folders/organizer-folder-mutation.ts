import type {
  FolderId,
  FolderTreeNode,
  VirtualFolder
} from "../../domain/folder"
import type { PersistentState } from "../../domain/organizer-state"
import { err, ok, type Result } from "../../utils/result"
import type { FileId } from "../scan/create-file-id"
import { assignFileToFolder, unassignFile } from "./file-assignment-service"
import { createFolder, type FolderOperationError } from "./folder-service"
import {
  findFolderTreeNode,
  setFolderTreeNodeExpanded
} from "./folder-tree-service"

export type OrganizerFolderMutation =
  | {
      type: "create_folder"
      folder: Pick<VirtualFolder, "id" | "name" | "parentId" | "createdAt">
    }
  | {
      type: "set_folder_expanded"
      folderId: FolderId
      expanded: boolean
      updatedAt: string
    }
  | {
      type: "set_file_assignment"
      fileId: FileId
      folderId: FolderId | null
      updatedAt: string
    }

const latestTimestamp = (current: string, candidate: string): string =>
  candidate > current ? candidate : current

const expandFolderPath = (
  tree: FolderTreeNode[],
  folders: PersistentState["folders"],
  folderId: FolderId | null
): FolderTreeNode[] => {
  const visited = new Set<FolderId>()
  let currentId = folderId
  let nextTree = tree

  while (currentId !== null && !visited.has(currentId)) {
    visited.add(currentId)
    nextTree = setFolderTreeNodeExpanded(nextTree, currentId, true)
    currentId = folders[currentId]?.parentId ?? null
  }

  return nextTree
}

const matchesCreateMutation = (
  folder: VirtualFolder,
  mutation: Extract<OrganizerFolderMutation, { type: "create_folder" }>
): boolean =>
  folder.id === mutation.folder.id &&
  folder.name === mutation.folder.name &&
  folder.parentId === mutation.folder.parentId &&
  folder.createdAt === mutation.folder.createdAt

export const applyOrganizerFolderMutation = (
  state: PersistentState,
  mutation: OrganizerFolderMutation
): Result<PersistentState, FolderOperationError> => {
  switch (mutation.type) {
    case "create_folder": {
      const existing = state.folders[mutation.folder.id]

      if (existing) {
        if (!matchesCreateMutation(existing, mutation)) {
          return err({ kind: "duplicate_folder_id" })
        }

        return ok({
          ...state,
          folderTree: expandFolderPath(
            state.folderTree,
            state.folders,
            existing.parentId
          )
        })
      }

      const result = createFolder(state, {
        name: mutation.folder.name,
        parentId: mutation.folder.parentId,
        now: mutation.folder.createdAt,
        createId: () => mutation.folder.id
      })

      if (result.ok === false) {
        return result
      }

      return ok({
        ...result.value.state,
        folderTree: expandFolderPath(
          result.value.state.folderTree,
          result.value.state.folders,
          mutation.folder.parentId
        ),
        meta: {
          ...result.value.state.meta,
          updatedAt: latestTimestamp(
            state.meta.updatedAt,
            mutation.folder.createdAt
          )
        }
      })
    }
    case "set_folder_expanded": {
      const node = findFolderTreeNode(state.folderTree, mutation.folderId)

      if (!node) {
        return err({ kind: "folder_not_found" })
      }

      if (node.expanded === mutation.expanded) {
        return ok(state)
      }

      return ok({
        ...state,
        folderTree: setFolderTreeNodeExpanded(
          state.folderTree,
          mutation.folderId,
          mutation.expanded
        ),
        meta: {
          ...state.meta,
          updatedAt: latestTimestamp(state.meta.updatedAt, mutation.updatedAt)
        }
      })
    }
    case "set_file_assignment":
      return mutation.folderId === null
        ? unassignFile(state, {
            fileId: mutation.fileId,
            now: mutation.updatedAt
          })
        : assignFileToFolder(state, {
            fileId: mutation.fileId,
            folderId: mutation.folderId,
            now: mutation.updatedAt
          })
  }
}
