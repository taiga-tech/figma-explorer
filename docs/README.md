# Figma Explorer 設計書

## 概要

Figma Drafts のファイル一覧を、Chrome 拡張機能で仮想的に整理するための設計書です。
実装は Plasmo、React、TypeScript、pnpm を前提にしています。

## 基本方針

- 初期版は Drafts の読み取り、仮想フォルダ分類、保存、検索、JSON 出力に絞る
- ラベル、命名規則チェック、複数選択、ドラッグ＆ドロップ、右クリックメニューは後続版へ移す
- Figma 上の実ファイル移動、削除、権限変更は行わない
- Figma DOM依存の処理は `src/features/scan` 配下に集約する
- 二重 world 契約（MAIN world bridge と isolated world の分担）は
  `architecture/scan-pipeline.md` を正本とする
- サービス層のエラー処理は Result 型で統一する（`architecture/error-handling.md`）
- 保存データはスキーマバージョンを持ち、移行でユーザーデータを失わない
- テストは `architecture/testing-strategy.md` に準拠する
- Plasmo Storageは `area: "local"` を明示する
- `world: "MAIN"` は React Fiber からのファイル URL 解決（bridge script）に限定し、Storage 等の Chrome Extensions API は isolated world 側でのみ使う
- スキャンで得たファイル一覧と、保存する分類情報を分離する

## ディレクトリ構成

```text
docs/
├─ overview/
│  ├─ requirements.md
│  ├─ user-stories.md
│  └─ scope-and-milestones.md
├─ architecture/
│  ├─ plasmo-architecture.md
│  ├─ scan-pipeline.md
│  ├─ data-model.md
│  ├─ state-management.md
│  ├─ error-handling.md
│  ├─ ui-and-components.md
│  └─ testing-strategy.md
├─ project/
│  └─ github-issues-v0.1.md
└─ reference/
   └─ references.md
```

## 文書一覧

| パス                                  | 内容                                   |
| ------------------------------------- | -------------------------------------- |
| `overview/requirements.md`            | 要件定義（非機能要件を含む）           |
| `overview/user-stories.md`            | ユーザーストーリーと受け入れ条件       |
| `overview/scope-and-milestones.md`    | v0.1 の範囲、進捗、後続版              |
| `architecture/plasmo-architecture.md` | Plasmo 前提の構成と責務分割            |
| `architecture/scan-pipeline.md`       | スキャンパイプラインと二重 world 契約  |
| `architecture/data-model.md`          | データモデルとスキーマ移行             |
| `architecture/state-management.md`    | 状態管理とストアパターン               |
| `architecture/error-handling.md`      | Result 型・エラー分類・テレメトリ      |
| `architecture/ui-and-components.md`   | 画面、コンポーネント、a11y、キーボード |
| `architecture/testing-strategy.md`    | テスト戦略とフィクスチャ運用           |
| `project/github-issues-v0.1.md`       | v0.1 GitHub Issue 一覧とステータス     |
| `reference/references.md`             | 外部参照と設計への反映                 |

## 表記ルール

- 実装済みの内容には「実装」「実装済み」、未実装の設計目標には「予定」を
  明記し、実装と設計目標を混同しない
- 型定義・契約・セレクタは下表の正本ファイルにのみ記述し、
  他文書は相対リンクで参照する

| 概念                           | 正本                             |
| ------------------------------ | -------------------------------- |
| Result 型 / OrganizerError     | `architecture/error-handling.md` |
| PersistentState / スキーマ移行 | `architecture/data-model.md`     |
| セレクタ台帳 / bridge 属性名   | `architecture/scan-pipeline.md`  |

- 用語は `schemaVersion`（`stateVersion` は廃止）、「空状態」「部分失敗」
  「bridge」「二重 world 契約」で統一する

## 運用ファイル

- GitHub Issue テンプレートの正本は `.github/ISSUE_TEMPLATE/task.md`
- タスク計画とレビューは `tasks/todo.md`、教訓は `tasks/lessons.md`
