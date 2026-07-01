# GitHub Issue一覧 v0.1

## 運用方針

v0.1では、以下19件を登録対象とする。
ラベル、命名規則、複数選択、右クリック、ドラッグ操作はv0.2以降へ移す。

## Labels

| Label           | 用途                   |
| --------------- | ---------------------- |
| `type:setup`    | 環境構築               |
| `type:feature`  | 機能追加               |
| `type:ui`       | UI実装                 |
| `type:domain`   | 型、ドメインロジック   |
| `type:storage`  | 永続化                 |
| `type:bug-risk` | 壊れやすい箇所への対策 |
| `area:plasmo`   | Plasmo固有             |
| `area:scan`     | Figma DOM読み取り      |
| `area:folder`   | 仮想フォルダ           |
| `area:filter`   | 検索、絞り込み         |
| `area:export`   | JSON出力               |
| `priority:high` | v0.1対象               |

## Issue 001: Plasmoプロジェクトを作成する

Labels: `type:setup`, `area:plasmo`, `priority:high`

対象ユーザーストーリー:

- US-001 Drafts画面を検出する

作業内容:

- `pnpm create plasmo figma-explorer` で作成する
- TypeScript構成を確認する
- `pnpm dev` が起動する状態にする
- Chromeに開発用拡張機能として読み込む
- READMEに起動手順を記載する

受け入れ条件:

- `pnpm dev` が起動する
- Chrome拡張機能として読み込める
- 開発中の変更が反映される
- READMEに起動手順がある

## Issue 002: Content Scripts UIの入口を作成する

Labels: `type:feature`, `type:ui`, `area:plasmo`, `priority:high`

対象ユーザーストーリー:

- US-001 Drafts画面を検出する
- US-003 ファイル一覧を整理パネルに表示する

作業内容:

- `contents/figma-explorer.tsx` を作成する
- `contents/figma-explorer.css` を作成する
- `matches: ["https://www.figma.com/*"]` を設定する
- 仮の右側固定パネルを表示する
- Drafts以外では表示しない判定を仮実装する

受け入れ条件:

- Figma Drafts画面で整理パネルが表示される
- Figmaファイル編集画面では整理パネルが表示されない
- Figma以外のサイトでは動作しない
- Figma標準UIのクリック操作を妨げない

## Issue 003: Drafts画面判定処理を実装する

Labels: `type:domain`, `area:scan`, `priority:high`

作業内容:

- `src/features/scan/detect-drafts-page.ts` を作成する
- `www.figma.com` のみ対象にする
- `/drafts` を含むパスのみ対象にする
- UI側からこの判定処理を呼び出す

受け入れ条件:

- Drafts画面は `true` になる
- ファイル編集画面は `false` になる
- チームプロジェクト画面は `false` になる
- Figma以外のURLは `false` になる

## Issue 004: DraftFile型を定義する

Labels: `type:domain`, `area:scan`, `priority:high`

作業内容:

- `DraftFile` を定義する
- `FigmaFileType` を定義する
- `FileScanStatus` を定義する
- Figmaファイル本文の情報を含めない

## Issue 005: ファイルカード候補DOMを検出する

Labels: `type:feature`, `area:scan`, `type:bug-risk`, `priority:high`

作業内容:

- ファイルカード候補のDOMを取得する
- 取得対象セレクタを `features/scan` に閉じ込める
- DOM取得0件と取得失敗を区別する

受け入れ条件:

- 表示中のファイルカード候補を検出できる
- 0件の場合は空状態として扱う
- DOM取得失敗時はエラーとして扱う

## Issue 006: ファイル名とURLを抽出する

Labels: `type:feature`, `area:scan`, `type:bug-risk`, `priority:high`

作業内容:

- ファイルカード候補DOMからファイル名を取得する
- ファイルURLを取得する
- 1件のパース失敗で全体が止まらないようにする

受け入れ条件:

- ファイル名を取得できる
- ファイルURLを取得できる
- パース失敗したカードはスキップできる
- 一部失敗件数を把握できる

## Issue 007: FileId生成処理を実装する

Labels: `type:domain`, `area:scan`, `priority:high`

作業内容:

- `create-file-id.ts` を作成する
- Figma URLからfile keyを取得する
- fallbackとしてURL hashを生成する
- ファイル名だけをIDにしない

受け入れ条件:

- Figma file URLから安定したFileIdを取得できる
- URLから取得できない場合のfallbackが定義されている
- ID生成処理が1箇所に集約されている

