"use client"

import { useCallback, useRef, useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { BLOCK_CATEGORIES, type BlockCategoryId } from "@/features/editor/constants"
import { useAppSelector } from "@/lib/store"
import {
  DEFAULT_VARIABLES,
  type BlockAssetOptions,
  getPaletteBlockDefs,
  isCBlockShape,
  isInlineReporterVariableInput,
  createDefaultProcedure,
  createDefaultProcedureParam,
} from "@/features/editor/block-editor/blocks"
import type { BlockDef, CustomProcedure } from "@/features/editor/block-editor/types"
import { getController, getWorkspace, openProcedureEditorForProcedure } from "./block-workspace"
import { ProcedureEditorForm } from "./procedure-editor-popover"

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

// ─── コンテキストメニュー用 state ───

type PaletteContextMenuState = {
  x: number
  y: number
  kind: "procedure"
  procedureId: string
} | {
  x: number
  y: number
  kind: "variable"
  variableName: string
} | null

// ─── ローカル procedure 編集ヘルパー ───

function addLabelToken(proc: CustomProcedure): CustomProcedure {
  return {
    ...proc,
    tokens: [
      ...proc.tokens,
      { id: `token-${Date.now()}`, type: "label", text: "label" },
    ],
  }
}

function addParamToken(proc: CustomProcedure, valueType: "text" | "number"): CustomProcedure {
  const param = createDefaultProcedureParam(valueType)
  return {
    ...proc,
    params: [...proc.params, param],
    tokens: [
      ...proc.tokens,
      { id: `token-${Date.now()}`, type: "param", paramId: param.id },
    ],
  }
}

function reorderToken(proc: CustomProcedure, fromIndex: number, toIndex: number): CustomProcedure {
  if (fromIndex < 0 || fromIndex >= proc.tokens.length) return proc
  if (toIndex < 0 || toIndex >= proc.tokens.length) return proc
  const tokens = proc.tokens.slice()
  const [token] = tokens.splice(fromIndex, 1)
  tokens.splice(toIndex, 0, token)
  return { ...proc, tokens }
}

function changeTokenType(proc: CustomProcedure, tokenId: string, newType: "label" | "text" | "number"): CustomProcedure {
  const tokenIndex = proc.tokens.findIndex((t) => t.id === tokenId)
  if (tokenIndex === -1) return proc
  const token = proc.tokens[tokenIndex]

  const currentType = token.type === "label"
    ? "label"
    : (proc.params.find((p) => p.id === token.paramId)?.valueType ?? "text")
  if (currentType === newType) return proc

  let params = [...proc.params]
  if (token.type === "param") {
    params = params.filter((p) => p.id !== token.paramId)
  }

  let newToken: typeof token
  if (newType === "label") {
    const oldText = token.type === "label"
      ? token.text
      : (proc.params.find((p) => p.id === token.paramId)?.name ?? "label")
    newToken = { id: token.id, type: "label", text: oldText }
  } else {
    const param = createDefaultProcedureParam(newType)
    const oldName = token.type === "label"
      ? token.text
      : (proc.params.find((p) => p.id === token.paramId)?.name ?? param.name)
    param.name = oldName
    params = [...params, param]
    newToken = { id: token.id, type: "param", paramId: param.id }
  }

  const tokens = proc.tokens.slice()
  tokens[tokenIndex] = newToken
  return { ...proc, tokens, params }
}

function removeToken(proc: CustomProcedure, tokenId: string): CustomProcedure {
  const token = proc.tokens.find((t) => t.id === tokenId)
  const removedParamId = token?.type === "param" ? token.paramId : null
  return {
    ...proc,
    tokens: proc.tokens.filter((t) => t.id !== tokenId),
    params: removedParamId
      ? proc.params.filter((p) => p.id !== removedParamId)
      : proc.params,
  }
}

function setLabelText(proc: CustomProcedure, tokenId: string, text: string): CustomProcedure {
  return {
    ...proc,
    name: computeProcedureName({ ...proc, tokens: proc.tokens.map((t) => t.id === tokenId && t.type === "label" ? { ...t, text } : t) }),
    tokens: proc.tokens.map((t) =>
      t.id === tokenId && t.type === "label" ? { ...t, text } : t
    ),
  }
}

function setParamName(proc: CustomProcedure, paramId: string, name: string): CustomProcedure {
  return {
    ...proc,
    params: proc.params.map((p) => (p.id === paramId ? { ...p, name } : p)),
  }
}

function setReturnsValue(proc: CustomProcedure, value: boolean): CustomProcedure {
  return { ...proc, returnsValue: value }
}

function computeProcedureName(proc: CustomProcedure): string {
  const label = proc.tokens.find((t) => t.type === "label")
  return label && label.type === "label" ? label.text : proc.name
}

// ─── メインコンポーネント ───

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
  const spriteNames = useAppSelector((s) => s.sprites.list.map((sp) => sp.name))
  const selectedSpriteAssets = useAppSelector((s): BlockAssetOptions | undefined => {
    const selectedSprite = s.sprites.list.find((sprite) => sprite.id === s.sprites.selectedId)
    if (!selectedSprite) return undefined
    return {
      costumes: selectedSprite.costumes.map((costume) => costume.name),
      sounds: selectedSprite.sounds?.map((sound) => sound.name) ?? [],
    }
  })
  const filteredBlocks = getPaletteBlockDefs(
    selectedCategory,
    snapshot.customProcedures,
    spriteNames,
    selectedSpriteAssets
  )

  const [paletteContextMenu, setPaletteContextMenu] = useState<PaletteContextMenuState>(null)

  // 変数作成ダイアログ
  const [variableDialogOpen, setVariableDialogOpen] = useState(false)
  const [newVariableName, setNewVariableName] = useState("")
  const variableInputRef = useRef<HTMLInputElement>(null)

  // 定義ブロック作成ダイアログ
  const [procedureDialogOpen, setProcedureDialogOpen] = useState(false)
  const [draftProcedure, setDraftProcedure] = useState<CustomProcedure | null>(null)

  const handleCreateVariable = useCallback(() => {
    const name = newVariableName.trim()
    if (!name) return
    controller.addVariable(name)
    setNewVariableName("")
    setVariableDialogOpen(false)
  }, [newVariableName, controller])

  const handleOpenProcedureDialog = useCallback(() => {
    setDraftProcedure(createDefaultProcedure())
    setProcedureDialogOpen(true)
  }, [])

  const handleCreateProcedure = useCallback(() => {
    if (!draftProcedure) return
    const workspace = getWorkspace()
    const vp = workspace?.viewport
    const centerX = vp ? -vp.x / vp.scale + 300 / vp.scale : 200
    const centerY = vp ? -vp.y / vp.scale + 200 / vp.scale : 200
    controller.createProcedureFromSpec(draftProcedure, centerX, centerY)
    setProcedureDialogOpen(false)
    setDraftProcedure(null)
  }, [draftProcedure, controller])

  const handleAdd = useCallback(
    (defId: string) => {
      onAddBlock?.(defId)
    },
    [onAddBlock]
  )

  const handleEditRequest = useCallback(
    (procedureId: string, x: number, y: number) => {
      setPaletteContextMenu({ x, y, kind: "procedure", procedureId })
    },
    []
  )

  const handleVariableContextMenu = useCallback(
    (name: string, e: React.MouseEvent) => {
      e.preventDefault()
      setPaletteContextMenu({ x: e.clientX, y: e.clientY, kind: "variable", variableName: name })
    },
    []
  )

  const allVariables = [...DEFAULT_VARIABLES, ...snapshot.customVariables]

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

      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col gap-1.5 p-2">
          {/* 変数カテゴリ: 作成ボタン + 一覧 */}
          {selectedCategory === "variables" && (
            <>
              <button
                onClick={() => setVariableDialogOpen(true)}
                className="flex items-center gap-1.5 rounded-md border border-dashed border-[#FF8C1A]/50 px-3 py-2 text-xs font-medium text-[#FF8C1A] hover:bg-[#FF8C1A]/5 transition-colors cursor-pointer"
              >
                <Plus size={14} />
                変数を作成
              </button>
              <div className="flex flex-wrap gap-1 pb-1">
                {allVariables.map((name) => {
                  const isCustom = !DEFAULT_VARIABLES.includes(name)
                  return (
                    <span
                      key={name}
                      className="inline-flex items-center rounded-full bg-[#FF8C1A]/10 px-2 py-0.5 text-[11px] text-[#FF8C1A]"
                      onContextMenu={isCustom ? (e) => handleVariableContextMenu(name, e) : undefined}
                    >
                      {name}
                    </span>
                  )
                })}
              </div>
            </>
          )}

          {/* MyBlocks カテゴリ: 作成ボタン */}
          {selectedCategory === "myblocks" && (
            <button
              onClick={handleOpenProcedureDialog}
              className="flex items-center gap-1.5 rounded-md border border-dashed border-[#FF6680]/50 px-3 py-2 text-xs font-medium text-[#FF6680] hover:bg-[#FF6680]/5 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              定義ブロックを作成
            </button>
          )}

          {filteredBlocks.map((def) => (
            <div key={def.id} title={def.description}>
              <PaletteBlock
                def={def}
                onAdd={handleAdd}
                onEditRequest={handleEditRequest}
              />
            </div>
          ))}
          {filteredBlocks.length === 0 && selectedCategory !== "variables" && selectedCategory !== "myblocks" && (
            <div className="text-xs text-muted-foreground text-center py-4">
              ブロックなし
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 変数作成ダイアログ */}
      <Dialog open={variableDialogOpen} onOpenChange={setVariableDialogOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>新しい変数</DialogTitle>
            <DialogDescription>変数名を入力してください</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleCreateVariable()
            }}
          >
            <Input
              ref={variableInputRef}
              value={newVariableName}
              onChange={(e) => setNewVariableName(e.target.value)}
              placeholder="変数名"
              autoFocus
            />
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setVariableDialogOpen(false)}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={!newVariableName.trim()}>
                作成
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 定義ブロック作成ダイアログ */}
      <Dialog
        open={procedureDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setProcedureDialogOpen(false)
            setDraftProcedure(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>定義ブロックを作成</DialogTitle>
            <DialogDescription>ブロックの名前と引数を設定してください</DialogDescription>
          </DialogHeader>
          {draftProcedure && (
            <ProcedureEditorForm
              procedure={draftProcedure}
              onAddLabel={() => setDraftProcedure(addLabelToken(draftProcedure))}
              onAddParam={(vt) => setDraftProcedure(addParamToken(draftProcedure, vt))}
              onReorderToken={(from, to) => setDraftProcedure(reorderToken(draftProcedure, from, to))}
              onRemoveToken={(tid) => setDraftProcedure(removeToken(draftProcedure, tid))}
              onLabelChange={(tid, text) => setDraftProcedure(setLabelText(draftProcedure, tid, text))}
              onParamNameChange={(pid, name) => setDraftProcedure(setParamName(draftProcedure, pid, name))}
              onReturnsValueChange={(val) => setDraftProcedure(setReturnsValue(draftProcedure, val))}
              onChangeTokenType={(tid, newType) => setDraftProcedure(changeTokenType(draftProcedure, tid, newType))}
            />
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setProcedureDialogOpen(false)
                setDraftProcedure(null)
              }}
            >
              キャンセル
            </Button>
            <Button onClick={handleCreateProcedure}>
              作成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* パレットコンテキストメニュー（procedure 編集 / variable 削除） */}
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
            {paletteContextMenu.kind === "procedure" && (
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
            )}
            {paletteContextMenu.kind === "variable" && (
              <button
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-destructive outline-hidden select-none hover:bg-destructive/10"
                onClick={() => {
                  controller.removeVariable(paletteContextMenu.variableName)
                  setPaletteContextMenu(null)
                }}
              >
                <Trash2 className="!size-4 shrink-0" />
                削除
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
