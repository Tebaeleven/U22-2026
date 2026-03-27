// @ts-expect-error Bun のテストランナー上でのみ解決される
import { describe, expect, test } from "bun:test"
import { getVisiblePixelBounds, shouldQueueAutoSave } from "./image-bounds"

function createTransparentPixels(width: number, height: number) {
  return new Uint8ClampedArray(width * height * 4)
}

function setOpaquePixel(
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
) {
  data[(y * width + x) * 4 + 3] = 255
}

describe("getVisiblePixelBounds", () => {
  test("透明余白を除いた可視領域を返す", () => {
    const width = 6
    const height = 5
    const data = createTransparentPixels(width, height)
    setOpaquePixel(data, width, 2, 1)
    setOpaquePixel(data, width, 3, 2)

    expect(getVisiblePixelBounds({ data, width, height })).toEqual({
      x: 2,
      y: 1,
      width: 2,
      height: 2,
    })
  })

  test("完全透明なら null を返す", () => {
    const width = 4
    const height = 4
    const data = createTransparentPixels(width, height)

    expect(getVisiblePixelBounds({ data, width, height })).toBeNull()
  })

  test("padding を含めた外接矩形を返す", () => {
    const width = 6
    const height = 5
    const data = createTransparentPixels(width, height)
    setOpaquePixel(data, width, 2, 1)
    setOpaquePixel(data, width, 3, 2)

    expect(getVisiblePixelBounds({ data, width, height, padding: 1 })).toEqual({
      x: 1,
      y: 0,
      width: 4,
      height: 4,
    })
  })
})

describe("shouldQueueAutoSave", () => {
  test("内容バージョンが進んだときだけ auto-save を許可する", () => {
    expect(shouldQueueAutoSave({
      hasOnSave: true,
      elementCount: 2,
      contentVersion: 3,
      lastQueuedContentVersion: 2,
    })).toBe(true)
  })

  test("同じ内容バージョンなら再計測だけでは auto-save しない", () => {
    expect(shouldQueueAutoSave({
      hasOnSave: true,
      elementCount: 2,
      contentVersion: 3,
      lastQueuedContentVersion: 3,
    })).toBe(false)
  })
})
