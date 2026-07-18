type FileAssignmentSectionProps = {
  selectedFileName: string | null
  selectedFolderName: string | null
  currentFolderName: string | null
  canAssign: boolean
  canUnassign: boolean
  onAssign: () => void
  onUnassign: () => void
}

export function FileAssignmentSection({
  selectedFileName,
  selectedFolderName,
  currentFolderName,
  canAssign,
  canUnassign,
  onAssign,
  onUnassign
}: FileAssignmentSectionProps) {
  return (
    <section className="figma-explorer-panel__section">
      <div className="figma-explorer-panel__section-heading">
        <h2 className="figma-explorer-panel__section-title">Classification</h2>
      </div>
      {selectedFileName ? (
        <div className="figma-explorer-panel__assignment">
          <p className="figma-explorer-panel__assignment-summary">
            <strong>{selectedFileName}</strong>
            <span aria-live="polite">
              現在: {currentFolderName ?? "未分類"}
            </span>
          </p>
          <div className="figma-explorer-panel__assignment-actions">
            <button
              className="figma-explorer-panel__assignment-button"
              disabled={!canAssign}
              onClick={onAssign}
              type="button">
              {selectedFolderName
                ? `「${selectedFolderName}」へ分類`
                : "分類先フォルダを選択"}
            </button>
            <button
              className="figma-explorer-panel__assignment-button figma-explorer-panel__assignment-button--secondary"
              disabled={!canUnassign}
              onClick={onUnassign}
              type="button">
              未分類へ戻す
            </button>
          </div>
        </div>
      ) : (
        <p className="figma-explorer-panel__empty-state">
          分類するファイルを選択してください。
        </p>
      )}
    </section>
  )
}
