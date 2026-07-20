import { useRef, type KeyboardEvent } from "react"

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
  const selectButtonRefs = useRef(new Map<string, HTMLButtonElement>())
  const openLinkRefs = useRef(new Map<string, HTMLAnchorElement>())

  if (files.length === 0) {
    return (
      <p className="figma-explorer-panel__empty-state">
        {emptyMessage ?? "表示中のファイルがありません。"}
      </p>
    )
  }

  const selectedIndex = files.findIndex((file) => file.id === selectedFileId)
  const tabStopFileId =
    selectedIndex >= 0 ? files[selectedIndex].id : files[0].id

  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key === "Enter") {
      event.stopPropagation()

      if (event.target instanceof HTMLAnchorElement) {
        return
      }

      const selectedFile = selectedIndex >= 0 ? files[selectedIndex] : files[0]

      event.preventDefault()
      openLinkRefs.current.get(selectedFile.id)?.click()
      return
    }

    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const currentIndex = selectedIndex >= 0 ? selectedIndex : 0
    const nextIndex =
      event.key === "ArrowDown"
        ? Math.min(currentIndex + 1, files.length - 1)
        : Math.max(currentIndex - 1, 0)
    const nextFile = files[nextIndex]

    if (nextFile.id !== selectedFileId) {
      onSelectFile(nextFile.id)
    }

    selectButtonRefs.current.get(nextFile.id)?.focus()
  }

  return (
    <ul
      aria-label="Detected draft files"
      className="figma-explorer-panel__file-list"
      onKeyDown={handleKeyDown}
      role="list">
      {files.map((file) => (
        <FileListItem
          file={file}
          isSelected={selectedFileId === file.id}
          isTabStop={tabStopFileId === file.id}
          key={file.id}
          onSelectFile={onSelectFile}
          openLinkRef={(element) => {
            if (element) {
              openLinkRefs.current.set(file.id, element)
            } else {
              openLinkRefs.current.delete(file.id)
            }
          }}
          selectButtonRef={(element) => {
            if (element) {
              selectButtonRefs.current.set(file.id, element)
            } else {
              selectButtonRefs.current.delete(file.id)
            }
          }}
        />
      ))}
    </ul>
  )
}
