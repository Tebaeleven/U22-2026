"use client"

import { useState, useRef, useEffect } from "react"
import type { DiagramNote } from "../types"

const NOTE_BG = "#FEF9C3"
const NOTE_BORDER = "#D4D4D8"
const NOTE_FOLD = "#FDE68A"
const NOTE_FOLD_SIZE = 10
const NOTE_LINE_HEIGHT = 18
const NOTE_PADDING_Y = 12
const NOTE_MIN_HEIGHT = 40

type DiagramNoteProps = {
  note: DiagramNote
  isSelected: boolean
  onClick: () => void
  onTextChange: (text: string) => void
  onRemove: () => void
}

/** モダンな黄色ノートコンポーネント（右上折れ角付き） */
export function DiagramNoteCard({
  note,
  isSelected,
  onClick,
  onTextChange,
  onRemove,
}: DiagramNoteProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note.text)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [editing])

  const commitEdit = () => {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed && trimmed !== note.text) {
      onTextChange(trimmed)
    } else {
      setDraft(note.text)
    }
  }

  const borderColor = isSelected ? "#3B82F6" : NOTE_BORDER

  // テキスト内容からノートの高さを計算
  const displayText = editing ? draft : note.text
  const lineCount = Math.max(displayText.split("\n").length, 1)
  const noteHeight = Math.max(NOTE_MIN_HEIGHT, NOTE_PADDING_Y * 2 + lineCount * NOTE_LINE_HEIGHT)

  return (
    <div
      className="select-none cursor-pointer relative"
      style={{ width: 180 }}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        setEditing(true)
      }}
    >
      {/* SVG で折れ角付きノートを描画 */}
      <svg
        width="180"
        height={noteHeight}
        className="absolute inset-0 pointer-events-none"
        style={{ overflow: "visible" }}
      >
        <path
          d={`M 0 0 L ${180 - NOTE_FOLD_SIZE} 0 L 180 ${NOTE_FOLD_SIZE} L 180 ${noteHeight} L 0 ${noteHeight} Z`}
          fill={NOTE_BG}
          stroke={borderColor}
          strokeWidth="1"
        />
        <path
          d={`M ${180 - NOTE_FOLD_SIZE} 0 L ${180 - NOTE_FOLD_SIZE} ${NOTE_FOLD_SIZE} L 180 ${NOTE_FOLD_SIZE}`}
          fill={NOTE_FOLD}
          stroke={borderColor}
          strokeWidth="1"
        />
      </svg>

      {/* テキスト */}
      <div
        className="relative px-3 py-2 text-xs text-zinc-700 leading-relaxed"
        style={{ minHeight: NOTE_MIN_HEIGHT }}
      >
        {editing ? (
          <textarea
            ref={textareaRef}
            className="w-full bg-transparent outline-none resize-none text-xs leading-relaxed"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                commitEdit()
              }
              if (e.key === "Escape") {
                setDraft(note.text)
                setEditing(false)
              }
            }}
            rows={Math.max(2, draft.split("\n").length)}
          />
        ) : (
          <div className="whitespace-pre-wrap">{note.text}</div>
        )}
      </div>

      {/* 削除ボタン（選択時のみ） */}
      {isSelected && !editing && (
        <button
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center hover:bg-red-600 shadow-sm"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          title="ノートを削除"
        >
          ×
        </button>
      )}
    </div>
  )
}
