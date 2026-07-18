import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { FolderId, VirtualFolder } from "../../domain/folder"
import { FolderTree } from "./FolderTree"

const NOW = "2026-07-05T00:00:00.000Z"

const buildFolder = (
  id: string,
  name: string,
  parentId: string | null
): VirtualFolder => ({
  id,
  name,
  parentId,
  sortOrder: 0,
  createdAt: NOW,
  updatedAt: NOW,
  isSystem: false
})

const folders: Record<FolderId, VirtualFolder> = {
  "folder-design": buildFolder("folder-design", "design", null),
  "folder-design-child": buildFolder(
    "folder-design-child",
    "design-child",
    "folder-design"
  ),
  "folder-research": buildFolder("folder-research", "research", null)
}

const tree = [
  {
    folderId: "folder-design",
    expanded: true,
    children: [
      { folderId: "folder-design-child", expanded: false, children: [] }
    ]
  },
  { folderId: "folder-research", expanded: false, children: [] }
]

describe("FolderTree", () => {
  it("renders tree semantics with expanded and selected state", () => {
    const html = renderToStaticMarkup(
      createElement(FolderTree, {
        folders,
        tree,
        selectedFolderId: "folder-design-child",
        onSelectFolder: () => undefined,
        onToggleExpanded: () => undefined
      })
    )

    document.body.innerHTML = html

    const treeRoot = document.querySelector("[role='tree']")
    const items = Array.from(document.querySelectorAll("[role='treeitem']"))
    const group = document.querySelector("[role='group']")

    expect(treeRoot).not.toBeNull()
    expect(items).toHaveLength(3)
    expect(group).not.toBeNull()

    const designItem = items.find((item) =>
      item.textContent?.includes("design")
    )

    expect(designItem?.getAttribute("aria-expanded")).toBe("true")
    expect(designItem?.getAttribute("aria-level")).toBe("1")

    const childItem = items.find(
      (item) => item.getAttribute("aria-level") === "2"
    )

    expect(childItem?.getAttribute("aria-selected")).toBe("true")
    // 子を持たないノードには aria-expanded を付けない
    expect(childItem?.getAttribute("aria-expanded")).toBeNull()
  })

  it("does not render collapsed children", () => {
    const collapsedTree = [
      {
        folderId: "folder-design",
        expanded: false,
        children: [
          { folderId: "folder-design-child", expanded: false, children: [] }
        ]
      }
    ]

    const html = renderToStaticMarkup(
      createElement(FolderTree, {
        folders,
        tree: collapsedTree,
        selectedFolderId: null,
        onSelectFolder: () => undefined,
        onToggleExpanded: () => undefined
      })
    )

    expect(html).not.toContain("design-child")
    expect(html).toContain('aria-expanded="false"')
  })

  it("renders empty state when there are no folders", () => {
    const html = renderToStaticMarkup(
      createElement(FolderTree, {
        folders: {},
        tree: [],
        selectedFolderId: null,
        onSelectFolder: () => undefined,
        onToggleExpanded: () => undefined
      })
    )

    expect(html).toContain("まだフォルダがありません")
    expect(html).not.toContain('role="tree"')
  })
})
