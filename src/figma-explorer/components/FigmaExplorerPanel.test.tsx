import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { FigmaExplorerPanel } from "./FigmaExplorerPanel"

vi.mock("../hooks/use-file-card-detection", () => ({
  useFileCardDetection: () => ({ status: "empty", elements: [] })
}))

vi.mock("../hooks/use-organizer-folders", () => ({
  useOrganizerFolders: () => ({
    status: "loading",
    folders: {},
    folderTree: [],
    storageError: null,
    canRetrySave: false
  })
}))

vi.mock("../stores/file-card-detection-store", () => ({
  rescanFileCards: vi.fn()
}))

vi.mock("../stores/organizer-folders-store", () => ({
  getOrganizerFoldersStore: () => ({
    createFolder: vi.fn(),
    retrySave: vi.fn(),
    toggleFolderExpanded: vi.fn()
  })
}))

describe("FigmaExplorerPanel", () => {
  it("ファイル抽出前のempty状態でも初回レンダーできる", () => {
    const html = renderToStaticMarkup(
      <FigmaExplorerPanel href="https://www.figma.com/files/team/drafts" />
    )

    expect(html).toContain("0 candidate cards")
    expect(html).toContain("まだ候補カードが見つかっていません。")
  })
})
