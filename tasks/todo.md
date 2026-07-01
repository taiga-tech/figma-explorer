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
