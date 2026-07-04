import type {
  FolderId,
  FolderTreeNode,
  VirtualFolder
} from "../../domain/folder"
import { FolderTreeItem } from "./FolderTreeItem"

type FolderTreeProps = {
  folders: Record<FolderId, VirtualFolder>
  tree: FolderTreeNode[]
  selectedFolderId: FolderId | null
  onSelectFolder: (folderId: FolderId) => void
  onToggleExpanded: (folderId: FolderId) => void
}

export function FolderTree({
  folders,
  tree,
  selectedFolderId,
  onSelectFolder,
  onToggleExpanded
}: FolderTreeProps) {
  if (tree.length === 0) {
    return (
      <p className="figma-explorer-panel__empty-state">
        まだフォルダがありません。「新規作成」から追加できます。
      </p>
    )
  }

  return (
    <ul
      aria-label="仮想フォルダツリー"
      className="figma-explorer-folder-tree"
      role="tree">
      {tree.map((node) => (
        <FolderTreeItem
          folders={folders}
          key={node.folderId}
          level={1}
          node={node}
          onSelectFolder={onSelectFolder}
          onToggleExpanded={onToggleExpanded}
          selectedFolderId={selectedFolderId}
        />
      ))}
    </ul>
  )
}
