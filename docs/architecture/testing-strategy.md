# テスト戦略

本書はテスト方針の設計であり、基盤導入の実装は Issue 020 で行う
（[github-issues-v0.1.md](../project/github-issues-v0.1.md)）。

## 1. 方針

Figma DOM 依存部分の壊れやすさをテストで補う。ピラミッドは次の3層。

| 層          | 対象                       | 実行方法               |
| ----------- | -------------------------- | ---------------------- |
| unit        | 純関数（変換・判定・移行） | Vitest（自動）         |
| DOM fixture | DOM 読み取りロジック       | Vitest + jsdom（自動） |
| smoke       | 実 Figma 上の一連の動作    | 手動チェックリスト     |

- 新規のサービス関数・migration は unit テストを必須とする
- テストは対象モジュールと同階層に `*.test.ts` で併置する

## 2. ツール選定

- **Vitest + jsdom** を採用する
- 選定理由: TypeScript をそのまま実行でき、Plasmo のビルドと完全に独立して
  動かせる。jsdom は `querySelector` / `MutationObserver` 等、
  scan 層が使う DOM API を十分カバーする
- happy-dom は高速だが API 互換の穴があるため、実 Figma DOM の
  フィクスチャを扱う本プロジェクトでは jsdom を優先する
- 既知の制約: jsdom は `innerText` を実装していないため、
  `vitest.setup.ts` で `textContent` ベースの近似 polyfill を適用する。
  可視性（display/visibility）に依存するテストは書かない
- 実行コマンドは `pnpm test`（`vitest run`）とし、導入時に
  CLAUDE.md / README のコマンド一覧へ追記する

## 3. テスト対象マップ

| 対象                                      | 層          | 主な観点                                         |
| ----------------------------------------- | ----------- | ------------------------------------------------ |
| create-file-id（予定）                    | unit        | file key 抽出、URL 正規化、hash fallback、安定性 |
| extract-file-card-metadata                | unit + DOM  | 名前候補の優先順、タイムスタンプ除外、部分失敗   |
| detect-drafts-page                        | unit        | Drafts / 編集画面 / 他サイトの判定               |
| detect-file-card-elements                 | DOM fixture | success / empty / error の三値判定               |
| annotate-file-card-routes                 | DOM fixture | `data-index` 変化時の再解決、失敗時の属性除去    |
| migration チェーン（予定）                | unit        | 旧→新の変換、将来バージョン・破損の分岐          |
| folder / filter / export サービス（予定） | unit        | 循環禁止、階層上限、検索、ExportJson 形式        |
| resolve-file-card-route-from-fiber        | 対象外      | MAIN world 依存のため自動化不能（§5 で担保）     |

fiber 探索は jsdom 上で React 内部構造を再現できないため自動テストしない。
代わりに探索の入出力境界（ルートパターンの正規表現マッチ等）だけを
unit テストで押さえ、実機は手動 smoke で担保する。

## 4. DOM フィクスチャ運用

- 実 Figma Drafts の DOM をサニタイズして `tests/fixtures/` に
  HTML として保存し、DOM fixture テストの入力にする
- サニタイズ規則: ファイル名・URL の file key・サムネイル URL を
  ダミー値へ置換する。構造（role・data 属性・階層）は変えない
- 更新タイミング: Figma UI 変更でセレクタを直したとき
  （[scan-pipeline.md](./scan-pipeline.md) §6.4 のチェックリストと連動）
- フィクスチャには取得日と取得画面をコメントで記録する

## 5. 手動 smoke チェックリスト

リリース前・スキャン系変更後に実施する。

1. `pnpm build` が成功する
2. 拡張機能を再読み込みし、Figma タブをフルリロードする
3. Drafts 画面でパネルが表示され、編集画面では表示されない
4. 表示中のファイル数と「N files extracted」が一致し、skipped が 0 である
5. 一覧をスクロールしても別ファイルの URL が混ざらない（仮想化対策）
6. （storage 実装後）分類→再読み込みで分類が復元される

## 6. CI 方針

- v0.1 ではローカル実行を必須とする: `pnpm build` + `pnpm test`
- GitHub Actions での自動実行は v0.1 完了後に導入を検討する
  （導入時は本書と CLAUDE.md を更新する）

## 7. 関連文書

- [scan-pipeline.md](./scan-pipeline.md) — フィクスチャ更新の起点
- [error-handling.md](./error-handling.md) — 部分失敗の計数仕様
- [data-model.md](./data-model.md) — migration のテスト観点
