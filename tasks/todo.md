# ドキュメント・テンプレート整理タスク

## 仕様

- `docs/` は役割別ディレクトリへ分割する
- 設計情報は保持し、履歴メモや重複テンプレートのような不要文書だけを削除する
- 削除対象は「他ファイルに内容が吸収済み」「運用上の正本が別にある」の両方を満たすものに限定する
- 既存内容の意味は変えず、見つけやすさと保守性を優先して整理する

## 実施計画

- [x] `docs/` と `.github/ISSUE_TEMPLATE/` の現状を確認する
- [x] 新しいディレクトリ構成を定義する
- [x] `docs/README.md` を新構成に合わせて書き直す
- [x] 要件・ストーリー・ロードマップを `docs/overview/` へ再配置する
- [x] 設計文書を `docs/architecture/` へ再配置する
- [x] Issue関連文書を `docs/project/` へ再配置する
- [x] 参照リンクを `docs/reference/` へ再配置する
- [x] `docs/01_review_and_revision.md` を削除する
- [x] `docs/10_issue_template.md` を削除する
- [x] 差分と最終構成を確認する

## レビュー

- `docs/` を `overview / architecture / project / reference` に分割した
- 履歴メモの `docs/01_review_and_revision.md` を削除した
- Issue テンプレートの重複をやめ、正本を `.github/ISSUE_TEMPLATE/task.md` に一本化した

## Issueテンプレート修正

### 仕様

- `.github/ISSUE_TEMPLATE/task.md` を GitHub Issue 用の正しい Markdown テンプレートとして修正する
- 記入ガイドは残すが、Markdown のコードブロック崩れや不整合は解消する
- タイトル形式、本文項目、記入例を 1 ファイルで完結させる

### 実施計画

- [x] 現在のテンプレート崩れを確認する
- [x] frontmatter を含めたテンプレート全体を修正する
- [x] 記入例のコードブロックと見出し構造を検証する

### レビュー

- frontmatter を GitHub Issue Template 向けの `name/about/title/labels/assignees` に修正した
- タイトル形式の案内をテンプレート本体へ戻した
- 壊れていたコードブロックを閉じ、記入例まで 1 ファイルで読める状態にした

## docs から GitHub Issue を起票する

### 仕様

- `docs/project/github-issues-v0.1.md` を起票内容の正本として扱う
- 既存 Issue と重複しないように確認してから作成する
- タイトル、ラベル、本文は `.github/ISSUE_TEMPLATE/task.md` の形式に合わせる
- 作成結果は `tasks/todo.md` に記録する

### 実施計画

- [x] `docs/project/github-issues-v0.1.md` と `.github/ISSUE_TEMPLATE/task.md` を確認する
- [x] 既存 Issue の有無を確認する
- [x] 起票対象のタイトル、ラベル、本文を整形する
- [x] GitHub に Issue を作成する
- [x] 作成結果を確認してレビューを追記する

### 進捗メモ

- GitHub 上の `taiga-tech/figma-explorer` には open / closed とも既存 Issue は 0 件だった
- `gh` で GitHub API へ接続し、docs 定義の 12 個のカスタムラベルを作成した
- `docs/project/github-issues-v0.1.md` を元に 19 件の Issue を起票した
- 並列起票したため、GitHub の Issue 番号は docs 上の列挙順とは一致しない

### レビュー

- `taiga-tech/figma-explorer` に v0.1 向け 19 Issue を起票した
- `type:*`, `area:*`, `priority:high` のカスタムラベルを GitHub 上に作成した
- Issue 本文は `docs/` と `.github/ISSUE_TEMPLATE/task.md` を参照して整形した

## AGENTS.md contributor guide 作成

### 仕様

- ルートに `AGENTS.md` が未作成であることを確認してから新規作成する
- 文書タイトルは `Repository Guidelines` とする
- 実在する構成、コマンド、整形規約、コミット傾向だけを書き、未整備のテストはそのまま明記する
- 200〜400 words 程度で短く保守しやすい contributor guide にする

### 実施計画

- [x] ルートの `AGENTS.md` の有無を確認する
- [x] `README.md` `package.json` `docs/` `.prettierrc.mjs` `git log` を確認する
- [x] リポジトリ固有の contributor guide を作成する
- [x] 文量と内容を確認する

### レビュー

- `AGENTS.md` を新規作成し、Plasmo 拡張の構成、主要 `pnpm` コマンド、Prettier 規約、現状の手動検証方針を整理した
- コミットメッセージ傾向は既存履歴に合わせて短い命令形として案内した
- セキュリティ注意点として現行の host permissions と `docs/architecture/` の参照先を明記した

## Issue 001: Plasmoプロジェクトを作成する

### 仕様

- `docs/project/github-issues-v0.1.md` の Issue 001 を実装対象とする
- 既存の Plasmo 初期生成物をこのリポジトリ向けの内容に更新する
- README に Chrome 向けの開発起動手順を明記する
- `pnpm dev` と `pnpm build` で開発・本番ビルドが通る状態を確認する

### 実施計画

- [x] Issue 001 の受け入れ条件と現状の差分を確認する
- [x] `git flow feature start issue-001-plasmo-project` でブランチを作成する
- [x] `README.md` をこの拡張向けの開発手順へ更新する
- [x] `package.json` と `popup.tsx` の初期プレースホルダを置き換える
- [x] `pnpm dev` と `pnpm build` を実行して確認する
- [x] レビューと検証結果を追記する

### レビュー

- `feature/issue-001-plasmo-project` を `git flow feature start` で作成した
- `README.md` を Figma Explorer 向けの開発手順へ更新し、`build/chrome-mv3-dev` の読み込み方法を明記した
- `package.json` の `name` `displayName` `description` と `popup.tsx` の初期文言を実プロジェクト向けへ置き換えた
- `pnpm build` で `build/chrome-mv3-prod` を生成し、`pnpm dev` で `build/chrome-mv3-dev` の生成を確認した
