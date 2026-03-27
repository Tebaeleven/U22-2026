"use client"

import Image from "next/image"
import { useCallback } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DrawingCanvas } from "./drawing-canvas"
import { resolveSpriteEmoji, type SpriteDef, type Costume } from "@/features/editor/constants"
import { estimateBboxFromDataUrl } from "@/features/editor/utils/estimate-bbox"

interface CostumeEditorProps {
  sprite: SpriteDef
  spriteIndex: number
  onAddCostume: () => void
  onDeleteCostume: (costumeId: string) => void
  onSelectCostume: (index: number) => void
  onSaveCostume: (costumeId: string, dataUrl: string, width: number, height: number) => void
  onAutoEstimateCollider?: (bbox: { offsetX: number; offsetY: number; width: number; height: number }) => void
}

/**
 * Scratch 風コスチュームエディタ
 * 左: コスチューム一覧（サムネイル）
 * 右: お絵描きキャンバス
 */
export function CostumeEditor({
  sprite,
  spriteIndex,
  onAddCostume,
  onDeleteCostume,
  onSelectCostume,
  onSaveCostume,
  onAutoEstimateCollider,
}: CostumeEditorProps) {
  const currentCostume = sprite.costumes[sprite.currentCostumeIndex]

  const handleSave = useCallback(
    async (dataUrl: string, width: number, height: number) => {
      if (!currentCostume) return
      onSaveCostume(currentCostume.id, dataUrl, width, height)
      if (onAutoEstimateCollider) {
        const bbox = await estimateBboxFromDataUrl(dataUrl)
        if (bbox) onAutoEstimateCollider(bbox)
      }
    },
    [currentCostume, onSaveCostume, onAutoEstimateCollider]
  )

  return (
    <div className="flex h-full w-full">
      {/* 左: コスチューム一覧 */}
      <div className="w-[100px] min-w-[100px] border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-200">
          <span className="text-[10px] font-semibold text-muted-foreground">
            コスチューム
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onAddCostume}
            className="text-[#4d97ff] h-5 w-5"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-1 p-1.5">
            {sprite.costumes.map((costume, idx) => (
              <CostumeThumbnail
                key={costume.id}
                costume={costume}
                index={idx}
                emoji={resolveSpriteEmoji(sprite, spriteIndex)}
                isSelected={sprite.currentCostumeIndex === idx}
                canDelete={sprite.costumes.length > 1}
                onSelect={() => onSelectCostume(idx)}
                onDelete={() => onDeleteCostume(costume.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* 右: お絵描きキャンバス */}
      <div className="flex-1 min-w-0">
        {currentCostume ? (
          <DrawingCanvas
            key={currentCostume.id}
            onSave={handleSave}
            initialDataUrl={currentCostume.dataUrl}
            collider={sprite.collider}
            costumeSize={{ width: currentCostume.width, height: currentCostume.height }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            コスチュームを追加してください
          </div>
        )}
      </div>
    </div>
  )
}

function CostumeThumbnail({
  costume,
  index,
  emoji,
  isSelected,
  canDelete,
  onSelect,
  onDelete,
}: {
  costume: Costume
  index: number
  emoji: string
  isSelected: boolean
  canDelete: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  return (
    <div
      onClick={onSelect}
      className={`group relative flex flex-col items-center rounded-md border-2 p-1 cursor-pointer transition-colors ${
        isSelected
          ? "border-[#4d97ff] bg-blue-50"
          : "border-transparent hover:border-gray-200"
      }`}
    >
      <span className="absolute top-0.5 left-1 text-[9px] text-gray-400">
        {index + 1}
      </span>
      {costume.dataUrl ? (
        <Image
          src={costume.dataUrl}
          alt={costume.name}
          width={56}
          height={56}
          unoptimized
          className="w-14 h-14 object-contain"
        />
      ) : (
        <div className="w-14 h-14 flex items-center justify-center text-3xl">
          <span aria-hidden>{emoji}</span>
        </div>
      )}
      <span className="text-[9px] text-gray-500 truncate w-full text-center">
        {costume.name}
      </span>
      {canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute -top-1 -right-1 hidden group-hover:flex size-3.5 items-center justify-center rounded-full bg-red-500 text-white"
        >
          <Trash2 className="size-2" />
        </button>
      )}
    </div>
  )
}
