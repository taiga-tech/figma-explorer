import { createRoot } from "react-dom/client"
import { act } from "react-dom/test-utils"
import { describe, expect, it, vi } from "vitest"

import { FileAssignmentSection } from "./FileAssignmentSection"

globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe("FileAssignmentSection", () => {
  it("選択したファイルをフォルダへ分類し未分類へ戻せる", () => {
    const container = document.createElement("div")
    const root = createRoot(container)
    const onAssign = vi.fn()
    const onUnassign = vi.fn()

    act(() => {
      root.render(
        <FileAssignmentSection
          canAssign
          canUnassign
          currentFolderName="Current"
          onAssign={onAssign}
          onUnassign={onUnassign}
          selectedFileName="Dashboard"
          selectedFolderName="Design"
        />
      )
    })

    const buttons = container.querySelectorAll("button")

    expect(container.textContent).toContain("「Design」へ分類")
    expect(container.textContent).toContain("現在: Current")

    act(() => buttons[0]?.click())
    act(() => buttons[1]?.click())

    expect(onAssign).toHaveBeenCalledOnce()
    expect(onUnassign).toHaveBeenCalledOnce()

    act(() => root.unmount())
  })

  it("分類先がない場合は分類操作を無効にする", () => {
    const container = document.createElement("div")
    const root = createRoot(container)

    act(() => {
      root.render(
        <FileAssignmentSection
          canAssign={false}
          canUnassign={false}
          currentFolderName={null}
          onAssign={() => undefined}
          onUnassign={() => undefined}
          selectedFileName="Dashboard"
          selectedFolderName={null}
        />
      )
    })

    const buttons = container.querySelectorAll("button")

    expect(buttons[0]?.disabled).toBe(true)
    expect(buttons[1]?.disabled).toBe(true)

    act(() => root.unmount())
  })
})
