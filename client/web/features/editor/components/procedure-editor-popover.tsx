"use client"

import { useMemo } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { CustomProcedure, CustomProcedureToken } from "../block-editor/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export type ProcedureEditorState = {
  blockId: string
  procedureId: string
  x: number
  y: number
} | null

// ─── トークンのタイプ定義 ───

type TokenType = "label" | "text" | "number"

function resolveTokenType(token: CustomProcedureToken, procedure: CustomProcedure): TokenType {
  if (token.type === "label") return "label"
  const param = procedure.params.find((p) => p.id === token.paramId)
  return param?.valueType === "number" ? "number" : "text"
}

const TOKEN_TYPE_OPTIONS: { value: TokenType; label: string }[] = [
  { value: "label", label: "文字列" },
  { value: "text", label: "text 引数" },
  { value: "number", label: "number 引数" },
]

// ─── ドラッグハンドルアイコン ───

function GripIcon() {
  return (
    <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" className="shrink-0">
      <circle cx="3.5" cy="2.5" r="1.2" />
      <circle cx="8.5" cy="2.5" r="1.2" />
      <circle cx="3.5" cy="6.5" r="1.2" />
      <circle cx="8.5" cy="6.5" r="1.2" />
      <circle cx="3.5" cy="10.5" r="1.2" />
      <circle cx="8.5" cy="10.5" r="1.2" />
    </svg>
  )
}

// ─── Sortable トークン行 ───

