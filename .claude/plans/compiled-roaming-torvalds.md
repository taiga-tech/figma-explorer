# docs/ 設計書の全面改善プラン

## Context

Issue 006 完了時点で、実装は設計書を超える知見を獲得した（二重 world 構成、fiber 探索、仮想化リスト対策、動的登録の再注入）。一方 docs/ は v0.1 初期構想のままで、堅牢性・データ移行・テスト・a11y の設計が存在しない。ユーザーの要望は「拡張機能をもっと良くするための改善した設計書への書き換え」で、方向性は 3 つすべて採用: ①堅牢性・保守性 ②データ設計強化 ③UX・機能充実。対象は docs/ 全体、v0.1 スコープの再定義も可。**実装コードは変更しない**（設計書のみ。実装は再編後の Issue で行う）。

## 改訂後のファイル構成（10 → 13 ファイル）

既存 10 ファイルは名前を変えず全て改訂。新規は 3 件に抑える。

```text
docs/
├─ README.md                      [改訂] 目次・方針・表記ルール（最後に更新）
├─ overview/
│  ├─ requirements.md             [改訂] 非機能要件を新設
│  ├─ user-stories.md             [改訂] US-011具体化、US-013/014追加
│  └─ scope-and-milestones.md     [改訂] 進捗スナップショット、M2.5挿入
├─ architecture/
│  ├─ plasmo-architecture.md      [改訂] scan詳細をscan-pipelineへ委譲し縮小
│  ├─ scan-pipeline.md            [新規] 二重world契約 + DOM耐性戦略（中核）
│  ├─ data-model.md               [改訂] schema migration、FileId安定性
│  ├─ state-management.md         [改訂] useSyncExternalStoreパターン正式採用
│  ├─ error-handling.md           [新規] Result型・エラー分類・テレメトリ
│  ├─ ui-and-components.md        [改訂] 移行パス・a11y・キーボード操作
│  └─ testing-strategy.md         [新規] Vitest + jsdom + DOMフィクスチャ
├─ project/
│  └─ github-issues-v0.1.md       [改訂] 001-006完了反映、020番台追加
└─ reference/
   └─ references.md               [追記] useSyncExternalStore、WAI-ARIA等
```

**型定義の「正本」ルール**（重複記述の排除。他文書は相対リンク参照のみ）:

| 概念                         | 正本              |
| ---------------------------- | ----------------- |
| Result 型 / OrganizerError   | error-handling.md |
| PersistentState / migration  | data-model.md     |
| セレクタ台帳 / bridge 属性名 | scan-pipeline.md  |

**用語統一**（着手前に確定）: `schemaVersion`（`stateVersion` 廃止）、「空状態」「部分失敗」「bridge」「二重 world 契約」。実装済み/予定の区別ラベルを全文書で使う。

## 各ファイルの改訂骨子

### scan-pipeline.md（新規・中核）

1. 目的: Figma DOM/fiber アクセスの source of truth 宣言
2. パイプライン全体像: detect-drafts-page → detect-file-card-elements → (bridge) annotate-file-card-routes → extract-file-card-metadata → create-file-id → DraftFile[]（ASCII 図 + 各段の入出力表）
3. 二重 world 契約（一級市民）: MAIN は `data-figma-explorer-resolved-url` 書き込みのみ / isolated は読み取りのみ。属性名の単一定義は `src/features/scan/file-card-route-attribute.ts`。禁止事項表（MAIN で chrome.\*/Storage 禁止、isolated で `__reactFiber$` 参照禁止）。仮想化リストの `data-index` 変化による再解決。契約変更時は bridge / isolated / 本書の3点同時更新
4. fiber 探索設計: BFS、ホップ/ノード上限、`memoizedProps.tile.file.editUrl`
5. 注入と再注入: Plasmo の動的登録制約、background.ts の二系統再注入
6. DOM 耐性戦略: セレクタ集約ポリシー、現行セレクタ台帳（表）、失敗の可視化（skippedCount / success・empty・error 三値）、Figma UI 変更時の診断表と対応チェックリスト
7. 監視と再スキャン: MutationObserver + rAF スロットリング
8. 既知の制約

### error-handling.md（新規）

1. 方針: 部分失敗で全体を止めない / 0件は空状態 / 失敗は必ず計数
2. Result 型定義（正本）と適用範囲（features/\* サービス・storage・FileId 生成。UI ハンドラは対象外）
3. OrganizerError の kind コード表（scan_dom_missing / scan_partial / storage_load_failed / storage_migration_failed / export_failed 等）
4. 層別ハンドリング表（scan: skip+計数 / storage: 退避→初期化 / UI: ErrorBanner）
5. 失敗テレメトリ（v0.1 はローカル console 診断のみ、外部送信なし）: skippedCount、URL 未解決件数、フォールバック段数
6. ユーザー向けエラー表示の原則

### testing-strategy.md（新規）

1. 方針: 実装は Issue 020。純関数 unit 中心 + DOM fixture + 手動 smoke のピラミッド
2. ツール: Vitest + jsdom（Plasmo ビルドと独立に実行）
3. テスト対象マップ: unit（create-file-id、extract-file-card-metadata、migration、folder/filter/export サービス）、DOM fixture（detect-file-card-elements、annotate のキャッシュ判定）、自動化不能（fiber 探索 → 手動 smoke）
4. フィクスチャ運用: サニタイズ済み実 Figma DOM を tests/fixtures/ に保存、更新手順は scan-pipeline の UI 変更対応手順と連動
5. 手動 smoke チェックリスト（CLAUDE.md の記述を正式化）
6. CI 方針（v0.1 はローカル必須: pnpm build + vitest run）

