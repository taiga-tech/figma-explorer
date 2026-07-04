import { describe, expect, it } from "vitest"

import {
  createInitialPersistentState,
  SCHEMA_VERSION
} from "../domain/organizer-state"
import {
  createOrganizerStorage,
  type OrganizerStorageBackend
} from "./organizer-storage"

const STORAGE_KEY = "figmaDraftsOrganizerState"
const BACKUP_STORAGE_KEY = "figmaDraftsOrganizerStateBackup"

const createMemoryBackend = () => {
  const store = new Map<string, unknown>()

  const backend: OrganizerStorageBackend = {
    get: async (key) => store.get(key),
    set: async (key, value) => {
      store.set(key, value)
    },
    remove: async (key) => {
      store.delete(key)
    }
  }

  return { backend, store }
}

describe("organizerStorage.loadOrMigrate", () => {
  it("保存データがない場合は初期状態を返す", async () => {
    const { backend } = createMemoryBackend()
    const storage = createOrganizerStorage(backend)

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

    const storage = createOrganizerStorage(backend)
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

    const storage = createOrganizerStorage(backend)
    const result = await storage.loadOrMigrate()

    expect(result.ok).toBe(false)

    if (!result.ok) {
      expect(result.error.kind).toBe("storage_migration_failed")
    }

    expect(store.get(STORAGE_KEY)).toEqual(futureState)
  })

  it("破損データは退避してから初期状態を返す", async () => {
    const { backend, store } = createMemoryBackend()
    const corrupted = { schemaVersion: "broken" }
    store.set(STORAGE_KEY, corrupted)

    const storage = createOrganizerStorage(backend)
    const result = await storage.loadOrMigrate()

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.value.warning?.kind).toBe("storage_corrupted")
      expect(result.value.state.schemaVersion).toBe(SCHEMA_VERSION)
    }

    expect(store.get(BACKUP_STORAGE_KEY)).toEqual(corrupted)
    expect(store.get(STORAGE_KEY)).not.toEqual(corrupted)
  })

  it("読み込み失敗はstorage_load_failedを返す", async () => {
    const { backend } = createMemoryBackend()
    backend.get = async () => {
      throw new Error("chrome storage unavailable")
    }

    const storage = createOrganizerStorage(backend)
    const result = await storage.loadOrMigrate()

    expect(result.ok).toBe(false)

    if (!result.ok) {
      expect(result.error.kind).toBe("storage_load_failed")
    }
  })
})

describe("organizerStorage.save / clear", () => {
  it("保存と削除ができ、バックアップキーはclearで消えない", async () => {
    const { backend, store } = createMemoryBackend()
    store.set(BACKUP_STORAGE_KEY, { old: true })

    const storage = createOrganizerStorage(backend)
    const state = createInitialPersistentState()

    const saveResult = await storage.save(state)

    expect(saveResult.ok).toBe(true)
    expect(store.get(STORAGE_KEY)).toEqual(state)

    await storage.clear()

    expect(store.has(STORAGE_KEY)).toBe(false)
    expect(store.get(BACKUP_STORAGE_KEY)).toEqual({ old: true })
  })

  it("保存失敗はstorage_save_failedを返す", async () => {
    const { backend } = createMemoryBackend()
    backend.set = async () => {
      throw new Error("quota exceeded")
    }

    const storage = createOrganizerStorage(backend)
    const result = await storage.save(createInitialPersistentState())

    expect(result.ok).toBe(false)

    if (!result.ok) {
      expect(result.error.kind).toBe("storage_save_failed")
    }
  })

  it("連続saveでも直列に完了する", async () => {
    const { backend, store } = createMemoryBackend()
    const order: number[] = []
    const originalSet = backend.set
    let callCount = 0

    backend.set = async (key, value) => {
      callCount += 1
      const current = callCount
      // 先行する保存ほど遅延させ、直列化されていなければ順序が入れ替わる
      await new Promise((resolve) => setTimeout(resolve, 30 - current * 10))
      order.push(current)
      await originalSet(key, value)
    }

    const storage = createOrganizerStorage(backend)
    const first = createInitialPersistentState("2026-07-01T00:00:00.000Z")
    const second = createInitialPersistentState("2026-07-02T00:00:00.000Z")

    await Promise.all([storage.save(first), storage.save(second)])

    expect(order).toEqual([1, 2])
    expect(store.get(STORAGE_KEY)).toEqual(second)
  })
})
