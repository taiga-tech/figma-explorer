import { createRoot } from "react-dom/client"
import { act } from "react-dom/test-utils"
import { describe, expect, it, vi } from "vitest"

import { SearchBox } from "./SearchBox"

globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe("SearchBox", () => {
  it("検索文字列の変更とクリアを通知する", () => {
    const container = document.createElement("div")
    const root = createRoot(container)
    const onQueryChange = vi.fn()

    act(() => {
      root.render(<SearchBox query="Draft" onQueryChange={onQueryChange} />)
    })

    const input = container.querySelector("input")
    const clearButton = container.querySelector("button")

    expect(input?.getAttribute("role")).toBe("searchbox")
    expect(input?.getAttribute("aria-label")).toBe("ファイル名で検索")

    act(() => {
      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      )?.set

      valueSetter?.call(input, "Dashboard")
      input?.dispatchEvent(new Event("input", { bubbles: true }))
    })
    act(() => clearButton?.click())

    expect(onQueryChange).toHaveBeenNthCalledWith(1, "Dashboard")
    expect(onQueryChange).toHaveBeenNthCalledWith(2, "")

    act(() => root.unmount())
  })

  it("空の検索条件ではクリア操作を無効にする", () => {
    const htmlContainer = document.createElement("div")
    const root = createRoot(htmlContainer)

    act(() => {
      root.render(<SearchBox query="" onQueryChange={() => undefined} />)
    })

    expect(htmlContainer.querySelector("button")?.disabled).toBe(true)

    act(() => root.unmount())
  })
})
