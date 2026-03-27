import { getVisiblePixelBounds } from "./image-bounds"

const PADDING = 4

/**
 * dataUrl の画像を解析し、非透明ピクセルの最小外接矩形を返す。
 * 全ピクセルが透明な場合は null を返す。
 */
export async function estimateBboxFromDataUrl(
  dataUrl: string,
): Promise<{ offsetX: number; offsetY: number; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img
      if (w === 0 || h === 0) {
        resolve(null)
        return
      }

      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        resolve(null)
        return
      }

      ctx.drawImage(img, 0, 0)
      const { data } = ctx.getImageData(0, 0, w, h)
      const bounds = getVisiblePixelBounds({
        data,
        width: w,
        height: h,
        padding: PADDING,
      })

      if (!bounds) {
        resolve(null)
        return
      }

      resolve({
        offsetX: bounds.x,
        offsetY: bounds.y,
        width: bounds.width,
        height: bounds.height,
      })
    }
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}
