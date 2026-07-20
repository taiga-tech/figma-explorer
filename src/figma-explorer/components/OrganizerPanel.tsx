import type { ComponentProps } from "react"

import type { ActiveFilter } from "../../domain/organizer-state"
import type { OrganizerErrorKind } from "../../utils/result"
import { FileAssignmentSection } from "./FileAssignmentSection"
import { FileList } from "./FileList"
import { FolderSection } from "./FolderSection"
import type { OrganizerFileListItem } from "./organizer-panel-types"
import { PanelHeader } from "./PanelHeader"
import { SearchBox } from "./SearchBox"
import { SummaryCards } from "./SummaryCards"

type OrganizerPanelProps = {
  targetLabel: string
  routeLabel: string
  scanSummary: string
  files: OrganizerFileListItem[]
  totalCount: number
  uncategorizedCount: number | null
  activeFilter: ActiveFilter
  searchQuery: string
  searchDisabled?: boolean
  selectedFileId: string | null
  emptyMessage: string | null
  errorBanner: {
    kind: OrganizerErrorKind
    message: string
  } | null
  folderSection: ComponentProps<typeof FolderSection>
  assignmentSection: ComponentProps<typeof FileAssignmentSection>
  onRescan: () => void
  onSelectFile: (fileId: string) => void
  onChangeFilter: (filter: ActiveFilter) => void
  onSearchQueryChange: (query: string) => void
}

export function OrganizerPanel({
  targetLabel,
  routeLabel,
  scanSummary,
  files,
  totalCount,
  uncategorizedCount,
  activeFilter,
  searchQuery,
  searchDisabled,
  selectedFileId,
  emptyMessage,
  errorBanner,
  folderSection,
  assignmentSection,
  onRescan,
  onSelectFile,
  onChangeFilter,
  onSearchQueryChange
}: OrganizerPanelProps) {
  return (
    <div className="figma-explorer-shell">
      <aside
        aria-label="Figma Explorer organizer panel"
        className="figma-explorer-panel">
        <PanelHeader onRescan={onRescan} visibleCount={files.length} />

        {errorBanner && (
          <div className="figma-explorer-panel__error-banner" role="alert">
            <div>
              <p className="figma-explorer-panel__error-message">
                ファイル一覧を読み取れません。Figma
                の画面構造が変わった可能性があります。
              </p>
              <p className="figma-explorer-panel__error-detail">
                {errorBanner.kind}: {errorBanner.message}
              </p>
            </div>
            <button
              className="figma-explorer-panel__rescan-button"
              onClick={onRescan}
              type="button">
              再スキャン
            </button>
          </div>
        )}

        <section className="figma-explorer-panel__section">
          <p className="figma-explorer-panel__lead">
            現在は OrganizerPanel の基本 UI を組み込み、スキャン済みファイルを
            一覧表示しています。
          </p>

          <dl className="figma-explorer-panel__meta">
            <div>
              <dt>Target</dt>
              <dd>{targetLabel}</dd>
            </div>
            <div>
              <dt>Route</dt>
              <dd>{routeLabel}</dd>
            </div>
            <div>
              <dt>Scan</dt>
              <dd>{scanSummary}</dd>
            </div>
          </dl>
        </section>

        <SearchBox
          disabled={searchDisabled}
          onQueryChange={onSearchQueryChange}
          query={searchQuery}
        />

        <SummaryCards
          activeFilter={activeFilter}
          onChangeFilter={onChangeFilter}
          totalCount={totalCount}
          uncategorizedCount={uncategorizedCount}
          visibleCount={files.length}
        />

        <FolderSection {...folderSection} />

        <FileAssignmentSection {...assignmentSection} />

        <section className="figma-explorer-panel__section figma-explorer-panel__section--file-list">
          <div className="figma-explorer-panel__section-heading">
            <h2 className="figma-explorer-panel__section-title">
              Detected files
            </h2>
            <span className="figma-explorer-panel__section-count">
              {files.length} items
            </span>
          </div>
          <FileList
            emptyMessage={emptyMessage}
            files={files}
            onSelectFile={onSelectFile}
            selectedFileId={selectedFileId}
          />
        </section>
      </aside>
    </div>
  )
}
