"use client"

import { useEffect } from "react"
import { createPortal } from "react-dom"
import type { CustomProcedure } from "../block-editor/types"

export type ProcedureEditorState = {
  blockId: string
  procedureId: string
  x: number
  y: number
} | null

export function ProcedureEditorPopover({
  state,
  procedure,
  onClose,
  onAddLabel,
  onAddParam,
  onMoveToken,
  onRemoveToken,
  onLabelChange,
  onParamNameChange,
  onReturnsValueChange,
}: {
  state: ProcedureEditorState
  procedure: CustomProcedure | null
  onClose: () => void
  onAddLabel: (procedureId: string) => void
  onAddParam: (procedureId: string, valueType: "text" | "number") => void
  onMoveToken: (procedureId: string, tokenId: string, direction: -1 | 1) => void
  onRemoveToken: (procedureId: string, tokenId: string) => void
  onLabelChange: (procedureId: string, tokenId: string, text: string) => void
  onParamNameChange: (procedureId: string, paramId: string, name: string) => void
  onReturnsValueChange: (procedureId: string, value: boolean) => void
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

  if (!state || !procedure) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[10000]"
      onClick={onClose}
    >
      <div
        className="absolute w-[360px] rounded-xl border border-zinc-200 bg-white p-4 shadow-xl"
        style={{ left: state.x, top: state.y }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-zinc-500">Custom Define</div>
            <div className="text-sm font-semibold text-zinc-900">{procedure.name}</div>
          </div>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100"
            onClick={onClose}
          >
            閉じる
          </button>
        </div>

        <div className="mb-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <div className="mb-2 text-[11px] font-medium text-zinc-500">シグネチャ</div>
          <div className="space-y-2">
            {procedure.tokens.map((token, index) => {
              if (token.type === "label") {
                return (
                  <div key={token.id} className="flex items-center gap-2">
                    <span className="w-10 shrink-0 text-[11px] font-medium text-zinc-500">文字列</span>
                    <input
                      type="text"
                      value={token.text}
                      onChange={(event) =>
                        onLabelChange(procedure.id, token.id, event.currentTarget.value)
                      }
                      className="h-8 flex-1 rounded-md border border-zinc-200 bg-white px-2 text-sm outline-hidden focus:border-pink-300"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="rounded border border-zinc-200 px-2 py-1 text-[11px] text-zinc-600 hover:bg-zinc-100"
                        onClick={() => onMoveToken(procedure.id, token.id, -1)}
                        disabled={index === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="rounded border border-zinc-200 px-2 py-1 text-[11px] text-zinc-600 hover:bg-zinc-100"
                        onClick={() => onMoveToken(procedure.id, token.id, 1)}
                        disabled={index === procedure.tokens.length - 1}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="rounded border border-red-200 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50"
                        onClick={() => onRemoveToken(procedure.id, token.id)}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                )
              }

              const param = procedure.params.find((item) => item.id === token.paramId)
              if (!param) return null

              return (
                <div key={token.id} className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-[11px] font-medium text-zinc-500">
                    {param.valueType}
                  </span>
                  <input
                    type="text"
                    value={param.name}
                    onChange={(event) =>
                      onParamNameChange(procedure.id, param.id, event.currentTarget.value)
                    }
                    className="h-8 flex-1 rounded-md border border-zinc-200 bg-white px-2 text-sm outline-hidden focus:border-pink-300"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="rounded border border-zinc-200 px-2 py-1 text-[11px] text-zinc-600 hover:bg-zinc-100"
                      onClick={() => onMoveToken(procedure.id, token.id, -1)}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="rounded border border-zinc-200 px-2 py-1 text-[11px] text-zinc-600 hover:bg-zinc-100"
                      onClick={() => onMoveToken(procedure.id, token.id, 1)}
                      disabled={index === procedure.tokens.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="rounded border border-red-200 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50"
                      onClick={() => onRemoveToken(procedure.id, token.id)}
                    >
                      削除
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
            onClick={() => onAddLabel(procedure.id)}
          >
            + 文字列
          </button>
          <button
            type="button"
            className="rounded-full bg-pink-100 px-3 py-1.5 text-xs font-medium text-pink-700 hover:bg-pink-200"
            onClick={() => onAddParam(procedure.id, "text")}
          >
            + text 引数
          </button>
          <button
            type="button"
            className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-200"
            onClick={() => onAddParam(procedure.id, "number")}
          >
            + number 引数
          </button>
        </div>

        <label className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={procedure.returnsValue}
            onChange={(event) =>
              onReturnsValueChange(procedure.id, event.currentTarget.checked)
            }
          />
          return を有効にして呼び出しを reporter にする
        </label>
      </div>
    </div>,
    document.body
  )
}
