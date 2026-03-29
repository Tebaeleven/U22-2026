"use client"

import { useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Copy, Pencil, Trash2, ListX } from "lucide-react"

export type BlockContextMenuState = {
  blockId: string
  x: number
  y: number
  procedureId?: string
} | null

export function BlockContextMenu({
  state,
  onClose,
  onDelete,
  onDeleteChain,
  onDuplicate,
  onEdit,
}: {
  state: BlockContextMenuState
  onClose: () => void
  onDelete: (blockId: string) => void
  onDeleteChain?: (blockId: string) => void
  onDuplicate: (blockId: string) => void
  onEdit?: (blockId: string) => void
}) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (!state) return
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [state, handleKeyDown])

  if (!state) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999]"
      onClick={onClose}
      onContextMenu={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      <div
        className="absolute min-w-36 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 animate-in fade-in-0 zoom-in-95"
        style={{ left: state.x, top: state.y }}
        onClick={(e) => e.stopPropagation()}
      >
        {onEdit && (
          <>
            <button
              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                onEdit(state.blockId)
                onClose()
              }}
            >
              <Pencil className="!size-4 shrink-0" />
              編集
            </button>
            <div className="-mx-1 my-1 h-px bg-border" />
          </>
        )}
        <button
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground"
          onClick={() => {
            onDuplicate(state.blockId)
            onClose()
          }}
        >
          <Copy className="!size-4 shrink-0" />
          複製
        </button>
        <div className="-mx-1 my-1 h-px bg-border" />
        <button
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-destructive outline-hidden select-none hover:bg-destructive/10"
          onClick={() => {
            onDelete(state.blockId)
            onClose()
          }}
        >
          <Trash2 className="!size-4 shrink-0" />
          削除
        </button>
        {onDeleteChain && (
          <button
            className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-destructive outline-hidden select-none hover:bg-destructive/10"
            onClick={() => {
              onDeleteChain(state.blockId)
              onClose()
            }}
          >
            <ListX className="!size-4 shrink-0" />
            チェーンごと削除
          </button>
        )}
      </div>
    </div>,
    document.body
  )
}
