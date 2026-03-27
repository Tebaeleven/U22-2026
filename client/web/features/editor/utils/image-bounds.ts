export interface PixelBounds {
  x: number
  y: number
  width: number
  height: number
}

interface VisiblePixelBoundsParams {
  data: ArrayLike<number>
  width: number
  height: number
  alphaThreshold?: number
  padding?: number
}

interface AutoSaveDecisionParams {
  hasOnSave: boolean
  elementCount: number
  contentVersion: number
  lastQueuedContentVersion: number
}

const DEFAULT_ALPHA_THRESHOLD = 10

export function getVisiblePixelBounds({
  data,
  width,
  height,
  alphaThreshold = DEFAULT_ALPHA_THRESHOLD,
  padding = 0,
}: VisiblePixelBoundsParams): PixelBounds | null {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha <= alphaThreshold) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }

  if (maxX < 0 || maxY < 0) {
    return null
  }

  const x = Math.max(0, minX - padding)
  const y = Math.max(0, minY - padding)
  const boundedMaxX = Math.min(width - 1, maxX + padding)
  const boundedMaxY = Math.min(height - 1, maxY + padding)

  return {
    x,
    y,
    width: boundedMaxX - x + 1,
    height: boundedMaxY - y + 1,
  }
}

export function shouldQueueAutoSave({
  hasOnSave,
  elementCount,
  contentVersion,
  lastQueuedContentVersion,
}: AutoSaveDecisionParams): boolean {
  return (
    hasOnSave &&
    elementCount > 0 &&
    contentVersion > lastQueuedContentVersion
  )
}
