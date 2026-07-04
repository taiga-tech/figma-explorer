# 画面設計とコンポーネント設計

## 1. 現状と移行パス

現行実装は仮パネル
`src/figma-explorer/components/FigmaExplorerPanel.tsx`（実装済み）で、
検出・抽出結果の確認だけができる。本書が定義する `OrganizerApp` /
`OrganizerPanel` へ次の段階で置き換える。

| 段階 | 内容                                                       | 引き継ぐもの                                        |
| ---- | ---------------------------------------------------------- | --------------------------------------------------- |
| 1    | `OrganizerApp` を新設し、FigmaExplorerPanel をその中へ移す | `use-current-href` / `use-file-card-detection`      |
| 2    | Storage 復元と DraftFile 合成を OrganizerApp に実装        | `file-card-detection-store` / `href-store`          |
| 3    | OrganizerPanel 一式を実装し、FigmaExplorerPanel を廃棄     | styles（クラス命名は `figma-explorer-` 接頭辞維持） |

## 2. 画面構成

Figma Drafts画面上に右側固定の整理パネルを表示する。

```text
+-------------------------------------------------------------+
| Figma Drafts                                                |
|                                                             |
|  [File Card] [File Card] [File Card]                        |
|  [File Card] [File Card] [File Card]                        |
|                                                             |
|                                      +--------------------+ |
|                                      | Organizer Panel    | |
|                                      |--------------------| |
|                                      | Search             | |
|                                      | Summary            | |
|                                      | Folders            | |
|                                      | File List          | |
|                                      | JSON Export        | |
|                                      +--------------------+ |
+-------------------------------------------------------------+
```

## 3. 初期版で作る画面

```text
1. 整理パネル
2. フォルダツリー
3. ファイル一覧
4. 検索欄
5. JSON出力
6. 初回案内
7. エラー表示
```

## 4. 後続に回す画面

```text
1. ラベル一覧
2. 命名規則設定
3. 複数選択ツールバー
4. 右クリックメニュー
5. JSON復元
6. アーカイブ候補一覧
7. 重複候補一覧
```

## 5. コンポーネント構成

```text
contents/figma-explorer.tsx
└─ OrganizerApp
   ├─ FirstRunNotice
   ├─ OrganizerPanel
   │  ├─ PanelHeader
   │  ├─ SearchBox
   │  ├─ SummaryCards
   │  ├─ FolderTree
   │  │  └─ FolderTreeItem
   │  ├─ FileList
   │  │  └─ FileListItem
   │  └─ PanelFooter
   ├─ ExportJsonDialog
   └─ ErrorBanner
```

## 6. アクセシビリティ設計

- パネル: `role="complementary"` + `aria-label`（現行の `aside` +
  `aria-label` を踏襲）
- FolderTree: WAI-ARIA の tree パターンに従う。`role="tree"` /
  `role="treeitem"`、展開状態は `aria-expanded`、選択は `aria-selected`
- FileList: `role="list"` / `role="listitem"`、選択中項目は
  `aria-selected` で表現する
- フォーカスリングを消さない。コントラストは Figma のライト/ダーク両
  テーマ上で読めることを確認する
- アイコンのみのボタンには必ず `aria-label` を付ける

v0.1 は上記の構造ロール付与までを対象とし、スクリーンリーダーの
読み上げ最適化は v0.2 で扱う。

## 7. キーボード操作

パネル内にフォーカスがあるときのみ処理し、`stopPropagation` で
Figma 本体のショートカットへ伝播させない。パネル外のキー入力には
一切干渉しない。

| キー      | 対象       | 動作                              |
| --------- | ---------- | --------------------------------- |
| `↑` / `↓` | FileList   | 選択の移動                        |
| `Enter`   | FileList   | 選択ファイルをFigmaで開く         |
| `↑↓←→`    | FolderTree | tree パターン準拠の移動・開閉     |
| `F2`      | FolderTree | フォルダ名変更                    |
| `Delete`  | FolderTree | フォルダ削除（確認あり）          |
| `Escape`  | パネル全体 | 検索クリア → パネルフォーカス解除 |

v0.1 では FileList の `↑↓` / `Enter` と `Escape` を必須とし、
残りは v0.2 で拡張する。

## 8. 状態別表示マトリクス

「0件は空状態、構造欠落はエラー」の原則
（[error-handling.md](./error-handling.md)）を UI 仕様に落とす。

