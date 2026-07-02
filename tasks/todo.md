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

## Issue 002: Content Scripts UIの入口を作成する

### 仕様

- `docs/project/github-issues-v0.1.md` の Issue 002 を実装対象とする
- `contents/figma-explorer.tsx` と `contents/figma-explorer.css` を追加する
- `https://www.figma.com/*` でのみ content script を読み込み、Drafts 画面だけに仮の右側固定パネルを表示する
- Drafts 判定は暫定的に URL の host と path を使って行い、後続 Issue の判定処理へ差し替えやすい形にする
- Figma 標準 UI を塞がないように、非パネル領域では pointer events を透過させる

### 実施計画

- [x] Issue 002 の受け入れ条件と現在の Plasmo 構成を確認する
- [x] `contents/figma-explorer.tsx` と `contents/figma-explorer.css` を実装する
- [x] `pnpm build` を実行し、content script のビルドと manifest 出力を確認する
- [x] レビュー結果と必要な教訓を追記する

### レビュー

- `feature/issue-002-content-scripts-ui-entry` を `git flow feature start` で作成した
- `contents/figma-explorer.tsx` に `https://www.figma.com/*` 向けの Plasmo content script を追加した
- Drafts 判定は暫定的に `www.figma.com` かつ `pathname` に `/drafts` を含むかで行い、Figma の SPA 遷移へ追従するため URL 変化を監視するようにした
- `contents/figma-explorer.css` で右側固定の仮パネルを追加し、全画面ラッパーは `pointer-events: none`、実パネルのみ `pointer-events: auto` にして Figma 標準 UI を塞がないようにした
- 既存 UI に被る不具合に対して、`contents/figma-explorer.tsx` で Drafts 表示中だけ `html` と `body` に右余白を適用し、Figma 側の描画領域を先に縮めるよう修正した
- 右領域が広すぎる不具合に対して、余白適用を `body` の `padding-right` のみに絞り、過剰に横幅を縮めないよう修正した
- `useEffect` を廃止し、URL 監視とページ余白制御を React コンポーネント外の監視ロジックへ移して `useSyncExternalStore` で購読する構成に変更した
- source root を `src/` に切り替え、entry を `src/popup.tsx` と `src/contents/figma-explorer.tsx` へ移し、補助ロジックを `src/figma-explorer/` 配下へ責務分割した
- Plasmo の制約に合わせて、`config.matches` は literal のまま残し、CSS は `src/contents/` の外へ移した
- Drafts 判定を path segment ベースに厳密化し、`/drafts` 配下だけを対象にするよう修正した
- Plasmo entry の export をより素朴な形に寄せ、`pnpm build --verbose` で出ていた parser 起因の内部エラーを解消した
- 2026-07-01 時点で Chrome 上の手動確認を行い、Drafts 表示、`/file/...` 非表示、Figma 以外での非動作、既存 UI のクリック非阻害を確認した
- `pnpm format` と `pnpm build --verbose` を実行し、content script のビルド成功を確認した
- `react-doctor` は実行を試したが、この環境では応答が返らず中断した

## Issue 003: Drafts画面判定処理を実装する

### 仕様

- `docs/project/github-issues-v0.1.md` の Issue 003 を実装対象とする
- `src/features/scan/detect-drafts-page.ts` を追加し、Drafts 判定を専用モジュールへ切り出す
- `www.figma.com` のみを対象にし、path segment ベースで `/drafts` 配下だけを `true` にする
- content script UI と URL 監視側の両方から同じ判定処理を呼ぶ

### 実施計画

- [x] Issue 003 の要件と既存の判定ロジック配置を確認する
- [x] `git flow feature start issue-003-detect-drafts-page` でブランチを作成する
- [x] `src/features/scan/detect-drafts-page.ts` を実装する
- [x] 既存の参照箇所を新しい判定処理へ差し替える
- [x] `pnpm build` でビルド確認し、レビューと教訓を追記する

### レビュー

