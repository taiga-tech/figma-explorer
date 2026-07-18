import { createRoot } from "react-dom/client"
import { act } from "react-dom/test-utils"
import { describe, expect, it, vi } from "vitest"

import { FolderSection } from "./FolderSection"

globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe("FolderSection", () => {
  it("保存エラーの再試行ボタンからcallbackを呼ぶ", () => {
    const container = document.createElement("div")
    const onRetrySave = vi.fn()
    const root = createRoot(container)

    act(() => {
      root.render(
        <FolderSection
          canRetrySave
          folders={{}}
          onCreateFolder={() => null}
          onRetrySave={onRetrySave}
          onSelectFolder={() => undefined}
          onToggleExpanded={() => undefined}
          selectedFolderId={null}
          status="ready"
          storageErrorMessage="フォルダの保存に失敗しました。"
          tree={[]}
        />
      )
    })

    const retryButton = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === "再試行"
    )

    expect(retryButton).toBeDefined()
    expect(container.querySelector('[role="alert"] button')).toBeNull()

    act(() => {
      retryButton?.click()
    })

    expect(onRetrySave).toHaveBeenCalledOnce()

    act(() => {
      root.unmount()
    })
  })
})
