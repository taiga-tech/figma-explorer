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

## Issue 006: ファイル名とURLを抽出する

### 仕様

- `docs/project/github-issues-v0.1.md` の Issue 006 を実装対象とする
- `src/features/scan/` 配下でファイルカード候補 DOM からファイル名と URL を抽出する
- 1 件のパース失敗で全体を止めず、失敗したカードだけをスキップできるようにする
- 抽出結果と失敗件数を仮パネルから確認できるようにし、後続 Issue の ID 生成処理へ渡しやすい形にする

### 実施計画

- [x] Issue 006 の受け入れ条件と既存 scan 構成を確認する
- [x] `git flow feature start issue-006-extract-file-name-url` でブランチを作成する
- [x] ファイル名と URL の抽出処理を実装し、仮パネルへ接続する
- [x] `pnpm build` で検証し、レビューと教訓を追記する

### レビュー

- `feature/issue-006-extract-file-name-url` を `git flow feature start` で作成した
- `src/features/scan/extract-file-card-metadata.ts` を追加し、候補カード DOM からファイル名と URL を抽出する処理を `scan` 機能配下へ閉じ込めた
- `aria-label`、`title`、`data-tooltip`、`innerText` を段階的に見て名前候補を組み立て、更新日時らしい文字列や URL 自体は除外するようにした
- URL や名前を取れなかったカードは全体失敗にせず `skippedCount` として集計し、1 件のパース失敗で一覧全体が止まらない形にした
- `src/figma-explorer/components/FigmaExplorerPanel.tsx` を更新し、抽出件数・スキップ件数・検出済みファイル一覧を仮パネル上で確認できるようにした
- `pnpm format` と `pnpm build` を実行し、Prettier 整形と `plasmo build` の成功を確認した
- `npx -y react-doctor@latest . --verbose --diff` を実行し、diff スキャンでは `No issues found!` を確認した
- 候補カード検出後も `名前または URL を抽出できませんでした` になったため、抽出対象の self 要素にも `data-card-main-action` や `href` が付くケースを拾えるように修正した
- ユーザー共有の Figma Drafts HTML を確認し、`button[data-card-main-action]` に `href` が出ないカードでは React 内部 props/fiber から `/file/...` などのルート断片を探すフォールバックを追加した
- 実機検証で `0 files extracted / 25 skipped` のまま失敗したため、ユーザー共有の Figma Drafts 生 DOM を再確認したところ、カード内に `a` 要素・`href`/`data-href`/`data-url` 系属性が一切存在しないことを確認した
- React fiber 探索が `link`（null）と外側の `listitem` 要素にしか行われておらず、実際のクリック領域である `actionRoot`（`button[data-card-main-action]`）自体の fiber を一度もスキャンしていなかったため、`resolveFileCardUrl` に `actionRoot` のスキャンを追加した
- fiber 探索の深度 4・ノード予算 250 では、ルート文字列を保持するラッパーコンポーネントまで届かない可能性があったため、深度 6・ノード予算 600・1 ノードあたりの走査件数 40 へ拡大した
- ルート文字列がラッパーコンポーネント側の props/state にある場合に対応するため、`return` ポインタ経由で祖先 fiber を最大 3 ホップまで辿って探索対象に加えた（`child`/`sibling`/`alternate` は他カードのデータ混入を避けるため引き続き除外）
- 一覧に出ていた `Sites` ファイルのアイコン種別に合わせて `FIGMA_ROUTE_FRAGMENT_PATTERN` へ `design` と `site` のルートセグメントを追加した
- `pnpm build` と `pnpm format` を実行し、ビルド成功と整形済みを確認した。Figma の React 内部構造への依存は本質的に脆いため、実機での再スキャン結果次第でさらなる調整が必要
- 実機でも `0 files extracted` のまま変化がなかったため、ユーザーに DevTools Console 上で fiber 祖先チェーンとルート文字列マッチを可視化する診断スクリプトを実行してもらった
- 診断結果から、実際のファイル URL は `button[data-card-main-action]` から祖先方向へ **11 ホップ** 上った fiber の `memoizedProps.tile.file.editUrl`（および `handoffUrl`）に存在することが判明した。直前の修正で追加した祖先探索は上限 3 ホップに抑えていたため、実データまで全く届いていなかった
- `MAX_FIBER_ANCESTOR_HOPS` を 3 → 16（安全マージン込み）、`MAX_ROUTE_SCAN_NODES` を 600 → 3000 に引き上げ、既存の正規表現ベースの探索がこの深さでも `editUrl`/`handoffUrl` にヒットできるようにした
- `pnpm build` を再実行し、ビルド成功を確認した。次は実機での再スキャンでファイル名・URL が正しく抽出されるかの確認待ち
- 実機で再度変化がなかったため、ユーザーに DevTools Console（main world で実行される）上で fiber 祖先チェーンを可視化する診断スクリプトを実行してもらった
- 診断結果から `button[data-card-main-action]` の 11 ホップ祖先の `memoizedProps.tile.file.editUrl` に実 URL が存在すると判明したが、ホップ上限を 16 へ広げても実機では改善しなかった
- 根本原因は「Chrome 拡張の content script は既定で isolated world で動くため、ページ本体（React）が DOM ノードへ付与した `__reactFiber$` / `__reactProps$` の expando プロパティ自体が見えない」ことだった。DevTools Console は既定で main world 実行のため、そこでは見えていただけで、ホップ数やノード予算をいくら調整しても isolated world からは原理的に届かない
- `src/features/scan/resolve-file-card-route-from-fiber.ts` に fiber 探索ロジックを切り出し、`src/features/scan/annotate-file-card-routes.ts` で候補カードへ解決済み URL を `data-figma-explorer-resolved-url` 属性として書き込む構成にした
- 新しい `src/contents/figma-file-route-bridge.ts` を `world: "MAIN"` の Plasmo content script として追加し、実際の fiber 探索は必ずページ本体と同じ JS world から実行されるようにした
- 仮想化された一覧で DOM ノードが使い回されても誤った URL を残さないよう、`annotate-file-card-routes.ts` は `data-index` が前回解決時と変わったら必ず再解決するキャッシュ判定を入れた
- `src/features/scan/extract-file-card-metadata.ts` から isolated world では原理的に成功しない fiber 探索コードを削除し、`data-figma-explorer-resolved-url` 属性を読むだけのシンプルな実装に置き換えた
- Plasmo は `world: "MAIN"` の content script を `manifest.json` の静的 `content_scripts` ではなく `chrome.scripting.registerContentScripts` による動的登録で実装しており、既存の `src/background.ts` の再注入ロジックは静的 `content_scripts` しか見ていなかったため、既に開いていたタブには新しい bridge script が注入されない不備があった。`chrome.scripting.getRegisteredContentScripts()` を使った再注入処理を追加して解消した
- `pnpm build` と `pnpm format` を実行し、ビルド成功と整形済みを確認した。次はユーザーに拡張機能の完全リロードと Figma タブの**フルリロード**（SPA 内遷移ではなく実ページ再読み込み）をしてもらい、再スキャン結果を確認してもらう
- ユーザーが実機で動作確認し、ファイル名・URL の抽出が正しく機能することを確認した
- 今回のセッションで新規作成していた `CLAUDE.md` は Issue 006 と無関係のため、コミットから除外した
- `git commit` で `feature/issue-006-extract-file-name-url` に `extract file name and url from Figma draft cards` としてまとめてコミットした

