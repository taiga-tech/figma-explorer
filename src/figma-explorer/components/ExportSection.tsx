type ExportSectionProps = {
  disabled: boolean
  feedback: {
    kind: "success" | "error"
    message: string
  } | null
  onExport: () => void
}

export function ExportSection({
  disabled,
  feedback,
  onExport
}: ExportSectionProps) {
  return (
    <section className="figma-explorer-panel__section">
      <div className="figma-explorer-panel__section-heading">
        <div>
          <h2 className="figma-explorer-panel__section-title">JSON export</h2>
          <p className="figma-explorer-panel__export-description">
            現在スキャンできているファイル情報と保存済みの整理状態を出力します。
          </p>
        </div>
        <button
          className="figma-explorer-panel__section-action"
          disabled={disabled}
          onClick={onExport}
          type="button">
          JSON を出力
        </button>
      </div>

      {feedback && (
        <p
          aria-live="polite"
          className={
            feedback.kind === "error"
              ? "figma-explorer-panel__export-feedback figma-explorer-panel__export-feedback--error"
              : "figma-explorer-panel__export-feedback"
          }
          role={feedback.kind === "error" ? "alert" : "status"}>
          {feedback.message}
        </p>
      )}
    </section>
  )
}
