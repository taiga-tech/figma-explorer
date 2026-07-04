import { SCHEMA_VERSION, type PersistentState } from "../domain/organizer-state"
import { createOrganizerError, type OrganizerError } from "../utils/result"

type Migration = (state: Record<string, unknown>) => Record<string, unknown>

// 過去バージョン n から n+1 への変換を登録する。キーは変換先バージョン。
// 例: 2: (state) => ({ ...state, newField: defaultValue })
const migrations: Record<number, Migration> = {}

export type MigrationDecision =
  | { type: "ready"; state: PersistentState; migratedFrom: number | null }
  | { type: "future_version"; foundVersion: number }
  | { type: "corrupted"; error: OrganizerError }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const hasPersistentStateShape = (
  value: Record<string, unknown>
): value is Record<string, unknown> & PersistentState =>
  isRecord(value.folders) &&
  Array.isArray(value.folderTree) &&
  isRecord(value.assignments) &&
  isRecord(value.settings) &&
  isRecord(value.meta)

/**
 * 保存データを現行スキーマへ解決する（docs/architecture/data-model.md §10）。
 * Storage への保存・退避は行わない純関数。実行は Repository 側が担う。
 */
export const migratePersistentState = (raw: unknown): MigrationDecision => {
  if (!isRecord(raw) || typeof raw.schemaVersion !== "number") {
    return {
      type: "corrupted",
      error: createOrganizerError(
        "storage_corrupted",
        "Stored state is not an object with a numeric schemaVersion."
      )
    }
  }

  if (raw.schemaVersion > SCHEMA_VERSION) {
    return { type: "future_version", foundVersion: raw.schemaVersion }
  }

  let current: Record<string, unknown> = raw
  const originalVersion = raw.schemaVersion

  for (
    let nextVersion = originalVersion + 1;
    nextVersion <= SCHEMA_VERSION;
    nextVersion += 1
  ) {
    const migration = migrations[nextVersion]

    if (!migration) {
      return {
        type: "corrupted",
        error: createOrganizerError(
          "storage_migration_failed",
          `No migration registered for schema version ${nextVersion}.`
        )
      }
    }

    try {
      current = { ...migration(current), schemaVersion: nextVersion }
    } catch (cause) {
      return {
        type: "corrupted",
        error: createOrganizerError(
          "storage_migration_failed",
          `Migration to schema version ${nextVersion} threw.`,
          cause
        )
      }
    }
  }

  if (!hasPersistentStateShape(current)) {
    return {
      type: "corrupted",
      error: createOrganizerError(
        "storage_corrupted",
        "Stored state is missing required PersistentState fields."
      )
    }
  }

  return {
    type: "ready",
    state: current,
    migratedFrom: originalVersion === SCHEMA_VERSION ? null : originalVersion
  }
}
