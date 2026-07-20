import type { OrganizerFileListItem } from "./organizer-panel-types"

type FileListItemProps = {
  file: OrganizerFileListItem
  isSelected: boolean
  isTabStop: boolean
  onSelectFile: (fileId: string) => void
  openLinkRef: (element: HTMLAnchorElement | null) => void
  selectButtonRef: (element: HTMLButtonElement | null) => void
}

export function FileListItem({
  file,
  isSelected,
  isTabStop,
  onSelectFile,
  openLinkRef,
  selectButtonRef
}: FileListItemProps) {
  return (
    <li
      aria-current={isSelected ? "true" : undefined}
      className="figma-explorer-panel__file-list-item"
      role="listitem">
      <button
        className="figma-explorer-panel__file-select"
        data-selected={isSelected ? "true" : "false"}
        onClick={() => onSelectFile(file.id)}
        ref={selectButtonRef}
        tabIndex={isTabStop ? 0 : -1}
        type="button">
        <span className="figma-explorer-panel__file-name">{file.name}</span>
        <span className="figma-explorer-panel__file-folder">
          {file.folderName ?? "未分類"}
        </span>
      </button>
      <a
        className="figma-explorer-panel__file-open-link"
        href={file.url}
        ref={openLinkRef}
        rel="noreferrer"
        target="_blank">
        開く
      </a>
    </li>
  )
}