### Issue 006 の PR を作成する

#### 仕様

- `feature/issue-006-extract-file-name-url` から `develop` 向けの PR を作成する
- PR 本文の先頭に `Closes #<issue-number>` を入れて GitHub Issue と紐づける
- `gh` を使って PR を作成する

#### 実施計画

- [x] 対応 GitHub Issue 番号を確認する
- [x] ブランチを publish する
- [x] `gh` で draft PR を作成する

#### レビュー

- `gh issue list -R taiga-tech/figma-explorer --state all --limit 100 --json number,title` で Issue 006 の対応 GitHub Issue が `#5 [M2][scan] ファイル名とURLを抽出する` だと確認した
- `gh pr list --head feature/issue-006-extract-file-name-url` では既存 PR は 0 件だった
- `git push -u origin feature/issue-006-extract-file-name-url` でブランチを publish した
- `gh pr create --draft --base develop --head feature/issue-006-extract-file-name-url` で draft PR `#25` を作成した
- PR URL は `https://github.com/taiga-tech/figma-explorer/pull/25`、本文先頭には `Closes #5` を入れて Issue と紐づけた

### docs/ 配下の設計書を見直す

#### 仕様

- docs/ 配下の設計書と現在の実装（Issue 006 完了時点）の乖離を洗い出し、事実と異なる記述を更新する
- v0.1 の設計目標（未実装の OrganizerApp、フォルダ、Storage 等）は設計書として残し、実装済み範囲との区別を明確にする

#### 実施計画

- [x] docs/README.md の「`world: "MAIN"` を使わない」方針を実態に合わせて更新する
- [x] docs/architecture/plasmo-architecture.md の MAIN world 節をブリッジ構成の説明に書き換える
- [x] 同ファイルのディレクトリ構成と責務分割を現状＋今後の予定に整理する
- [x] docs/reference/references.md の entry 配置の記述を src/ 構成に合わせる
- [x] pnpm format を実行して整形する

#### レビュー

- docs 10 ファイルと `src/` 全実装を突き合わせ、事実と異なる記述は `world: "MAIN"` 方針・ディレクトリ構成・責務分割・Plasmo entry 配置の 4 点だった
- docs/README.md: 「初期版では `world: "MAIN"` を使わない」を、fiber からの URL 解決に限定して MAIN world bridge を使う現方針に更新した
- docs/architecture/plasmo-architecture.md: §3 を「MAIN worldの扱い」に書き換え、isolated world から `__reactFiber$` が見えない制約、bridge と isolated の分担、background.ts の動的登録再注入、仮想化リストの再解決を明文化した。§5 を「現状」と「今後追加予定」に分割し、§7 の責務分割に実装/予定の状態列を追加した
- docs/reference/references.md: entry を root 直下に置くという記述を、実際の src/ 構成（Plasmo の src ディレクトリ構成）に合わせて修正した
- data-model.md / state-management.md / ui-and-components.md / overview 配下は v0.1 の設計目標として実装と矛盾がないため変更しなかった（実装済みの DraftFile 型は draft-file.ts と一致することを確認済み）
- `pnpm format` を実行し、整形済みを確認した

