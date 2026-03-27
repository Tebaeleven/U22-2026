"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { SpriteDef } from "@/features/editor/constants"

interface SpriteListProps {
  sprites: SpriteDef[]
  selectedSpriteId: string
  onSelectSprite: (id: string) => void
  onAddSprite: () => void
  onDeleteSprite: (id: string) => void
}

export function SpriteList({
  sprites,
  selectedSpriteId,
  onSelectSprite,
  onAddSprite,
  onDeleteSprite,
}: SpriteListProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <span className="text-xs font-semibold text-muted-foreground">
          スプライト
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onAddSprite}
          className="text-[#4d97ff]"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {/* スプライト一覧 */}
      <ScrollArea className="flex-1">
        <div className="flex flex-wrap gap-2 p-2">
          {sprites.map((sprite) => (
            <div
              key={sprite.id}
              onClick={() => onSelectSprite(sprite.id)}
              className={`group relative flex w-16 flex-col items-center gap-1 rounded-lg border-2 p-2 cursor-pointer transition-colors ${
                selectedSpriteId === sprite.id
                  ? "border-[#4d97ff] bg-blue-50"
                  : "border-transparent hover:border-gray-200"
              }`}
            >
              <span className="text-2xl">{sprite.emoji}</span>
              <span className="text-[10px] text-center truncate w-full">
                {sprite.name}
              </span>

              {/* 削除ボタン */}
              {sprites.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteSprite(sprite.id)
                  }}
                  className="absolute -top-1 -right-1 hidden group-hover:flex size-4 items-center justify-center rounded-full bg-red-500 text-white"
                >
                  <Trash2 className="size-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
