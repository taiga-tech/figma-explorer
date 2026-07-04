import { describe, expect, it } from "vitest"

import type { PersistentState } from "../../domain/organizer-state"
import {
  createOrganizerStorage,
  type OrganizerStorageBackend
} from "../../storage/organizer-storage"
import { createOrganizerFoldersStore } from "./organizer-folders-store"

const createMemoryBackend = (
  initialEntries: Record<string, unknown> = {}
): OrganizerStorageBackend & { entries: Map<string, unknown> } => {
  const entries = new Map<string, unknown>(Object.entries(initialEntries))

  return {
    entries,
    get: (key) => Promise.resolve(entries.get(key)),
    set: (key, value) => {
      entries.set(key, value)

      return Promise.resolve()
    },
    remove: (key) => {
      entries.delete(key)

      return Promise.resolve()
    }
  }
}

const flushAsyncTasks = () => new Promise((resolve) => setTimeout(resolve, 0))

const setupReadyStore = async (
  initialEntries: Record<string, unknown> = {}
) => {
  const backend = createMemoryBackend(initialEntries)
  const store = createOrganizerFoldersStore(createOrganizerStorage(backend))
  const unsubscribe = store.subscribe(() => undefined)

  await flushAsyncTasks()

  return { backend, store, unsubscribe }
}

describe("createOrganizerFoldersStore", () => {
  it("購読開始でstorageから読み込みreadyになる", async () => {
    const { store } = await setupReadyStore()

    expect(store.getSnapshot()).toMatchObject({
      status: "ready",
      folders: {},
      folderTree: [],
      storageError: null
    })
  })

  it("フォルダ作成がsnapshotとstorageへ反映される", async () => {
    const { backend, store } = await setupReadyStore()

    const error = store.createFolder({ name: "design", parentId: null })

    expect(error).toBeNull()

    await flushAsyncTasks()

    const snapshot = store.getSnapshot()
    const createdId = Object.keys(snapshot.folders)[0]

    expect(createdId).toBeDefined()
    expect(snapshot.folders[createdId]?.name).toBe("design")
    expect(snapshot.folderTree).toHaveLength(1)

    const persisted = backend.entries.get(
      "figmaDraftsOrganizerState"
    ) as PersistentState

    expect(persisted.folders[createdId]?.name).toBe("design")
  })

  it("親フォルダ配下へ作成すると親が展開される", async () => {
    const { store } = await setupReadyStore()

    store.createFolder({ name: "design", parentId: null })

    const parentId = Object.keys(store.getSnapshot().folders)[0]

    store.createFolder({ name: "child", parentId })

    const snapshot = store.getSnapshot()

    expect(snapshot.folderTree[0]?.expanded).toBe(true)
    expect(snapshot.folderTree[0]?.children).toHaveLength(1)
  })

  it("作成エラーはsnapshotを変えずに返す", async () => {
    const { store } = await setupReadyStore()

    const error = store.createFolder({ name: "   ", parentId: null })

    expect(error).toEqual({ kind: "empty_folder_name" })
    expect(store.getSnapshot().folderTree).toHaveLength(0)
  })

  it("展開状態の切り替えが永続化される", async () => {
    const { backend, store } = await setupReadyStore()

    store.createFolder({ name: "design", parentId: null })

    const folderId = Object.keys(store.getSnapshot().folders)[0]

    store.toggleFolderExpanded(folderId)

    expect(store.getSnapshot().folderTree[0]?.expanded).toBe(true)

    await flushAsyncTasks()

    const persisted = backend.entries.get(
      "figmaDraftsOrganizerState"
    ) as PersistentState

    expect(persisted.folderTree[0]?.expanded).toBe(true)

    store.toggleFolderExpanded(folderId)

    expect(store.getSnapshot().folderTree[0]?.expanded).toBe(false)
  })

  it("保存失敗はstorageErrorとしてsnapshotへ載る", async () => {
    const backend = createMemoryBackend()
    const failingBackend: OrganizerStorageBackend = {
      ...backend,
      set: () => Promise.reject(new Error("quota exceeded"))
    }
    const store = createOrganizerFoldersStore(
      createOrganizerStorage(failingBackend)
    )

    store.subscribe(() => undefined)
    await flushAsyncTasks()

    store.createFolder({ name: "design", parentId: null })
    await flushAsyncTasks()

    expect(store.getSnapshot().storageError?.kind).toBe("storage_save_failed")
  })
})
