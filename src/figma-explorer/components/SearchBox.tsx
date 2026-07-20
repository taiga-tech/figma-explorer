type SearchBoxProps = {
  disabled?: boolean
  query: string
  onQueryChange: (query: string) => void
}

export function SearchBox({
  disabled = false,
  query,
  onQueryChange
}: SearchBoxProps) {
  return (
    <div className="figma-explorer-panel__search">
      <input
        aria-label="ファイル名で検索"
        className="figma-explorer-panel__search-input"
        disabled={disabled}
        onChange={(event) => onQueryChange(event.currentTarget.value)}
        placeholder="ファイル名で検索"
        role="searchbox"
        type="search"
        value={query}
      />
      <button
        className="figma-explorer-panel__search-clear"
        disabled={disabled || query.length === 0}
        onClick={() => onQueryChange("")}
        type="button">
        クリア
      </button>
    </div>
  )
}
