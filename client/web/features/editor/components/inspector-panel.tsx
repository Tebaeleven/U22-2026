"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  resolveSpriteEmoji,
  type SpriteDef,
  type ColliderDef,
} from "@/features/editor/constants"

interface InspectorPanelProps {
  sprite: SpriteDef | null
  spriteIndex: number
  onUpdate: (id: string, changes: Partial<SpriteDef>) => void
  onSetCollider: (id: string, collider: ColliderDef) => void
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  suffix?: string
}) {
  return (
    <div className="grid grid-cols-[4rem_1fr] items-center gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.currentTarget.value))}
          className="h-7 text-xs"
        />
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  )
}

export function InspectorPanel({
  sprite,
  spriteIndex,
  onUpdate,
  onSetCollider,
}: InspectorPanelProps) {
  const [colliderOpen, setColliderOpen] = useState(false)

  if (!sprite) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        スプライトを選択してください
      </div>
    )
  }

  const emoji = resolveSpriteEmoji(sprite, spriteIndex)
  const costume = sprite.costumes[sprite.currentCostumeIndex]
  const collider = sprite.collider

  const updateCollider = (changes: Partial<ColliderDef>) => {
    onSetCollider(sprite.id, { ...collider, ...changes })
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-3 text-sm">
        {/* ヘッダー */}
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="font-medium">{sprite.name}</span>
        </div>

        <Separator />

        {/* トランスフォーム */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            トランスフォーム
          </h3>
          <NumberField
            label="X"
            value={sprite.x}
            onChange={(v) => onUpdate(sprite.id, { x: v })}
          />
          <NumberField
            label="Y"
            value={sprite.y}
            onChange={(v) => onUpdate(sprite.id, { y: v })}
          />
          <NumberField
            label="サイズ"
            value={sprite.size}
            onChange={(v) => onUpdate(sprite.id, { size: v })}
          />
          <NumberField
            label="向き"
            value={sprite.direction}
            onChange={(v) => onUpdate(sprite.id, { direction: v })}
            suffix="°"
          />
        </section>

        <Separator />

        {/* 表示 */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            表示
          </h3>
          <div className="grid grid-cols-[4rem_1fr] items-center gap-1">
            <Label className="text-xs text-muted-foreground">表示</Label>
            <Switch
              checked={sprite.visible}
              onCheckedChange={(v) => onUpdate(sprite.id, { visible: v })}
            />
          </div>
          <div className="grid grid-cols-[4rem_1fr] items-center gap-1">
            <Label className="text-xs text-muted-foreground">衣装</Label>
            <span className="text-xs truncate">{costume?.name ?? "なし"}</span>
          </div>
        </section>

        <Separator />

        {/* 当たり判定（折りたたみ） */}
        <section>
          <button
            type="button"
            className="flex w-full items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
            onClick={() => setColliderOpen(!colliderOpen)}
          >
            <ChevronRight
              className={`size-3 transition-transform ${colliderOpen ? "rotate-90" : ""}`}
            />
            当たり判定
          </button>
          {colliderOpen && (
            <div className="mt-2 space-y-2 pl-4">
              <div className="grid grid-cols-[4rem_1fr] items-center gap-1">
                <Label className="text-xs text-muted-foreground">タイプ</Label>
                <select
                  value={collider.type}
                  onChange={(e) =>
                    updateCollider({ type: e.currentTarget.value as ColliderDef["type"] })
                  }
                  className="h-7 rounded border bg-background px-2 text-xs"
                >
                  <option value="bbox">バウンディングボックス</option>
                  <option value="circle">円</option>
                </select>
              </div>
              {collider.type === "bbox" && (
                <>
                  <NumberField
                    label="X offset"
                    value={collider.offsetX ?? 0}
                    onChange={(v) => updateCollider({ offsetX: v })}
                  />
                  <NumberField
                    label="Y offset"
                    value={collider.offsetY ?? 0}
                    onChange={(v) => updateCollider({ offsetY: v })}
                  />
                  <NumberField
                    label="幅"
                    value={collider.width ?? costume?.width ?? 0}
                    onChange={(v) => updateCollider({ width: v })}
                  />
                  <NumberField
                    label="高さ"
                    value={collider.height ?? costume?.height ?? 0}
                    onChange={(v) => updateCollider({ height: v })}
                  />
                </>
              )}
              {collider.type === "circle" && (
                <NumberField
                  label="半径"
                  value={collider.radius ?? 0}
                  onChange={(v) => updateCollider({ radius: v })}
                />
              )}
            </div>
          )}
        </section>
      </div>
    </ScrollArea>
  )
}
