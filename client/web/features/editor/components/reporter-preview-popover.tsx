"use client"

import { useEffect } from "react"
import { createPortal } from "react-dom"

export type ReporterPreviewState = {
  blockId: string
  x: number
  y: number
  value: string
} | null

export function ReporterPreviewPopover({
  state,
  onClose,
}: {
  state: ReporterPreviewState
  onClose: () => void
}) {
  useEffect(() => {
    if (!state) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [onClose, state])

  if (!state) return null

  return createPortal(
    <div className="fixed inset-0 z-[9998]" onClick={onClose}>
      <div
        className="absolute max-w-[280px] rounded-2xl border border-zinc-200 bg-white px-3 py-2 shadow-lg"
        style={{ left: state.x, top: state.y }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
          Reporter Value
        </div>
        <div className="mt-1 break-all text-sm font-medium text-zinc-900">
          {state.value}
        </div>
      </div>
    </div>,
    document.body
  )
}
