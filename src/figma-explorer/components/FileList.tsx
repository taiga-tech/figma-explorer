import { FileListItem } from "./FileListItem"
import type { OrganizerFileListItem } from "./organizer-panel-types"

type FileListProps = {
  files: OrganizerFileListItem[]
  selectedFileId: string | null
  emptyMessage: string | null
  onSelectFile: (fileId: string) => void
}

export function FileList({
  files,
  selectedFileId,
  emptyMessage,
  onSelectFile
}: FileListProps) {
  if (files.length === 0) {
    return (
      <p className="figma-explorer-panel__empty-state">
        {emptyMessage ?? "表示中のファイルがありません。"}
      </p>
    )
  }

  return (
    <ul
      aria-label="Detected draft files"
      className="figma-explorer-panel__file-list"
      role="list">
      {files.map((file) => (
        <FileListItem
          file={file}
          isSelected={selectedFileId === file.id}
          key={file.url}
          onSelectFile={onSelectFile}
        />
      ))}
    </ul>
  )
}