- `feature/issue-003-detect-drafts-page` を `git flow feature start` で作成した
- Drafts 判定を `src/features/scan/detect-drafts-page.ts` へ切り出し、`www.figma.com` かつ path segment に `drafts` を含む場合だけ `true` を返すようにした
- `src/contents/figma-explorer.tsx` と `src/figma-explorer/stores/href-store.ts` の両方を新しい判定処理へ差し替え、UI 表示とページ余白制御で同じ条件を共有するようにした
- 役割が重複した `src/figma-explorer/utils/is-drafts-page.ts` は削除した
- `pnpm build` を実行し、`plasmo build` の成功を確認した
- `.serena/project.yml` は今回の Issue と無関係のため PR には含めない

## GitHub Issue 現状確認

### 仕様

- `taiga-tech/figma-explorer` の GitHub Issue の現状を確認する
- `docs/project/github-issues-v0.1.md` の起票計画と GitHub 上の状態を突き合わせる
- open / closed の件数と、直近で着手済みの Issue を把握する

### 実施計画

- [x] 対象リポジトリと Issue 関連ドキュメントを確認する
- [x] `tasks/todo.md` に確認タスクの計画を追記する
- [x] GitHub 上の Issue 一覧を取得する
- [x] open / closed の状況を整理してレビューを追記する

### レビュー

- `gh issue list -R taiga-tech/figma-explorer --state all --limit 100 --json number,title,state,labels,createdAt,closedAt,url` で 19 件の Issue を確認した
- 2026-07-02 時点で closed は `#1 [M1][setup] Plasmoプロジェクトを作成する` と `#6 [M1][plasmo] Content Scripts UIの入口を作成する` の 2 件、open は 17 件だった
- `docs/project/github-issues-v0.1.md` の起票計画数 19 件と GitHub 上の Issue 数は一致していた
- `docs/project/github-issues-v0.1.md` の `開発順序` は `001 → 002 → 003 ...` なので、次に着手すべき Issue は `#4 [M1][scan] Drafts画面判定処理を実装する` だった
- `#14 [M1][ui] 初回案内を実装する` も M1 ラベル相当だが、開始順序の基準はマイルストーン名ではなく docs に明記された連番順とする

## Issue 003 の PR を作成する

### 仕様

- `feature/issue-003-detect-drafts-page` から `develop` 向けの PR を作成する
- PR 本文の先頭に `Closes #4` を入れて GitHub Issue と紐づける
- 未コミットの `.serena/project.yml` と `tasks/todo.md` も今回の PR に含める
- 既存 PR の重複がないことを確認してから draft PR を作成する

### 実施計画

- [x] 現在のブランチ、対応 Issue、既存 PR の有無を確認する
- [x] PR タイトルと本文を整えて draft PR を作成する
- [x] 作成結果を確認してレビューを追記する

### レビュー

- `feature/issue-003-detect-drafts-page` が `origin/feature/issue-003-detect-drafts-page` に push 済みで、`develop` に対する差分が `implement drafts page detection` の 1 コミットであることを確認した
- `gh issue list -R taiga-tech/figma-explorer --state all --limit 100 --json number,title` で Issue 003 の対応 GitHub Issue が `#4 [M1][scan] Drafts画面判定処理を実装する` だと確認した
- `gh pr list --head feature/issue-003-detect-drafts-page --json number,title,state,isDraft,url` では既存 PR は 0 件だった
- `gh pr create --draft --base develop --head feature/issue-003-detect-drafts-page` で draft PR `#22` を作成した
- PR URL は `https://github.com/taiga-tech/figma-explorer/pull/22`、本文先頭には `Closes #4` を入れて Issue と紐づけた
- ユーザー指示に合わせて、PR 作成後に未コミットだった `.serena/project.yml` と `tasks/todo.md` も追加で含める

## actionlint を修正する

### 仕様

- `.github/workflows/submit.yml` の `actionlint` エラーを解消する
- 古い runner を要求する GitHub Action を、現行の GitHub Actions runner で動く版へ更新する
- 既存の submit workflow の処理順や目的は変えない

### 実施計画

- [x] `actionlint` を実行して失敗箇所を特定する
- [x] 対象 workflow を最小変更で修正する
- [x] `actionlint` を再実行して解消を確認し、レビューを追記する

### レビュー

- `actionlint .github/workflows/submit.yml` で `actions/checkout@v3` と `actions/cache@v3` が古い runner を要求すると指摘された
- `.github/workflows/submit.yml` の該当 2 箇所を `@v4` へ更新し、workflow の処理順や artifact 設定は変えなかった
- 修正後に `actionlint .github/workflows/submit.yml` を再実行し、エラーが 0 件になった

