type PanelHeaderProps = {
  visibleCount: number
  onRescan: () => void
}

export function PanelHeader({ visibleCount, onRescan }: PanelHeaderProps) {
  return (
    <header className="figma-explorer-panel__header">
      <div className="figma-explorer-panel__header-copy">
        <p className="figma-explorer-panel__eyebrow">Figma Explorer</p>
        <h1 className="figma-explorer-panel__title">Organizer Panel</h1>
        <p className="figma-explorer-panel__subtitle">
          Drafts 一覧を整理するための基本 UI です。
        </p>
      </div>
      <div className="figma-explorer-panel__header-actions">
        <span className="figma-explorer-panel__count-badge">
          {visibleCount} files
        </span>
        <button
          className="figma-explorer-panel__rescan-button"
          onClick={onRescan}
          type="button">
          再スキャン
        </button>
      </div>
    </header>
  )
}
