"use client"

import { useCallback, useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { Pencil } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BLOCK_CATEGORIES, type BlockCategoryId } from "@/features/editor/constants"
import {
  getPaletteBlockDefs,
  isCBlockShape,
  isInlineReporterVariableInput,
} from "@/features/editor/block-editor/blocks"
import type { BlockDef } from "@/features/editor/block-editor/types"
import { getController, openProcedureEditorForProcedure } from "./block-workspace"

interface BlockPaletteProps {
  selectedCategory: BlockCategoryId
  onSelectCategory: (id: BlockCategoryId) => void
  onAddBlock?: (defId: string) => void
}

function getBlockLabel(def: BlockDef): string {
  if (def.name) return def.name
  const parts = def.inputs.map((input) => {
    if (input.type === "label") return input.text
    if (input.type === "number") return input.placeholder || String(input.default)
    if (input.type === "text") return input.placeholder || `"${input.default}"`
    if (input.type === "variable-name") return input.default
    if (input.type === "param-chip") return input.label
    if (input.type === "dropdown") return input.default
    if (input.type === "boolean-slot") return "◇"
    return "?"
  })
  return parts.join(" ") || "block"
}

function PaletteBlock({
  def,
  onAdd,
  onEditRequest,
}: {
  def: BlockDef
  onAdd: (defId: string) => void
  onEditRequest?: (procedureId: string, x: number, y: number) => void
}) {
  const label = getBlockLabel(def)
  const isCBlock = isCBlockShape(def.shape)
  const isValue = def.shape === "reporter" || def.shape === "boolean"

  const renderInputPreviews = () =>
    def.inputs.map((input, index) => {
      if (input.type === "label") {
        return (
          <span key={index} className="text-white/80 text-[11px]">
            {input.text}
          </span>
        )
      }
      if (input.type === "number" || input.type === "text") {
        const text =
          input.placeholder || (input.type === "number" ? String(input.default) : input.default)
        return (
          <span
            key={index}
            className="inline-block rounded-full bg-white/25 px-1.5 text-[11px] text-white min-w-[36px] h-[18px] leading-[18px]"
          >
            {text || "..."}
          </span>
        )
      }
      if (isInlineReporterVariableInput(input)) {
        return (
          <span
            key={index}
            className="inline-flex items-center justify-center rounded-full border border-black/15 bg-white/20 px-2 text-[11px] font-semibold text-white min-w-[28px] h-[18px] leading-[18px]"
          >
            {input.default}
          </span>
        )
      }
      if (input.type === "variable-name" || input.type === "param-chip") {
        return (
          <span
            key={index}
            className="inline-block rounded-full border border-white/25 bg-white/18 px-2 text-[11px] text-white min-w-[32px] h-[18px] leading-[18px]"
          >
            {input.type === "variable-name" ? input.default : input.label}
          </span>
        )
      }
      if (input.type === "dropdown") {
        return (
          <span
            key={index}
            className="inline-block rounded-full bg-white/25 px-1.5 text-[11px] text-white min-w-[36px] h-[18px] leading-[18px]"
          >
            {input.default} ▾
          </span>
        )
      }
      if (input.type === "boolean-slot") {
        return (
          <span
            key={index}
            className="inline-block w-[24px] h-[16px] bg-black/20"
            style={{
              clipPath:
                "polygon(6px 0%, calc(100% - 6px) 0%, 100% 50%, calc(100% - 6px) 100%, 6px 100%, 0% 50%)",
            }}
          />
        )
      }
      return null
    })

  const baseClasses =
    "cursor-pointer select-none transition-all hover:brightness-110 active:scale-[0.97] border-2 border-black/15 shadow-sm"

  const handleContextMenu =
    onEditRequest && def.source.kind === "custom-call"
      ? (e: React.MouseEvent) => {
          e.preventDefault()
          onEditRequest((def.source as import("@/features/editor/block-editor/types").CustomCallBlockSource).procedureId, e.clientX, e.clientY)
        }
      : undefined

  if (def.shape === "hat") {
    return (
      <div
        onClick={() => onAdd(def.id)}
        onContextMenu={handleContextMenu}
        className={`${baseClasses} rounded-t-[16px] rounded-b`}
        style={{ backgroundColor: def.color }}
      >
        <div className="flex items-center gap-1.5 px-3 h-[38px] text-[12px] font-medium text-white">
          {label && <span>{label}</span>}
          {renderInputPreviews()}
        </div>
      </div>
    )
  }

  if (isValue) {
    const isBoolean = def.shape === "boolean"
    return (
      <div
        onClick={() => onAdd(def.id)}
        onContextMenu={handleContextMenu}
        className={`${baseClasses} inline-flex self-start ${isBoolean ? "" : "rounded-full"}`}
        style={{
          backgroundColor: def.color,
          ...(isBoolean
            ? {
                clipPath:
                  "polygon(10px 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0% 50%)",
                border: "none",
              }
            : {}),
        }}
      >
        <div className="flex items-center gap-1.5 px-3 h-[26px] text-[12px] font-medium text-white">
          {label && <span>{label}</span>}
          {renderInputPreviews()}
        </div>
      </div>
    )
  }

  if (isCBlock) {
    return (
      <div
        onClick={() => onAdd(def.id)}
        onContextMenu={handleContextMenu}
        className={`${baseClasses} rounded`}
        style={{ backgroundColor: def.color }}
      >
        <div className="flex items-center gap-1.5 px-3 h-[30px] text-[12px] font-medium text-white">
          {label && <span>{label}</span>}
          {renderInputPreviews()}
        </div>
        <div className="mx-3 mb-1 rounded border border-dashed border-white/25 bg-white/8 h-[20px]" />
        {def.shape === "c-block-else" && (
          <>
            <div className="px-3 text-[10px] text-white/70 leading-[18px]">
              else
            </div>
            <div className="mx-3 mb-1 rounded border border-dashed border-white/25 bg-white/8 h-[20px]" />
          </>
        )}
        <div className="h-[10px]" />
      </div>
    )
  }

  return (
    <div
      onClick={() => onAdd(def.id)}
      onContextMenu={handleContextMenu}
      className={`${baseClasses} rounded`}
      style={{ backgroundColor: def.color }}
    >
      <div className="flex items-center gap-1.5 px-3 h-[32px] text-[12px] font-medium text-white">
        {label && <span>{label}</span>}
        {renderInputPreviews()}
      </div>
    </div>
  )
}

