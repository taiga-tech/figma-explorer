export type FolderId = string

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
