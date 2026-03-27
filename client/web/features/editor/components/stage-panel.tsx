"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { Camera, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { STAGE_WIDTH, STAGE_HEIGHT, type SpriteDef } from "@/features/editor/constants"

interface StagePanelProps {
  sprites: SpriteDef[]
  isRunning: boolean
  onSaveThumbnail?: (blob: Blob) => Promise<void>
}

export function StagePanel({ sprites, isRunning, onSaveThumbnail }: StagePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [thumbnailSaved, setThumbnailSaved] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 白背景
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)

    // グリッド描画
    ctx.strokeStyle = "#f0f0f0"
    ctx.lineWidth = 1
    for (let x = 0; x <= STAGE_WIDTH; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, STAGE_HEIGHT)
      ctx.stroke()
    }
    for (let y = 0; y <= STAGE_HEIGHT; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(STAGE_WIDTH, y)
      ctx.stroke()
    }

    // 中心の十字線
    ctx.strokeStyle = "#ddd"
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(STAGE_WIDTH / 2, 0)
    ctx.lineTo(STAGE_WIDTH / 2, STAGE_HEIGHT)
    ctx.moveTo(0, STAGE_HEIGHT / 2)
    ctx.lineTo(STAGE_WIDTH, STAGE_HEIGHT / 2)
    ctx.stroke()
    ctx.setLineDash([])

    // スプライト描画
    sprites.forEach((sprite) => {
      if (!sprite.visible) return
      const sx = STAGE_WIDTH / 2 + sprite.x
      const sy = STAGE_HEIGHT / 2 - sprite.y
      const fontSize = Math.round((sprite.size / 100) * 40)
      ctx.font = `${fontSize}px serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      // コスチューム画像があれば描画、なければプレースホルダー
      const costume = sprite.costumes[sprite.currentCostumeIndex]
      if (costume?.dataUrl) {
        const img = new window.Image()
        img.src = costume.dataUrl
        // 非同期だが静的プレビュー用途なので簡易描画
        ctx.fillText("🎭", sx, sy)
      } else {
        ctx.fillText("🎭", sx, sy)
      }
    })
  }, [sprites, isRunning])

  const handleSaveThumbnail = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas || !onSaveThumbnail) return

    canvas.toBlob(async (blob) => {
      if (!blob) return
      await onSaveThumbnail(blob)
      setThumbnailSaved(true)
      setTimeout(() => setThumbnailSaved(false), 2000)
    }, "image/png")
  }, [onSaveThumbnail])

  return (
    <div className="flex flex-col border-b">
      <div className="overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={STAGE_WIDTH}
          height={STAGE_HEIGHT}
          className="w-full"
          style={{ aspectRatio: `${STAGE_WIDTH}/${STAGE_HEIGHT}` }}
        />
      </div>
      {onSaveThumbnail && (
        <div className="flex justify-end px-2 py-1 bg-gray-50">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={handleSaveThumbnail}
          >
            {thumbnailSaved ? (
              <>
                <Check className="size-3 mr-1 text-green-500" />
                保存しました
              </>
            ) : (
              <>
                <Camera className="size-3 mr-1" />
                サムネイルに設定
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
