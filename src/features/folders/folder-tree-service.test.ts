import { describe, expect, it } from "vitest"

import type { FolderTreeNode } from "../../domain/folder"
import {
  collectFolderTreeIds,
  createFolderTreeNode,
  findFolderTreeNode,
  insertFolderTreeNode,
  removeFolderTreeNode
} from "./folder-tree-service"

const buildTree = (): FolderTreeNode[] => [
  {
    folderId: "root-a",
    expanded: true,
    children: [
      {
        folderId: "child-a1",
        expanded: false,
        children: [
          { folderId: "grandchild-a1x", expanded: false, children: [] }
        ]
      }
    ]
  },
  { folderId: "root-b", expanded: false, children: [] }
]

describe("createFolderTreeNode", () => {
  it("子なし・折りたたみ状態のノードを作る", () => {
    expect(createFolderTreeNode("folder-1")).toEqual({
      folderId: "folder-1",
      children: [],
      expanded: false
    })
  })
})

describe("findFolderTreeNode", () => {
  it("ネストしたノードを見つける", () => {
    const found = findFolderTreeNode(buildTree(), "grandchild-a1x")

    expect(found?.folderId).toBe("grandchild-a1x")
  })

  it("存在しないIDはnullを返す", () => {
    expect(findFolderTreeNode(buildTree(), "missing")).toBeNull()
  })
})

describe("insertFolderTreeNode", () => {
  it("parentIdがnullならルート直下の末尾へ追加する", () => {
    const tree = insertFolderTreeNode(
      buildTree(),
      createFolderTreeNode("root-c"),
      null
    )

    expect(tree.map((node) => node.folderId)).toEqual([
      "root-a",
      "root-b",
      "root-c"
    ])
  })

  it("ネストした親のchildren末尾へ追加する", () => {
    const tree = insertFolderTreeNode(
      buildTree(),
      createFolderTreeNode("child-a2"),
      "child-a1"
    )

    const parent = findFolderTreeNode(tree, "child-a1")

    expect(parent?.children.map((node) => node.folderId)).toEqual([
      "grandchild-a1x",
      "child-a2"
    ])
  })

  it("元のツリーを変更しない", () => {
    const original = buildTree()
    const snapshot = structuredClone(original)

    insertFolderTreeNode(original, createFolderTreeNode("child-a2"), "child-a1")

    expect(original).toEqual(snapshot)
  })
})

describe("removeFolderTreeNode", () => {
  it("対象ノードをサブツリーごと取り除く", () => {
    const tree = removeFolderTreeNode(buildTree(), "child-a1")

    expect(collectFolderTreeIds(tree)).toEqual(["root-a", "root-b"])
  })

  it("ルートノードも取り除ける", () => {
    const tree = removeFolderTreeNode(buildTree(), "root-a")

    expect(collectFolderTreeIds(tree)).toEqual(["root-b"])
  })

  it("元のツリーを変更しない", () => {
    const original = buildTree()
    const snapshot = structuredClone(original)

    removeFolderTreeNode(original, "child-a1")

    expect(original).toEqual(snapshot)
  })
})

describe("collectFolderTreeIds", () => {
  it("深さ優先ですべてのIDを返す", () => {
    expect(collectFolderTreeIds(buildTree())).toEqual([
      "root-a",
      "child-a1",
      "grandchild-a1x",
      "root-b"
    ])
  })
})
