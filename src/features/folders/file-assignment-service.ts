import type { FolderId } from "../../domain/folder"
import type { PersistentState } from "../../domain/organizer-state"
import { err, ok, type Result } from "../../utils/result"
import type { FileId } from "../scan/create-file-id"

export type FileAssignmentOperationError = {
  kind: "folder_not_found"
}

export type FileAssignmentResult = Result<
  PersistentState,
  FileAssignmentOperationError
>

type SetFileAssignmentInput = {
  fileId: FileId
  folderId: FolderId | null
  now?: string
}

const setFileAssignment = (
  state: PersistentState,
  input: SetFileAssignmentInput
): FileAssignmentResult => {
  if (input.folderId !== null && !state.folders[input.folderId]) {
    return err({ kind: "folder_not_found" })
  }

  const now = input.now ?? new Date().toISOString()
  const current = state.assignments[input.fileId]

  // A delayed retry must not overwrite an assignment made after it.
  if (current && current.updatedAt > now) {
    return ok(state)
  }

  if (current?.folderId === input.folderId && current.updatedAt === now) {
    return ok(state)
  }

  return ok({
    ...state,
    assignments: {
      ...state.assignments,
      [input.fileId]: {
        fileId: input.fileId,
        folderId: input.folderId,
        updatedAt: now
      }
    },
    meta: {
      ...state.meta,
      updatedAt: now > state.meta.updatedAt ? now : state.meta.updatedAt
    }
  })
}

export const assignFileToFolder = (
  state: PersistentState,
  input: { fileId: FileId; folderId: FolderId; now?: string }
): FileAssignmentResult => setFileAssignment(state, input)

export const unassignFile = (
  state: PersistentState,
  input: { fileId: FileId; now?: string }
): FileAssignmentResult =>
  setFileAssignment(state, { ...input, folderId: null })
