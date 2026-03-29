"use client"

import { ArrowUp, ArrowDown, Copy, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { resolveSpriteEmoji, type SpriteDef } from "@/features/editor/constants"

interface HierarchyPanelProps {
  sprites: SpriteDef[]
  selectedSpriteId: string | null
  onSelectSprite: (id: string) => void
  onAddSprite: () => void
  onDeleteSprite: (id: string) => void
  onDuplicateSprite: (id: string) => void
  onMoveSprite?: (id: string, direction: "up" | "down") => void
}

export function HierarchyPanel({
  sprites,
  selectedSpriteId,
  onSelectSprite,
  onAddSprite,
  onDeleteSprite,
  onDuplicateSprite,
  onMoveSprite,
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
              <div
                key={sprite.id}
                role="button"
                tabIndex={0}
                className={`group flex w-full items-center gap-2 border-l-2 px-3 py-1.5 text-left text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 font-medium text-blue-900"
                    : "border-transparent hover:bg-muted/50"
                }`}
                onClick={() => onSelectSprite(sprite.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelectSprite(sprite.id) }}
              >
                <span className="shrink-0 text-sm">{emoji}</span>
                <span className="flex-1 truncate">{sprite.name}</span>
                {!sprite.visible && (
                  <span className="text-muted-foreground/50" title="非表示">
                    👁‍🗨
                  </span>
                )}
                {index > 0 && (
                  <button
                    type="button"
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-blue-500 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); onMoveSprite?.(sprite.id, "up") }}
                    title="上に移動"
                  >
                    <ArrowUp className="size-3" />
                  </button>
                )}
                {index < sprites.length - 1 && (
                  <button
                    type="button"
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-blue-500 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); onMoveSprite?.(sprite.id, "down") }}
                    title="下に移動"
                  >
                    <ArrowDown className="size-3" />
                  </button>
                )}
                <button
                  type="button"
                  className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-blue-500 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDuplicateSprite(sprite.id)
                  }}
                  title="複製"
                >
                  <Copy className="size-3" />
                </button>
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
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
