// jsdom は innerText を実装していないため、textContent ベースで近似する。
// 実ブラウザとの差（非表示要素の除外等）は許容し、可視性依存のテストは書かない。
if (!("innerText" in HTMLElement.prototype)) {
  Object.defineProperty(HTMLElement.prototype, "innerText", {
    configurable: true,
    get(this: HTMLElement) {
      return this.textContent ?? ""
    },
    set(this: HTMLElement, value: string) {
      this.textContent = value
    }
  })
}

export {}
