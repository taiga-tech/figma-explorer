import type { ActiveFilter, FileAssignment } from "../../domain/organizer-state"
import type { FileId } from "../scan/create-file-id"

type FilterableFile = {
  id: FileId
}

type SearchableFile = FilterableFile & {
  name: string
}

const isUncategorized = (
  fileId: FileId,
  assignments: Readonly<Record<FileId, FileAssignment>>
): boolean => assignments[fileId]?.folderId == null

export const filterFiles = <T extends FilterableFile>(
  files: readonly T[],
  assignments: Readonly<Record<FileId, FileAssignment>>,
  activeFilter: ActiveFilter
): T[] => {
  switch (activeFilter.type) {
    case "all":
      return [...files]
    case "folder":
      return files.filter(
        (file) => assignments[file.id]?.folderId === activeFilter.folderId
      )
    case "uncategorized":
      return files.filter((file) => isUncategorized(file.id, assignments))
  }
}

export const countUncategorizedFiles = (
  files: readonly FilterableFile[],
  assignments: Readonly<Record<FileId, FileAssignment>>
): number =>
  files.filter((file) => isUncategorized(file.id, assignments)).length

export const searchFilesByName = <T extends SearchableFile>(
  files: readonly T[],
  query: string
): T[] => {
  const normalizedQuery = query.trim().toLowerCase()

  if (normalizedQuery.length === 0) {
    return [...files]
  }

  return files.filter((file) =>
    file.name.toLowerCase().includes(normalizedQuery)
  )
}
