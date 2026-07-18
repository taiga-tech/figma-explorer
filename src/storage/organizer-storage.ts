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
const STORAGE_LOCK_NAME = "figma-explorer:organizer-state"

export type ExclusiveRunner = <T>(task: () => Promise<T>) => Promise<T>

export type OrganizerStorageBackend = {
  get: (key: string) => Promise<unknown>
  set: (key: string, value: unknown) => Promise<void>
  remove: (key: string) => Promise<void>
  watch?: (key: string, listener: (raw: unknown) => void) => () => void
}

export type LoadOrMigrateValue = {
  state: PersistentState
  migratedFrom: number | null
  // 破損データを退避して初期化した場合に、UI 表示用の警告を載せる
  warning?: OrganizerError
}

export type OrganizerStorageUpdateValue<T> = {
  state: PersistentState
  value: T
}

export type OrganizerStorageUpdateError<E> =
  | { type: "storage"; error: OrganizerError }
  | { type: "apply"; error: E; state: PersistentState }

export type OrganizerStorage = {
  loadOrMigrate: () => Promise<Result<LoadOrMigrateValue>>
  update: <T, E>(
    apply: (state: PersistentState) => Result<OrganizerStorageUpdateValue<T>, E>
  ) => Promise<
    Result<OrganizerStorageUpdateValue<T>, OrganizerStorageUpdateError<E>>
  >
  clear: () => Promise<Result<void>>
  watch: (listener: (state: PersistentState) => void) => () => void
}

const runWithWebLock: ExclusiveRunner = async <T>(
  task: () => Promise<T>
): Promise<T> => {
  const lockManager = globalThis.navigator?.locks

  if (!lockManager || typeof lockManager.request !== "function") {
    throw new Error(
      "Web Locks API is unavailable; organizer state cannot be accessed safely."
    )
  }

  return lockManager.request(STORAGE_LOCK_NAME, task) as Promise<T>
}

const createPlasmoBackend = (): OrganizerStorageBackend => {
  const storage = new Storage({ area: "local" })

  return {
    get: (key) => storage.get(key),
    set: (key, value) => storage.set(key, value).then(() => undefined),
    remove: (key) => storage.remove(key),
    watch: (key, listener) => {
      const callbackMap = {
        [key]: (change: chrome.storage.StorageChange) => {
          listener(change.newValue)
        }
      }
      const watching = storage.watch(callbackMap)

      return () => {
        if (watching) {
          storage.unwatch(callbackMap)
        }
      }
    }
  }
}

export const createOrganizerStorage = (
  backend: OrganizerStorageBackend,
  runExclusive: ExclusiveRunner = runWithWebLock
): OrganizerStorage => {
  const saveUnlocked = async (
    state: PersistentState
  ): Promise<Result<void>> => {
    try {
      await backend.set(STORAGE_KEY, state)

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

  const loadOrMigrateUnlocked = async (): Promise<
    Result<LoadOrMigrateValue>
  > => {
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
      const saveResult = await saveUnlocked(initialState)

      if (saveResult.ok === false) {
        return err(saveResult.error)
      }

      return ok({
        state: initialState,
        migratedFrom: null,
        warning: decision.error
      })
    }

    if (decision.migratedFrom !== null) {
      const saveResult = await saveUnlocked(decision.state)

      if (saveResult.ok === false) {
        return err(saveResult.error)
      }
    }

    return ok({
      state: decision.state,
      migratedFrom: decision.migratedFrom
    })
  }

  const loadOrMigrate = async (): Promise<Result<LoadOrMigrateValue>> => {
    try {
      return await runExclusive(loadOrMigrateUnlocked)
    } catch (cause) {
      return err(
        createOrganizerError(
          "storage_load_failed",
          "Failed to acquire exclusive access to organizer state.",
          cause
        )
      )
    }
  }

  const update: OrganizerStorage["update"] = async (apply) => {
    try {
      return await runExclusive(async () => {
        const loadResult = await loadOrMigrateUnlocked()

        if (loadResult.ok === false) {
          return err({ type: "storage", error: loadResult.error })
        }

        const applyResult = apply(loadResult.value.state)

        if (applyResult.ok === false) {
          return err({
            type: "apply",
            error: applyResult.error,
            state: loadResult.value.state
          })
        }

        const saveResult = await saveUnlocked(applyResult.value.state)

        if (saveResult.ok === false) {
          return err({ type: "storage", error: saveResult.error })
        }

        return ok(applyResult.value)
      })
    } catch (cause) {
      return err({
        type: "storage",
        error: createOrganizerError(
          "storage_save_failed",
          "Failed to acquire exclusive access to update organizer state.",
          cause
        )
      })
    }
  }

  const clearUnlocked = async (): Promise<Result<void>> => {
    try {
      // バックアップキーは復旧用に残す
      await backend.remove(STORAGE_KEY)

      return ok(undefined)
    } catch (cause) {
      return err(
        createOrganizerError(
          "storage_save_failed",
          "Failed to clear organizer state.",
          cause
        )
      )
    }
  }

  const clear = async (): Promise<Result<void>> => {
    try {
      return await runExclusive(clearUnlocked)
    } catch (cause) {
      return err(
        createOrganizerError(
          "storage_save_failed",
          "Failed to acquire exclusive access to clear organizer state.",
          cause
        )
      )
    }
  }

  const watch = (listener: (state: PersistentState) => void): (() => void) => {
    if (!backend.watch) {
      return () => undefined
    }

    return backend.watch(STORAGE_KEY, (raw) => {
      if (raw === undefined || raw === null) {
        listener(createInitialPersistentState())

        return
      }

      const decision = migratePersistentState(raw)

      if (decision.type === "ready") {
        listener(decision.state)
      }
    })
  }

  return { loadOrMigrate, update, clear, watch }
}

let defaultStorage: OrganizerStorage | null = null

export const getOrganizerStorage = (): OrganizerStorage => {
  if (!defaultStorage) {
    defaultStorage = createOrganizerStorage(createPlasmoBackend())
  }

  return defaultStorage
}