## Issue 008: スキャン失敗と0件を区別する

Labels: `type:feature`, `type:ui`, `area:scan`, `type:bug-risk`, `priority:high`

作業内容:

- `ScanStatus` を定義する
- `empty` と `error` を分ける
- `ErrorBanner` と空状態表示を分ける

受け入れ条件:

- 0件時にエラー表示にならない
- DOM取得失敗時はエラー表示になる
- 再スキャンできる

## Issue 009: OrganizerPanelの基本UIを実装する

Labels: `type:ui`, `area:plasmo`, `priority:high`

作業内容:

- `OrganizerPanel` を作成する
- `PanelHeader` を作成する
- `FileList` を作成する
- `FileListItem` を作成する
- 取得件数を表示する

## Issue 010: OrganizerState型を定義する

Labels: `type:domain`, `priority:high`

作業内容:

- `PersistentState` を定義する
- `RuntimeState` を定義する
- `OrganizerSettings` を定義する
- `StateMeta` を定義する

## Issue 011: Plasmo Storage Repositoryを実装する

Labels: `type:storage`, `area:plasmo`, `priority:high`

作業内容:

- `@plasmohq/storage` を使う
- `area: "local"` を明示する
- `load` を実装する
- `save` を実装する
- `clear` を実装する
- 初期状態生成処理を実装する

受け入れ条件:

- 状態を保存できる
- ページ再読み込み後に復元できる
- 保存データがない場合は初期状態を返せる

## Issue 012: 仮想フォルダ型とサービスを実装する

Labels: `type:domain`, `type:feature`, `area:folder`, `priority:high`

作業内容:

- `VirtualFolder` を定義する
- `FolderTreeNode` を定義する
- フォルダ作成処理を実装する
- フォルダ名変更処理を実装する
- フォルダ削除処理を実装する

## Issue 013: フォルダツリーUIを実装する

Labels: `type:ui`, `area:folder`, `priority:high`

作業内容:

- `FolderTree` を作成する
- `FolderTreeItem` を作成する
- 新規作成ボタンを配置する
- 展開、折りたたみを実装する
- 選択中フォルダを表示する

## Issue 014: フォルダ階層の制約処理を実装する

Labels: `type:domain`, `area:folder`, `type:bug-risk`, `priority:high`

作業内容:

- 最大5階層制限を実装する
- 循環参照チェックを実装する
- 同一フォルダの重複配置を防ぐ
- フォルダ削除時の扱いを実装する

## Issue 015: ファイルを仮想フォルダへ分類する

Labels: `type:feature`, `area:folder`, `type:storage`, `priority:high`

作業内容:

- `FileAssignment` を定義する
- ファイル分類処理を実装する
- 未分類へ戻す処理を実装する
- 分類結果を保存する
- ファイル一覧に所属フォルダ名を表示する

## Issue 016: 未分類一覧を表示する

Labels: `type:feature`, `type:ui`, `area:filter`, `priority:high`

作業内容:

- `ActiveFilter` に `uncategorized` を追加する
- 未分類件数を計算する
- 未分類だけを表示する
- 未分類に戻す操作を用意する

## Issue 017: ファイル名検索を実装する

Labels: `type:feature`, `type:ui`, `area:filter`, `priority:high`

作業内容:

- `SearchBox` を作成する
- 検索状態を `OrganizerApp` に持たせる
- `file-filter-service.ts` を作成する
- 大文字小文字を区別しない検索を実装する

## Issue 018: JSON出力形式とダウンロードを実装する

Labels: `type:feature`, `type:ui`, `area:export`, `priority:high`

作業内容:

- `ExportJson` 型を定義する
- JSON生成処理を実装する
- Blobを使ってダウンロードする
- 出力ファイル名を生成する
- Figmaファイル本文を含めない

## Issue 019: 初回案内を実装する

Labels: `type:ui`, `priority:high`

作業内容:

- `FirstRunNotice` を作成する
- 初回表示フラグをStorageに保存する
- 閉じる操作を実装する
- 仮想分類であることを説明する

受け入れ条件:

- 初回のみ案内が表示される
- Figma上の実ファイル移動、削除、権限変更を行わないことが表示される
- 閉じた状態が保存される

## 開発順序

```text
001 → 002 → 003 → 004 → 005 → 006 → 007 → 008 → 009 → 010 → 011 → 012 → 013 → 014 → 015 → 016 → 017 → 018 → 019
```
