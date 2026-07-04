import { Storage } from "@plasmohq/storage"

import {
  createInitialPersistentState,
  type PersistentState
} from "../domain/organizer-state"
import {
  createOrganizerError,
  err,
  ok,
  type OrganizerError,
  type Result
} from "../utils/result"
import { migratePersistentState } from "./migrate-persistent-state"

const STORAGE_KEY = "figmaDraftsOrganizerState"
const BACKUP_STORAGE_KEY = "figmaDraftsOrganizerStateBackup"

export type OrganizerStorageBackend = {
  get: (key: string) => Promise<unknown>
  set: (key: string, value: unknown) => Promise<void>
  remove: (key: string) => Promise<void>
}

export type LoadOrMigrateValue = {
  state: PersistentState
  migratedFrom: number | null
  // 破損データを退避して初期化した場合に、UI 表示用の警告を載せる
  warning?: OrganizerError
}

export type OrganizerStorage = {
  loadOrMigrate: () => Promise<Result<LoadOrMigrateValue>>
  save: (state: PersistentState) => Promise<Result<void>>
  clear: () => Promise<void>
}

const createPlasmoBackend = (): OrganizerStorageBackend => {
  const storage = new Storage({ area: "local" })

  return {
    get: (key) => storage.get(key),
    set: (key, value) => storage.set(key, value).then(() => undefined),
    remove: (key) => storage.remove(key)
  }
}

export const createOrganizerStorage = (
  backend: OrganizerStorageBackend
): OrganizerStorage => {
  // 保存は直列化し、同一キーへの書き込み競合を防ぐ
  let pendingSave: Promise<unknown> = Promise.resolve()

  const save = async (state: PersistentState): Promise<Result<void>> => {
    const task = pendingSave.then(() => backend.set(STORAGE_KEY, state))

    pendingSave = task.catch(() => undefined)

    try {
      await task

      return ok(undefined)
    } catch (cause) {
      return err(
        createOrganizerError(
          "storage_save_failed",
          "Failed to persist organizer state.",
          cause
        )
      )
    }
  }

  const loadOrMigrate = async (): Promise<Result<LoadOrMigrateValue>> => {
    let raw: unknown

    try {
      raw = await backend.get(STORAGE_KEY)
    } catch (cause) {
      return err(
        createOrganizerError(
          "storage_load_failed",
          "Failed to read organizer state from storage.",
          cause
        )
      )
    }

    if (raw === undefined || raw === null) {
      return ok({
        state: createInitialPersistentState(),
        migratedFrom: null
      })
    }

    const decision = migratePersistentState(raw)

    if (decision.type === "future_version") {
      // 将来バージョンのデータは上書きせず、読み取り専用の警告にする
      return err(
        createOrganizerError(
          "storage_migration_failed",
          `Stored schema version ${decision.foundVersion} is newer than this extension supports.`
        )
      )
    }

    if (decision.type === "corrupted") {
      try {
        await backend.set(BACKUP_STORAGE_KEY, raw)
      } catch (cause) {
        return err(
          createOrganizerError(
            "storage_load_failed",
            "Failed to back up corrupted organizer state.",
            cause
          )
        )
      }

      const initialState = createInitialPersistentState()
      const saveResult = await save(initialState)

      if (!saveResult.ok) {
        return saveResult
      }

      return ok({
        state: initialState,
        migratedFrom: null,
        warning: decision.error
      })
    }

    if (decision.migratedFrom !== null) {
      const saveResult = await save(decision.state)

      if (!saveResult.ok) {
        return saveResult
      }
    }

    return ok({
      state: decision.state,
      migratedFrom: decision.migratedFrom
    })
  }

  const clear = async (): Promise<void> => {
    // バックアップキーは復旧用に残す
    await backend.remove(STORAGE_KEY)
  }

  return { loadOrMigrate, save, clear }
}

let defaultStorage: OrganizerStorage | null = null

export const getOrganizerStorage = (): OrganizerStorage => {
  if (!defaultStorage) {
    defaultStorage = createOrganizerStorage(createPlasmoBackend())
  }

  return defaultStorage
}