### docs/ 設計書を改善版へ全面書き換えする

#### 仕様

- 改善方向は①堅牢性・保守性 ②データ設計強化 ③UX・機能充実の3点（ユーザー承認済みプラン: .claude/plans/compiled-roaming-torvalds.md）
- docs/ を 10 → 13 ファイルへ再編（scan-pipeline / error-handling / testing-strategy を新規追加）
- 実装コードは変更しない。型・契約の「正本」ルールと用語統一（schemaVersion 等）を導入する

#### 実施計画

- [x] Phase 1: error-handling.md / data-model.md / scan-pipeline.md / testing-strategy.md（正本の確定）
- [x] Phase 2: state-management.md / plasmo-architecture.md / ui-and-components.md
- [x] Phase 3: requirements.md / user-stories.md / scope-and-milestones.md
- [x] Phase 4: github-issues-v0.1.md / references.md / README.md
- [x] 検証: pnpm format、内部リンク・実装パス・セレクタ台帳の突合、git diff 確認

#### レビュー

- 承認済みプランどおり docs/ を 10 → 13 ファイルへ再編した。新規は
  architecture/scan-pipeline.md（二重 world 契約・セレクタ台帳・DOM 耐性戦略の正本）、
  architecture/error-handling.md（Result 型・OrganizerError・テレメトリの正本）、
  architecture/testing-strategy.md（Vitest + jsdom、DOM フィクスチャ、smoke 手順）の3本
- data-model.md に FileId 安定性保証（editUrl 由来 file key 第一候補、URL 正規化、hash fallback）と
  スキーマ移行（SCHEMA_VERSION、migration チェーン、3分岐）を新設し、stateVersion を schemaVersion へ統一した
- state-management.md で useSyncExternalStore + 手書きストアを正式採用として明文化し、
  Zustand 不採用理由と再検討条件、loadOrMigrate() を追記した
- ui-and-components.md に移行パス（FigmaExplorerPanel → OrganizerPanel の3段階）、
  a11y 設計、キーボード操作表、状態別表示マトリクス、ErrorBanner と kind の対応表を新設した
- overview/ は非機能要件の新設、US-013（キーボード操作）・US-014（データ非損失移行）の追加、
  マイルストーン M2.5（テスト・エラー処理基盤）の挿入と進捗スナップショットを反映した
- github-issues-v0.1.md にステータス表と Issue 020〜024（テスト基盤、Result 型、migration 基盤、
  キーボード/a11y、テレメトリ）を追加し、開発順序を基盤先行に再編した
- README.md に表記ルール（実装/予定ラベル、型定義の正本ファイル表、用語統一）を新設した
- 検証: pnpm format 済み、内部リンク切れ 0 件、docs 中の src パス参照は「予定」2件を除き実在、
  セレクタ台帳と src/features/scan の定数が一致、変更ファイルは docs/ と tasks/ のみ

### 基盤フェーズを実装する（Issue 020 → 021 → 007 → 022 → 010 → 011）

#### 仕様

- docs の開発順序に従い、基盤（テスト・Result・FileId・migration）から実装する
- 各 Issue ごとにコミットを分け、`pnpm test` と `pnpm build` を通す
- GitHub Issue 対応: 020=#26, 021=#30, 007=#8, 022=#27, 010=#7, 011=#11

#### 実施計画

- [x] Issue 020: Vitest + jsdom 導入、既存純関数の unit テスト、fixtures 雛形
- [x] Issue 021: `src/utils/result.ts`（Result / OrganizerError）+ テスト
- [x] Issue 007: `create-file-id.ts`（file key 抽出・正規化・hash fallback）+ テスト
- [x] Issue 010: `src/domain/` の状態型（SCHEMA_VERSION 含む）
- [x] Issue 022: migration 基盤（3分岐）+ テスト
- [x] Issue 011: Plasmo Storage Repository（loadOrMigrate / save / clear）
- [x] 検証: pnpm test / pnpm build / pnpm format
- [x] Issue 008: スキャン失敗と0件の区別（scan_dom_missing 分類、再スキャンボタン、エラーバナー）

#### レビュー

- ブランチ feature/v0.1-foundation に Issue ごとの7コミットを積んだ（テスト基盤 → Result 型 → FileId → 状態型 → migration → Storage → スキャンエラー区別）
- Issue 020（#26）: Vitest + jsdom を導入し `pnpm test` を追加。jsdom は innerText 未実装のため vitest.setup.ts で textContent ベースの polyfill を適用し、testing-strategy.md に既知の制約として追記した。README / AGENTS.md（CLAUDE.md の実体）のコマンド一覧も更新
- Issue 021（#30）: src/utils/result.ts に Result / ok / err / OrganizerError（kind 7種）を実装
- Issue 007（#8）: create-file-id.ts。file key 第一候補（8ルート対応）、タイトルスラッグ・クエリ不変の正規化、FNV-1a hash fallback、missing_url / unsupported_url の Result 形式
- Issue 010（#7）: src/domain/ に folder.ts と organizer-state.ts（SCHEMA_VERSION=1、PersistentState、RuntimeState、createInitialPersistentState）
- Issue 022（#27）: migrate-persistent-state.ts。ready / future_version / corrupted の3分岐を純関数で実装し、形状検証も実施
- Issue 011（#11）: organizer-storage.ts。backend 注入でテスト可能にし、loadOrMigrate（破損時はバックアップキーへ退避→初期化）、直列化された save、バックアップを残す clear を実装
- Issue 008（#10）: 検出エラーを scan_dom_missing へ分類する toOrganizerScanError、ストアの rescanFileCards、パネルのエラーバナー + 再スキャンボタンを実装
- 検証: pnpm test 45件パス、pnpm build 成功、pnpm format 済み
- 未実施: Issue 008 の UI 変更は実 Figma での smoke test が未実施（拡張再読み込み + 再スキャンボタンの動作確認が必要）。push / PR 作成は未実施

