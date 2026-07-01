# Figma Explorer 設計書

## 概要

Figma Drafts のファイル一覧を、Chrome 拡張機能で仮想的に整理するための設計書です。
実装は Plasmo、React、TypeScript、pnpm を前提にしています。

## 基本方針

- 初期版は Drafts の読み取り、仮想フォルダ分類、保存、検索、JSON 出力に絞る
- ラベル、命名規則チェック、複数選択、ドラッグ＆ドロップ、右クリックメニューは後続版へ移す
- Figma 上の実ファイル移動、削除、権限変更は行わない
- Figma DOM依存の処理は `src/features/scan` 配下に集約する
- Plasmo Storageは `area: "local"` を明示する
- 初期版では `world: "MAIN"` を使わない
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
│  ├─ data-model.md
│  ├─ ui-and-components.md
│  └─ state-management.md
├─ project/
│  └─ github-issues-v0.1.md
└─ reference/
   └─ references.md
```

## 文書一覧

| パス                                  | 内容                             |
| ------------------------------------- | -------------------------------- |
| `overview/requirements.md`            | 要件定義                         |
| `overview/user-stories.md`            | ユーザーストーリーと受け入れ条件 |
| `overview/scope-and-milestones.md`    | v0.1 の範囲と後続版              |
| `architecture/plasmo-architecture.md` | Plasmo 前提の構成                |
| `architecture/data-model.md`          | データモデル                     |
| `architecture/ui-and-components.md`   | 画面とコンポーネント             |
| `architecture/state-management.md`    | 状態管理                         |
| `project/github-issues-v0.1.md`       | v0.1 GitHub Issue 一覧           |
| `reference/references.md`             | 外部参照と設計への反映           |

## 運用ファイル

- GitHub Issue テンプレートの正本は `.github/ISSUE_TEMPLATE/task.md`
