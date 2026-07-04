import { describe, expect, it } from "vitest"

import {
  createInitialPersistentState,
  SCHEMA_VERSION
} from "../domain/organizer-state"
import { migratePersistentState } from "./migrate-persistent-state"

describe("migratePersistentState", () => {
  it("現行バージョンのデータはそのまま返す", () => {
    const state = createInitialPersistentState("2026-07-04T00:00:00.000Z")

    const decision = migratePersistentState(state)

    expect(decision).toEqual({
      type: "ready",
      state,
      migratedFrom: null
    })
  })

  it("未知の将来バージョンはfuture_versionを返す", () => {
    const state = {
      ...createInitialPersistentState(),
      schemaVersion: SCHEMA_VERSION + 1
    }

    const decision = migratePersistentState(state)

    expect(decision).toEqual({
      type: "future_version",
      foundVersion: SCHEMA_VERSION + 1
    })
  })

  it("schemaVersionを持たないデータはcorruptedを返す", () => {
    const decision = migratePersistentState({ folders: {} })

    expect(decision.type).toBe("corrupted")

    if (decision.type === "corrupted") {
      expect(decision.error.kind).toBe("storage_corrupted")
    }
  })

  it("オブジェクトでない値はcorruptedを返す", () => {
    expect(migratePersistentState(null).type).toBe("corrupted")
    expect(migratePersistentState("broken").type).toBe("corrupted")
    expect(migratePersistentState([1, 2]).type).toBe("corrupted")
  })

  it("必須フィールドが欠けたデータはcorruptedを返す", () => {
    const decision = migratePersistentState({
      schemaVersion: SCHEMA_VERSION,
      folders: {}
      // folderTree / assignments / settings / meta が無い
    })

    expect(decision.type).toBe("corrupted")

    if (decision.type === "corrupted") {
      expect(decision.error.kind).toBe("storage_corrupted")
    }
  })

  it("移行が未登録の旧バージョンはmigration_failedを返す", () => {
    // SCHEMA_VERSION = 1 の現在、version 0 → 1 の migration は存在しない
    const decision = migratePersistentState({
      ...createInitialPersistentState(),
      schemaVersion: SCHEMA_VERSION - 1
    })

    expect(decision.type).toBe("corrupted")

    if (decision.type === "corrupted") {
      expect(decision.error.kind).toBe("storage_migration_failed")
    }
  })
})
