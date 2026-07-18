import { describe, expect, it } from "vitest"

import { createInitialPersistentState } from "../../domain/organizer-state"
import { createFolder } from "./folder-service"
import { findFolderTreeNode } from "./folder-tree-service"
import {
  applyOrganizerFolderMutation,
  type OrganizerFolderMutation
} from "./organizer-folder-mutation"

const NOW = "2026-07-15T00:00:00.000Z"
const LATER = "2026-07-16T00:00:00.000Z"

const createFolderOrThrow = (
  state: ReturnType<typeof createInitialPersistentState>,
  name: string,
  id: string,
  parentId: string | null = null
) => {
  const result = createFolder(state, {
    name,
    parentId,
    now: NOW,
    createId: () => id
  })

  if (result.ok === false) {
    throw new Error(result.error.kind)
  }

  return result.value.state
}

describe("applyOrganizerFolderMutation", () => {
  it("作成先までの折りたたまれた祖先をすべて展開する", () => {
    let state = createInitialPersistentState(NOW)

    state = createFolderOrThrow(state, "root", "folder-root")
    state = createFolderOrThrow(state, "child", "folder-child", "folder-root")

    const mutation: OrganizerFolderMutation = {
      type: "create_folder",
      folder: {
        id: "folder-grandchild",
        name: "grandchild",
        parentId: "folder-child",
        createdAt: NOW
      }
    }
    const result = applyOrganizerFolderMutation(state, mutation)

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(
        findFolderTreeNode(result.value.folderTree, "folder-root")?.expanded
      ).toBe(true)
      expect(
        findFolderTreeNode(result.value.folderTree, "folder-child")?.expanded
      ).toBe(true)
      expect(
        findFolderTreeNode(result.value.folderTree, "folder-grandchild")
      ).not.toBeNull()
    }
  })

  it("同じ作成mutationを再適用してもフォルダを重複させない", () => {
    const mutation: OrganizerFolderMutation = {
      type: "create_folder",
      folder: {
        id: "folder-design",
        name: "design",
        parentId: null,
        createdAt: NOW
      }
    }
    const first = applyOrganizerFolderMutation(
      createInitialPersistentState(NOW),
      mutation
    )

    expect(first.ok).toBe(true)

    if (first.ok) {
      const second = applyOrganizerFolderMutation(first.value, mutation)

      expect(second.ok).toBe(true)

      if (second.ok) {
        expect(Object.keys(second.value.folders)).toEqual(["folder-design"])
        expect(second.value.folderTree).toHaveLength(1)
      }
    }
  })

  it("展開状態は反転ではなく指定値へ冪等に更新する", () => {
    const state = createFolderOrThrow(
      createInitialPersistentState(NOW),
      "design",
      "folder-design"
    )
    const mutation: OrganizerFolderMutation = {
      type: "set_folder_expanded",
      folderId: "folder-design",
      expanded: true,
      updatedAt: NOW
    }
    const first = applyOrganizerFolderMutation(state, mutation)

    expect(first.ok).toBe(true)

    if (first.ok) {
      const second = applyOrganizerFolderMutation(first.value, mutation)

      expect(second.ok).toBe(true)

      if (second.ok) {
        expect(
          findFolderTreeNode(second.value.folderTree, "folder-design")?.expanded
        ).toBe(true)
      }
    }
  })

  it("古いmutationの再適用でstateのupdatedAtを巻き戻さない", () => {
    const createMutation: OrganizerFolderMutation = {
      type: "create_folder",
      folder: {
        id: "folder-design",
        name: "design",
        parentId: null,
        createdAt: NOW
      }
    }
    const created = applyOrganizerFolderMutation(
      createInitialPersistentState(LATER),
      createMutation
    )

    expect(created.ok).toBe(true)

    if (created.ok) {
      expect(created.value.meta.updatedAt).toBe(LATER)

      const expanded = applyOrganizerFolderMutation(created.value, {
        type: "set_folder_expanded",
        folderId: "folder-design",
        expanded: true,
        updatedAt: NOW
      })

      expect(expanded.ok).toBe(true)

      if (expanded.ok) {
        expect(expanded.value.meta.updatedAt).toBe(LATER)
      }
    }
  })
})
