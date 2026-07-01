# Lessons

- 初期作成
- `docs/` に運用ファイルの複製を置かず、正本への参照に寄せる
- 運用ファイルを正本へ寄せた後は、その正本自体の Markdown 構文崩れも必ず再確認する
- contributor guide を作るときは `README.md` `package.json` `docs/` `git log` を根拠にし、未整備のテストは推測せず明記する
- Plasmo 初期生成直後は `package.json` の `name` `displayName` `description` と `popup.tsx` の文言を早めに実プロジェクト名へ置き換える
- PR を作成するときは本文に `Closes #<issue-number>` を入れて、対応 Issue と自動で紐づける
- GitHub の操作は `gh` を使い、Issue 確認、PR 作成、PR 更新も `gh` コマンドで統一する
- Figma 上へ仮パネルを重ねるときは、全画面ラッパーを `pointer-events: none`、操作可能なパネルだけを `pointer-events: auto` にして既存 UI のクリックを塞がない
- Issue 着手時は実装を始める前に `git flow feature start issue-<番号>-<要約>` で feature ブランチを切る
- Figma の固定パネルはオーバーレイ表示だけで済ませず、表示中はページ本体にも右余白を適用して既存 UI と視覚的に競合しないようにする
- ページ余白の退避は複数プロパティを同時に触らず、まずは 1 箇所だけに適用して実際の縮み量を確認する
- React 側で `useEffect` を使いたくない副作用は、コンポーネント外の監視ロジックへ出して `useSyncExternalStore` などで購読する
- Plasmo で `src/` を作るなら entry も `src/` 配下へ移す。root entry のままでは source root が切り替わって検出されない
- Plasmo の `config` 解析は import 先の定数を追えないので、`matches` などの entry 設定は literal で書く
- `src/contents/` 配下には entry 以外を置かない。CSS や補助モジュールは別ディレクトリへ逃がす
- Plasmo entry は export を素朴に保つ。型注釈や helper 経由を減らすと parser 起因の不安定さを避けやすい
- URL ベースの画面判定は単純な `includes` ではなく path segment ベースで判定する
