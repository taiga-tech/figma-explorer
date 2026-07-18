import { useState, type FormEvent } from "react"

import type {
  FolderId,
  FolderTreeNode,
  VirtualFolder
} from "../../domain/folder"
import type { FolderOperationError } from "../../features/folders/folder-service"
import type { OrganizerFoldersStatus } from "../stores/organizer-folders-store"
import { FolderTree } from "./FolderTree"

type FolderSectionProps = {
  status: OrganizerFoldersStatus
  folders: Record<FolderId, VirtualFolder>
  tree: FolderTreeNode[]
  selectedFolderId: FolderId | null
  storageErrorMessage: string | null
  canRetrySave: boolean
  onSelectFolder: (folderId: FolderId) => void
  onToggleExpanded: (folderId: FolderId) => void
  onCreateFolder: (name: string) => FolderOperationError | null
  onRetrySave: () => void
}

const FOLDER_OPERATION_ERROR_MESSAGES: Record<
  FolderOperationError["kind"],
  string
> = {
  empty_folder_name: "フォルダ名を入力してください。",
  folder_not_found: "対象のフォルダが見つかりません。",
  parent_folder_not_found: "親フォルダが見つかりません。",
  system_folder_not_deletable: "システムフォルダは削除できません。",
  duplicate_folder_id: "フォルダIDが重複しました。もう一度お試しください。",
  circular_reference: "循環参照になるため、この操作はできません。",
  max_depth_exceeded: "フォルダは最大5階層までです。"
}

export function FolderSection({
  status,
  folders,
  tree,
  selectedFolderId,
  storageErrorMessage,
  canRetrySave,
  onSelectFolder,
  onToggleExpanded,
  onCreateFolder,
  onRetrySave
}: FolderSectionProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [draftName, setDraftName] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  const selectedFolderName = selectedFolderId
    ? folders[selectedFolderId]?.name ?? null
    : null

  const closeForm = () => {
    setIsFormOpen(false)
    setDraftName("")
    setFormError(null)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const error = onCreateFolder(draftName)

    if (error) {
      setFormError(FOLDER_OPERATION_ERROR_MESSAGES[error.kind])

      return
    }

    closeForm()
  }

  return (
    <section className="figma-explorer-panel__section">
      <div className="figma-explorer-panel__section-heading">
        <h2 className="figma-explorer-panel__section-title">Folders</h2>
        <button
          className="figma-explorer-panel__section-action"
          disabled={status !== "ready"}
          onClick={() => (isFormOpen ? closeForm() : setIsFormOpen(true))}
          type="button">
          新規作成
        </button>
      </div>

      {storageErrorMessage && (
        <div className="figma-explorer-panel__folder-alert figma-explorer-panel__folder-alert--storage">
          <p
            className="figma-explorer-panel__folder-alert-message"
            role="alert">
            {storageErrorMessage}
          </p>
          {canRetrySave && (
            <button
              className="figma-explorer-panel__folder-retry-button"
              onClick={onRetrySave}
              type="button">
              再試行
            </button>
          )}
        </div>
      )}

      {isFormOpen && (
        <form
          className="figma-explorer-panel__folder-form"
          onSubmit={handleSubmit}>
          <input
            aria-label="新しいフォルダ名"
            autoFocus
            className="figma-explorer-panel__folder-name-input"
            onChange={(event) => setDraftName(event.target.value)}
            placeholder={
              selectedFolderName
                ? `「${selectedFolderName}」の中に作成`
                : "ルートに作成"
            }
            type="text"
            value={draftName}
          />
          <div className="figma-explorer-panel__folder-form-actions">
            <button
              className="figma-explorer-panel__folder-form-submit"
              type="submit">
              作成
            </button>
            <button
              className="figma-explorer-panel__folder-form-cancel"
              onClick={closeForm}
              type="button">
              キャンセル
            </button>
          </div>
          {formError && (
            <p className="figma-explorer-panel__folder-alert" role="alert">
              {formError}
            </p>
          )}
        </form>
      )}

      {renderTreeArea()}
    </section>
  )

  function renderTreeArea() {
    switch (status) {
      case "loading":
        return (
          <p className="figma-explorer-panel__empty-state">
            保存済みフォルダを読み込んでいます…
          </p>
        )
      case "error":
        // 読み込みに失敗した状態では、誤解を招く空ツリーを出さない
        return null
      case "ready":
        return (
          <FolderTree
            folders={folders}
            onSelectFolder={onSelectFolder}
            onToggleExpanded={onToggleExpanded}
            selectedFolderId={selectedFolderId}
            tree={tree}
          />
        )
    }
  }
}
