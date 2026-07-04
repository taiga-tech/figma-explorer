import type { DraftFile } from "../features/scan/draft-file"
import type { FileId } from "../features/scan/create-file-id"
import type { OrganizerError } from "../utils/result"
import type { FolderId, FolderTreeNode, VirtualFolder } from "./folder"

export const SCHEMA_VERSION = 1

export type FileAssignment = {
  fileId: FileId
  folderId: FolderId | null
  updatedAt: string
}

export type OrganizerSettings = {
  panelPosition: "right" | "left"
  panelWidth: number
  autoScan: boolean
  showFirstRunNotice: boolean
}

export type StateMeta = {
  createdAt: string
  updatedAt: string
  lastScannedAt?: string
  lastExportedAt?: string
}

export type PersistentState = {
  schemaVersion: number
  folders: Record<FolderId, VirtualFolder>
  folderTree: FolderTreeNode[]
  assignments: Record<FileId, FileAssignment>
  settings: OrganizerSettings
  meta: StateMeta
}

export type ScanStatus = "idle" | "scanning" | "success" | "empty" | "error"

export type ActiveFilter =
  | { type: "all" }
  | { type: "folder"; folderId: FolderId }
  | { type: "uncategorized" }

export type RuntimeState = {
  scannedFiles: Record<FileId, DraftFile>
  scanStatus: ScanStatus
  scanError?: OrganizerError
  selectedFileId: FileId | null
  activeFilter: ActiveFilter
  searchQuery: string
}

export const createInitialPersistentState = (
  now: string = new Date().toISOString()
): PersistentState => ({
  schemaVersion: SCHEMA_VERSION,
  folders: {},
  folderTree: [],
  assignments: {},
  settings: {
    panelPosition: "right",
    panelWidth: 360,
    autoScan: true,
    showFirstRunNotice: true
  },
  meta: {
    createdAt: now,
    updatedAt: now
  }
})
