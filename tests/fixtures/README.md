# DOM フィクスチャ

実 Figma Drafts の DOM をサニタイズした HTML を置く。
運用ルールは `docs/architecture/testing-strategy.md` §4 を参照。

## 取得手順

1. Figma Drafts 画面で DevTools を開く
2. `[role='main']` 配下のファイルカードリスト（`[role='list']`）の
   outerHTML をコピーする
3. 下記のサニタイズを行い、`drafts-list-YYYYMMDD.html` として保存する

## サニタイズ規則

- ファイル名 → `File A` などのダミー名へ置換する
- URL の file key → `AbC123` などのダミー値へ置換する
- サムネイル URL・アバター URL → 削除またはダミーへ置換する
- 構造（role、data 属性、階層）は変更しない

## 記録事項

ファイル先頭に HTML コメントで以下を記録する。

```html
<!-- 取得日: YYYY-MM-DD / 画面: Figma Drafts (grid view) -->
```
