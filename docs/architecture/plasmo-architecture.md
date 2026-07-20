# Plasmo前提の構成

## 1. 技術前提

```text
Framework: Plasmo
Language: TypeScript
UI: React
Package Manager: pnpm
Storage: @plasmohq/storage
Storage Area: local
Target: Chrome Extension MV3
Target Page: https://www.figma.com/*
```

## 2. Plasmoでの入口

PlasmoのContent Scripts UIで、Figma Drafts画面上にReact UIをマウントする。

```ts
export const config = {
  matches: ["https://www.figma.com/*"]
}
```

このリポジトリでは source root を `src/` に寄せるため、Content Scripts UI の
entry は `src/contents/` 配下に置く。

## 3. MAIN worldの扱い

Content Scriptは原則isolated worldで動かす。ただし、isolated worldからは
Reactのfiber（`__reactFiber$`）が見えないため、ファイルURLの解決だけは
`world: "MAIN"` のbridge scriptで行う。

| Script                                    | World    | 役割                                    |
| ----------------------------------------- | -------- | --------------------------------------- |
| `src/contents/figma-file-route-bridge.ts` | MAIN     | fiberからURLを解決し、DOM属性へ書き込む |
| `src/contents/figma-explorer.tsx`         | isolated | UI表示とDOM読み取り。属性を読むだけ     |

二重world契約の詳細（属性名、禁止事項、仮想化リスト対策、再注入）は
[scan-pipeline.md](./scan-pipeline.md) が正本。
MAIN worldのContent ScriptではChrome Extensions API（Plasmo Storage含む）を
使わない。

## 4. 保存領域

Plasmo Storageは既定でsyncを使うため、この拡張機能ではlocalを明示する。

```ts
import { Storage } from "@plasmohq/storage"

export const organizerStorage = new Storage({
  area: "local"
})
```

## 5. ディレクトリ構成

### 現状（Issue 012〜014 レビュー修正時点）

```text
figma-explorer/
├─ package.json
├─ tsconfig.json
├─ src/
│  ├─ background.ts                      # 拡張更新時のcontent script再注入
│  ├─ popup.tsx
│  ├─ contents/
│  │  ├─ figma-explorer.tsx              # isolated world: UI注入 entry
│  │  └─ figma-file-route-bridge.ts      # MAIN world: fiberからURL解決
│  ├─ figma-explorer/
│  │  ├─ components/                     # OrganizerPanel / SearchBox /
│  │  │                                  # FolderTree / FileList ほか（FigmaExplorerPanel
│  │  │                                  # はコンテナとして残存）
│  │  ├─ constants/
│  │  ├─ formatters/
│  │  ├─ hooks/
│  │  ├─ stores/                         # 検出ストア、フォルダ状態ストア
│  │  ├─ styles/
│  │  ├─ types/
│  │  └─ utils/
│  ├─ domain/
│  │  ├─ folder.ts                       # VirtualFolder / FolderTreeNode /
│  │  │                                  # MAX_FOLDER_DEPTH
│  │  └─ organizer-state.ts              # PersistentState / SCHEMA_VERSION
│  ├─ features/
│  │  ├─ filters/
│  │  │  └─ file-filter-service.ts       # 全件・フォルダ・未分類filter + 名前検索
│  │  ├─ scan/
│  │  │  ├─ detect-drafts-page.ts
│  │  │  ├─ detect-file-card-elements.ts
│  │  │  ├─ extract-file-card-metadata.ts
│  │  │  ├─ create-file-id.ts
│  │  │  ├─ draft-file.ts
│  │  │  ├─ file-card-route-attribute.ts
│  │  │  ├─ resolve-file-card-route-from-fiber.ts
│  │  │  └─ annotate-file-card-routes.ts
│  │  └─ folders/
│  │     ├─ folder-service.ts            # 作成・改名・移動・削除 + 階層制約
│  │     ├─ file-assignment-service.ts    # ファイル分類・未分類化
│  │     ├─ folder-tree-service.ts       # folderTree の純関数ヘルパー
│  │     └─ organizer-folder-mutation.ts # 再試行可能な永続化操作
│  ├─ storage/
│  │  ├─ organizer-storage.ts
│  │  └─ migrate-persistent-state.ts
│  └─ utils/
│     └─ result.ts
└─ README.md
```

