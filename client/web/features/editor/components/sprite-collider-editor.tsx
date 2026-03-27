"use client"

import { useState } from "react"
import { Box, CircleDot, Wand2 } from "lucide-react"
import type { ColliderDef, ColliderType, SpriteDef } from "@/features/editor/constants"
import { estimateBboxFromDataUrl } from "@/features/editor/utils/estimate-bbox"

interface SpriteColliderEditorProps {
  sprite: SpriteDef
  onSetCollider: (collider: ColliderDef) => void
  currentCostumeDataUrl?: string
}

export function SpriteColliderEditor({
  sprite,
  onSetCollider,
  currentCostumeDataUrl,
}: SpriteColliderEditorProps) {
  const collider = sprite.collider
  const [isEstimating, setIsEstimating] = useState(false)

  const setType = (type: ColliderType) => {
    onSetCollider({ ...collider, type })
  }

  const handleAutoEstimate = async () => {
    if (!currentCostumeDataUrl) return
    setIsEstimating(true)
    try {
      const bbox = await estimateBboxFromDataUrl(currentCostumeDataUrl)
      if (bbox) {
        onSetCollider({ type: "bbox", ...bbox })
      }
    } finally {
      setIsEstimating(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <div>
        <p className="mb-2 text-xs font-semibold text-muted-foreground">
          判定タイプ
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setType("bbox")}
            className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${
              collider.type === "bbox"
                ? "border-[#4d97ff] bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <Box size={14} />
            矩形 (BBox)
          </button>
          <button
            onClick={() => setType("circle")}
            className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${
              collider.type === "circle"
                ? "border-[#4d97ff] bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <CircleDot size={14} />
            円形
          </button>
          {currentCostumeDataUrl && (
            <button
              onClick={handleAutoEstimate}
              disabled={isEstimating}
              className="flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wand2 size={14} />
              {isEstimating ? "推定中..." : "自動推定"}
            </button>
          )}
        </div>
      </div>

      {collider.type === "bbox" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            サイズ（空欄でコスチュームに合わせる）
          </p>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="幅"
              value={collider.width}
              onChange={(value) => onSetCollider({ ...collider, width: value })}
            />
            <NumberInput
              label="高さ"
              value={collider.height}
              onChange={(value) => onSetCollider({ ...collider, height: value })}
            />
            <NumberInput
              label="X オフセット"
              value={collider.offsetX}
              onChange={(value) => onSetCollider({ ...collider, offsetX: value })}
            />
            <NumberInput
              label="Y オフセット"
              value={collider.offsetY}
              onChange={(value) => onSetCollider({ ...collider, offsetY: value })}
            />
          </div>
        </div>
      )}

      {collider.type === "circle" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            半径（空欄でコスチュームに合わせる）
          </p>
          <NumberInput
            label="半径"
            value={collider.radius}
            onChange={(value) => onSetCollider({ ...collider, radius: value })}
          />
        </div>
      )}
    </div>
  )
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | undefined
  onChange: (value: number | undefined) => void
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] text-gray-400">{label}</span>
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => {
          const nextValue = e.target.value
          onChange(nextValue === "" ? undefined : Number(nextValue))
        }}
        placeholder="自動"
        className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-[#4d97ff] focus:outline-none"
      />
    </label>
  )
}
