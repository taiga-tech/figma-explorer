import { createRoot } from "react-dom/client"
import { act } from "react-dom/test-utils"
import { describe, expect, it, vi } from "vitest"

import { SummaryCards } from "./SummaryCards"

globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe("SummaryCards", () => {
  it("件数と選択中filterを表示しfilter変更を通知する", () => {
    const container = document.createElement("div")
    const root = createRoot(container)
    const onChangeFilter = vi.fn()

    act(() => {
      root.render(
        <SummaryCards
          activeFilter={{ type: "uncategorized" }}
          onChangeFilter={onChangeFilter}
          totalCount={3}
          uncategorizedCount={2}
          visibleCount={2}
        />
      )
    })

    const buttons = container.querySelectorAll("button")

    expect(container.textContent).toContain("全件3")
    expect(container.textContent).toContain("未分類2")
    expect(container.textContent).toContain("表示中2")
    expect(buttons[0]?.getAttribute("aria-pressed")).toBe("false")
    expect(buttons[1]?.getAttribute("aria-pressed")).toBe("true")

    act(() => buttons[0]?.click())
    act(() => buttons[1]?.click())

    expect(onChangeFilter).toHaveBeenNthCalledWith(1, { type: "all" })
    expect(onChangeFilter).toHaveBeenNthCalledWith(2, {
      type: "uncategorized"
    })

    act(() => root.unmount())
  })

  it("分類情報の読み込み中は未分類filterを無効にする", () => {
    const container = document.createElement("div")
    const root = createRoot(container)

    act(() => {
      root.render(
        <SummaryCards
          activeFilter={{ type: "all" }}
          onChangeFilter={() => undefined}
          totalCount={3}
          uncategorizedCount={null}
          visibleCount={3}
        />
      )
    })

    const buttons = container.querySelectorAll("button")

    expect(container.textContent).toContain("未分類-")
    expect(buttons[1]?.disabled).toBe(true)

    act(() => root.unmount())
  })
})
