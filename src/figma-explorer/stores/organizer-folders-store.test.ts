import { describe, expect, it } from "vitest"

import {
  createInitialPersistentState,
  type PersistentState
} from "../../domain/organizer-state"
import {
  createFolder,
  deleteFolder
} from "../../features/folders/folder-service"
import { findFolderTreeNode } from "../../features/folders/folder-tree-service"
import {
  createOrganizerStorage,
  type ExclusiveRunner,
  type OrganizerStorage,
  type OrganizerStorageBackend
} from "../../storage/organizer-storage"
import { createOrganizerError, err, ok } from "../../utils/result"
import { createOrganizerFoldersStore } from "./organizer-folders-store"

const STORAGE_KEY = "figmaDraftsOrganizerState"
const NOW = "2026-07-15T00:00:00.000Z"

const runImmediately: ExclusiveRunner = (task) => task()

const createSharedExclusiveRunner = (): ExclusiveRunner => {
  let pending: Promise<unknown> = Promise.resolve()

  return async <T>(task: () => Promise<T>): Promise<T> => {
    const result = pending.then(task)

    pending = result.catch(() => undefined)

    return result
  }
}

const createPausableExclusiveRunner = () => {
  let pause: Promise<void> | null = null
  let resume = () => undefined

  const runExclusive: ExclusiveRunner = async (task) => {
    await pause

    return task()
  }

  return {
    runExclusive,
    pause: () => {
      pause = new Promise<void>((resolve) => {
        resume = resolve
      })
    },
    resume: () => {
      pause = null
      resume()
    }
  }
}

const clone = <T>(value: T): T => structuredClone(value)

const createMemoryBackend = (
  initialEntries: Record<string, unknown> = {}
): OrganizerStorageBackend & {
  entries: Map<string, unknown>
  failNextSet: () => void
  watcherCount: (key: string) => number
} => {
  const entries = new Map<string, unknown>(Object.entries(initialEntries))
  const watchers = new Map<string, Set<(raw: unknown) => void>>()
  let shouldFailNextSet = false

  return {
    entries,
    failNextSet: () => {
      shouldFailNextSet = true
    },
    watcherCount: (key) => watchers.get(key)?.size ?? 0,
    get: async (key) => {
      const value = entries.get(key)

      return value === undefined ? undefined : clone(value)
    },
    set: async (key, value) => {
      if (shouldFailNextSet) {
        shouldFailNextSet = false

        throw new Error("quota exceeded")
      }

      const storedValue = clone(value)

      entries.set(key, storedValue)
      watchers.get(key)?.forEach((listener) => {
        listener(clone(storedValue))
      })
    },
    remove: async (key) => {
      entries.delete(key)
    },
    watch: (key, listener) => {
      const listeners = watchers.get(key) ?? new Set()

      listeners.add(listener)
      watchers.set(key, listeners)

      return () => {
        listeners.delete(listener)
      }
    }
  }
}

const flushAsyncTasks = () => new Promise((resolve) => setTimeout(resolve, 0))

const setupReadyStore = async (
  initialState: PersistentState = createInitialPersistentState(NOW)
) => {
  const backend = createMemoryBackend({ [STORAGE_KEY]: initialState })
  const store = createOrganizerFoldersStore(
    createOrganizerStorage(backend, runImmediately)
  )
  const unsubscribe = store.subscribe(() => undefined)

  await flushAsyncTasks()

  return { backend, store, unsubscribe }
}

const addFolder = (
  state: PersistentState,
  input: { id: string; name: string; parentId?: string | null }
): PersistentState => {
  const result = createFolder(state, {
    name: input.name,
    parentId: input.parentId,
    now: NOW,
    createId: () => input.id
  })

  if (result.ok === false) {
    throw new Error(result.error.kind)
  }

  return result.value.state
}

