import type { DraftFile } from "../features/scan/draft-file"
import type { FolderTreeNode, VirtualFolder } from "./folder"
import type { FileAssignment, OrganizerSettings } from "./organizer-state"

export type ExportJson = {
  exportedAt: string
  appVersion: string
  schemaVersion: number
  files: DraftFile[]
  folders: VirtualFolder[]
  folderTree: FolderTreeNode[]
  assignments: FileAssignment[]
  settings: OrganizerSettings
}
