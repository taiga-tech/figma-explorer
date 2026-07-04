import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { OrganizerPanel } from "./OrganizerPanel"

describe("OrganizerPanel", () => {
  it("renders summary counts and scan metadata", () => {
    const html = renderToStaticMarkup(
      createElement(OrganizerPanel, {
        emptyMessage: null,
        errorBanner: null,
        files: [
          {
            id: "file-1",
            name: "Dashboard",
            url: "https://www.figma.com/file/AbC123/Dashboard",
            folderName: null
          }
        ],
        onRescan: () => undefined,
        onSelectFile: () => undefined,
        routeLabel: "/drafts",
        scanSummary: "1 files extracted / 0 skipped",
        selectedFileId: "file-1",
        targetLabel: "https://www.figma.com/*"
      })
    )

    expect(html).toContain("Organizer Panel")
    expect(html).toContain("1 files extracted / 0 skipped")
    expect(html).toContain("全件")
    expect(html).toContain("未分類")
    expect(html).toContain("Detected files")
  })

  it("renders an alert banner for scan errors", () => {
    const html = renderToStaticMarkup(
      createElement(OrganizerPanel, {
        emptyMessage: "候補カードが見つかりません。",
        errorBanner: {
          kind: "scan_dom_missing",
          message: "File card list root was not found."
        },
        files: [],
        onRescan: () => undefined,
        onSelectFile: () => undefined,
        routeLabel: "/drafts",
        scanSummary: "scan_dom_missing",
        selectedFileId: null,
        targetLabel: "https://www.figma.com/*"
      })
    )

    expect(html).toContain('role="alert"')
    expect(html).toContain("scan_dom_missing")
  })
})
