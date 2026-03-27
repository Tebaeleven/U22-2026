// @ts-expect-error Bun のテストランナー上でのみ解決される
import { describe, expect, it } from "bun:test"
import { shouldReloadTexture } from "./texture-sync"

describe("shouldReloadTexture", () => {
  it("dataUrl がないときは reload しない", () => {
    expect(shouldReloadTexture({
      textureExists: false,
      currentDataUrl: undefined,
      nextDataUrl: undefined,
    })).toBe(false)
  })

  it("テクスチャがまだ存在しないときは reload する", () => {
    expect(shouldReloadTexture({
      textureExists: false,
      currentDataUrl: "before",
      nextDataUrl: "after",
    })).toBe(true)
  })

  it("同じ dataUrl なら位置更新だけでは reload しない", () => {
    expect(shouldReloadTexture({
      textureExists: true,
      currentDataUrl: "same-data-url",
      nextDataUrl: "same-data-url",
    })).toBe(false)
  })

  it("dataUrl が変わったときだけ reload する", () => {
    expect(shouldReloadTexture({
      textureExists: true,
      currentDataUrl: "before",
      nextDataUrl: "after",
    })).toBe(true)
  })
})