## Figma Drafts パネルの再注入と遷移追従を修正する

### 仕様

- 拡張機能を再読み込みした直後でも、既に開いている `https://www.figma.com/*` タブへ整理パネルを再注入できるようにする
- Figma の SPA 遷移で Drafts 画面から別画面へ移動したとき、整理パネルとページ右余白をすぐに外す
- 既存の Drafts 判定ロジックは流用し、表示条件そのものは変えない
- 権限追加は必要最小限に留める

### 実施計画

- [x] 既存タブ再注入の経路を追加する
- [x] URL 監視を強化して非 Drafts 遷移時の追従漏れを解消する
- [x] `pnpm build` でビルド確認し、レビューと教訓を追記する

### レビュー

- `src/background.ts` を追加し、拡張機能の再読み込み時に manifest の `content_scripts` 設定を使って、既に開いている `https://www.figma.com/*` タブへ再注入するようにした
- `package.json` の manifest に `scripting` 権限だけを追加し、既存タブへの再注入に必要な権限を最小限で付与した
- `src/figma-explorer/stores/href-store.ts` で初期同期を強制実行するようにし、`DOMContentLoaded` 時に `href` が変わっていなくても表示状態と右余白が同期されるようにした
- 同じ `href-store` で `history` patch に加えて `window.navigation`、`visibilitychange`、`focus`、DOM mutation を監視し、Figma の SPA 遷移でも Drafts 離脱時にパネルが消えるよう補強した
- `pnpm format` と `pnpm build` を実行し、`build/chrome-mv3-prod/manifest.json` に `background.service_worker`、`permissions: ["scripting"]`、既存 content script 定義が出力されることを確認した
- `react-doctor` は `npx -y react-doctor@latest . --verbose --diff` を試したが、この環境では応答が返らず中断した

## Issue 004: DraftFile型を定義する

### 仕様

- `docs/project/github-issues-v0.1.md` の Issue 004 を実装対象とする
- `src/features/scan/` 配下に `DraftFile`、`FigmaFileType`、`FileScanStatus` を定義する
- Figma ファイル本文の内容は含めず、Drafts 一覧から取得できるメタ情報だけを持つ
- 後続 Issue の DOM スキャン処理から import しやすい、責務が明確な型定義にする

### 実施計画

- [x] Issue 004 の受け入れ条件と既存データモデルを確認する
- [x] `git flow feature start issue-004-draft-file-types` でブランチを作成する
- [x] `DraftFile`、`FigmaFileType`、`FileScanStatus` を実装する
- [x] 既存 UI 文言や関連 import を必要最小限で更新する
- [x] `pnpm build` で検証し、レビューと教訓を追記する

### レビュー

- `feature/issue-004-draft-file-types` を `git flow feature start` で作成した
- `src/features/scan/draft-file.ts` を追加し、`DraftFile`、`FigmaFileType`、`FileScanStatus` を `scan` 機能配下へ集約した
- `DraftFile` には `id`、`name`、`url`、`type`、`updatedAtText`、`thumbnailUrl`、`firstSeenAt`、`lastSeenAt`、`scanStatus` を持たせ、Figma ファイル本文は含めない形に揃えた
- `FigmaFileType` は `design | figjam | slides | unknown`、`FileScanStatus` は `active | parse_error` として、後続の DOM 解析や失敗件数管理へ繋げやすい最小集合にした
- `src/figma-explorer/components/FigmaExplorerPanel.tsx` の Next steps を現状の進捗に合わせて更新した
- `pnpm build` を実行し、`plasmo build` の成功を確認した

## Issue 004 の PR を作成する

### 仕様

- `feature/issue-004-draft-file-types` から `develop` 向けの PR を作成する
- PR 本文の先頭に `Closes #9` を入れて GitHub Issue と紐づける
- `gh` を使って PR を作成する
- 作成結果は `tasks/todo.md` に記録する

### 実施計画

- [x] 現在のブランチ、対応 Issue、既存 PR の有無を確認する
- [x] 必要ならブランチを publish する
- [x] `gh` で PR を作成する
- [x] 作成結果を確認してレビューを追記する

### レビュー

