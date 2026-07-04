import type {
  FolderId,
  FolderTreeNode,
  VirtualFolder
} from "../../domain/folder"
import type { PersistentState } from "../../domain/organizer-state"
import {
  createFolder,
  type FolderOperationError
} from "../../features/folders/folder-service"
import {
  findFolderTreeNode,
  setFolderTreeNodeExpanded
} from "../../features/folders/folder-tree-service"
import {
  getOrganizerStorage,
  type OrganizerStorage
} from "../../storage/organizer-storage"
import type { OrganizerError } from "../../utils/result"

export type OrganizerFoldersStatus = "loading" | "ready" | "error"

export type OrganizerFoldersSnapshot = {
  status: OrganizerFoldersStatus
  folders: Record<FolderId, VirtualFolder>
  folderTree: FolderTreeNode[]
  // 読み込み・保存の失敗と、破損データ退避の警告を UI 表示用に載せる
  storageError: OrganizerError | null
}

export type CreateOrganizerFolderInput = {
  name: string
  parentId: FolderId | null
}

export type OrganizerFoldersStore = {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => OrganizerFoldersSnapshot
  createFolder: (
    input: CreateOrganizerFolderInput
  ) => FolderOperationError | null
  toggleFolderExpanded: (folderId: FolderId) => void
}

export const createOrganizerFoldersStore = (
  storage: OrganizerStorage
): OrganizerFoldersStore => {
  const listeners = new Set<() => void>()

  let persistentState: PersistentState | null = null
  let status: OrganizerFoldersStatus = "loading"
  let storageError: OrganizerError | null = null
  let loadStarted = false

  let snapshot: OrganizerFoldersSnapshot = {
    status,
    folders: {},
    folderTree: [],
    storageError
  }

  const publish = () => {
    snapshot = {
      status,
      folders: persistentState?.folders ?? {},
      folderTree: persistentState?.folderTree ?? [],
      storageError
    }

    listeners.forEach((listener) => {
      listener()
    })
  }

  const ensureLoaded = () => {
    if (loadStarted) {
      return
    }

    loadStarted = true

    void storage.loadOrMigrate().then((result) => {
      if (result.ok === false) {
        status = "error"
        storageError = result.error
        publish()

        return
      }

      persistentState = result.value.state
      status = "ready"
      storageError = result.value.warning ?? null
      publish()
    })
  }

  const commit = (nextState: PersistentState) => {
    persistentState = nextState
    publish()

    void storage.save(nextState).then((saveResult) => {
      if (saveResult.ok === false) {
        storageError = saveResult.error
        publish()
      }
    })
  }

  return {
    subscribe: (listener) => {
      ensureLoaded()
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot: () => snapshot,
    createFolder: (input) => {
      if (!persistentState) {
        return { kind: "folder_not_found" }
      }

      const result = createFolder(persistentState, {
        name: input.name,
        parentId: input.parentId
      })

      if (result.ok === false) {
        return result.error
      }

      // 親フォルダ配下へ作成したときは、作成直後から見えるように展開する
      const nextTree =
        input.parentId === null
          ? result.value.state.folderTree
          : setFolderTreeNodeExpanded(
              result.value.state.folderTree,
              input.parentId,
              true
            )

      commit({ ...result.value.state, folderTree: nextTree })

      return null
    },
    toggleFolderExpanded: (folderId) => {
      if (!persistentState) {
        return
      }

      const node = findFolderTreeNode(persistentState.folderTree, folderId)

      if (!node) {
        return
      }

      commit({
        ...persistentState,
        folderTree: setFolderTreeNodeExpanded(
          persistentState.folderTree,
          folderId,
          !node.expanded
        )
      })
    }
  }
}

let defaultStore: OrganizerFoldersStore | null = null

export const getOrganizerFoldersStore = (): OrganizerFoldersStore => {
  if (!defaultStore) {
    defaultStore = createOrganizerFoldersStore(getOrganizerStorage())
  }

  return defaultStore
}
