"use client"

import Image from "next/image"
import {
  Plus,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { resolveSpriteEmoji, type SpriteDef } from "@/features/editor/constants"

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
      <SpritesTab
        sprites={sprites}
        selectedSpriteId={selectedSpriteId}
        onSelectSprite={onSelectSprite}
        onAddSprite={onAddSprite}
        onDeleteSprite={onDeleteSprite}
      />
    </div>
  )
}

// ─── スプライト一覧タブ ────────────────────────────

function SpritesTab({
  sprites,
  selectedSpriteId,
  onSelectSprite,
  onAddSprite,
  onDeleteSprite,
}: {
  sprites: SpriteDef[]
  selectedSpriteId: string
  onSelectSprite: (id: string) => void
  onAddSprite: () => void
  onDeleteSprite: (id: string) => void
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <span className="text-xs font-semibold text-muted-foreground">
          スプライト一覧
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
      <ScrollArea className="flex-1">
        <div className="flex flex-wrap gap-2 p-2">
          {sprites.map((sprite, index) => {
            const thumb =
              sprite.costumes[sprite.currentCostumeIndex]?.dataUrl
            const emoji = resolveSpriteEmoji(sprite, index)
            return (
              <div
                key={sprite.id}
                onClick={() => onSelectSprite(sprite.id)}
                className={`group relative flex w-16 flex-col items-center gap-1 rounded-lg border-2 p-2 cursor-pointer transition-colors ${
                  selectedSpriteId === sprite.id
                    ? "border-[#4d97ff] bg-blue-50"
                    : "border-transparent hover:border-gray-200"
                }`}
              >
                {thumb ? (
                  <Image
                    src={thumb}
                    alt={sprite.name}
                    width={40}
                    height={40}
                    unoptimized
                    className="h-10 w-10 object-contain"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-2xl">
                    <span aria-hidden>{emoji}</span>
                  </div>
                )}
                <span className="text-[10px] text-center truncate w-full">
                  {sprite.name}
                </span>
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
            )
          })}
        </div>
      </ScrollArea>
    </>
  )
}
