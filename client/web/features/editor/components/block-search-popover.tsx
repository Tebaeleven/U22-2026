"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { getBlockDefs } from "../block-editor/blocks"
import type { BlockDef } from "../block-editor/types"

/** ブロックの表示名をラベルと入力から組み立てる */
function getBlockDisplayName(def: BlockDef): string {
  const parts: string[] = []
  if (def.name) parts.push(def.name)
  for (const input of def.inputs) {
    if (input.type === "label") parts.push(input.text)
  }
  return parts.join(" ") || def.opcode || def.id
}

/** 検索クエリにマッチするかを判定する */
function matchesDef(def: BlockDef, query: string): boolean {
  const q = query.toLowerCase()
  const displayName = getBlockDisplayName(def).toLowerCase()
  if (displayName.includes(q)) return true
  if (def.opcode?.toLowerCase().includes(q)) return true
  if (def.category.toLowerCase().includes(q)) return true
  return false
}

const MAX_VISIBLE = 8
const ITEM_HEIGHT = 36

export function BlockSearchPopover({
  open,
  position,
  onSelect,
  onClose,
}: {
  open: boolean
  position: { x: number; y: number }
  onSelect: (defId: string) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // パレット非表示のブロックを除外して全ブロック定義を取得
  const allDefs = useMemo(() => {
    if (!open) return []
    return getBlockDefs([], []).filter((d) => !d.paletteHidden)
  }, [open])

  const filtered = useMemo(() => {
    if (!query.trim()) return allDefs
    return allDefs.filter((d) => matchesDef(d, query.trim()))
  }, [allDefs, query])

  // 開いたときに状態をリセットしてフォーカス
  useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedIndex(0)
      // 次フレームでフォーカス
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // 選択インデックスが範囲外にならないよう調整
  useEffect(() => {
    if (selectedIndex >= filtered.length) {
      setSelectedIndex(Math.max(0, filtered.length - 1))
    }
  }, [filtered.length, selectedIndex])

  // 選択アイテムをスクロールに追従
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const item = list.children[selectedIndex] as HTMLElement | undefined
    item?.scrollIntoView({ block: "nearest" })
  }, [selectedIndex])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        const def = filtered[selectedIndex]
        if (def) onSelect(def.id)
        return
      }
    },
    [filtered, selectedIndex, onSelect, onClose]
  )

  if (!open) return null

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
        className="absolute flex w-72 flex-col rounded-lg bg-popover shadow-lg ring-1 ring-foreground/10 animate-in fade-in-0 zoom-in-95"
        style={{ left: position.x, top: position.y, transform: "translate(-50%, 0)" }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* 検索入力 */}
        <div className="border-b border-border p-2">
          <input
            ref={inputRef}
            type="text"
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
            placeholder="ブロックを検索..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
          />
        </div>

        {/* 検索結果リスト */}
        <div
          ref={listRef}
          className="overflow-y-auto p-1"
          style={{ maxHeight: MAX_VISIBLE * ITEM_HEIGHT }}
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              一致するブロックがありません
            </div>
          ) : (
            filtered.map((def, index) => (
              <button
                key={def.id}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none select-none ${
                  index === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(def.id)
                }}
              >
                {/* カテゴリカラーの左ボーダー */}
                <span
                  className="h-5 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: def.color }}
                />
                <span className="truncate">{getBlockDisplayName(def)}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {def.category}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
