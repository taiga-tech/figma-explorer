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
import { findFolderTreeNode } from "../../features/folders/folder-tree-service"
import {
  applyOrganizerFolderMutation,
  type OrganizerFolderMutation
} from "../../features/folders/organizer-folder-mutation"
import {
  getOrganizerStorage,
  type OrganizerStorage
} from "../../storage/organizer-storage"
import {
  createOrganizerError,
  ok,
  type OrganizerError
} from "../../utils/result"

export type OrganizerFoldersStatus = "loading" | "ready" | "error"

export type OrganizerFoldersSnapshot = {
  status: OrganizerFoldersStatus
  folders: Record<FolderId, VirtualFolder>
  folderTree: FolderTreeNode[]
  // 読み込み・保存の失敗と、破損データ退避の警告を UI 表示用に載せる
  storageError: OrganizerError | null
  canRetrySave: boolean
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
  retrySave: () => Promise<void>
}

export const createOrganizerFoldersStore = (
  storage: OrganizerStorage
): OrganizerFoldersStore => {
  const listeners = new Set<() => void>()

  let confirmedState: PersistentState | null = null
  let pendingMutations: OrganizerFolderMutation[] = []
  let status: OrganizerFoldersStatus = "loading"
  let loadWarning: OrganizerError | null = null
  let loadError: OrganizerError | null = null
  let saveError: OrganizerError | null = null
  let conflictError: OrganizerError | null = null
  let externalRevision = 0
  let synchronizationGeneration = 0
  let stopWatching: (() => void) | null = null
  let flushPromise: Promise<void> | null = null

  let snapshot: OrganizerFoldersSnapshot = {
    status,
    folders: {},
    folderTree: [],
    storageError: null,
    canRetrySave: false
  }

  const deriveOptimisticState = (): PersistentState | null => {
    if (!confirmedState) {
      return null
    }

    let state = confirmedState

    for (const mutation of pendingMutations) {
      const result = applyOrganizerFolderMutation(state, mutation)

      if (result.ok === false) {
        break
      }

      state = result.value
    }

    return state
  }

  const publish = () => {
    const optimisticState = deriveOptimisticState()
    const storageError = saveError ?? conflictError ?? loadError ?? loadWarning

    snapshot = {
      status,
      folders: optimisticState?.folders ?? {},
      folderTree: optimisticState?.folderTree ?? [],
      storageError,
      canRetrySave: saveError !== null && pendingMutations.length > 0
    }

    listeners.forEach((listener) => {
      listener()
    })
  }

  const startSynchronization = () => {
    const generation = synchronizationGeneration + 1

    synchronizationGeneration = generation
    const revisionAtStart = externalRevision
    status = "loading"
    stopWatching = storage.watch((state) => {
      if (generation !== synchronizationGeneration) {
        return
      }

      externalRevision += 1
      confirmedState = state
      loadError = null
      status = "ready"
      publish()
    })
    publish()

    void storage.loadOrMigrate().then((result) => {
      if (generation !== synchronizationGeneration) {
        return
      }

      if (result.ok === false) {
        loadError = result.error
        status = externalRevision === revisionAtStart ? "error" : "ready"

        publish()

        return
      }

      // load 中に watch が新しい state を受け取った場合は、古い読み込み結果で
      // 巻き戻さず、警告情報だけを引き継ぐ。
      if (externalRevision === revisionAtStart || !confirmedState) {
        confirmedState = result.value.state
      }

      status = "ready"
      loadError = null
      loadWarning = result.value.warning ?? null
      publish()
    })
  }

  const stopSynchronization = () => {
    synchronizationGeneration += 1
    stopWatching?.()
    stopWatching = null
  }

  const flushPendingMutations = (): Promise<void> => {
    if (flushPromise) {
      return flushPromise
    }

    flushPromise = (async () => {
      while (pendingMutations.length > 0) {
        const mutation = pendingMutations[0]
        const revisionBeforeUpdate = externalRevision
        const result = await storage.update<void, FolderOperationError>(
          (latestState) => {
            const applyResult = applyOrganizerFolderMutation(
              latestState,
              mutation
            )

            if (applyResult.ok === false) {
              return applyResult
            }

            return ok({ state: applyResult.value, value: undefined })
          }
        )

        if (result.ok === false) {
          if (result.error.type === "storage") {
            saveError = result.error.error
            publish()

            return
          } else {
            // 最新 state に適用できない操作は再試行しても解消しないため、
            // キューから除き、競合として UI に通知して後続操作は継続する。
            if (externalRevision === revisionBeforeUpdate) {
              confirmedState = result.error.state
            }

            pendingMutations = pendingMutations.slice(1)
            saveError = null
            loadError = null
            status = "ready"
            conflictError = createOrganizerError(
              "storage_update_conflict",
              "The folder change could not be applied to the latest stored state.",
              result.error.error
            )
          }

          publish()

          continue
        }

        // update の待機中により新しい watch が届いた場合、その state を古い
        // 応答で巻き戻さない。自身の保存通知なら既に同じ state が反映済み。
        if (externalRevision === revisionBeforeUpdate) {
          confirmedState = result.value.state
        }

        pendingMutations = pendingMutations.slice(1)
        saveError = null
        loadError = null
        status = "ready"
        publish()
      }
    })().finally(() => {
      flushPromise = null
    })

    return flushPromise
  }

  const enqueueMutation = (mutation: OrganizerFolderMutation) => {
    conflictError = null
    pendingMutations = [...pendingMutations, mutation]
    publish()
    void flushPendingMutations()
  }

  return {
    subscribe: (listener) => {
      listeners.add(listener)

      if (listeners.size === 1) {
        startSynchronization()
      }

      return () => {
        listeners.delete(listener)

        if (listeners.size === 0) {
          stopSynchronization()
        }
      }
    },
    getSnapshot: () => snapshot,
    createFolder: (input) => {
      const optimisticState = deriveOptimisticState()

      if (!optimisticState) {
        return { kind: "folder_not_found" }
      }

      // ID と時刻をここで確定し、保存失敗後も同じ操作を安全に再適用する。
      const result = createFolder(optimisticState, {
        name: input.name,
        parentId: input.parentId
      })

      if (result.ok === false) {
        return result.error
      }

      enqueueMutation({
        type: "create_folder",
        folder: {
          id: result.value.folder.id,
          name: result.value.folder.name,
          parentId: result.value.folder.parentId,
          createdAt: result.value.folder.createdAt
        }
      })

      return null
    },
    toggleFolderExpanded: (folderId) => {
      const optimisticState = deriveOptimisticState()

      if (!optimisticState) {
        return
      }

      const node = findFolderTreeNode(optimisticState.folderTree, folderId)

      if (!node) {
        return
      }

      enqueueMutation({
        type: "set_folder_expanded",
        folderId,
        expanded: !node.expanded,
        updatedAt: new Date().toISOString()
      })
    },
    retrySave: () => flushPendingMutations()
  }
}

let defaultStore: OrganizerFoldersStore | null = null

export const getOrganizerFoldersStore = (): OrganizerFoldersStore => {
  if (!defaultStore) {
    defaultStore = createOrganizerFoldersStore(getOrganizerStorage())
  }

  return defaultStore
}
