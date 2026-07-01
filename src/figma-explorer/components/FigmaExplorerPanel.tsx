import { FIGMA_MATCHES } from "../constants/figma-routes"
import { formatHrefPathname } from "../formatters/format-href-pathname"

type FigmaExplorerPanelProps = {
  href: string
}

export function FigmaExplorerPanel({ href }: FigmaExplorerPanelProps) {
  return (
    <div className="figma-explorer-shell">
      <aside
        aria-label="Figma Explorer organizer panel"
        className="figma-explorer-panel">
        <header className="figma-explorer-panel__header">
          <div>
            <p className="figma-explorer-panel__eyebrow">Figma Explorer</p>
            <h1 className="figma-explorer-panel__title">Organizer Panel</h1>
          </div>
          <span className="figma-explorer-panel__badge">Drafts only</span>
        </header>

        <section className="figma-explorer-panel__section">
          <p className="figma-explorer-panel__lead">
            Figma Drafts 画面でのみ表示する仮パネルです。次の Issue で
            ファイルスキャンと一覧 UI を追加します。
          </p>

          <dl className="figma-explorer-panel__meta">
            <div>
              <dt>Status</dt>
              <dd>Content Scripts UI mounted</dd>
            </div>
            <div>
              <dt>Target</dt>
              <dd>{FIGMA_MATCHES.join(", ")}</dd>
            </div>
            <div>
              <dt>Route</dt>
              <dd>{formatHrefPathname(href)}</dd>
            </div>
          </dl>
        </section>

        <section className="figma-explorer-panel__section">
          <h2 className="figma-explorer-panel__section-title">Next steps</h2>
          <ul className="figma-explorer-panel__list">
            <li>Drafts 画面判定を専用ロジックへ切り出す</li>
            <li>ファイルカード候補 DOM の検出を追加する</li>
            <li>OrganizerPanel の本体 UI へ置き換える</li>
          </ul>
        </section>
      </aside>
    </div>
  )
}
