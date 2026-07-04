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
- このリポジトリはPlasmoのsrcディレクトリ構成を採用し、entryである `contents/`, `popup.tsx`, `background.ts` を含めてすべて `src/` 配下に置く

## Chrome Extensions

### chrome.scripting.registerContentScripts

URL: https://developer.chrome.com/docs/extensions/reference/api/scripting

設計への反映:

- Plasmoは `world: "MAIN"` のContent Scriptを動的登録で実装するため、
  `src/background.ts` は静的 `content_scripts` と
  `getRegisteredContentScripts()` の両方を再注入する

## React

### useSyncExternalStore

URL: https://react.dev/reference/react/useSyncExternalStore

設計への反映:

- 実行時状態ストアの標準パターンとして採用する
  （`docs/architecture/state-management.md` §2）
- MutationObserver等のReact外イベント源との接続に使う

## テスト

### Vitest

URL: https://vitest.dev/

設計への反映:

- unit / DOM fixtureテストのランナーとして採用する
  （`docs/architecture/testing-strategy.md`）
- Plasmoのビルドと独立に実行する

## アクセシビリティ

### WAI-ARIA Authoring Practices: Tree View Pattern

URL: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/

設計への反映:

- FolderTreeのロール・キーボード操作の基準にする
  （`docs/architecture/ui-and-components.md` §6, §7）

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
