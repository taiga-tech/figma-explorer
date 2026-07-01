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

複数のContent Scripts UIを持つ場合は `contents/` 配下にentryを置く。

## 3. MAIN worldを使わない

初期版では `world: "MAIN"` を使わない。
FigmaページのJavaScript実行環境に入る必要がなく、DOM読み取り、UI表示、Storage保存だけで足りるため。

Plasmo StorageはMAIN worldのContent ScriptではChrome Extensions APIにアクセスできないため、保存処理と併用しない。

## 4. 保存領域

Plasmo Storageは既定でsyncを使うため、この拡張機能ではlocalを明示する。

```ts
import { Storage } from "@plasmohq/storage"

export const organizerStorage = new Storage({
  area: "local"
})
```

## 5. ディレクトリ構成

```text
figma-explorer/
├─ package.json
├─ tsconfig.json
├─ contents/
│  ├─ figma-explorer.tsx
│  └─ figma-explorer.css
├─ popup/
│  └─ index.tsx
├─ options/
│  └─ index.tsx
├─ background/
│  └─ index.ts
├─ src/
│  ├─ app/
│  │  ├─ OrganizerApp.tsx
│  │  ├─ organizer-actions.ts
│  │  └─ organizer-reducer.ts
│  ├─ components/
│  │  ├─ OrganizerPanel.tsx
│  │  ├─ PanelHeader.tsx
│  │  ├─ SearchBox.tsx
│  │  ├─ SummaryCards.tsx
│  │  ├─ FolderTree.tsx
│  │  ├─ FileList.tsx
│  │  ├─ FileListItem.tsx
│  │  ├─ ErrorBanner.tsx
│  │  └─ FirstRunNotice.tsx
│  ├─ domain/
│  │  ├─ file.ts
│  │  ├─ folder.ts
│  │  ├─ organizer-state.ts
│  │  └─ export-json.ts
│  ├─ features/
│  │  ├─ scan/
│  │  │  ├─ detect-drafts-page.ts
│  │  │  ├─ scan-draft-files.ts
│  │  │  ├─ detect-file-card-elements.ts
│  │  │  ├─ parse-figma-card.ts
│  │  │  └─ create-file-id.ts
│  │  ├─ folders/
│  │  │  ├─ folder-service.ts
│  │  │  └─ folder-tree-service.ts
│  │  ├─ filters/
│  │  │  └─ file-filter-service.ts
│  │  └─ export-json/
│  │     └─ export-json-service.ts
│  ├─ storage/
│  │  └─ organizer-storage.ts
│  └─ utils/
│     ├─ id.ts
│     ├─ result.ts
│     └─ figma-url.ts
└─ README.md
```

## 6. 起動コマンド

```bash
pnpm create plasmo figma-explorer
cd figma-explorer
pnpm install
pnpm add @plasmohq/storage
pnpm dev
```

## 7. 責務分割

| 領域                       | 役割                   |
| -------------------------- | ---------------------- |
| `contents/`                | FigmaページへのUI注入  |
| `src/app`                  | アプリ全体の状態と操作 |
| `src/components`           | React UI               |
| `src/domain`               | 型、ドメイン定義       |
| `src/features/scan`        | Figma DOM読み取り      |
| `src/features/folders`     | 仮想フォルダ処理       |
| `src/features/filters`     | 検索、絞り込み         |
| `src/features/export-json` | JSON出力               |
| `src/storage`              | Plasmo Storage保存     |