### 今後追加予定（v0.1 残り）

```text
src/
├─ app/
│  ├─ OrganizerApp.tsx
│  ├─ organizer-actions.ts
│  └─ organizer-reducer.ts
├─ components/
│  ├─ OrganizerPanel.tsx
│  ├─ PanelHeader.tsx
│  ├─ SearchBox.tsx
│  ├─ SummaryCards.tsx
│  ├─ FolderTree.tsx
│  ├─ FileList.tsx
│  ├─ FileListItem.tsx
│  ├─ ErrorBanner.tsx
│  └─ FirstRunNotice.tsx
├─ domain/
│  ├─ file.ts
│  ├─ folder.ts
│  ├─ organizer-state.ts
│  └─ export-json.ts
├─ features/
│  ├─ scan/
│  │  ├─ scan-draft-files.ts
│  │  └─ create-file-id.ts
│  ├─ folders/
│  │  ├─ folder-service.ts
│  │  └─ folder-tree-service.ts
│  ├─ filters/
│  │  └─ file-filter-service.ts
│  └─ export-json/
│     └─ export-json-service.ts
├─ storage/
│  └─ organizer-storage.ts
└─ utils/
   ├─ id.ts
   ├─ result.ts        # Result型（error-handling.md が正本）
   └─ figma-url.ts

tests/
└─ fixtures/           # サニタイズ済み Figma DOM（testing-strategy.md 参照）
```

- テストは対象モジュールと同階層に `*.test.ts` で併置する
- 当初計画の `parse-figma-card.ts` は、実装では
  `extract-file-card-metadata.ts` として実現済み

## 6. コマンド

```bash
pnpm dev      # 開発ビルド（build/chrome-mv3-dev を Chrome に読み込む）
pnpm build    # 本番ビルド
pnpm lint     # ESLint + Prettier check
pnpm typecheck # TypeScript 型チェック
pnpm format   # Prettier 整形
pnpm test     # unit / DOM fixture テスト（Vitest）
```

## 7. 責務分割

| 領域                       | 役割                                                       | 状態     | 関連文書                                       |
| -------------------------- | ---------------------------------------------------------- | -------- | ---------------------------------------------- |
| `src/background.ts`        | 拡張更新時のcontent script再注入                           | 実装     | [scan-pipeline.md](./scan-pipeline.md)         |
| `src/contents/`            | UI注入 entry（isolated）とbridge（MAIN）                   | 実装     | [scan-pipeline.md](./scan-pipeline.md)         |
| `src/figma-explorer/`      | Figma content script 向けの補助ロジック                    | 実装     | [state-management.md](./state-management.md)   |
| `src/features/scan`        | Figma DOM読み取り、fiberからのURL解決                      | 実装     | [scan-pipeline.md](./scan-pipeline.md)         |
| `src/app`                  | アプリ全体の状態と操作                                     | 予定     | [state-management.md](./state-management.md)   |
| `src/components`           | React UI（現状は `src/figma-explorer/components/` に実装） | 一部実装 | [ui-and-components.md](./ui-and-components.md) |
| `src/domain`               | 型、ドメイン定義                                           | 実装     | [data-model.md](./data-model.md)               |
| `src/features/folders`     | 仮想フォルダ処理                                           | 実装     | [data-model.md](./data-model.md)               |
| `src/features/filters`     | 検索、絞り込み                                             | 実装     | [state-management.md](./state-management.md)   |
| `src/features/export-json` | JSON生成、ファイル名生成、Blobダウンロード                 | 実装     | [data-model.md](./data-model.md)               |
| `src/storage`              | Plasmo Storage保存・移行・複数タブ排他更新                 | 実装     | [state-management.md](./state-management.md)   |
| `src/utils/result.ts`      | Result型                                                   | 実装     | [error-handling.md](./error-handling.md)       |