function SortableTokenRow({
  token,
  procedure,
  onChangeTokenType,
  onLabelChange,
  onParamNameChange,
  onRemoveToken,
}: {
  token: CustomProcedureToken
  procedure: CustomProcedure
  onChangeTokenType: (tokenId: string, newType: TokenType) => void
  onLabelChange: (tokenId: string, text: string) => void
  onParamNameChange: (paramId: string, name: string) => void
  onRemoveToken: (tokenId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: token.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const currentType = resolveTokenType(token, procedure)

  const inputEl = token.type === "label" ? (
    <input
      type="text"
      value={token.text}
      onChange={(event) => onLabelChange(token.id, event.currentTarget.value)}
      className="h-7 flex-1 rounded-md border border-zinc-200 bg-white px-2 text-sm outline-hidden focus:border-pink-300"
    />
  ) : (() => {
    const param = procedure.params.find((item) => item.id === token.paramId)
    if (!param) return null
    return (
      <input
        type="text"
        value={param.name}
        onChange={(event) => onParamNameChange(param.id, event.currentTarget.value)}
        className="h-7 flex-1 rounded-md border border-zinc-200 bg-white px-2 text-sm outline-hidden focus:border-pink-300"
      />
    )
  })()

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1.5 rounded-md px-1 py-1 ${
        isDragging ? "z-50 bg-white shadow-lg opacity-90 ring-1 ring-pink-200" : ""
      }`}
    >
      {/* ドラッグハンドル */}
      <button
        type="button"
        className="cursor-grab touch-none text-zinc-400 hover:text-zinc-600 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripIcon />
      </button>

      {/* タイプセレクト */}
      <select
        value={currentType}
        onChange={(e) => onChangeTokenType(token.id, e.currentTarget.value as TokenType)}
        className="h-7 rounded-md border border-zinc-200 bg-white px-1 text-[11px] text-zinc-600 outline-hidden focus:border-pink-300"
      >
        {TOKEN_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* 値入力 */}
      {inputEl}

      {/* 削除ボタン */}
      <button
        type="button"
        className="shrink-0 rounded border border-red-200 px-1.5 py-0.5 text-[11px] text-red-500 hover:bg-red-50"
        onClick={() => onRemoveToken(token.id)}
      >
        ×
      </button>
    </div>
  )
}

// ─── ProcedureEditorForm ───

/** トークン編集 UI（共通部品） */
export function ProcedureEditorForm({
  procedure,
  onAddLabel,
  onAddParam,
  onReorderToken,
  onRemoveToken,
  onLabelChange,
  onParamNameChange,
  onReturnsValueChange,
  onChangeTokenType,
}: {
  procedure: CustomProcedure
  onAddLabel: () => void
  onAddParam: (valueType: "text" | "number") => void
  onReorderToken: (fromIndex: number, toIndex: number) => void
  onRemoveToken: (tokenId: string) => void
  onLabelChange: (tokenId: string, text: string) => void
  onParamNameChange: (paramId: string, name: string) => void
  onReturnsValueChange: (value: boolean) => void
  onChangeTokenType: (tokenId: string, newType: TokenType) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const tokenIds = useMemo(
    () => procedure.tokens.map((t) => t.id),
    [procedure.tokens],
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = procedure.tokens.findIndex((t) => t.id === active.id)
    const toIndex = procedure.tokens.findIndex((t) => t.id === over.id)
    if (fromIndex !== -1 && toIndex !== -1) {
      onReorderToken(fromIndex, toIndex)
    }
  }

  return (
    <>
      <div className="mb-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
        <div className="mb-2 text-[11px] font-medium text-zinc-500">シグネチャ</div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={tokenIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {procedure.tokens.map((token) => (
                <SortableTokenRow
                  key={token.id}
                  token={token}
                  procedure={procedure}
                  onChangeTokenType={onChangeTokenType}
                  onLabelChange={onLabelChange}
                  onParamNameChange={onParamNameChange}
                  onRemoveToken={onRemoveToken}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
          onClick={onAddLabel}
        >
          + 文字列
        </button>
        <button
          type="button"
          className="rounded-full bg-pink-100 px-3 py-1.5 text-xs font-medium text-pink-700 hover:bg-pink-200"
          onClick={() => onAddParam("text")}
        >
          + text 引数
        </button>
        <button
          type="button"
          className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-200"
          onClick={() => onAddParam("number")}
        >
          + number 引数
        </button>
      </div>

      <label className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={procedure.returnsValue}
          onChange={(event) =>
            onReturnsValueChange(event.currentTarget.checked)
          }
        />
        return を有効にして呼び出しを reporter にする
      </label>
    </>
  )
}

/** 既存プロシージャ編集用 Dialog */
export function ProcedureEditorPopover({
  state,
  procedure,
  onClose,
  onAddLabel,
  onAddParam,
  onReorderToken,
  onRemoveToken,
  onLabelChange,
  onParamNameChange,
  onReturnsValueChange,
  onChangeTokenType,
}: {
  state: ProcedureEditorState
  procedure: CustomProcedure | null
  onClose: () => void
  onAddLabel: (procedureId: string) => void
  onAddParam: (procedureId: string, valueType: "text" | "number") => void
  onReorderToken: (procedureId: string, fromIndex: number, toIndex: number) => void
  onRemoveToken: (procedureId: string, tokenId: string) => void
  onLabelChange: (procedureId: string, tokenId: string, text: string) => void
  onParamNameChange: (procedureId: string, paramId: string, name: string) => void
  onReturnsValueChange: (procedureId: string, value: boolean) => void
  onChangeTokenType: (procedureId: string, tokenId: string, newType: TokenType) => void
}) {
  const isOpen = !!state && !!procedure

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>定義ブロックを編集</DialogTitle>
          <DialogDescription>{procedure?.name ?? ""}</DialogDescription>
        </DialogHeader>
        {procedure && state && (
          <ProcedureEditorForm
            procedure={procedure}
            onAddLabel={() => onAddLabel(procedure.id)}
            onAddParam={(vt) => onAddParam(procedure.id, vt)}
            onReorderToken={(from, to) => onReorderToken(procedure.id, from, to)}
            onRemoveToken={(tid) => onRemoveToken(procedure.id, tid)}
            onLabelChange={(tid, text) => onLabelChange(procedure.id, tid, text)}
            onParamNameChange={(pid, name) => onParamNameChange(procedure.id, pid, name)}
            onReturnsValueChange={(val) => onReturnsValueChange(procedure.id, val)}
            onChangeTokenType={(tid, newType) => onChangeTokenType(procedure.id, tid, newType)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