### 基盤フェーズの PR を作成する

#### 実施計画

- [x] feature/v0.1-foundation を origin へ publish する
- [x] gh で draft PR を作成する

#### レビュー

- `git push -u origin feature/v0.1-foundation` でブランチを publish した
- draft PR #31 を develop 向けに作成した（https://github.com/taiga-tech/figma-explorer/pull/31）
- 本文先頭に Closes #26 / #30 / #8 / #7 / #27 / #11 / #10 を記載し、7 Issue と紐づけた
- 検証チェックリストに「実 Figma での smoke test 未実施（#10 の UI）」をマージ前の要確認事項として明記した

### CI を作成する

#### 仕様

- GitHub Actions で pull request / push 時に `lint` `test` `build` を自動検証する
- `lint` は整形違反を検知するチェック専用コマンドとして定義し、既存の `format` は書き込み用途のまま残す
- Node / pnpm のセットアップは現在の repo に合わせて固定し、依存解決をキャッシュする
- 既存の workflow と衝突せず、CI 用 workflow は失敗箇所が分かりやすい job 名にする

#### 実施計画

- [x] 既存の package scripts と workflow 構成を確認する
- [x] `package.json` に CI 用の `lint` script を追加する
- [x] `.github/workflows/ci.yml` を追加して `lint` `test` `build` を実行する
- [x] workflow の構文とローカルの `pnpm lint` `pnpm test` `pnpm build` を確認する
- [x] レビューと教訓を追記する

#### レビュー

- `package.json` に `pnpm lint` を追加し、Prettier の check mode を CI 用の整形検証コマンドとして分離した
- `.github/workflows/ci.yml` を追加し、`push` / `pull_request` ごとに `lint` `test` `build` を matrix job で独立実行するようにした
- 依存セットアップは `pnpm/action-setup@v4` + `actions/setup-node@v4` + `pnpm install --frozen-lockfile` に統一した
- 既存の `.github/workflows/submit.yml` も同じ pnpm / Node 20 構成へ更新し、Node 16 と旧 action major 依存を解消した
- `AGENTS.md` `CLAUDE.md` `README.md` のコマンド案内を `lint` 追加後の実態に合わせて更新した
- 検証: `pnpm lint` 成功、`pnpm test` 45件成功、`pnpm build` 成功、`actionlint .github/workflows/*.yml` 成功

### ESLint を導入する

#### 仕様

- TypeScript / React / Vitest を含む現行 repo に ESLint を導入する
- `lint` は ESLint を中心に実行し、既存の Prettier 整形チェックも維持して CI からまとめて検証できるようにする
- browser / service worker / node / vitest の実行環境差分を config 側で吸収する
- 既存 CI とドキュメントのコマンド案内を ESLint 導入後の実態へ更新する

#### 実施計画

- [x] 現状の lint 運用と対象ファイルを確認する
- [x] ESLint 依存と `eslint.config.*` を追加する
- [x] `package.json` / CI / 案内文を ESLint 前提に更新する
- [x] `pnpm lint` `pnpm test` `pnpm build` `actionlint` を実行して確認する
- [x] レビューと教訓を追記する

#### レビュー

