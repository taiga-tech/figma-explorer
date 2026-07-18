# 状態管理設計

永続スキーマの型と移行規則の正本は
[data-model.md](./data-model.md)、エラー処理の正本は
[error-handling.md](./error-handling.md)。本書は状態の置き場所と
更新フローを定義する。

## 1. 状態の分類

| 種別         | 内容                                 | 保存                 |
| ------------ | ------------------------------------ | -------------------- |
| 永続状態     | フォルダ、分類、設定                 | Plasmo Storage local |
| スキャン状態 | 現在画面から取得したファイル一覧     | メモリ               |
| UI状態       | 検索条件、フィルター、選択中ファイル | メモリ               |
| 派生状態     | 件数、表示用ViewModel                | 計算で生成           |

## 2. 実行時状態ストアの標準パターン（実装済み・正式採用）

実行時状態（スキャン状態・UI状態）は、`useSyncExternalStore` +
手書き外部ストアのパターンを標準とする。実装例:
`src/figma-explorer/stores/file-card-detection-store.ts`、
`src/figma-explorer/stores/href-store.ts`

採用理由:

- 依存ゼロで Content Scripts UI のバンドルを小さく保てる
- MutationObserver・URL 変化など React 外のイベント源との接続が素直
- React 18 の tearing 対策が標準 API だけで完結する

Zustand / Redux 等は採用しない。ただし次のいずれかに達したら再検討する:

- ストアが5個を超える
- ストア間で派生状態の共有・合成が複雑化する

ストア規約:

- `src/figma-explorer/stores/` 配下に1ファイル1ストアで置く
- `subscribe` / `getSnapshot` を export し、hook（`hooks/` 配下）で包む
- 高頻度イベントは `requestAnimationFrame` でスロットリングする
- スナップショットの変化判定を行い、変化がなければ通知しない

## 3. 保存対象

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

各フィールドの定義は [data-model.md](./data-model.md) §9 を参照。

## 4. 保存しないもの

```text
- 現在表示中のDraftFile一覧
- DOM要素参照
- 検索文字列
- 現在開いているダイアログ
- 一時的なエラー表示状態
```

ただし、JSON出力時には、現在スキャンできている `DraftFile[]` を
出力に含めてもよい。

## 5. Plasmo Storage Repository（実装済み）

```ts
import { Storage } from "@plasmohq/storage"

import type { PersistentState } from "~/src/domain/organizer-state"

const STORAGE_KEY = "figmaDraftsOrganizerState"
const BACKUP_STORAGE_KEY = "figmaDraftsOrganizerStateBackup"

const storage = new Storage({
  area: "local"
})

export const organizerStorage = {
  async loadOrMigrate(): Promise<Result<LoadOrMigrateValue>> {
    // 1. STORAGE_KEY を読む。無ければ初期状態を ok で返す
    // 2. schemaVersion を確認し、data-model.md §10 の3分岐で処理する
    // 3. migration 成功時は保存し直してから返す
  },

  async update<T, E>(
    apply: (
      latest: PersistentState
    ) => Result<{ state: PersistentState; value: T }, E>
  ): Promise<
    Result<{ state: PersistentState; value: T }, OrganizerStorageUpdateError<E>>
  > {
    // Web Lock 内で最新 state の load → apply → save を完了する
  },

  watch(listener: (state: PersistentState) => void): () => void {
    // chrome.storage の外部更新を検証して購読ストアへ通知する
  },

  async clear(): Promise<Result<void>> {
    // STORAGE_KEY を削除する。BACKUP_STORAGE_KEY は残す
  }
}
```

- `PersistentState` 全体を呼び出し側の古い snapshot で上書きしない。
  作成や展開状態の設定を mutation として渡し、`update` がロック取得後に
  読み直した最新 state へ適用する
- `update` は storage I/O の失敗と mutation 適用競合を区別し、適用競合時は
  読み込んだ最新 state も返す。ストアは競合した操作だけを除外し、後続操作を続ける
- フォルダ作成 mutation は ID・作成時刻を最初に確定し、展開操作は toggle
  ではなく目標値を保持する。保存失敗後に同じ mutation を再適用しても結果が
  重複・反転しないよう冪等にする
- 現在の書き込み元は `https://www.figma.com/*` の content script に限定し、
  同じ storage bucket の Web Lock
  `figma-explorer:organizer-state` で複数タブを直列化する
- popup / background など別 origin の書き込み元を追加する場合は、この前提を
  保てないため background の単一 coordinator へ更新境界を移してから追加する
- `OrganizerFoldersStore` は未保存 mutation を保持して optimistic state を表示し、
  `watch` で届いた外部 state へ再適用する。保存失敗時は明示的な再試行を出し、
  成功後に `storage_save_failed` を解除する
- `clear` によるキー削除も `watch` では空の初期状態として通知し、購読中ストアに
  削除前のフォルダを残さない
- 読み込み・移行の分岐仕様は [data-model.md](./data-model.md) §10 が正本
- 失敗時の `OrganizerError` は
  [error-handling.md](./error-handling.md) §3 のコードを使う
- 破損データは `BACKUP_STORAGE_KEY` へ退避してから初期化する

## 6. 初期状態

```ts
const createInitialState = (): PersistentState => ({
  schemaVersion: SCHEMA_VERSION,
  folders: {},
  folderTree: [],
  assignments: {},
  settings: {
    panelPosition: "right",
    panelWidth: 360,
    autoScan: true,
    showFirstRunNotice: true
  },
  meta: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
})
```

## 7. スキャンの流れ

```text
Drafts画面検出
↓
ファイルカード検出・URL解決（scan-pipeline.md 参照）
↓
DraftFile[] を生成
↓
FileIdで既存assignmentsと合成
↓
ViewModelを生成
↓
画面表示を更新
```

現行実装では「検出→抽出→表示」までを
`file-card-detection-store.ts` と `FigmaExplorerPanel` が担う。
OrganizerApp 統合後（予定）は、合成以降を `organizer-reducer.ts` に移す。

## 8. 分類の流れ

```text
ファイルを選択
↓
分類先フォルダを選択
↓
assignments[fileId].folderId を更新
↓
PersistentStateを保存（Result を確認し、失敗時は ErrorBanner）
↓
表示用ViewModelを再計算
```

## 9. フォルダ削除の流れ

```text
フォルダ削除
↓
対象フォルダ配下の子フォルダを確認
↓
削除対象フォルダに属するファイルのfolderIdをnullにする
↓
folderTreeから削除
↓
PersistentStateを保存
```

## 10. 派生状態

```ts
type OrganizerSummary = {
  totalCount: number
  visibleCount: number
  uncategorizedCount: number
}
```

派生状態は保存しない。
表示時に `scannedFiles` と `assignments` から計算する。

## 11. ViewModel

```ts
type DraftFileViewModel = {
  file: DraftFile
  folder: VirtualFolder | null
  isUncategorized: boolean
}
```

ラベル、命名違反、アーカイブ候補、重複候補はv0.2以降で追加する。

## 12. 関連文書

- [data-model.md](./data-model.md) — PersistentState・移行規則の正本
- [error-handling.md](./error-handling.md) — Result 型・storage エラー
- [scan-pipeline.md](./scan-pipeline.md) — スキャン状態の供給元
- [ui-and-components.md](./ui-and-components.md) — ViewModel の表示先
