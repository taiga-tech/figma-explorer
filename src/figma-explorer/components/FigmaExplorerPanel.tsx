import { useMemo, useState } from "react"

import type { FolderId } from "../../domain/folder"
import { createFileId } from "../../features/scan/create-file-id"
import { toOrganizerScanError } from "../../features/scan/detect-file-card-elements"
import { extractFileCardMetadata } from "../../features/scan/extract-file-card-metadata"
import type { OrganizerErrorKind } from "../../utils/result"
import { FIGMA_MATCHES } from "../constants/figma-routes"
import { formatHrefPathname } from "../formatters/format-href-pathname"
import { useFileCardDetection } from "../hooks/use-file-card-detection"
import { useOrganizerFolders } from "../hooks/use-organizer-folders"
import { rescanFileCards } from "../stores/file-card-detection-store"
import { getOrganizerFoldersStore } from "../stores/organizer-folders-store"
import type { OrganizerFileListItem } from "./organizer-panel-types"
import { OrganizerPanel } from "./OrganizerPanel"

type FigmaExplorerPanelProps = {
  href: string
}

const STORAGE_ERROR_MESSAGES: Partial<Record<OrganizerErrorKind, string>> = {
  storage_load_failed: "保存済みの整理状態の読み込みに失敗しました。",
  storage_save_failed: "整理状態の保存に失敗しました。",
  storage_update_conflict:
    "別のタブで状態が変わったため、整理操作を反映できませんでした。",
  storage_migration_failed:
    "保存データのバージョンを現在の拡張機能で処理できません。",
  storage_corrupted:
    "保存データが破損していたため初期化しました。元データはバックアップへ退避済みです。"
}

export function FigmaExplorerPanel({ href }: FigmaExplorerPanelProps) {
  const fileCardDetectionResult = useFileCardDetection()
  const organizerFolders = useOrganizerFolders()
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<FolderId | null>(
    null
  )
  const extractedFileCards =
    fileCardDetectionResult.status === "success"
      ? extractFileCardMetadata(fileCardDetectionResult.elements, href)
      : null

  const scanError =
    fileCardDetectionResult.status === "error"
      ? toOrganizerScanError(fileCardDetectionResult)
      : null

  const scanSummary = useMemo(() => {
    switch (fileCardDetectionResult.status) {
      case "success":
        return `${extractedFileCards.files.length} files extracted / ${extractedFileCards.skippedCount} skipped`
      case "empty":
        return "0 candidate cards"
      case "error":
        return scanError?.kind ?? "error"
    }
  }, [
    extractedFileCards?.files.length,
    extractedFileCards?.skippedCount,
    fileCardDetectionResult.status,
    scanError?.kind
  ])

  const organizerFiles: OrganizerFileListItem[] =
    extractedFileCards?.files.map((file, index) => {
      const fileIdResult = createFileId(file.url)
      const fileId = fileIdResult.ok
        ? fileIdResult.value.fileId
        : `${file.url}-${index}`
      const folderId = organizerFolders.assignments[fileId]?.folderId ?? null

      return {
        id: fileId,
        name: file.name,
        url: file.url,
        folderName:
          folderId === null
            ? null
            : organizerFolders.folders[folderId]?.name ?? null
      }
    }) ?? []

  const resolvedSelectedFileId =
    selectedFileId && organizerFiles.some((file) => file.id === selectedFileId)
      ? selectedFileId
      : organizerFiles[0]?.id ?? null

  const emptyMessage = useMemo(() => {
    if (
      extractedFileCards &&
      extractedFileCards.files.length === 0 &&
      extractedFileCards.totalCount > 0
    ) {
      return "候補カードは見つかりましたが、名前または URL を抽出できませんでした。"
    }

    switch (fileCardDetectionResult.status) {
      case "success":
        return null
      case "empty":
        return "まだ候補カードが見つかっていません。"
      case "error":
        return `検出エラー（${scanError?.kind}）: ${scanError?.message}`
    }
  }, [
    extractedFileCards,
    fileCardDetectionResult.status,
    scanError?.kind,
    scanError?.message
  ])

  const resolvedSelectedFolderId =
    selectedFolderId && organizerFolders.folders[selectedFolderId]
      ? selectedFolderId
      : null

  const storageErrorMessage = organizerFolders.storageError
    ? STORAGE_ERROR_MESSAGES[organizerFolders.storageError.kind] ??
      organizerFolders.storageError.message
    : null
  const selectedFile = organizerFiles.find(
    (file) => file.id === resolvedSelectedFileId
  )
  const selectedFolder = resolvedSelectedFolderId
    ? organizerFolders.folders[resolvedSelectedFolderId]
    : null

  return (
    <OrganizerPanel
      assignmentSection={{
        selectedFileName: selectedFile?.name ?? null,
        selectedFolderName: selectedFolder?.name ?? null,
        currentFolderName: selectedFile?.folderName ?? null,
        canAssign:
          organizerFolders.status === "ready" &&
          selectedFile !== undefined &&
          selectedFolder !== null,
        canUnassign:
          organizerFolders.status === "ready" &&
          selectedFile !== undefined &&
          selectedFile.folderName !== null,
        onAssign: () => {
          if (selectedFile && selectedFolder) {
            getOrganizerFoldersStore().assignFile(
              selectedFile.id,
              selectedFolder.id
            )
          }
        },
        onUnassign: () => {
          if (organizerFolders.status === "ready" && selectedFile) {
            getOrganizerFoldersStore().assignFile(selectedFile.id, null)
          }
        }
      }}
      emptyMessage={emptyMessage}
      errorBanner={
        scanError
          ? {
              kind: scanError.kind,
              message: scanError.message
            }
          : null
      }
      files={organizerFiles}
      folderSection={{
        status: organizerFolders.status,
        folders: organizerFolders.folders,
        tree: organizerFolders.folderTree,
        selectedFolderId: resolvedSelectedFolderId,
        storageErrorMessage,
        canRetrySave: organizerFolders.canRetrySave,
        onSelectFolder: (folderId) =>
          setSelectedFolderId((current) =>
            current === folderId ? null : folderId
          ),
        onToggleExpanded: (folderId) =>
          getOrganizerFoldersStore().toggleFolderExpanded(folderId),
        onCreateFolder: (name) =>
          getOrganizerFoldersStore().createFolder({
            name,
            parentId: resolvedSelectedFolderId
          }),
        onRetrySave: () => {
          void getOrganizerFoldersStore().retrySave()
        }
      }}
      onRescan={rescanFileCards}
      onSelectFile={setSelectedFileId}
      routeLabel={formatHrefPathname(href)}
      scanSummary={scanSummary}
      selectedFileId={resolvedSelectedFileId}
      targetLabel={FIGMA_MATCHES.join(", ")}
    />
  )
}
