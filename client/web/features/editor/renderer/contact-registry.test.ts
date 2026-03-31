// @ts-expect-error Bun のテストランナー上でのみ解決される
import { describe, expect, test } from "bun:test"
import {
  FrameContactRegistry,
  normalizeContactPairKey,
  parseContactPairKey,
} from "./contact-registry"

describe("contact registry", () => {
  test("callback で記録した pair を正規化して返す", () => {
    const registry = new FrameContactRegistry()

    registry.recordCallback("sprite-b", "sprite-a")

    expect(registry.readPairs()).toEqual([
      { idA: "sprite-a", idB: "sprite-b" },
    ])
  })

  test("callback pair は fallback より優先され、重複しない", () => {
    const registry = new FrameContactRegistry()

    registry.recordCallback("sprite-a", "sprite-b")
    registry.recordFallback("sprite-b", "sprite-a")
    registry.recordFallback("sprite-c", "sprite-d")

    expect(registry.readPairs()).toEqual([
      { idA: "sprite-a", idB: "sprite-b" },
      { idA: "sprite-c", idB: "sprite-d" },
    ])
  })

  test("beginFrame で前フレームの pair をクリアする", () => {
    const registry = new FrameContactRegistry()

    registry.recordCallback("sprite-a", "sprite-b")
    registry.recordFallback("sprite-c", "sprite-d")
    registry.beginFrame()

    expect(registry.readPairs()).toEqual([])
  })

  test("key 正規化 helper は A/B と B/A を同一 key にする", () => {
    expect(normalizeContactPairKey("sprite-a", "sprite-b")).toBe("sprite-a::sprite-b")
    expect(normalizeContactPairKey("sprite-b", "sprite-a")).toBe("sprite-a::sprite-b")
    expect(parseContactPairKey("sprite-a::sprite-b")).toEqual({
      idA: "sprite-a",
      idB: "sprite-b",
    })
  })
})
