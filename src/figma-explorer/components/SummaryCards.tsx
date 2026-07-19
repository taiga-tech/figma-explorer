import type { ActiveFilter } from "../../domain/organizer-state"

type SummaryCardsProps = {
  totalCount: number
  uncategorizedCount: number | null
  visibleCount: number
  activeFilter: ActiveFilter
  onChangeFilter: (filter: ActiveFilter) => void
}

export function SummaryCards({
  totalCount,
  uncategorizedCount,
  visibleCount,
  activeFilter,
  onChangeFilter
}: SummaryCardsProps) {
  return (
    <section
      aria-label="ファイル表示フィルター"
      className="figma-explorer-panel__summary-grid">
      <button
        aria-pressed={activeFilter.type === "all"}
        className="figma-explorer-panel__summary-card"
        onClick={() => onChangeFilter({ type: "all" })}
        type="button">
        <span className="figma-explorer-panel__summary-label">全件</span>
        <span className="figma-explorer-panel__summary-value">
          {totalCount}
        </span>
      </button>
      <button
        aria-pressed={activeFilter.type === "uncategorized"}
        className="figma-explorer-panel__summary-card"
        disabled={uncategorizedCount === null}
        onClick={() => onChangeFilter({ type: "uncategorized" })}
        type="button">
        <span className="figma-explorer-panel__summary-label">未分類</span>
        <span className="figma-explorer-panel__summary-value">
          {uncategorizedCount ?? "-"}
        </span>
      </button>
      <article className="figma-explorer-panel__summary-card">
        <p className="figma-explorer-panel__summary-label">表示中</p>
        <p className="figma-explorer-panel__summary-value">{visibleCount}</p>
      </article>
    </section>
  )
}
