"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { resolveSpriteEmoji, type SpriteDef } from "@/features/editor/constants"

interface HierarchyPanelProps {
  sprites: SpriteDef[]
  selectedSpriteId: string | null
  onSelectSprite: (id: string) => void
  onAddSprite: () => void
  onDeleteSprite: (id: string) => void
}

export function HierarchyPanel({
  sprites,
  selectedSpriteId,
  onSelectSprite,
  onAddSprite,
  onDeleteSprite,
}: HierarchyPanelProps) {
  return (
    <div className="flex h-full flex-col text-sm">
      <div className="flex items-center justify-between border-b px-2 py-1">
        <span className="text-xs text-muted-foreground">シーン</span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-6"
          onClick={onAddSprite}
          title="スプライトを追加"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-0.5">
          {sprites.map((sprite, index) => {
            const isSelected = sprite.id === selectedSpriteId
            const emoji = resolveSpriteEmoji(sprite, index)
            return (
              <button
                key={sprite.id}
                type="button"
                className={`group flex w-full items-center gap-2 border-l-2 px-3 py-1.5 text-left text-xs transition-colors ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 font-medium text-blue-900"
                    : "border-transparent hover:bg-muted/50"
                }`}
                onClick={() => onSelectSprite(sprite.id)}
              >
                <span className="shrink-0 text-sm">{emoji}</span>
                <span className="flex-1 truncate">{sprite.name}</span>
                {!sprite.visible && (
                  <span className="text-muted-foreground/50" title="非表示">
                    👁‍🗨
                  </span>
                )}
                {sprites.length > 1 && (
                  <button
                    type="button"
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteSprite(sprite.id)
                    }}
                    title="削除"
                  >
                    <Trash2 className="size-3" />
                  </button>
                )}
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
