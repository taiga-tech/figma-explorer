import type { FolderId, FolderTreeNode } from "../../domain/folder"

export const createFolderTreeNode = (folderId: FolderId): FolderTreeNode => ({
  folderId,
  children: [],
  expanded: false
})

export const findFolderTreeNode = (
  tree: FolderTreeNode[],
  folderId: FolderId
): FolderTreeNode | null => {
  for (const node of tree) {
    if (node.folderId === folderId) {
      return node
    }

    const found = findFolderTreeNode(node.children, folderId)

    if (found) {
      return found
    }
  }

  return null
}

/**
 * parentId が null ならルート直下、そうでなければ該当ノードの children 末尾へ
 * 追加した新しいツリーを返す。parent が見つからない場合はツリーを変えないため、
 * 呼び出し側で parent の存在を先に検証する。
 */
export const insertFolderTreeNode = (
  tree: FolderTreeNode[],
  node: FolderTreeNode,
  parentId: FolderId | null
): FolderTreeNode[] => {
  if (parentId === null) {
    return [...tree, node]
  }

  return tree.map((current) =>
    current.folderId === parentId
      ? { ...current, children: [...current.children, node] }
      : {
          ...current,
          children: insertFolderTreeNode(current.children, node, parentId)
        }
  )
}

/** 対象ノードを配下のサブツリーごと取り除いた新しいツリーを返す。 */
export const removeFolderTreeNode = (
  tree: FolderTreeNode[],
  folderId: FolderId
): FolderTreeNode[] =>
  tree.flatMap((node) =>
    node.folderId === folderId
      ? []
      : [
          {
            ...node,
            children: removeFolderTreeNode(node.children, folderId)
          }
        ]
  )

/** 対象ノードの展開状態だけを更新した新しいツリーを返す。 */
export const setFolderTreeNodeExpanded = (
  tree: FolderTreeNode[],
  folderId: FolderId,
  expanded: boolean
): FolderTreeNode[] =>
  tree.map((node) =>
    node.folderId === folderId
      ? { ...node, expanded }
      : {
          ...node,
          children: setFolderTreeNodeExpanded(node.children, folderId, expanded)
        }
  )

export const collectFolderTreeIds = (tree: FolderTreeNode[]): FolderId[] =>
  tree.flatMap((node) => [
    node.folderId,
    ...collectFolderTreeIds(node.children)
  ])
