# データモデル

## 1. 基本方針

スキャンで得たファイル一覧と、保存する整理情報を分ける。

- `RuntimeState`: 現在のFigma Drafts画面から得た情報
- `PersistentState`: 拡張機能の保存領域に保持する情報

Drafts画面でファイルが一時的に表示されない場合でも、分類情報は消さない。

## 2. DraftFile

Figma Drafts画面から読み取る実行時データ。

```ts
type FileId = string

type DraftFile = {
  id: FileId
  name: string
  url: string
  type: FigmaFileType
  updatedAtText?: string
  thumbnailUrl?: string
  firstSeenAt: string
  lastSeenAt: string
  scanStatus: FileScanStatus
}

type FigmaFileType = "design" | "figjam" | "slides" | "unknown"

type FileScanStatus = "active" | "parse_error"
```

## 3. FileId生成

```ts
type CreateFileIdResult =
  | { ok: true; fileId: FileId; source: "figma_url" | "url_hash" }
  | { ok: false; reason: "missing_url" | "unsupported_url" }
```

方針:

- Figma file URLから取得できる場合は、URL内のfile keyを使う
- 取得できない場合はURL文字列のhashをfallbackにする
- ファイル名だけをIDにしない
- ID生成処理は `src/features/scan/create-file-id.ts` に集約する

## 4. VirtualFolder

```ts
type FolderId = string

type VirtualFolder = {
  id: FolderId
  name: string
  parentId: FolderId | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  isSystem: boolean
}
```

## 5. FolderTreeNode

```ts
type FolderTreeNode = {
  folderId: FolderId
  children: FolderTreeNode[]
  expanded: boolean
}
```

制約:

- 同じ `folderId` はツリー内に1回だけ出現する
- 親子関係の循環は禁止
- 初期版では最大5階層まで
- システムフォルダは削除不可

## 6. FileAssignment

```ts
type FileAssignment = {
  fileId: FileId
  folderId: FolderId | null
  updatedAt: string
}
```

v0.1では1ファイルにつき主フォルダは1つ。
ラベル、アーカイブ候補、重複除外はv0.2以降で追加する。

## 7. OrganizerSettings

```ts
type OrganizerSettings = {
  panelPosition: "right" | "left"
  panelWidth: number
  autoScan: boolean
  showFirstRunNotice: boolean
}
```

## 8. StateMeta

```ts
type StateMeta = {
  createdAt: string
  updatedAt: string
  lastScannedAt?: string
  lastExportedAt?: string
}
```

## 9. PersistentState

```ts
type PersistentState = {
  version: number
  folders: Record<FolderId, VirtualFolder>
  folderTree: FolderTreeNode[]
  assignments: Record<FileId, FileAssignment>
  settings: OrganizerSettings
  meta: StateMeta
}
```

## 10. RuntimeState

```ts
type ScanStatus = "idle" | "scanning" | "success" | "empty" | "error"

type RuntimeState = {
  scannedFiles: Record<FileId, DraftFile>
  scanStatus: ScanStatus
  scanError?: OrganizerError
  selectedFileId: FileId | null
  activeFilter: ActiveFilter
  searchQuery: string
}
```

## 11. ActiveFilter

```ts
type ActiveFilter =
  | { type: "all" }
  | { type: "folder"; folderId: FolderId }
  | { type: "uncategorized" }
```

## 12. ExportJson

```ts
type ExportJson = {
  exportedAt: string
  appVersion: string
  stateVersion: number
  files: DraftFile[]
  folders: VirtualFolder[]
  folderTree: FolderTreeNode[]
  assignments: FileAssignment[]
  settings: OrganizerSettings
}
```

JSONにはFigmaファイル本文を含めない。
保存するのは、Drafts一覧から取得したメタ情報と拡張機能内の整理情報だけとする。
