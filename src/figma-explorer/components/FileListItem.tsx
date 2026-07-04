import type { OrganizerFileListItem } from "./organizer-panel-types"

type FileListItemProps = {
  file: OrganizerFileListItem
  isSelected: boolean
  onSelectFile: (fileId: string) => void
}

export function FileListItem({
  file,
  isSelected,
  onSelectFile
}: FileListItemProps) {
  return (
    <li
      aria-selected={isSelected}
      className="figma-explorer-panel__file-list-item"
      role="listitem">
      <button
        className="figma-explorer-panel__file-select"
        data-selected={isSelected ? "true" : "false"}
        onClick={() => onSelectFile(file.id)}
        type="button">
        <span className="figma-explorer-panel__file-name">{file.name}</span>
        <span className="figma-explorer-panel__file-folder">
          {file.folderName ?? "未分類"}
        </span>
      </button>
      <a
        className="figma-explorer-panel__file-open-link"
        href={file.url}
        rel="noreferrer"
        target="_blank">
        開く
      </a>
    </li>
  )
}
