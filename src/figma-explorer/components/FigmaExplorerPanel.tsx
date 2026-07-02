import { extractFileCardMetadata } from "../../features/scan/extract-file-card-metadata"
import { FIGMA_MATCHES } from "../constants/figma-routes"
import { formatHrefPathname } from "../formatters/format-href-pathname"
import { useFileCardDetection } from "../hooks/use-file-card-detection"

type FigmaExplorerPanelProps = {
  href: string
}

export function FigmaExplorerPanel({ href }: FigmaExplorerPanelProps) {
  const fileCardDetectionResult = useFileCardDetection()
  const extractedFileCards =
    fileCardDetectionResult.status === "success"
      ? extractFileCardMetadata(fileCardDetectionResult.elements, href)
      : null

  const scanSummary =
    fileCardDetectionResult.status === "success"
      ? `${extractedFileCards.files.length} files extracted / ${extractedFileCards.skippedCount} skipped`
      : fileCardDetectionResult.status === "empty"
        ? "0 candidate cards"
        : fileCardDetectionResult.message

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
            Figma Drafts 画面でのみ表示する仮パネルです。現在は候補カードから
            ファイル名と URL の抽出結果を確認できます。
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
            <div>
              <dt>Scan</dt>
              <dd>{scanSummary}</dd>
            </div>
          </dl>
        </section>

        <section className="figma-explorer-panel__section">
          <h2 className="figma-explorer-panel__section-title">
            Detected files
          </h2>
          {extractedFileCards && extractedFileCards.files.length > 0 && (
            <ul className="figma-explorer-panel__detected-files">
              {extractedFileCards.files.map((file) => (
                <li
                  className="figma-explorer-panel__detected-file"
                  key={file.url}>
                  <strong className="figma-explorer-panel__detected-file-name">
                    {file.name}
                  </strong>
                  <span className="figma-explorer-panel__detected-file-url">
                    {file.url}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {extractedFileCards &&
            extractedFileCards.files.length === 0 &&
            extractedFileCards.totalCount > 0 && (
              <p className="figma-explorer-panel__empty-state">
                候補カードは見つかりましたが、名前または URL
                を抽出できませんでした。
              </p>
            )}
          {fileCardDetectionResult.status === "empty" && (
            <p className="figma-explorer-panel__empty-state">
              まだ候補カードが見つかっていません。
            </p>
          )}
          {fileCardDetectionResult.status === "error" && (
            <p className="figma-explorer-panel__empty-state">
              {fileCardDetectionResult.message}
            </p>
          )}
        </section>

        <section className="figma-explorer-panel__section">
          <h2 className="figma-explorer-panel__section-title">Next steps</h2>
          <ul className="figma-explorer-panel__list">
            <li>FileId 生成処理を追加する</li>
            <li>更新日時やサムネイルの抽出を追加する</li>
            <li>OrganizerPanel の本体 UI へ置き換える</li>
          </ul>
        </section>
      </aside>
    </div>
  )
}
