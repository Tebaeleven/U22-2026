"use client"

import { useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { SpriteDef } from "@/features/editor/constants"

const THUMBNAIL_SIZE = 48

interface AssetBrowserProps {
  sprites: SpriteDef[]
}

export function AssetBrowser({ sprites }: AssetBrowserProps) {
  const totalCostumes = useMemo(
    () => sprites.reduce((sum, s) => sum + s.costumes.length, 0),
    [sprites],
  )

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b px-3 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          アセット ({totalCostumes})
        </span>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-2">
          {sprites.map((sprite) => (
            <div key={sprite.id} className="mb-3 last:mb-0">
              <div className="mb-1 flex items-center gap-1.5 px-1">
                {sprite.emoji && (
                  <span className="text-xs">{sprite.emoji}</span>
                )}
                <span className="text-[11px] font-medium text-foreground truncate">
                  {sprite.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  ({sprite.costumes.length})
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 px-1">
                {sprite.costumes.map((costume) => (
                  <CostumeThumbnail
                    key={costume.id}
                    name={costume.name}
                    dataUrl={costume.dataUrl}
                    emoji={sprite.emoji}
                  />
                ))}
              </div>
            </div>
          ))}

          {sprites.length === 0 && (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
              スプライトがありません
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function CostumeThumbnail({
  name,
  dataUrl,
  emoji,
}: {
  name: string
  dataUrl: string
  emoji?: string
}) {
  const hasImage = dataUrl && dataUrl.length > 0

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className="flex items-center justify-center rounded border border-border bg-muted/50"
        style={{ width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE }}
      >
        {hasImage ? (
          <img
            src={dataUrl}
            alt={name}
            className="max-h-full max-w-full object-contain"
            draggable={false}
          />
        ) : (
          <span className="text-lg leading-none select-none">
            {emoji ?? "?"}
          </span>
        )}
      </div>
      <span className="w-full truncate text-center text-[9px] text-muted-foreground">
        {name}
      </span>
    </div>
  )
}
