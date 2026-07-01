# Figma Explorer

Figma Drafts 画面を対象にした Chrome 拡張の開発ベースです。現在は
Plasmo を使った最小構成で、今後 content scripts と整理パネルを追加していきます。

## セットアップ

```bash
pnpm install
```

## 開発起動

```bash
pnpm dev
```

`pnpm dev` を起動すると Chrome Manifest V3 向けの開発ビルドが
`build/chrome-mv3-dev/` に生成されます。

Chrome で読み込む手順:

1. `chrome://extensions` を開く
2. 右上の「デベロッパー モード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」を押す
4. `build/chrome-mv3-dev` ディレクトリを選ぶ

開発中の主な編集対象:

- `src/popup.tsx`: 拡張ポップアップ
- `src/contents/*.tsx`: Figma 上に挿入する entry
- `src/figma-explorer/**/*.ts(x)|css`: content script の補助ロジックとスタイル

`src/popup.tsx` の変更は開発ビルドへ反映されます。content scripts を追加した場合は、
Chrome 側で拡張機能の再読み込みも行ってください。

## 本番ビルド

```bash
pnpm build
```

成果物は `build/` に出力されます。

## パッケージ作成

```bash
pnpm package
```

配布用アーカイブを生成します。
