# エラー処理設計

本書は Result 型と `OrganizerError` の正本である。
他文書はここで定義した型とエラーコードを参照のみで使う。

## 1. 方針

- 部分失敗で全体を止めない。1件のカード読み取り失敗はスキップして継続する
- 取得0件はエラーではなく空状態として扱う
- 失敗は握りつぶさず、必ず計数して可視化する
- 例外はモジュール境界で Result に変換し、UI 層まで throw を伝播させない

## 2. Result 型（正本）

```ts
type Result<T, E = OrganizerError> =
  | { ok: true; value: T }
  | { ok: false; error: E }
```

`src/utils/result.ts` に実装済みで、ヘルパー（`ok()` / `err()`）を併設する。

適用範囲:

| 層                            | Result 適用 | 備考                                     |
| ----------------------------- | ----------- | ---------------------------------------- |
| `src/features/*` サービス関数 | 必須        | FileId 生成、フォルダ操作、JSON 出力など |
| `src/storage`                 | 必須        | load / save / migration                  |
| スキャン検出・抽出            | 準拠        | 既存の判別可能 union（下記）を維持       |
| React コンポーネント・hooks   | 対象外      | Result を受け取り表示に変換するだけ      |
| UI イベントハンドラ           | 対象外      | サービス層の Result を分岐する           |

既存実装の `DetectFileCardElementsResult`（success / empty / error の三値）と
`ExtractFileCardMetadataResult`（skippedCount 付き）は「部分失敗を計数して継続する」
方針の先行実装であり、Result 型へ無理に置き換えない。

## 3. OrganizerError 分類体系

```ts
type OrganizerErrorKind =
  | "scan_dom_missing" // ファイルカードのリスト構造が見つからない
  | "scan_partial" // 一部カードの名前・URL を抽出できなかった
  | "storage_load_failed" // 保存データの読み込み失敗
  | "storage_save_failed" // 保存失敗
  | "storage_update_conflict" // 外部更新との競合で操作を適用できない
  | "storage_migration_failed" // スキーマ移行失敗
  | "storage_corrupted" // 保存データの破損
  | "export_failed" // JSON 出力失敗

type OrganizerError = {
  kind: OrganizerErrorKind
  message: string
  cause?: unknown
}
```

- `message` は開発者向けの英語文。ユーザー向け文言は UI 層で `kind` から引く
- `cause` には元の例外や診断オブジェクトを入れる

## 4. 層別ハンドリング

| 層      | 失敗時の挙動                                                             |
| ------- | ------------------------------------------------------------------------ |
| scan    | 対象カードをスキップし `skippedCount` を加算。全体は継続する             |
| storage | I/O 読み込み失敗は `storage_load_failed` を返し、元データを変更しない    |
| 移行    | 破損・旧版移行失敗は退避後に初期化。将来版は上書きせず読み取りを停止する |
| UI      | `ErrorBanner` に `kind` 対応の文言を表示。空状態とは表示を分ける         |

## 5. 失敗テレメトリ

v0.1 ではローカル計測のみとし、外部送信は行わない。

計測項目:

- `skippedCount` / `totalCount`（抽出の部分失敗率）
- URL 未解決件数（bridge が `data-figma-explorer-resolved-url` を
  付与できなかったカード数）
- フォールバック段数（何番目のセレクタ・属性候補で抽出に成功したか）

出力書式: `console.debug("[figma-explorer]", diagnostics)` の形で
診断オブジェクトを1回のスキャンにつき1件出力する。
Figma UI 変更時の一次診断に使う（対応手順は
[scan-pipeline.md](./scan-pipeline.md) を参照）。

## 6. ユーザー向けエラー表示の原則

- 空状態（0件）とエラーは文言・見た目を分ける
- 再試行で回復可能なエラーには再試行（再スキャン・再保存）の導線を付ける
- `storage_update_conflict` は同じ操作を再適用しても回復しないため、変更を破棄して
  最新状態を表示し、必要ならユーザーが操作をやり直せる文言にする
- 部分失敗（`scan_partial`）は一覧表示を止めず、件数だけ知らせる
- storage 系の失敗はデータ喪失の有無を明示する

## 7. 関連文書

- [data-model.md](./data-model.md) — PersistentState とスキーマ移行
- [scan-pipeline.md](./scan-pipeline.md) — スキャンの失敗可視化と診断手順
- [ui-and-components.md](./ui-and-components.md) — ErrorBanner と状態別表示
