export type FolderId = string

// docs/architecture/data-model.md §5: 初期版では最大5階層まで。
export const MAX_FOLDER_DEPTH = 5

export type VirtualFolder = {
  id: FolderId
  name: string
  parentId: FolderId | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  isSystem: boolean
}

export type FolderTreeNode = {
  folderId: FolderId
  children: FolderTreeNode[]
  expanded: boolean
}
