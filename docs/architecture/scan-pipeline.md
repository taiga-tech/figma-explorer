# スキャンパイプラインと二重 world 契約

本書は Figma DOM・React Fiber アクセスの source of truth である。
セレクタ・bridge 属性名の正本もここに置く。
Figma の画面構造や内部実装に依存する変更は、必ず本書を先に更新する。

## 1. 目的と位置づけ

Figma Drafts 画面からファイルカードを検出し、ファイル名と URL を抽出して
`DraftFile[]` を得るまでの処理系を定義する。この処理系は Figma の
DOM 構造と React 内部（fiber）に依存する唯一の領域であり、
壊れやすさを前提に「多段フォールバック」「部分失敗の計数」「失敗の可視化」を
設計原則とする。

## 2. パイプライン全体像

```text
[isolated world]                       [MAIN world]
detect-drafts-page(href)               figma-file-route-bridge.ts
  ↓ Drafts 画面のみ続行                  ↓ MutationObserver + rAF
detect-file-card-elements()            annotate-file-card-routes()
  ↓ success / empty / error              ↓ fiber から URL 解決
  ↓                                      ↓ data-figma-explorer-resolved-url
extract-file-card-metadata()  ←── DOM 属性経由で受け取る ──┘
  ↓ { files, skippedCount, totalCount }
create-file-id()（予定）
  ↓
DraftFile[]
```

| 段階                       | world    | 入力         | 出力                                | 状態 |
| -------------------------- | -------- | ------------ | ----------------------------------- | ---- |
| detect-drafts-page         | isolated | href         | boolean                             | 実装 |
| detect-file-card-elements  | isolated | document     | success / empty / error + elements  | 実装 |
| annotate-file-card-routes  | MAIN     | document     | カードへの解決済み URL 属性書き込み | 実装 |
| extract-file-card-metadata | isolated | elements     | files / skippedCount / totalCount   | 実装 |
| create-file-id             | isolated | 解決済み URL | `CreateFileIdResult`                | 予定 |

## 3. 二重 world 契約

Chrome の isolated world からは、ページ本体の React が DOM ノードへ付与する
`__reactFiber$` / `__reactProps$` の expando プロパティが見えない。
Figma のファイル URL は fiber の `memoizedProps.tile.file.editUrl` にしか
存在しないため（Issue 006 で確定）、fiber 探索は `world: "MAIN"` の
bridge script でのみ行い、結果は DOM 属性を介して isolated 側へ渡す。

### 3.1 契約の定義

| 役割     | script                                    | 許可される操作                                     |
| -------- | ----------------------------------------- | -------------------------------------------------- |
| MAIN     | `src/contents/figma-file-route-bridge.ts` | fiber 探索と、解決済み URL 属性の書き込み **のみ** |
| isolated | `src/contents/figma-explorer.tsx`         | 属性の読み取り **のみ**。fiber には触れない        |

### 3.2 属性の単一定義

| 定数                        | 値                                   | 定義場所                                         |
| --------------------------- | ------------------------------------ | ------------------------------------------------ |
| `FILE_CARD_ROUTE_ATTRIBUTE` | `data-figma-explorer-resolved-url`   | `src/features/scan/file-card-route-attribute.ts` |
| `RESOLVED_INDEX_ATTRIBUTE`  | `data-figma-explorer-resolved-index` | `src/features/scan/annotate-file-card-routes.ts` |

両 world とも属性名は必ず定数 import で参照し、文字列を直書きしない。

### 3.3 禁止事項

| world    | 禁止事項                                 | 理由                                      |
| -------- | ---------------------------------------- | ----------------------------------------- |
| MAIN     | `chrome.*` API・Plasmo Storage の使用    | MAIN world からは拡張 API に触れない      |
| MAIN     | URL 解決以外の状態保持・UI 操作          | 責務を最小にして Figma 本体への影響を防ぐ |
| isolated | `__reactFiber$` / `__reactProps$` の参照 | 原理的に見えないため、静かに失敗する      |
| isolated | bridge の実装詳細（fiber 構造）への依存  | 契約は属性のみとする                      |

### 3.4 属性のライフサイクル（仮想化リスト対策）

Figma の一覧は仮想化されており、同じ DOM ノードが別の行データへ
使い回される。`annotate-file-card-routes.ts` は次のキャッシュ判定を行う。

- `data-index` が前回解決時（`RESOLVED_INDEX_ATTRIBUTE`）と同じ間だけ
  解決済み URL を再利用する
- `data-index` が変化したら必ず fiber から再解決する
- 解決に失敗したら両属性を除去する（古い URL を残さない）

### 3.5 契約変更手順

bridge 側・isolated 側・本書の3点を必ず同一コミットで更新する。
属性名の変更は `file-card-route-attribute.ts` の定数変更のみで完結すること。

## 4. fiber 探索の設計

実装: `src/features/scan/resolve-file-card-route-from-fiber.ts`

- カードのアクション要素（`[data-card-main-action]`）から
  `__reactFiber$*` / `__reactProps$*` を起点に、fiber 祖先
  （`return` チェーン、最大 16 ホップ）を収集する
- 収集した値を BFS 探索し、Figma ルート形式
  （`/file|design|board|slides|buzz|make|proto|site/:key`）に一致する
  文字列を候補として返す
