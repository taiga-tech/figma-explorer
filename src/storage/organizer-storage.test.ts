import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createInitialPersistentState,
  SCHEMA_VERSION
} from "../domain/organizer-state"
import { err, ok } from "../utils/result"
import {
  createOrganizerStorage,
  type ExclusiveRunner,
  type OrganizerStorageBackend
} from "./organizer-storage"

const STORAGE_KEY = "figmaDraftsOrganizerState"
const BACKUP_STORAGE_KEY = "figmaDraftsOrganizerStateBackup"

const runImmediately: ExclusiveRunner = (task) => task()

const createSharedExclusiveRunner = (): ExclusiveRunner => {
  let pending: Promise<unknown> = Promise.resolve()

  return async <T>(task: () => Promise<T>): Promise<T> => {
    const result = pending.then(task)

    pending = result.catch(() => undefined)

    return result
  }
}

const createMemoryBackend = () => {
  const store = new Map<string, unknown>()
  const watchers = new Map<string, Set<(raw: unknown) => void>>()

  const emit = (key: string, raw: unknown) => {
    watchers.get(key)?.forEach((listener) => {
      listener(raw)
    })
  }

  const backend: OrganizerStorageBackend = {
    get: async (key) => store.get(key),
    set: async (key, value) => {
      store.set(key, value)
    },
    remove: async (key) => {
      store.delete(key)
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

  return { backend, store, emit }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("organizerStorage.loadOrMigrate", () => {
  it("保存データがない場合は初期状態を返す", async () => {
    const { backend } = createMemoryBackend()
    const storage = createOrganizerStorage(backend, runImmediately)

    const result = await storage.loadOrMigrate()

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.value.state.schemaVersion).toBe(SCHEMA_VERSION)
      expect(result.value.migratedFrom).toBeNull()
      expect(result.value.warning).toBeUndefined()
    }
  })

  it("現行バージョンの保存データを復元する", async () => {
    const { backend, store } = createMemoryBackend()
    const saved = createInitialPersistentState("2026-07-01T00:00:00.000Z")
    store.set(STORAGE_KEY, saved)

    const storage = createOrganizerStorage(backend, runImmediately)
    const result = await storage.loadOrMigrate()

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.value.state).toEqual(saved)
      expect(result.value.migratedFrom).toBeNull()
    }
  })

  it("将来バージョンのデータは上書きせずエラーを返す", async () => {
    const { backend, store } = createMemoryBackend()
    const futureState = {
      ...createInitialPersistentState(),
      schemaVersion: SCHEMA_VERSION + 5
    }
    store.set(STORAGE_KEY, futureState)

    const storage = createOrganizerStorage(backend, runImmediately)
    const result = await storage.loadOrMigrate()

    expect(result.ok).toBe(false)

    if (result.ok === false) {
      expect(result.error.kind).toBe("storage_migration_failed")
    }

    expect(store.get(STORAGE_KEY)).toEqual(futureState)
  })

  it("破損データは退避してから初期状態を返す", async () => {
    const { backend, store } = createMemoryBackend()
    const corrupted = { schemaVersion: "broken" }
    store.set(STORAGE_KEY, corrupted)

    const storage = createOrganizerStorage(backend, runImmediately)
    const result = await storage.loadOrMigrate()

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.value.warning?.kind).toBe("storage_corrupted")
      expect(result.value.state.schemaVersion).toBe(SCHEMA_VERSION)
    }

    expect(store.get(BACKUP_STORAGE_KEY)).toEqual(corrupted)
    expect(store.get(STORAGE_KEY)).not.toEqual(corrupted)
  })

  it("未登録の旧版migrationは退避して初期化し警告を返す", async () => {
    const { backend, store } = createMemoryBackend()
    const oldState = {
      ...createInitialPersistentState(),
      schemaVersion: SCHEMA_VERSION - 1
    }
    store.set(STORAGE_KEY, oldState)

    const storage = createOrganizerStorage(backend, runImmediately)
    const result = await storage.loadOrMigrate()

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.value.warning?.kind).toBe("storage_migration_failed")
      expect(result.value.state.schemaVersion).toBe(SCHEMA_VERSION)
    }

    expect(store.get(BACKUP_STORAGE_KEY)).toEqual(oldState)
    expect(store.get(STORAGE_KEY)).toMatchObject({
      schemaVersion: SCHEMA_VERSION,
      folders: {},
      folderTree: []
    })
  })

  it("読み込み失敗はstorage_load_failedを返す", async () => {
    const { backend } = createMemoryBackend()
    backend.get = async () => {
      throw new Error("chrome storage unavailable")
    }

    const storage = createOrganizerStorage(backend, runImmediately)
    const result = await storage.loadOrMigrate()

    expect(result.ok).toBe(false)

    if (result.ok === false) {
      expect(result.error.kind).toBe("storage_load_failed")
    }
  })
})