- `gh issue list -R taiga-tech/figma-explorer --state all --limit 100 --json number,title` で Issue 004 の対応 GitHub Issue が `#9 [M2][domain] DraftFile型を定義する` だと確認した
- `gh pr list --head feature/issue-004-draft-file-types --json number,title,state,isDraft,url` では既存 PR は 0 件だった
- `git flow feature publish issue-004-draft-file-types` で `origin/feature/issue-004-draft-file-types` を作成した
- `gh pr create --draft --base develop --head feature/issue-004-draft-file-types` で draft PR `#23` を作成した
- PR URL は `https://github.com/taiga-tech/figma-explorer/pull/23`、本文先頭には `Closes #9` を入れて Issue と紐づけた

## Issue 005: ファイルカード候補DOMを検出する

### 仕様

- `docs/project/github-issues-v0.1.md` の Issue 005 を実装対象とする
- `src/features/scan/detect-file-card-elements.ts` を追加し、取得対象セレクタを `features/scan` に閉じ込める
- Drafts 画面のカード一覧 root を取得できない場合は `error`、取得できても候補が 0 件なら `empty`、候補があれば `success` を返す
- 既存の仮パネルから検出結果を確認できるようにし、後続 Issue のパース処理へ渡しやすい形にする

### 実施計画

- [x] Issue 005 の受け入れ条件と既存 scan 構成を確認する
- [x] `git flow feature start issue-005-detect-file-card-elements` でブランチを作成する
- [x] `detect-file-card-elements.ts` を実装し、仮パネルから結果を表示する
- [x] `pnpm build` で検証し、レビューと教訓を追記する

### レビュー

- `feature/issue-005-detect-file-card-elements` を `git flow feature start` で作成した
- `src/features/scan/detect-file-card-elements.ts` を追加し、Drafts 画面の surface root と一覧 root の取得、`[role='listitem'][data-index]` ベースの候補検出、重複除去を `scan` 機能配下へ閉じ込めた
- 戻り値は `success | empty | error` の union にし、カード一覧 root を取得できない場合だけ `error`、一覧 root は取れたが候補 0 件なら `empty` を返すようにして DOM 取得失敗と 0 件を区別した
- ユーザー提供の Figma DOM に合わせて、候補検出はリンク前提を捨てて `role=list` 配下の `role=listitem` を対象にする形へ修正し、後続 Issue でカード内部の `role=group`、`data-card-main-action`、名前・更新日時を辿れる要素配列にした
- `src/figma-explorer/components/FigmaExplorerPanel.tsx` から検出結果を表示するようにし、仮パネル上で候補件数または error 内容を確認できるようにした
- 初回描画時に Drafts DOM がまだ揃っていないと stale な error 表示が残るため、`src/figma-explorer/stores/file-card-detection-store.ts` と `useSyncExternalStore` ベースの hook を追加し、DOM mutation 後に検出結果が再評価されるよう修正した
- `pnpm format` と `pnpm build` を実行し、Prettier 整形と `plasmo build` の成功を確認した

## Issue 005 の PR を作成する

### 仕様

- `feature/issue-005-detect-file-card-elements` から `develop` 向けの PR を作成する
- PR 本文の先頭に `Closes #2` を入れて GitHub Issue と紐づける
- `gh` を使って PR を作成する
- 作成結果は `tasks/todo.md` に記録する

### 実施計画

- [x] 現在のブランチ、対応 Issue、既存 PR の有無を確認する
- [x] 必要ならブランチを publish する
- [x] `gh` で PR を作成する
- [x] 作成結果を確認してレビューを追記する

### レビュー

- `gh issue list -R taiga-tech/figma-explorer --state all --limit 100 --json number,title` で Issue 005 の対応 GitHub Issue が `#2 [M2][scan] ファイルカード候補DOMを検出する` だと確認した
- `gh pr list --head feature/issue-005-detect-file-card-elements --json number,title,state,isDraft,url` では既存 PR は 0 件だった
- `git flow feature publish issue-005-detect-file-card-elements` で `origin/feature/issue-005-detect-file-card-elements` を作成した
- `gh pr create --draft --base develop --head feature/issue-005-detect-file-card-elements` で draft PR `#24` を作成した
- PR URL は `https://github.com/taiga-tech/figma-explorer/pull/24`、本文先頭には `Closes #2` を入れて Issue と紐づけた
