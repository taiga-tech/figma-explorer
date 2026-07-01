# 参照情報

## Plasmo

### Content Scripts UI

URL: https://docs.plasmo.com/framework/content-scripts-ui

設計への反映:

- Figmaページ上にReact UIを注入する入口として使う
- 複数entryを扱う場合は `contents/` 配下に置く
- Shadow DOMにより、対象ページのCSSとの衝突を抑える

### Storage

URL: https://docs.plasmo.com/framework/storage

設計への反映:

- `@plasmohq/storage` を使う
- 既定のstorage areaに依存せず、`area: "local"` を明示する
- `world: "MAIN"` のContent ScriptではStorage APIを使わない

### New Extension

URL: https://docs.plasmo.com/framework/workflows/new

設計への反映:

- 新規作成は `pnpm create plasmo` を使う
- 共通ロジックは `src/` 配下に置く
- Plasmoのentryである `contents/`, `popup/`, `options/`, `background/` はroot直下に置く

## Figma

### Guide to files and projects

URL: https://help.figma.com/hc/en-us/articles/1500005554982-Guide-to-files-and-projects

設計への反映:

- Figmaの整理単位はprojectsであり、Draftsの整理はFigma本体の実フォルダ作成ではなく、拡張機能側の仮想分類として扱う
- FigmaにはDesign files、FigJam boards、Slide decksなど複数のファイル種別があるため、`FigmaFileType` は拡張可能にする

### ファイルの移動

URL: https://help.figma.com/hc/ja/articles/360038511573-%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E3%81%AE%E7%A7%BB%E5%8B%95

設計への反映:

- ファイル移動はプロジェクト権限やアクセスできるユーザーに影響する
- 初期版ではDraftsからプロジェクトへの実移動を扱わない
- ユーザーには仮想分類であることを明示する