describe("organizerStorage.update / clear", () => {
  it("最新stateを更新し、applyの値と保存stateを返す", async () => {
    const { backend, store } = createMemoryBackend()
    const saved = createInitialPersistentState()
    store.set(STORAGE_KEY, saved)

    const storage = createOrganizerStorage(backend, runImmediately)
    const result = await storage.update((state) => {
      const nextState = {
        ...state,
        settings: { ...state.settings, panelWidth: 420 }
      }

      return ok({ state: nextState, value: "updated" })
    })

    expect(result).toEqual(
      ok({
        state: expect.objectContaining({
          settings: expect.objectContaining({ panelWidth: 420 })
        }),
        value: "updated"
      })
    )
    expect(store.get(STORAGE_KEY)).toEqual(
      expect.objectContaining({
        settings: expect.objectContaining({ panelWidth: 420 })
      })
    )
  })

  it("apply失敗を区別し、stateを保存しない", async () => {
    const { backend, store } = createMemoryBackend()
    const saved = createInitialPersistentState()
    store.set(STORAGE_KEY, saved)

    const storage = createOrganizerStorage(backend, runImmediately)
    const result = await storage.update(() => err({ kind: "rejected" }))

    expect(result).toEqual(
      err({
        type: "apply",
        error: { kind: "rejected" },
        state: saved
      })
    )
    expect(store.get(STORAGE_KEY)).toBe(saved)
  })

  it("保存失敗をstorage errorとして返す", async () => {
    const { backend } = createMemoryBackend()
    backend.set = async () => {
      throw new Error("quota exceeded")
    }

    const storage = createOrganizerStorage(backend, runImmediately)
    const result = await storage.update((state) =>
      ok({ state, value: undefined })
    )

    expect(result.ok).toBe(false)

    if (result.ok === false) {
      expect(result.error.type).toBe("storage")

      if (result.error.type === "storage") {
        expect(result.error.error.kind).toBe("storage_save_failed")
      }
    }
  })

  it("共有runnerで複数storage instanceのlost updateを防ぐ", async () => {
    const { backend, store } = createMemoryBackend()
    const initialState = createInitialPersistentState()
    store.set(STORAGE_KEY, initialState)

    const runExclusive = createSharedExclusiveRunner()
    const firstStorage = createOrganizerStorage(backend, runExclusive)
    const secondStorage = createOrganizerStorage(backend, runExclusive)
    const incrementWidth = (state: typeof initialState) => {
      const panelWidth = state.settings.panelWidth + 1

      return ok({
        state: {
          ...state,
          settings: { ...state.settings, panelWidth }
        },
        value: panelWidth
      })
    }

    const [firstResult, secondResult] = await Promise.all([
      firstStorage.update(incrementWidth),
      secondStorage.update(incrementWidth)
    ])

    expect(firstResult).toEqual(
      ok({
        state: expect.objectContaining({
          settings: expect.objectContaining({ panelWidth: 361 })
        }),
        value: 361
      })
    )
    expect(secondResult).toEqual(
      ok({
        state: expect.objectContaining({
          settings: expect.objectContaining({ panelWidth: 362 })
        }),
        value: 362
      })
    )
    expect(store.get(STORAGE_KEY)).toEqual(
      expect.objectContaining({
        settings: expect.objectContaining({ panelWidth: 362 })
      })
    )
  })

  it("clearで保存stateを削除し、バックアップは残す", async () => {
    const { backend, store } = createMemoryBackend()
    store.set(STORAGE_KEY, createInitialPersistentState())
    store.set(BACKUP_STORAGE_KEY, { old: true })

    const storage = createOrganizerStorage(backend, runImmediately)
    const result = await storage.clear()

    expect(result).toEqual(ok(undefined))
    expect(store.has(STORAGE_KEY)).toBe(false)
    expect(store.get(BACKUP_STORAGE_KEY)).toEqual({ old: true })
  })
})

describe("organizerStorage.watch", () => {
  it("ready stateとclear後の初期状態を通知し、unsubscribe後は通知しない", () => {
    const { backend, emit } = createMemoryBackend()
    const storage = createOrganizerStorage(backend, runImmediately)
    const received: ReturnType<typeof createInitialPersistentState>[] = []
    const unsubscribe = storage.watch((state) => {
      received.push(state)
    })
    const ready = createInitialPersistentState("2026-07-01T00:00:00.000Z")

    emit(STORAGE_KEY, { schemaVersion: "broken" })
    emit(STORAGE_KEY, {
      ...ready,
      schemaVersion: SCHEMA_VERSION + 1
    })
    emit(STORAGE_KEY, ready)
    emit(STORAGE_KEY, undefined)

    expect(received).toHaveLength(2)
    expect(received[0]).toEqual(ready)
    expect(received[1]).toMatchObject({
      folders: {},
      folderTree: [],
      assignments: {}
    })

    unsubscribe()
    emit(STORAGE_KEY, createInitialPersistentState("2026-07-02T00:00:00.000Z"))

    expect(received).toHaveLength(2)
  })
})

describe("organizerStorage Web Locks", () => {
  it("既定runnerは指定名のWeb Lockを使う", async () => {
    const request = vi.fn(async (_name: string, task: () => Promise<unknown>) =>
      task()
    )
    vi.stubGlobal("navigator", { locks: { request } })

    const { backend } = createMemoryBackend()
    const storage = createOrganizerStorage(backend)

    const result = await storage.loadOrMigrate()

    expect(result.ok).toBe(true)
    expect(request).toHaveBeenCalledWith(
      "figma-explorer:organizer-state",
      expect.any(Function)
    )
  })

  it("Web Locks非対応時はローカルfallbackせずResult errorを返す", async () => {
    vi.stubGlobal("navigator", {})

    const { backend, store } = createMemoryBackend()
    const storage = createOrganizerStorage(backend)
    const loadResult = await storage.loadOrMigrate()
    const updateResult = await storage.update((state) =>
      ok({ state, value: undefined })
    )
    const clearResult = await storage.clear()

    expect(loadResult.ok).toBe(false)

    if (loadResult.ok === false) {
      expect(loadResult.error.kind).toBe("storage_load_failed")
    }

    expect(updateResult.ok).toBe(false)

    if (updateResult.ok === false) {
      expect(updateResult.error.type).toBe("storage")

      if (updateResult.error.type === "storage") {
        expect(updateResult.error.error.kind).toBe("storage_save_failed")
      }
    }

    expect(clearResult.ok).toBe(false)

    if (clearResult.ok === false) {
      expect(clearResult.error.kind).toBe("storage_save_failed")
    }

    expect(store.size).toBe(0)
  })
})
