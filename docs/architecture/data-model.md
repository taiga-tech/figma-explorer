# データモデル

本書は `PersistentState` とスキーマ移行の正本である。
Result 型と `OrganizerError` は [error-handling.md](./error-handling.md) を参照。

## 1. 基本方針

スキャンで得たファイル一覧と、保存する整理情報を分ける。

- `RuntimeState`: 現在のFigma Drafts画面から得た情報
- `PersistentState`: 拡張機能の保存領域に保持する情報

Drafts画面でファイルが一時的に表示されない場合でも、分類情報は消さない。
拡張機能の更新・スキーマ変更でユーザーの分類データを失わない（移行は §10）。

## 2. DraftFile

Figma Drafts画面から読み取る実行時データ。
実装済み: `src/features/scan/draft-file.ts`

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

分類情報（`assignments`）のキーになるため、同一ファイルの再スキャンで
必ず同一 ID になることを最優先の保証とする。

```ts
type FileIdSource = "figma_file_key" | "url_hash"

type CreateFileIdValue = {
  fileId: FileId
  source: FileIdSource
}

type CreateFileIdError = {
  kind: "missing_url" | "unsupported_url"
}

type CreateFileIdResult = Result<CreateFileIdValue, CreateFileIdError>
```

方針:

- 第一候補は bridge が解決した URL（`editUrl` 由来。
  [scan-pipeline.md](./scan-pipeline.md) 参照）から file key を抽出する
- file key を取得できない場合のみ、正規化した URL 文字列の hash を使う
- ファイル名だけをIDにしない（改名で ID が変わるため）
- ID生成処理は `src/features/scan/create-file-id.ts`（予定）に集約する

file key の抽出対象パスパターン
（実装済みのルート判定 `FIGMA_ROUTE_FRAGMENT_PATTERN` と揃える）:

| パターン         | 例                                  |
| ---------------- | ----------------------------------- |
| `/file/:key/...` | `https://www.figma.com/file/AbC123` |
| `/design/:key`   | `/design/AbC123/title-slug`         |
| `/board/:key`    | FigJam                              |
| `/slides/:key`   | Slides                              |
| `/proto/:key`    | プロトタイプ                        |
| `/site/:key`     | Sites                               |
| `/buzz/:key`     | Buzz                                |
| `/make/:key`     | Make                                |

hash fallback 用の URL 正規化規則:

- クエリ文字列とフラグメントを除去する
- 末尾のタイトルスラッグ（`/design/:key/` 以降）を除去する
- 末尾スラッシュを除去する

安定性の保証条件:

| 変化                              | FileId       |
| --------------------------------- | ------------ |
| ファイル改名                      | 変わらない   |
| タイトルスラッグ・クエリの変化    | 変わらない   |
| 再スキャン・ページ再読み込み      | 変わらない   |
| file key 自体の変化（別ファイル） | 変わってよい |

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
  schemaVersion: number
  folders: Record<FolderId, VirtualFolder>
  folderTree: FolderTreeNode[]
  assignments: Record<FileId, FileAssignment>
  settings: OrganizerSettings
  meta: StateMeta
}
```

## 10. スキーマバージョニングと移行

```ts
const SCHEMA_VERSION = 1

type Migration = (state: unknown) => unknown

const migrations: Record<number, Migration> = {
  // 2: (state) => v1 から v2 への変換
}
```

読み込み時（`loadOrMigrate()`。[state-management.md](./state-management.md)
参照）は保存データの `schemaVersion` で3分岐する。

| 状態                             | 挙動                                                     |
| -------------------------------- | -------------------------------------------------------- |
| 過去バージョン                   | migration を昇順に順次適用し、成功したら保存し直す       |
| 未知の将来バージョン             | 上書き保存を止め、読み取り専用の警告を表示する           |
| 破損（parse 不能・必須キー欠落） | バックアップキーへ退避してから初期状態を返し、警告を表示 |

- migration は純関数とし、unit テスト対象にする
  （[testing-strategy.md](./testing-strategy.md)）
- migration 失敗は `storage_migration_failed`、破損は `storage_corrupted`
  として扱う（[error-handling.md](./error-handling.md)）

## 11. RuntimeState

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

## 12. ActiveFilter

```ts
type ActiveFilter =
  | { type: "all" }
  | { type: "folder"; folderId: FolderId }
  | { type: "uncategorized" }
```

## 13. ExportJson

実装済み: `src/domain/export-json.ts`、
`src/features/export-json/export-json-service.ts`

```ts
type ExportJson = {
  exportedAt: string
  appVersion: string
  schemaVersion: number
  files: DraftFile[]
  folders: VirtualFolder[]
  folderTree: FolderTreeNode[]
  assignments: FileAssignment[]
  settings: OrganizerSettings
}
```

JSONにはFigmaファイル本文を含めない。
保存するのは、Drafts一覧から取得したメタ情報と拡張機能内の整理情報だけとする。
現行スキャンは表示中カードの履歴を保持しないため、出力時の `firstSeenAt` と
`lastSeenAt` には同じスナップショット日時を設定する。

## 14. 関連文書

- [error-handling.md](./error-handling.md) — Result 型・エラー分類の正本
- [state-management.md](./state-management.md) — 保存・復元・移行の実行フロー
- [scan-pipeline.md](./scan-pipeline.md) — DraftFile の取得元