- 探索上限: 深さ 6、ノード数 3,000、ノードあたりエントリ 40。
  構造キー（`owner` / `return` / `child` / `sibling` / `alternate`）は
  値の探索対象から除外し、循環と爆発を防ぐ
- 上限値は「実データが 11 ホップ先にあった」実測に安全マージンを
  乗せたもの。変更する場合は本書の値も更新する

## 5. 注入と再注入

- Plasmo は `world: "MAIN"` の content script を静的な `content_scripts`
  ではなく `chrome.scripting.registerContentScripts` による動的登録で
  実装する
- そのため `src/background.ts` は拡張機能の更新時
  （`chrome.runtime.onInstalled`）に、静的 `content_scripts` と
  `chrome.scripting.getRegisteredContentScripts()` の結果の両方を、
  開いているタブへ再注入する
- 検証時は拡張機能の再読み込みに加えて Figma タブの
  フルリロードが必要（SPA 内遷移では bridge が入らない場合がある）

## 6. DOM 耐性戦略

### 6.1 セレクタ集約ポリシー

- Figma DOM に依存するセレクタは `src/features/scan/` 配下の各モジュール
  先頭に `readonly` 配列で集約し、モジュール外へ漏らさない
- 候補は配列順に評価する多段フォールバックとし、壊れにくい順
  （role・aria 属性 → data 属性 → 要素名）に並べる

### 6.2 現行セレクタ台帳

| 用途            | セレクタ・属性（評価順）                                            | 定義場所                      |
| --------------- | ------------------------------------------------------------------- | ----------------------------- |
| Drafts 画面判定 | hostname `www.figma.com` + パスに `drafts`                          | detect-drafts-page.ts         |
| surface root    | `[role='main']` → `main`                                            | detect-file-card-elements.ts  |
| list root       | `[role='list']`                                                     | detect-file-card-elements.ts  |
| ファイルカード  | `[role='listitem'][data-index]`                                     | detect-file-card-elements.ts  |
| アクション要素  | `[data-card-main-action]` → `a[href]`                               | extract-file-card-metadata.ts |
| URL 属性候補    | `href` → `data-href` → `data-url` → 解決済み属性                    | extract-file-card-metadata.ts |
| 名前 root       | `[role='group'][aria-label]` → `[aria-labelledby]`                  | extract-file-card-metadata.ts |
| 名前属性候補    | `aria-label` → `title` → `data-tooltip` → `img[alt]` → 可視テキスト | extract-file-card-metadata.ts |
| 名前の除外      | タイムスタンプ様文字列と URL 様文字列を除外                         | extract-file-card-metadata.ts |

### 6.3 失敗の可視化

- 検出は success / empty / error の三値
  （`DetectFileCardElementsResult`）。0件は空状態、構造欠落はエラー
- 抽出は `skippedCount` / `totalCount` で部分失敗を計数する
- 診断出力の書式と計測項目は
  [error-handling.md](./error-handling.md) の失敗テレメトリに従う

### 6.4 Figma UI 変更時の対応手順

症状から疑うモジュールを絞る:

| 症状                          | 疑う箇所                                      |
| ----------------------------- | --------------------------------------------- |
| パネル自体が出ない            | detect-drafts-page（URL 構造の変更）          |
| 「file card list not found」  | detect-file-card-elements（role 構造の変更）  |
| 0 files extracted / N skipped | bridge 未注入、または fiber 構造の変更        |
| 名前が取れて URL が取れない   | fiber の `editUrl` 位置、ルートパターンの変更 |
| URL が取れて名前が取れない    | 名前 root・属性候補の変更                     |
| 別ファイルの URL が表示される | 仮想化キャッシュ判定（`data-index`）の破綻    |

セレクタ更新チェックリスト:

1. DevTools Console（main world）で診断し、新しい構造を特定する
2. 該当モジュールのセレクタ配列へ候補を追加する（既存候補は残す）
3. 本書 §6.2 の台帳を更新する
4. `tests/fixtures/` の DOM フィクスチャを更新する
   （[testing-strategy.md](./testing-strategy.md)）
5. `pnpm build` + 実機 smoke test で確認する

## 7. 監視と再スキャン

- isolated 側: `file-card-detection-store.ts` が MutationObserver +
  `requestAnimationFrame` スロットリングで検出結果を更新し、
  status と件数が変わったときだけ購読者へ通知する
- MAIN 側: bridge が同様に MutationObserver + rAF で
  `annotateFileCardRoutes()` を再実行する。`focus` と
  `visibilitychange` でも再実行する

## 8. 既知の制約

- fiber 探索は Figma の React 内部実装に依存する。React の
  バージョンアップや Figma のリファクタで壊れる可能性を常に想定する
- 仮想化リストのため、画面外のファイルはスキャンできない。
  「表示中のファイルのみ取得できる」ことは仕様とする
- MAIN world の処理は自動テストできない（[testing-strategy.md](./testing-strategy.md)）

## 9. 関連文書

- [plasmo-architecture.md](./plasmo-architecture.md) — 全体構成と責務分割
- [error-handling.md](./error-handling.md) — 失敗の分類と計数
- [testing-strategy.md](./testing-strategy.md) — フィクスチャ運用と smoke test
- [data-model.md](./data-model.md) — DraftFile と FileId