describe("createOrganizerFoldersStore", () => {
  it("購読開始でstorageから読み込みreadyになる", async () => {
    const { store } = await setupReadyStore()

    expect(store.getSnapshot()).toMatchObject({
      status: "ready",
      folders: {},
      folderTree: [],
      storageError: null,
      canRetrySave: false
    })
  })

  it("最初の購読でwatchを開始し最後の解除で停止する", async () => {
    const initialState = createInitialPersistentState(NOW)
    const backend = createMemoryBackend({ [STORAGE_KEY]: initialState })
    const store = createOrganizerFoldersStore(
      createOrganizerStorage(backend, runImmediately)
    )

    expect(backend.watcherCount(STORAGE_KEY)).toBe(0)

    const unsubscribe = store.subscribe(() => undefined)

    expect(backend.watcherCount(STORAGE_KEY)).toBe(1)
    await flushAsyncTasks()
    unsubscribe()

    expect(backend.watcherCount(STORAGE_KEY)).toBe(0)

    const unsubscribeAgain = store.subscribe(() => undefined)

    expect(backend.watcherCount(STORAGE_KEY)).toBe(1)
    await flushAsyncTasks()
    expect(store.getSnapshot().status).toBe("ready")

    unsubscribeAgain()
    expect(backend.watcherCount(STORAGE_KEY)).toBe(0)
  })

  it("フォルダ作成がsnapshotとstorageへ反映される", async () => {
    const { backend, store } = await setupReadyStore()

    const error = store.createFolder({ name: "design", parentId: null })

    expect(error).toBeNull()
    expect(Object.values(store.getSnapshot().folders)[0]?.name).toBe("design")

    await store.retrySave()

    const snapshot = store.getSnapshot()
    const createdId = Object.keys(snapshot.folders)[0]
    const persisted = backend.entries.get(STORAGE_KEY) as PersistentState

    expect(createdId).toBeDefined()
    expect(snapshot.folderTree).toHaveLength(1)
    expect(persisted.folders[createdId]?.name).toBe("design")
  })

  it("load中に外部更新を受けても古い読み込み結果へ巻き戻さない", async () => {
    type LoadResult = Awaited<ReturnType<OrganizerStorage["loadOrMigrate"]>>

    const initialState = createInitialPersistentState(NOW)
    const externalState = addFolder(initialState, {
      id: "folder-external",
      name: "external"
    })
    let resolveLoad: (result: LoadResult) => void = () => undefined
    let notifyExternalState: (state: PersistentState) => void = () => undefined
    const loadPromise = new Promise<LoadResult>((resolve) => {
      resolveLoad = resolve
    })
    const storage: OrganizerStorage = {
      loadOrMigrate: () => loadPromise,
      update: () => Promise.reject(new Error("not used")),
      clear: async () => ok(undefined),
      watch: (listener) => {
        notifyExternalState = listener

        return () => undefined
      }
    }
    const store = createOrganizerFoldersStore(storage)

    store.subscribe(() => undefined)
    notifyExternalState(externalState)
    resolveLoad(ok({ state: initialState, migratedFrom: null }))
    await flushAsyncTasks()

    expect(Object.values(store.getSnapshot().folders)[0]?.name).toBe("external")
  })

  it("watch後にloadが失敗しても次の外部更新で一時エラーを解除する", async () => {
    type LoadResult = Awaited<ReturnType<OrganizerStorage["loadOrMigrate"]>>

    const externalState = addFolder(createInitialPersistentState(NOW), {
      id: "folder-external",
      name: "external"
    })
    let resolveLoad: (result: LoadResult) => void = () => undefined
    let notifyExternalState: (state: PersistentState) => void = () => undefined
    const storage: OrganizerStorage = {
      loadOrMigrate: () =>
        new Promise<LoadResult>((resolve) => {
          resolveLoad = resolve
        }),
      update: () => Promise.reject(new Error("not used")),
      clear: async () => ok(undefined),
      watch: (listener) => {
        notifyExternalState = listener

        return () => undefined
      }
    }
    const store = createOrganizerFoldersStore(storage)

    store.subscribe(() => undefined)
    notifyExternalState(externalState)
    resolveLoad(
      err(
        createOrganizerError(
          "storage_load_failed",
          "Failed to read organizer state."
        )
      )
    )
    await flushAsyncTasks()

    expect(store.getSnapshot().status).toBe("ready")
    expect(store.getSnapshot().storageError?.kind).toBe("storage_load_failed")

    notifyExternalState(externalState)

    expect(store.getSnapshot().storageError).toBeNull()
  })

  it("折りたたまれた祖先配下へ作成すると作成先までのpathを展開する", async () => {
    let initialState = createInitialPersistentState(NOW)

    initialState = addFolder(initialState, {
      id: "folder-root",
      name: "root"
    })
    initialState = addFolder(initialState, {
      id: "folder-child",
      name: "child",
      parentId: "folder-root"
    })
    initialState = addFolder(initialState, {
      id: "folder-other",
      name: "other"
    })

    const { backend, store } = await setupReadyStore(initialState)

    const error = store.createFolder({
      name: "grandchild",
      parentId: "folder-child"
    })

    expect(error).toBeNull()
    expect(
      findFolderTreeNode(store.getSnapshot().folderTree, "folder-root")
        ?.expanded
    ).toBe(true)
    expect(
      findFolderTreeNode(store.getSnapshot().folderTree, "folder-child")
        ?.expanded
    ).toBe(true)
    expect(
      findFolderTreeNode(store.getSnapshot().folderTree, "folder-other")
        ?.expanded
    ).toBe(false)

    await store.retrySave()

    const persisted = backend.entries.get(STORAGE_KEY) as PersistentState
    const grandchild = Object.values(persisted.folders).find(
      (folder) => folder.name === "grandchild"
    )

    expect(grandchild?.parentId).toBe("folder-child")
    expect(
      findFolderTreeNode(persisted.folderTree, "folder-root")?.expanded
    ).toBe(true)
    expect(
      findFolderTreeNode(persisted.folderTree, "folder-child")?.expanded
    ).toBe(true)
  })

  it("作成エラーはsnapshotを変えずに返す", async () => {
    const { store } = await setupReadyStore()

    const error = store.createFolder({ name: "   ", parentId: null })

    expect(error).toEqual({ kind: "empty_folder_name" })
    expect(store.getSnapshot().folderTree).toHaveLength(0)
  })

  it("展開状態の切り替えを指定値として永続化する", async () => {
    const { backend, store } = await setupReadyStore()

    store.createFolder({ name: "design", parentId: null })

    const folderId = Object.keys(store.getSnapshot().folders)[0]

    store.toggleFolderExpanded(folderId)

    expect(store.getSnapshot().folderTree[0]?.expanded).toBe(true)

    await store.retrySave()

    let persisted = backend.entries.get(STORAGE_KEY) as PersistentState

    expect(persisted.folderTree[0]?.expanded).toBe(true)

    store.toggleFolderExpanded(folderId)

    expect(store.getSnapshot().folderTree[0]?.expanded).toBe(false)

    await store.retrySave()
    persisted = backend.entries.get(STORAGE_KEY) as PersistentState

    expect(persisted.folderTree[0]?.expanded).toBe(false)
  })

  it("別タブから同時に作成しても両方を保存しsnapshotを同期する", async () => {
    const initialState = createInitialPersistentState(NOW)
    const backend = createMemoryBackend({ [STORAGE_KEY]: initialState })
    const runExclusive = createSharedExclusiveRunner()
    const firstStore = createOrganizerFoldersStore(
      createOrganizerStorage(backend, runExclusive)
    )
    const secondStore = createOrganizerFoldersStore(
      createOrganizerStorage(backend, runExclusive)
    )

    firstStore.subscribe(() => undefined)
    secondStore.subscribe(() => undefined)
    await flushAsyncTasks()

    expect(
      firstStore.createFolder({ name: "Alpha", parentId: null })
    ).toBeNull()
    expect(
      secondStore.createFolder({ name: "Beta", parentId: null })
    ).toBeNull()

    await Promise.all([firstStore.retrySave(), secondStore.retrySave()])

    const persisted = backend.entries.get(STORAGE_KEY) as PersistentState
    const persistedFolders = Object.values(persisted.folders)

    expect(persistedFolders.map((folder) => folder.name)).toEqual([
      "Alpha",
      "Beta"
    ])
    expect(persistedFolders.map((folder) => folder.sortOrder)).toEqual([0, 1])
    expect(persisted.folderTree).toHaveLength(2)

    for (const store of [firstStore, secondStore]) {
      expect(
        Object.values(store.getSnapshot().folders).map((folder) => folder.name)
      ).toEqual(["Alpha", "Beta"])
      expect(store.getSnapshot().folderTree).toHaveLength(2)
      expect(store.getSnapshot().storageError).toBeNull()
    }
  })

  it("外部watchへpending mutationをrebaseし次の操作も失わない", async () => {
    const initialState = createInitialPersistentState(NOW)
    const externalState = addFolder(initialState, {
      id: "folder-beta",
      name: "Beta"
    })
    const backend = createMemoryBackend({ [STORAGE_KEY]: initialState })
    const runner = createPausableExclusiveRunner()
    const store = createOrganizerFoldersStore(
      createOrganizerStorage(backend, runner.runExclusive)
    )

    store.subscribe(() => undefined)
    await flushAsyncTasks()
    runner.pause()

    store.createFolder({ name: "Alpha", parentId: null })
    await backend.set(STORAGE_KEY, externalState)

    expect(
      Object.values(store.getSnapshot().folders).map((folder) => folder.name)
    ).toEqual(["Beta", "Alpha"])

    store.createFolder({ name: "Gamma", parentId: null })

    expect(
      Object.values(store.getSnapshot().folders).map((folder) => folder.name)
    ).toEqual(["Beta", "Alpha", "Gamma"])

    runner.resume()
    await store.retrySave()

    const persisted = backend.entries.get(STORAGE_KEY) as PersistentState

    expect(
      Object.values(persisted.folders).map((folder) => folder.name)
    ).toEqual(["Beta", "Alpha", "Gamma"])
    expect(
      Object.values(persisted.folders).map((folder) => folder.sortOrder)
    ).toEqual([0, 1, 2])
  })

  it("update待機中の新しいwatch stateを古い完了応答で巻き戻さない", async () => {
    const initialState = createInitialPersistentState(NOW)
    let notifyExternalState: (state: PersistentState) => void = () => undefined
    let pendingSavedState: PersistentState | null = null
    let finishUpdate = () => undefined
    const update: OrganizerStorage["update"] = (apply) =>
      new Promise((resolve) => {
        const applied = apply(initialState)

        if (applied.ok === false) {
          resolve(
            err({
              type: "apply",
              error: applied.error,
              state: initialState
            })
          )

          return
        }

        pendingSavedState = applied.value.state
        finishUpdate = () => {
          resolve(ok(applied.value))
        }
      })
    const storage: OrganizerStorage = {
      loadOrMigrate: async () =>
        ok({ state: initialState, migratedFrom: null }),
      update,
      clear: async () => ok(undefined),
      watch: (listener) => {
        notifyExternalState = listener

        return () => undefined
      }
    }
    const store = createOrganizerFoldersStore(storage)

    store.subscribe(() => undefined)
    await flushAsyncTasks()
    store.createFolder({ name: "Alpha", parentId: null })

    if (!pendingSavedState) {
      throw new Error("The pending update was not captured.")
    }

    const newerState = addFolder(pendingSavedState, {
      id: "folder-beta",
      name: "Beta"
    })

    notifyExternalState(newerState)

    const saving = store.retrySave()

    finishUpdate()
    await saving

    expect(
      Object.values(store.getSnapshot().folders).map((folder) => folder.name)
    ).toEqual(["Alpha", "Beta"])
  })

  it("apply競合の待機中に届いた新しいwatch stateも巻き戻さない", async () => {
    const initialState = addFolder(createInitialPersistentState(NOW), {
      id: "folder-parent",
      name: "parent"
    })
    const deleted = deleteFolder(initialState, {
      folderId: "folder-parent",
      now: NOW
    })

    if (deleted.ok === false) {
      throw new Error(deleted.error.kind)
    }

    const newerState = addFolder(deleted.value, {
      id: "folder-beta",
      name: "Beta"
    })
    let notifyExternalState: (state: PersistentState) => void = () => undefined
    let finishUpdate = () => undefined
    const update: OrganizerStorage["update"] = (apply) =>
      new Promise((resolve, reject) => {
        const applied = apply(deleted.value)

        if (applied.ok !== false) {
          reject(new Error("The mutation unexpectedly succeeded."))

          return
        }

        finishUpdate = () => {
          resolve(
            err({
              type: "apply",
              error: applied.error,
              state: deleted.value
            })
          )
        }
      })
    const storage: OrganizerStorage = {
      loadOrMigrate: async () =>
        ok({ state: initialState, migratedFrom: null }),
      update,
      clear: async () => ok(undefined),
      watch: (listener) => {
        notifyExternalState = listener

        return () => undefined
      }
    }
    const store = createOrganizerFoldersStore(storage)

    store.subscribe(() => undefined)
    await flushAsyncTasks()
    store.createFolder({ name: "child", parentId: "folder-parent" })
    notifyExternalState(newerState)

    const saving = store.retrySave()

    finishUpdate()
    await saving

    expect(
      Object.values(store.getSnapshot().folders).map((folder) => folder.name)
    ).toEqual(["Beta"])
    expect(store.getSnapshot().storageError?.kind).toBe(
      "storage_update_conflict"
    )
  })

  it("適用不能な操作を競合として除外して後続の独立操作を保存する", async () => {
    const initialState = addFolder(createInitialPersistentState(NOW), {
      id: "folder-parent",
      name: "parent"
    })
    const deleted = deleteFolder(initialState, {
      folderId: "folder-parent",
      now: NOW
    })

    if (deleted.ok === false) {
      throw new Error(deleted.error.kind)
    }

    const backend = createMemoryBackend({ [STORAGE_KEY]: initialState })
    const runner = createPausableExclusiveRunner()
    const store = createOrganizerFoldersStore(
      createOrganizerStorage(backend, runner.runExclusive)
    )

    store.subscribe(() => undefined)
    await flushAsyncTasks()
    runner.pause()

    store.createFolder({ name: "child", parentId: "folder-parent" })
    store.createFolder({ name: "independent", parentId: null })
    await backend.set(STORAGE_KEY, deleted.value)

    runner.resume()
    await store.retrySave()

    const persisted = backend.entries.get(STORAGE_KEY) as PersistentState

    expect(
      Object.values(persisted.folders).map((folder) => folder.name)
    ).toEqual(["independent"])
    expect(store.getSnapshot().storageError?.kind).toBe(
      "storage_update_conflict"
    )
    expect(store.getSnapshot().canRetrySave).toBe(false)

    store.createFolder({ name: "recovery", parentId: null })

    expect(store.getSnapshot().storageError).toBeNull()

    await store.retrySave()

    expect(
      Object.values(
        (backend.entries.get(STORAGE_KEY) as PersistentState).folders
      ).map((folder) => folder.name)
    ).toEqual(["independent", "recovery"])
  })

  it("保存失敗後に適用競合へ変わった場合は古い保存エラーを解除する", async () => {
    const initialState = addFolder(createInitialPersistentState(NOW), {
      id: "folder-parent",
      name: "parent"
    })
    const deleted = deleteFolder(initialState, {
      folderId: "folder-parent",
      now: NOW
    })

    if (deleted.ok === false) {
      throw new Error(deleted.error.kind)
    }

    const { backend, store } = await setupReadyStore(initialState)

    backend.failNextSet()
    store.createFolder({ name: "child", parentId: "folder-parent" })
    await store.retrySave()

    expect(store.getSnapshot().storageError?.kind).toBe("storage_save_failed")

    await backend.set(STORAGE_KEY, deleted.value)
    await store.retrySave()

    expect(store.getSnapshot().storageError?.kind).toBe(
      "storage_update_conflict"
    )
    expect(store.getSnapshot().canRetrySave).toBe(false)
  })

  it("保存失敗後も未保存stateを保持しretry成功でerrorを解除する", async () => {
    const { backend, store } = await setupReadyStore()

    backend.failNextSet()
    store.createFolder({ name: "design", parentId: null })
    await store.retrySave()

    expect(Object.values(store.getSnapshot().folders)[0]?.name).toBe("design")
    expect(
      Object.values(
        (backend.entries.get(STORAGE_KEY) as PersistentState).folders
      )
    ).toHaveLength(0)
    expect(store.getSnapshot().storageError?.kind).toBe("storage_save_failed")
    expect(store.getSnapshot().canRetrySave).toBe(true)

    await store.retrySave()

    const persisted = backend.entries.get(STORAGE_KEY) as PersistentState

    expect(Object.values(persisted.folders)[0]?.name).toBe("design")
    expect(persisted.folderTree).toHaveLength(1)
    expect(store.getSnapshot().storageError).toBeNull()
    expect(store.getSnapshot().canRetrySave).toBe(false)
  })
})