| コンポーネント | loading         | empty                            | error                          | success    |
| -------------- | --------------- | -------------------------------- | ------------------------------ | ---------- |
| FileList       | スケルトン表示  | 「表示中のファイルがありません」 | ErrorBanner に委譲             | 一覧表示   |
| FolderTree     | —               | システムフォルダのみ表示         | —                              | ツリー表示 |
| SummaryCards   | 件数を `-` 表示 | 全件 0 を表示                    | 非表示                         | 件数表示   |
| SearchBox      | 入力可          | 入力可（結果 0 件表示）          | 入力不可                       | 入力可     |
| ErrorBanner    | —               | 表示しない（空状態は別扱い）     | kind 対応文言 + 再スキャン導線 | 表示しない |

## 9. OrganizerApp

責務:

- Drafts画面判定
- 初期ロード（`loadOrMigrate()` の Result 分岐を含む）
- Storageから状態復元
- Draftsファイルスキャン起動
- スキャン結果と保存済み分類情報の合成
- エラー状態管理

## 10. OrganizerPanel

責務:

- 整理パネル全体の表示
- 検索、件数、フォルダ、ファイル一覧、JSON出力を配置する

## 11. PanelHeader

表示:

- タイトル
- 再スキャンボタン
- 閉じるボタン

操作:

| 操作       | 結果                                   |
| ---------- | -------------------------------------- |
| 再スキャン | Drafts画面のファイルカードを再取得する |
| 閉じる     | パネルを非表示にする                   |

## 12. SearchBox

仕様:

- 入力に応じてファイル一覧を絞り込む
- 大文字小文字は区別しない
- 空文字の場合は検索条件を解除する
- `role="searchbox"` + `aria-label` を付ける

## 13. SummaryCards

表示項目:

```text
全件
未分類
表示中
```

クリック時の挙動:

| 項目   | 挙動             |
| ------ | ---------------- |
| 全件   | 全ファイルを表示 |
| 未分類 | 未分類のみ表示   |

命名違反、アーカイブ候補、重複候補はv0.2以降で追加する。

## 14. FolderTree

表示例:

```text
Drafts
├─ すべて
├─ 未分類
├─ 案件_A
│  ├─ 売上一覧
│  ├─ 売上補正
│  └─ 入金消込
└─ 案件_B
   ├─ 管理画面
   └─ 顧客画面
```

操作:

| 操作               | 結果                             |
| ------------------ | -------------------------------- |
| フォルダクリック   | 対象フォルダのファイル一覧を表示 |
| 展開アイコン       | 子フォルダを表示                 |
| 折りたたみアイコン | 子フォルダを非表示               |
| 新規作成           | フォルダを追加                   |
| 名前変更           | フォルダ名を変更                 |
| 削除               | フォルダを削除                   |

## 15. FileList

表示項目:

```text
ファイル名
所属フォルダ
URLを開く操作
```

操作:

| 操作           | 結果                         |
| -------------- | ---------------------------- |
| クリック       | 選択                         |
| ダブルクリック | Figmaファイルを開く          |
| フォルダ選択   | 対象ファイルをフォルダへ分類 |
| 未分類に戻す   | folderIdをnullにする         |

## 16. FirstRunNotice

表示内容:

```text
この拡張機能はFigma Draftsを仮想的に整理します。
Figma上のファイル移動、削除、権限変更は行いません。
分類情報はこのブラウザのローカル保存領域に保存されます。
```

## 17. ErrorBanner

エラー分類（[error-handling.md](./error-handling.md) §3 の kind）と
表示の対応:

| kind                       | 表示                                         |
| -------------------------- | -------------------------------------------- |
| `scan_dom_missing`         | 「ファイル一覧を読み取れません」+ 再スキャン |
| `scan_partial`             | 件数のみ表示（一覧表示は継続）               |
| `storage_load_failed`      | 「保存データを読み込めません」               |
| `storage_save_failed`      | 「保存に失敗しました」+ 再試行               |
| `storage_migration_failed` | 「旧データを変換できません」（読み取り専用） |
| `storage_corrupted`        | 「保存データを初期化しました」（退避済み）   |
| `export_failed`            | 「JSON出力に失敗しました」+ 再試行           |

取得0件はエラーではなく、空状態として扱う（§8）。

## 18. 関連文書

- [error-handling.md](./error-handling.md) — エラー分類・表示原則の正本
- [state-management.md](./state-management.md) — ストアと ViewModel
- [scan-pipeline.md](./scan-pipeline.md) — 検出・抽出結果の由来