type PaletteContextMenuState = { x: number; y: number; procedureId: string } | null

export function BlockPalette({
  selectedCategory,
  onSelectCategory,
  onAddBlock,
}: BlockPaletteProps) {
  const controller = getController()
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot
  )
  const filteredBlocks = getPaletteBlockDefs(
    selectedCategory,
    snapshot.customProcedures
  )

  const [paletteContextMenu, setPaletteContextMenu] = useState<PaletteContextMenuState>(null)

  const handleAdd = useCallback(
    (defId: string) => {
      onAddBlock?.(defId)
    },
    [onAddBlock]
  )

  const handleEditRequest = useCallback(
    (procedureId: string, x: number, y: number) => {
      setPaletteContextMenu({ x, y, procedureId })
    },
    []
  )

  return (
    <div className="flex h-full flex-col bg-[#f9f9f9]">
      <div className="flex flex-wrap gap-1 p-2 border-b">
        {BLOCK_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-white transition-opacity"
            style={{
              backgroundColor: cat.color,
              opacity: selectedCategory === cat.id ? 1 : 0.6,
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1.5 p-2">
          {filteredBlocks.map((def) => (
            <PaletteBlock
              key={def.id}
              def={def}
              onAdd={handleAdd}
              onEditRequest={handleEditRequest}
            />
          ))}
          {filteredBlocks.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-4">
              ブロックなし
            </div>
          )}
        </div>
      </ScrollArea>

      {paletteContextMenu && createPortal(
        <div
          className="fixed inset-0 z-[9999]"
          onClick={() => setPaletteContextMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setPaletteContextMenu(null) }}
        >
          <div
            className="absolute min-w-36 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 animate-in fade-in-0 zoom-in-95"
            style={{ left: paletteContextMenu.x, top: paletteContextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                openProcedureEditorForProcedure(
                  paletteContextMenu.procedureId,
                  paletteContextMenu.x,
                  paletteContextMenu.y + 8,
                )
                setPaletteContextMenu(null)
              }}
            >
              <Pencil className="!size-4 shrink-0" />
              編集
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
