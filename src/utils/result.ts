export type OrganizerErrorKind =
  | "scan_dom_missing"
  | "scan_partial"
  | "storage_load_failed"
  | "storage_save_failed"
  | "storage_update_conflict"
  | "storage_migration_failed"
  | "storage_corrupted"
  | "export_failed"

export type OrganizerError = {
  kind: OrganizerErrorKind
  message: string
  cause?: unknown
}

export type Result<T, E = OrganizerError> =
  | { ok: true; value: T }
  | { ok: false; error: E }

export const ok = <T>(value: T): { ok: true; value: T } => ({
  ok: true,
  value
})

export const err = <E>(error: E): { ok: false; error: E } => ({
  ok: false,
  error
})

export const createOrganizerError = (
  kind: OrganizerErrorKind,
  message: string,
  cause?: unknown
): OrganizerError =>
  cause === undefined ? { kind, message } : { kind, message, cause }