- `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `eslint-config-prettier` を devDependencies に追加した
- `eslint.config.mjs` を新設し、TypeScript 推奨ルール、React Hooks ルール、browser/service worker/webextensions globals、Node/Vitest 用 override を設定した
- `pnpm lint` は `pnpm lint:eslint && pnpm lint:format` に変更し、ESLint と Prettier の check をまとめて CI から実行できるようにした
- Plasmo の content script entry は `config` / `getStyle` の export が必要なため、`src/contents/**/*.tsx` では `react-refresh/only-export-components` を無効化して誤検知を避けた
- `AGENTS.md` `CLAUDE.md` `README.md` の `pnpm lint` 説明を ESLint 導入後の実態へ更新した
- 検証: `pnpm lint` 成功、`pnpm test` 45件成功、`pnpm build` 成功、`actionlint .github/workflows/*.yml` 成功

### Detected files 一覧をスクロール可能にする

#### 仕様

- `figma-explorer-panel__detected-files` が縦に溢れたとき、パネル全体ではなく一覧領域だけがスクロールする
- 既存の header / summary / next steps は固定されたままにし、余剰高さは Detected files セクションへ割り当てる
- 既存の未コミット CSS 差分を壊さず、必要最小限の構造変更で解決する

#### 実施計画

- [x] `FigmaExplorerPanel` と `figma-explorer.css` の該当レイアウトを確認する
- [x] Detected files セクションだけが伸縮するように class と CSS を調整する
- [x] `pnpm lint` と `pnpm build` で確認し、レビューと教訓を追記する

#### レビュー

- `src/figma-explorer/components/FigmaExplorerPanel.tsx` の Detected files セクションに専用 class を追加し、伸縮先を一覧セクションへ限定した
- `src/figma-explorer/styles/figma-explorer.css` では `.figma-explorer-panel__section` 全体を伸ばさず、`.figma-explorer-panel__section--detected-files` のみに `flex: 1` と `min-height: 0` を付与した
- `.figma-explorer-panel__detected-files` は `flex: 1` と `min-height: 0` を持つスクロール領域に変更し、ヘッダーや他セクションを固定したまま一覧だけが縦スクロールするようにした
- 検証: `pnpm lint` 成功、`pnpm build` 成功

### CI の Node と pnpm バージョンを更新する

#### 仕様

- GitHub Actions の CI / submit workflow で使う Node を `26` に更新する
- GitHub Actions の pnpm setup は `10` 系指定へ揃える
- 既存の action major や install 手順は維持しつつ、バージョン指定だけを今回の要件に合わせる

#### 実施計画

- [x] 現在の workflow 内の Node / pnpm 指定箇所を確認する
- [x] `ci.yml` と `submit.yml` の version 指定を `node 26` / `pnpm 10` に更新する
- [x] `actionlint` と差分確認を行い、レビューと教訓を追記する

#### レビュー

- `.github/workflows/ci.yml` の `actions/setup-node` を `node-version: 26` に更新した
- `.github/workflows/ci.yml` の `pnpm/action-setup` は patch 固定の `10.34.4` から major 指定の `10` に変更した
- `.github/workflows/submit.yml` も同様に `node-version: 26` と `pnpm version: 10` へ更新し、CI と submit の実行環境を揃えた
- 検証: `actionlint .github/workflows/*.yml` 成功

### Issue 009: OrganizerPanelの基本UIを実装する

#### 仕様

- `docs/project/github-issues-v0.1.md` の Issue 009 を実装対象とする
- 仮の `FigmaExplorerPanel` の表示責務を `OrganizerPanel` 系コンポーネントへ分割する
- 最低限 `OrganizerPanel` `PanelHeader` `FileList` `FileListItem` を作成する
- 一覧は現行のスキャン結果を使って描画し、取得件数を表示する
- `FileList` に `role="list"`、各項目に `role="listitem"` と `aria-selected` を付ける
- 既存の再スキャン導線と scan error / empty の表示は維持する

#### 実施計画

- [x] Issue 009 の受け入れ条件と現行パネル実装の差分を確認する
- [x] `git flow feature start issue-009-organizer-panel-basic-ui` でブランチを作成する
- [x] `OrganizerPanel` `PanelHeader` `FileList` `FileListItem` を実装する
- [x] `FigmaExplorerPanel` から新しい UI コンポーネントを利用するよう差し替える
- [x] 必要なスタイルとテストを追加する
- [x] `pnpm lint` `pnpm test` `pnpm build` を実行して確認する
- [x] レビューと教訓を追記する

#### レビュー

- `feature/issue-009-organizer-panel-basic-ui` を `git flow feature start` で作成した
- `src/figma-explorer/components/OrganizerPanel.tsx` `PanelHeader.tsx` `FileList.tsx` `FileListItem.tsx` を追加し、仮パネルの表示責務を分割した
- `src/figma-explorer/components/FigmaExplorerPanel.tsx` はスキャン結果を `OrganizerPanel` へ渡すコンテナに寄せ、`createFileId()` で選択可能な一覧 ID を安定化した
- `FileList` に `role="list"`、各 `FileListItem` に `role="listitem"` と `aria-selected` を付け、一覧項目へ明示的な「開く」導線を追加した
- `src/figma-explorer/styles/figma-explorer.css` を更新し、件数カード、選択状態、一覧レイアウトを OrganizerPanel 向けに調整した
- `src/figma-explorer/components/*.test.tsx` を追加し、一覧の role / selected 状態と OrganizerPanel の summary / error banner を検証した
- component test のため `tsconfig.json` に `jsx: react-jsx` を追加し、Vitest から `.tsx` コンポーネントを正しく import できるようにした
- `package.json` に `pnpm typecheck` を追加し、README / AGENTS / architecture docs のコマンド一覧も更新した
- 検証: `pnpm lint` 成功、`pnpm typecheck` 成功、`pnpm test` 49件成功、`pnpm build` 成功
- 未実施: 実 Figma Drafts 上での smoke test は未実施。拡張再読み込み後に一覧選択・`開く` リンク・再スキャン導線の目視確認が必要

### Issue 009 の PR を作成する

#### 実施計画

- [x] PR 対象ファイルを確認し、無関係な差分を除外する
- [x] Issue 009 の変更をコミットして branch を push する
- [x] `gh` で `develop` 向け PR を作成する

#### レビュー

- PR #32 を作成し、`develop` へマージ済み（2026-07-04 の Merge pull request #32 で確認）

## Issue 012: 仮想フォルダ型とサービスを実装する

### 仕様

- `docs/project/github-issues-v0.1.md` の Issue 012（GitHub #12）を実装対象とする
- `VirtualFolder` / `FolderTreeNode` は Issue 010 で `src/domain/folder.ts` に定義済みのため流用する
- `src/features/folders/folder-tree-service.ts` に folderTree の純関数ヘルパーを実装する
- `src/features/folders/folder-service.ts` にフォルダ作成・名前変更・削除を Result 形式で実装する
- 削除はシステムフォルダを対象外にし、配下サブツリーの削除と該当 assignments の `folderId: null` 化を行う（state-management.md §9）
- 最大5階層・循環・重複配置の制約チェックは Issue 014 の対象なので今回は実装しない

### 実施計画

- [x] `git flow feature start issue-012-virtual-folder-service` でブランチを作成する
- [x] `folder-tree-service.ts`（挿入・削除・探索・子孫収集）を実装する
- [x] `folder-service.ts`（createFolder / renameFolder / deleteFolder）を実装する
- [x] 各サービスの unit テストを追加する
- [x] `pnpm lint` `pnpm typecheck` `pnpm test` `pnpm build` で検証する
- [x] レビューと教訓を追記する

### レビュー

- `src/features/folders/folder-tree-service.ts` に folderTree の純関数ヘルパー（作成・探索・挿入・サブツリー削除・ID収集）を実装した。すべて元のツリーを変更しない immutable 実装にした
- `src/features/folders/folder-service.ts` に `createFolder` / `renameFolder` / `deleteFolder` を `Result<_, FolderOperationError>` 形式で実装した（error-handling.md の「features サービスは Result 必須」に準拠）
- `createFolder` は名前 trim・空名エラー・親存在チェック・同一親内の末尾 `sortOrder` 採番を行い、`createId` / `now` を注入可能にしてテストを決定的にした
- `deleteFolder` は `parentId` 連鎖から子孫を収集してサブツリーごと削除し、該当 assignments を `folderId: null`（未分類）へ戻す state-management.md §9 の流れを実装した。`isSystem` フォルダは `system_folder_not_deletable` で拒否する
- 最大5階層・循環・重複配置チェックは Issue 014 のスコープとして未実装のまま残した
- unit テスト 24 件を追加し、`pnpm lint` / `pnpm typecheck` / `pnpm test`（73件） / `pnpm build` の成功を確認した
- 教訓: この repo の tsconfig では `!result.ok` による判別 union の絞り込みが効かないため、既存コード同様 `result.ok === false` を使う

## Issue 014: フォルダ階層の制約処理を実装する

### 仕様

- `docs/project/github-issues-v0.1.md` の Issue 014（GitHub #16）を実装対象とする
- Issue 012 と同じ `feature/issue-012-virtual-folder-service` ブランチで、`folder-service.ts` への追記として実装する
- `MAX_FOLDER_DEPTH = 5` を `src/domain/folder.ts` に定義し、作成・移動時に超過を防ぐ（data-model.md §5）
- 循環参照チェックの前提となる `moveFolder`（parentId 変更）を追加し、自分自身・子孫への移動を拒否する
- 同一フォルダの重複配置は「作成時の ID 重複チェック」と「移動時の remove → insert」で構造的に防ぐ
- フォルダ削除時の扱いは Issue 012 の `deleteFolder` で定義済み（サブツリー削除 + 未分類化）

### 実施計画

- [x] `MAX_FOLDER_DEPTH` と深さ・サブツリー高さの算出ヘルパーを実装する
- [x] `createFolder` に深さ制限と ID 重複チェックを追加する
- [x] `moveFolder` を実装する（循環・深さ・重複配置の制約込み）
- [x] 制約ケースの unit テストを追加する
- [x] `pnpm lint` `pnpm typecheck` `pnpm test` `pnpm build` で検証する

### レビュー

- `src/domain/folder.ts` に `MAX_FOLDER_DEPTH = 5` を追加した（data-model.md §5 の正本値）
- `folder-service.ts` に `folderDepth` / `folderSubtreeHeight` を追加した。どちらも visited 判定を持ち、破損データで parentId が循環していても無限ループしない
- `createFolder` は親の深さ +1 が 5 を超えると `max_depth_exceeded`、注入 ID が既存と衝突すると `duplicate_folder_id` を返すようにした
- `moveFolder` を追加した。自分自身・子孫への移動は `circular_reference`、移動先の深さ + サブツリー高さが 5 を超えると `max_depth_exceeded` で拒否する。ツリーは remove → insert の順で更新するため同一フォルダの重複配置は構造的に起きない
- フォルダ削除時の扱い（サブツリー削除・配下ファイルの未分類化・システムフォルダ除外）は Issue 012 の `deleteFolder` で定義済み
- 制約ケースのテスト 13 件を追加し、`pnpm lint` / `pnpm typecheck` / `pnpm test`（86件） / `pnpm build` の成功を確認した

## Issue 013: フォルダツリーUIを実装する

### 仕様

- `docs/project/github-issues-v0.1.md` の Issue 013（GitHub #17）を実装対象とする
- `FolderTree` / `FolderTreeItem` を既存コンポーネントと同じ `src/figma-explorer/components/` に作成する
- WAI-ARIA tree パターンに従い `role="tree"` / `role="treeitem"` / `aria-expanded` / `aria-selected` / `role="group"` を付与する（ui-and-components.md §6）
- フォルダ状態は organizer-storage（Issue 011）から復元し、作成・展開切替のたびに保存する `organizer-folders-store` を新設する
- 新規作成ボタンからインラインフォームを開き、選択中フォルダの配下（未選択ならルート）へ作成する
- 展開/折りたたみは `FolderTreeNode.expanded` を更新して永続化する
- キーボード操作の拡張は Issue 023 のスコープなので実装しない

### 実施計画

- [x] `folder-tree-service.ts` に展開状態の更新ヘルパーを追加する
- [x] `organizer-folders-store.ts` と `use-organizer-folders.ts` を実装する
- [x] `FolderTree.tsx` / `FolderTreeItem.tsx` を実装する
- [x] `OrganizerPanel` に Folders セクション（新規作成フォーム込み）を追加し、`FigmaExplorerPanel` から接続する
- [x] スタイルとテストを追加する
- [x] `pnpm lint` `pnpm typecheck` `pnpm test` `pnpm build` で検証する

### レビュー

- `folder-tree-service.ts` に `setFolderTreeNodeExpanded` を追加し、展開状態の更新も immutable な純関数に揃えた
- `organizer-folders-store.ts` を新設し、購読開始時に organizer-storage の `loadOrMigrate` で復元する。レビュー修正後は作成・展開の mutation を最新 state へ排他適用し、外部更新を `watch` で同期する構成へ更新した（useSyncExternalStore 用の subscribe / getSnapshot、テスト用に storage 注入可能）
- 読み込み失敗は `status: "error"`、保存失敗・競合・破損退避の警告は `storageError` として snapshot に載せ、UI で日本語文言に変換して表示する。保存失敗時は未保存 mutation を保持して再試行できる
- `FolderTree` / `FolderTreeItem` を追加し、`role="tree"` / `role="treeitem"` / `role="group"` / `aria-expanded`（子を持つノードのみ） / `aria-selected` / `aria-level` を付与した
- `FolderSection` を追加し、新規作成ボタン → インラインフォーム → 選択中フォルダ配下（未選択ならルート）へ作成する導線を実装した。親配下へ作成したときは作成先までの祖先パスを自動展開する
- `FigmaExplorerPanel` にフォルダ選択状態（クリックで選択/解除）を持たせ、`OrganizerPanel` へ `folderSection` として接続した
- docs/architecture/plasmo-architecture.md の現状ディレクトリと責務分割表を Issue 013 完了時点へ更新した
- テスト 11 件を追加（tree サービス 2、FolderTree 3、フォルダストア 6）し、`pnpm lint` / `pnpm typecheck` / `pnpm test`（97件） / `pnpm build` の成功を確認した
- 未実施: 実 Figma Drafts 上での smoke test（フォルダ作成 → リロード後の復元、展開状態の永続化、Figma 本体 UI との干渉確認）

## Issue 012〜014 レビュー指摘を修正する

### 仕様

- 複数の Figma タブから同じ永続状態を更新しても、古い `PersistentState` の全体保存で他タブの変更を消さない
- 永続状態の更新は、最新状態の読み込みから保存までを content-script 間で共有される単一の直列化境界内で行う
- 外部タブの保存結果を購読中ストアへ反映し、次の操作と表示が古い snapshot を使わないようにする
- 保存失敗時は未保存状態を保持して明示的に再試行できるようにし、最新状態の保存成功後は `storage_save_failed` を解消する
- 非表示の選択フォルダ配下へ作成した場合も、ルートから作成先までの祖先を展開して新規フォルダを表示する
- 既存保存データに循環した `parentId` があっても子孫収集を必ず終了させ、削除・移動で UI スレッドを停止させない
- 削除サブツリーに `isSystem` フォルダが1件でも含まれる場合は削除全体を拒否し、間接削除を防ぐ

### 実施計画

- [x] 現行 background / storage / store の境界を確認し、複数タブ更新を直列化する最小構成を決める
- [x] 2ストアの競合更新、保存失敗からの再試行、祖先展開の回帰テストを追加する
- [x] organizer storage / folders store を修正し、最新状態を基準に永続更新する
- [x] 循環済みデータと system folder を含むサブツリー削除の回帰テストを追加する
- [x] folder service の子孫収集と削除ガードを修正する
- [x] `pnpm lint` `pnpm typecheck` `pnpm test` `pnpm build` と React Doctor を実行する
- [x] 差分レビュー、結果記録、再発防止の教訓追記を行う

### レビュー

- organizer storage は全 state の `save` を廃止し、Web Lock
  `figma-explorer:organizer-state` 内で最新 state の load → mutation 適用 → save を
  完了する `update` API へ変更した。現行の書き込み元である Figma content script
  間で同時更新を直列化し、2ストアからの同時作成が両方残ることをテストした
- フォルダ作成は ID・時刻を固定し、展開切替は目標値を持つ冪等 mutation とした。
  再試行時も重複・再反転せず、より新しい `meta.updatedAt` を巻き戻さない
- organizer folders store は外部 storage watch を購読し、pending mutation を最新 state
  へ rebase する。load / watch / update の到着順は世代番号と revision で制御し、最後の
  React 購読解除時には storage listener も解除する
- 保存失敗時は optimistic state と pending mutation を保持し、UI の「再試行」から
  保存できる。成功時は `storage_save_failed` を解除し、最新 state へ適用不能な操作は
  `storage_update_conflict` として再試行可能な I/O 失敗から分離した
- 選択中フォルダ配下への作成では祖先パス全体を展開する。削除はサブツリー内の
  system folder をすべて検査し、parentId が循環した保存データの削除・移動も有限時間で
  終了するよう visited set と回帰テストを追加した
- storage clear の通知、旧版 migration 失敗の退避・初期化、再試行ボタンのクリックと
  live region の配置までテストし、関連 architecture docs とエラー文言を現行実装へ揃えた
- 検証: `pnpm lint`、`pnpm typecheck`、`pnpm test`（15ファイル・121件）、
  `pnpm build`、`git diff --check` 成功。React Doctor は 100 / 100（指摘なし）
- 未実施: 実 Figma Drafts 上での複数タブ smoke test。拡張機能を再読み込み後、2タブでの
  同時フォルダ作成・保存失敗時の再試行・リロード後の復元を目視確認する必要がある

## FigmaExplorerPanel の初回レンダークラッシュを修正する

### 仕様

- ファイルカード検出結果が `empty` または `error` で、抽出結果がまだ存在しない初回レンダーでもパネルを表示できる
- 抽出結果が存在しない状態では `files` / `skippedCount` を参照せず、検出状態に対応する summary と empty/error 表示を返す
- `success` 時の抽出件数・skip 件数表示と、既存のフォルダ表示・保存エラー表示は変更しない
- 実 Figma で発生した初期化順序をコンポーネントテストで再現し、同じ null 参照の再発を防ぐ

### 実施計画

- [x] コンソールスタックと `FigmaExplorerPanel` の初期化経路を照合し、null 参照箇所を特定する
- [x] `empty` の初回レンダーを再現する回帰テストを追加し、修正前に失敗を確認する
- [x] nullable な抽出結果を dependency 評価時に参照しないよう summary 算出を修正する
- [x] 関連テストと `pnpm lint` `pnpm typecheck` `pnpm test` `pnpm build` を実行する
- [x] React Doctor と差分レビューを実施し、レビュー結果と再発防止の教訓を追記する

### レビュー

- 原因は `empty` / `error` 時に `extractedFileCards` が `null` になる一方、
  `scanSummary` の `useMemo` dependency 配列が `.files.length` と
  `.skippedCount` を callback の status 分岐より先に無条件評価していたことだった
- dependency 側の2参照を optional chaining に変更し、正当な初期 `empty` / `error`
  snapshot を維持したままパネルをレンダーできるようにした
- `FigmaExplorerPanel.test.tsx` を追加し、`empty` snapshot の初回レンダーが修正前に
  同じ `Cannot read properties of null (reading 'files')` で失敗し、修正後に summary と
  empty message を表示することを確認した
- 検証: targeted test、`pnpm lint`、`pnpm typecheck`、`pnpm test`
  （16ファイル・122件）、`pnpm build`、`git diff --check` 成功。React Doctor は
  100 / 100（指摘なし）
- 未実施: in-app browser が利用できなかったため、修正版を読み込んだ実 Figma Drafts
  での目視 smoke test

## mise tasks を整理する

### 仕様

- `package.json` の主要スクリプトを `mise.toml` の task として一貫した名前で公開する
- 日常の開発・整形・検証・成果物生成を `mise run <task>` から実行できるようにする
- 一括検証用 task を用意し、必須の lint・型チェック・テスト・ビルドをまとめて実行できるようにする
- `AGENTS.md` のコマンド案内と完了前検証を mise task 基準へ変更する
- npm script は mise task の実装詳細として残し、処理の重複定義は避ける

### 実施計画

- [x] 現在の `mise.toml`、`package.json`、`AGENTS.md` とコマンド参照を確認する
- [x] `mise.toml` の task を整理し、説明と一括検証 task を追加する
- [x] `AGENTS.md` を mise task を使うワークフローへ更新する
- [x] task 一覧と主要な検証 task を実行する
- [x] 差分をレビューし、結果を記録する

### レビュー

- `mise.toml` に `dev` / `build` / `package` / `format` / `lint` /
  `typecheck` / `test` を揃え、`mise tasks ls` で説明付きの一覧を確認した
- `check` は各検証 task を lint → typecheck → test → build の順に呼び出し、並列
  task の失敗で他の検証結果が不明にならない構成にした
- `AGENTS.md` の通常コマンドを `mise run <task>` に統一し、PR 前の標準検証を
  `mise run check` とした
- 検証: `mise tasks ls`、`mise tasks info check`、`mise run check`、
  `git diff --check` 成功。テストは16ファイル・122件、Plasmo production build も成功した
- Plasmo build はサンドボックス内では `Operation not permitted` になったため、同じ
  `mise run check` を承認済みのサンドボックス外実行で再確認した
