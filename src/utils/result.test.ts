import { describe, expect, it } from "vitest"

import { createOrganizerError, err, ok, type Result } from "./result"

describe("ok / err", () => {
  it("okは成功のResultを返す", () => {
    const result: Result<number> = ok(42)

    expect(result).toEqual({ ok: true, value: 42 })
  })

  it("errは失敗のResultを返す", () => {
    const error = createOrganizerError("export_failed", "failed to export")
    const result: Result<number> = err(error)

    expect(result).toEqual({ ok: false, error })
  })

  it("判別可能unionとして分岐できる", () => {
    const result: Result<string> = ok("value")

    if (result.ok) {
      expect(result.value).toBe("value")
    } else {
      throw new Error("unreachable")
    }
  })
})

describe("createOrganizerError", () => {
  it("kindとmessageを保持する", () => {
    const error = createOrganizerError("storage_load_failed", "load failed")

    expect(error).toEqual({
      kind: "storage_load_failed",
      message: "load failed"
    })
  })

  it("causeを保持する", () => {
    const cause = new Error("original")
    const error = createOrganizerError("storage_corrupted", "broken", cause)

    expect(error.cause).toBe(cause)
  })

  it("cause未指定時はcauseキーを持たない", () => {
    const error = createOrganizerError("scan_partial", "some cards skipped")

    expect("cause" in error).toBe(false)
  })
})
