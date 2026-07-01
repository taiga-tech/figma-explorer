# 状態管理設計

## 1. 状態の分類

| 種別         | 内容                                 | 保存                 |
| ------------ | ------------------------------------ | -------------------- |
| 永続状態     | フォルダ、分類、設定                 | Plasmo Storage local |
| スキャン状態 | 現在画面から取得したファイル一覧     | メモリ               |
| UI状態       | 検索条件、フィルター、選択中ファイル | メモリ               |
| 派生状態     | 件数、表示用ViewModel                | 計算で生成           |

## 2. 保存対象

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

## 3. 保存しないもの

```text
- 現在表示中のDraftFile一覧
- DOM要素参照
- 検索文字列
- 現在開いているダイアログ
- 一時的なエラー表示状態
```

ただし、JSON出力時には、現在スキャンできている `DraftFile[]` を出力に含めてもよい。

## 4. Plasmo Storage Repository

```ts
import { Storage } from "@plasmohq/storage"

import type { PersistentState } from "~/src/domain/organizer-state"

const STORAGE_KEY = "figmaDraftsOrganizerState"

const storage = new Storage({
  area: "local"
})

export const organizerStorage = {
  async load(): Promise<PersistentState | null> {
    return await storage.get(STORAGE_KEY)
  },

  async save(state: PersistentState): Promise<void> {
    await storage.set(STORAGE_KEY, state)
  },

  async clear(): Promise<void> {
    await storage.remove(STORAGE_KEY)
  }
}
```

## 5. 初期状態

```ts
const createInitialState = (): PersistentState => ({
  version: 1,
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

## 6. スキャンの流れ

```text
Drafts画面検出
↓
scanDraftFiles()
↓
DraftFile[] を生成
↓
FileIdで既存assignmentsと合成
↓
ViewModelを生成
↓
画面表示を更新
```

## 7. 分類の流れ

```text
ファイルを選択
↓
分類先フォルダを選択
↓
assignments[fileId].folderId を更新
↓
PersistentStateを保存
↓
表示用ViewModelを再計算
```

## 8. フォルダ削除の流れ

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

## 9. 派生状態

```ts
type OrganizerSummary = {
  totalCount: number
  visibleCount: number
  uncategorizedCount: number
}
```

派生状態は保存しない。
表示時に `scannedFiles` と `assignments` から計算する。

## 10. ViewModel

```ts
type DraftFileViewModel = {
  file: DraftFile
  folder: VirtualFolder | null
  isUncategorized: boolean
}
```

ラベル、命名違反、アーカイブ候補、重複候補はv0.2以降で追加する。