### data-model.md（改訂）

- §3 FileId 強化: 第一候補を「bridge 解決済み editUrl から file key 抽出」に変更。`/file|design|board|slides/:key` パターン表、URL 正規化規則、hash fallback、安定性保証条件。`CreateFileIdResult` を Result 型形式へ（error-handling.md 参照）
- 新設「スキーマバージョニングと移行」: `SCHEMA_VERSION` 定数、migration チェーン、3分岐（旧→順次移行+保存 / 未知の将来版→読み取り専用警告 / 破損→バックアップ退避後初期化）
- `stateVersion` → `schemaVersion` に統一

### state-management.md（改訂）

- 新設「実行時状態ストアの標準パターン」: `useSyncExternalStore` + 手書き外部ストア（file-card-detection-store.ts の実パターン）を正式採用。理由（依存ゼロ、React 外イベント接続、tearing 対策）と Zustand 不採用判断・再検討条件（ストア5個超等）を記録。ストア規約（subscribe/getSnapshot、rAF スロットリング、変化判定による通知抑制）
- §4 Repository: `loadOrMigrate()` を追加。スキーマ詳細は data-model.md 参照に置換
- フロー図は維持し「現行ストア（実装済）」と「OrganizerApp 統合後（予定）」を注記

### ui-and-components.md（改訂）

- 冒頭に「現状と移行パス」: 仮パネル FigmaExplorerPanel → OrganizerPanel の置換手順（引き継ぐ hooks/stores、廃棄物）を段階表で
- 新設「アクセシビリティ設計」: パネル `role="complementary"`、FolderTree は WAI-ARIA tree パターン、FileList は list/listitem + 選択状態
- 新設「キーボード操作」: キーマップ表（↑↓/Enter/F2/Escape）と Figma 本体ショートカット衝突回避規則（パネル内フォーカス時のみ handle）
- 新設「状態別表示マトリクス」: コンポーネント × loading/empty/error/success。ErrorBanner はエラー kind コードと対応付け

### plasmo-architecture.md（改訂・縮小）

- §3 は要旨 + 構成表のみ残し scan-pipeline.md へ委譲
- §5 予定構成に `utils/result.ts`（error-handling 参照）、`*.test.ts` 併置と `tests/fixtures/` を追記
- §7 責務分割表に「関連文書」列を追加

### overview/ 3 ファイル

- requirements.md: 「非機能要件」新設（DOM 変更耐性、データ非損失移行、キーボード/a11y、テスト可能性）。完成条件に migration 定義と unit テストを追加
- user-stories.md: US-011 の受け入れ条件を具体化。新規 US-013「キーボードだけで分類操作」、US-014「拡張更新後もデータが失われない」
- scope-and-milestones.md: 進捗スナップショット（M1・M2 完了 = Issue 001〜006）。M2 と M3 の間に「M2.5 テスト・エラー処理基盤」挿入。v0.1 に「テスト基盤 / Result 型 / schema migration / キーボード基本操作」を追加、a11y 完全対応は v0.2 へ

### github-issues-v0.1.md（改訂）

- 番号は振り直さない。冒頭にステータス表（001〜006 完了 / 007〜019 未着手 / 020〜追加）
- 007（FileId: editUrl 第一候補 + Result 形式）、008/010/011/009/013 を新設計へ追従修正
- 新規 Issue（`type:test` ラベル追加）: 020 テスト基盤導入、021 Result 型と OrganizerError、022 migration 基盤、023 キーボード操作と基本 a11y、024 スキャン失敗テレメトリ
- 開発順序: `020 → 021 → 007 → 008 → 022 → 010 → 011 → 009 → 012 → … → 023 → 024 → 019`

### README.md（最後）/ references.md（追記）

- README: 13 ファイル構成に更新、基本方針へ Result 統一・二重 world 契約・テスト準拠を追記、「表記ルール」新設（実装/予定ラベル、正本ファイル表）
- references: useSyncExternalStore、chrome.scripting.registerContentScripts、Vitest、WAI-ARIA Authoring Practices を追加

## 作業順序（被参照側 → 参照側 → 目次）

1. **Phase 1**: error-handling.md → data-model.md → scan-pipeline.md → testing-strategy.md（正本を先に確定）
2. **Phase 2**: state-management.md → plasmo-architecture.md → ui-and-components.md（正本へ参照を張り替え）
3. **Phase 3**: requirements.md → user-stories.md → scope-and-milestones.md
4. **Phase 4**: github-issues-v0.1.md → references.md → README.md
5. tasks/todo.md に計画・レビューを記録（プロジェクト規約）

## 検証

1. `pnpm format` で整形
2. 内部リンク実在チェック: `grep -rhoE '\]\(([^)#]+\.md)' docs/` で列挙 → 存在確認
3. 実装パス参照チェック: docs 内の `src/...` 記述を grep で列挙 → `ls` で実在確認（「予定」節は対象外）
4. セレクタ台帳・属性名を `src/features/scan/*.ts` の定数と突合（`data-figma-explorer-resolved-url`、`[role='listitem'][data-index]` 等）
5. `git diff --stat` で変更が docs/ と tasks/ のみであることを確認
6. Issue ステータス表と milestones の進捗スナップショットの一致確認
