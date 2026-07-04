import type {
  FolderId,
  FolderTreeNode,
  VirtualFolder
} from "../../domain/folder"

type FolderTreeItemProps = {
  node: FolderTreeNode
  folders: Record<FolderId, VirtualFolder>
  level: number
  selectedFolderId: FolderId | null
  onSelectFolder: (folderId: FolderId) => void
  onToggleExpanded: (folderId: FolderId) => void
}

export function FolderTreeItem({
  node,
  folders,
  level,
  selectedFolderId,
  onSelectFolder,
  onToggleExpanded
}: FolderTreeItemProps) {
  const folder = folders[node.folderId]

  if (!folder) {
    return null
  }

  const hasChildren = node.children.length > 0
  const isSelected = selectedFolderId === folder.id

  return (
    <li
      aria-expanded={hasChildren ? node.expanded : undefined}
      aria-level={level}
      aria-selected={isSelected}
      className="figma-explorer-folder-tree__item"
      role="treeitem">
      <div
        className={
          isSelected
            ? "figma-explorer-folder-tree__row figma-explorer-folder-tree__row--selected"
            : "figma-explorer-folder-tree__row"
        }>
        {hasChildren ? (
          <button
            aria-label={
              node.expanded
                ? `${folder.name} を折りたたむ`
                : `${folder.name} を展開する`
            }
            className="figma-explorer-folder-tree__toggle"
            onClick={() => onToggleExpanded(folder.id)}
            type="button">
            {node.expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span
            aria-hidden="true"
            className="figma-explorer-folder-tree__toggle-spacer"
          />
        )}
        <button
          className="figma-explorer-folder-tree__name"
          onClick={() => onSelectFolder(folder.id)}
          type="button">
          {folder.name}
        </button>
      </div>

      {hasChildren && node.expanded && (
        <ul className="figma-explorer-folder-tree__children" role="group">
          {node.children.map((child) => (
            <FolderTreeItem
              folders={folders}
              key={child.folderId}
              level={level + 1}
              node={child}
              onSelectFolder={onSelectFolder}
              onToggleExpanded={onToggleExpanded}
              selectedFolderId={selectedFolderId}
            />
          ))}
        </ul>
      )}
    </li>
  )
}
