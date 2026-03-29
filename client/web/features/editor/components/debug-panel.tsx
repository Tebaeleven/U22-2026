"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAppSelector } from "@/lib/store"
import { getController } from "./block-workspace"
import { buildScripts } from "../engine/script-builder"
import type { CompiledProgram, ScriptBlock } from "../engine/types"
import type { SpriteRuntime } from "../engine/types"
import type { Runtime } from "../engine/runtime"
import { programToClassCode } from "../codegen/class-code-generator"
import { compileProgramFromProjectData } from "../engine/program-builder"

type DebugTab = "ast" | "sprites" | "variables" | "vm" | "pseudocode"

interface DebugPanelProps {
  runtimeRef: React.RefObject<Runtime | null>
}

// --- opcode のカテゴリ色 ---
const OPCODE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  event: { bg: "#FFF8E1", text: "#F57F17", border: "#FFD54F" },
  motion: { bg: "#E3F2FD", text: "#1565C0", border: "#90CAF9" },
  looks: { bg: "#F3E5F5", text: "#7B1FA2", border: "#CE93D8" },
  control: { bg: "#FFF3E0", text: "#E65100", border: "#FFCC80" },
  sensing: { bg: "#E0F7FA", text: "#00838F", border: "#80DEEA" },
  operator: { bg: "#E8F5E9", text: "#2E7D32", border: "#A5D6A7" },
  data: { bg: "#FFF3E0", text: "#EF6C00", border: "#FFB74D" },
  observer: { bg: "#FCE4EC", text: "#C62828", border: "#EF9A9A" },
}

function getOpcodeColor(opcode: string) {
  const prefix = opcode.split("_")[0]
  return OPCODE_COLORS[prefix] ?? { bg: "#F5F5F5", text: "#616161", border: "#E0E0E0" }
}

function formatArgValue(value: unknown): string {
  if (typeof value === "string") return `"${value}"`
  return String(value)
}

// --- ステータスバッジの色 ---
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  running: { bg: "#E8F5E9", text: "#2E7D32" },
  yield: { bg: "#FFF8E1", text: "#F57F17" },
  yield_tick: { bg: "#FFF3E0", text: "#E65100" },
  promise_wait: { bg: "#E3F2FD", text: "#1565C0" },
  done: { bg: "#F5F5F5", text: "#9E9E9E" },
}

// ============================================================
// AST タブ
// ============================================================

function AstNode({ block, executingIds }: { block: ScriptBlock; executingIds: Set<string> }) {
  const color = getOpcodeColor(block.opcode)
  const args = Object.entries(block.args)
  const hasBranches = block.branches.length > 0
  const isExecuting = executingIds.has(block.id)

  return (
    <div className="flex flex-col">
      <div
        className="flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-mono border transition-all duration-150"
        style={{
          backgroundColor: isExecuting ? "#FFFDE7" : color.bg,
          borderColor: isExecuting ? "#FDD835" : color.border,
          color: isExecuting ? "#F57F17" : color.text,
          boxShadow: isExecuting ? "0 0 8px 2px rgba(253, 216, 53, 0.5)" : "none",
        }}
      >
        {isExecuting && <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />}
        <span className="font-semibold">{block.opcode}</span>
        {args.map(([key, value]) => (
          <span key={key} className="opacity-70">
            <span className="text-[10px]">{key}=</span>
            <span className="font-medium">{formatArgValue(value)}</span>
          </span>
        ))}
      </div>

      {hasBranches && (
        <div className="ml-3 mt-0.5">
          {block.branches.map((branch, i) => {
            const label = block.branches.length > 1
              ? (i === 0 ? "then" : "else")
              : "body"
            return (
              <div key={i} className="flex">
                <div className="flex flex-col items-center mr-1.5 mt-0.5">
                  <div
                    className="w-px flex-1 min-h-[16px]"
                    style={{ backgroundColor: color.border }}
                  />
                </div>
                <div className="flex-1 mb-0.5">
                  <span
                    className="inline-block text-[9px] font-medium px-1.5 py-0.5 rounded-sm mb-0.5"
                    style={{ backgroundColor: color.border, color: color.text }}
                  >
                    {label}
                  </span>
                  {branch ? (
                    <AstChain block={branch} executingIds={executingIds} />
                  ) : (
                    <div className="text-[10px] text-zinc-400 italic pl-2 py-0.5">
                      (空)
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AstChain({ block, executingIds }: { block: ScriptBlock; executingIds: Set<string> }) {
  const blocks: ScriptBlock[] = []
  let current: ScriptBlock | null = block
  while (current) {
    blocks.push(current)
    current = current.next
  }

  return (
    <div className="flex flex-col gap-px">
      {blocks.map((b, i) => (
        <div key={b.id ?? i} className="flex">
          {i > 0 && (
            <div className="flex flex-col items-center mr-1.5 w-0">
              <div className="w-px h-1 bg-zinc-300" />
            </div>
          )}
          <div className="flex-1">
            <AstNode block={b} executingIds={executingIds} />
          </div>
        </div>
      ))}
    </div>
  )
}

function AstScript({ opcode, hatArgs, script, executingIds }: {
  opcode: string
  hatArgs: Record<string, unknown>
  script: ScriptBlock
  executingIds: Set<string>
}) {
  const color = getOpcodeColor(opcode)
  const args = Object.entries(hatArgs)

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: color.border }}>
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-mono"
        style={{ backgroundColor: color.bg, color: color.text }}
      >
        <span className="text-sm">🏴</span>
        <span className="font-bold">{opcode}</span>
        {args.map(([key, value]) => (
          <span key={key} className="opacity-70">
            <span className="text-[10px]">{key}=</span>
            <span className="font-medium">{formatArgValue(value)}</span>
          </span>
        ))}
      </div>
      <div className="p-2 bg-white">
        <AstChain block={script} executingIds={executingIds} />
      </div>
    </div>
  )
}

function AstView({ runtimeRef }: { runtimeRef: React.RefObject<Runtime | null> }) {
  const [program, setProgram] = useState<CompiledProgram>({
    eventScripts: [],
    procedures: {},
  })
  const [error, setError] = useState<string | null>(null)
  const [executingIds, setExecutingIds] = useState<Set<string>>(new Set())
  const isRunning = useAppSelector((s) => s.runtime.isRunning)

  const refresh = useCallback(() => {
    try {
      const controller = getController()
      if (!controller) {
        setProgram({ eventScripts: [], procedures: {} })
        return
      }
      setProgram(buildScripts(controller))
      setError(null)
    } catch (e) {
      setError(String(e))
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 1000)
    return () => clearInterval(id)
  }, [refresh])

  // 実行中ブロック ID のポーリング
  useEffect(() => {
    if (!isRunning) {
      setExecutingIds(new Set())
      return
    }
    const id = setInterval(() => {
      const ids = runtimeRef.current?.getExecutingBlockIds()
      if (ids) setExecutingIds(ids)
    }, 100)
    return () => clearInterval(id)
  }, [isRunning, runtimeRef])

  return (
    <div className="p-2 text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-muted-foreground">
          AST (Script Tree)
          {isRunning && <span className="ml-1.5 text-yellow-600 text-[10px]">実行中ブロックをハイライト</span>}
        </span>
        <button
          onClick={refresh}
          className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-[10px] font-medium"
        >
          更新
        </button>
      </div>
      {error && (
        <div className="p-2 mb-2 bg-red-50 border border-red-200 rounded text-red-700 text-[10px]">
          {error}
        </div>
      )}
      {program.eventScripts.length === 0 &&
      Object.keys(program.procedures).length === 0 ? (
        <div className="text-zinc-400 text-center py-4">
          スクリプトなし
        </div>
      ) : (
        <div className="space-y-3">
          {program.eventScripts.map((s, i) => (
            <AstScript key={i} opcode={s.opcode} hatArgs={s.hatArgs} script={s.script} executingIds={executingIds} />
          ))}
          {Object.values(program.procedures).map((procedure) => (
            <div
              key={procedure.procedureId}
              className="rounded-lg border border-pink-200 overflow-hidden"
            >
              <div className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-mono bg-pink-50 text-pink-700">
                <span className="font-bold">procedure</span>
                <span>{procedure.procedureId}</span>
                <span className="opacity-70">
                  {procedure.returnsValue ? "reporter" : "stack"}
                </span>
              </div>
              <div className="p-2 bg-white">
                {procedure.script ? (
                  <AstChain block={procedure.script} executingIds={executingIds} />
                ) : (
                  <div className="text-[10px] text-zinc-400 italic">
                    (空)
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// スプライトタブ
// ============================================================

function SpritesView({ runtimeRef }: { runtimeRef: React.RefObject<Runtime | null> }) {
  const reduxSprites = useAppSelector((s) => s.sprites.list)
  const isRunning = useAppSelector((s) => s.runtime.isRunning)
  const [runtimeSprites, setRuntimeSprites] = useState<SpriteRuntime[]>([])

  useEffect(() => {
    if (!isRunning) {
      setRuntimeSprites([])
      return
    }

    const id = setInterval(() => {
      const states = runtimeRef.current?.getSpriteStates()
      if (states) setRuntimeSprites([...states])
    }, 100)

    return () => clearInterval(id)
  }, [isRunning, runtimeRef])

  const spritesToShow = isRunning ? runtimeSprites : null

  return (
    <div className="p-2 text-xs">
      <span className="font-semibold text-muted-foreground block mb-2">
        スプライト状態 {isRunning && <span className="text-green-600">(実行中)</span>}
      </span>
      <div className="space-y-2">
        {reduxSprites.map((sprite) => {
          const rt = spritesToShow?.find((s) => s.id === sprite.id)
          return (
            <div key={sprite.id} className="bg-zinc-50 rounded p-2 border border-zinc-100">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-base">🎭</span>
                <span className="font-medium">{sprite.name}</span>
                <span className="text-[10px] text-zinc-400 ml-auto">{sprite.id}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] font-mono">
                <span>x: <span className="text-blue-600">{(rt?.x ?? sprite.x).toFixed(1)}</span></span>
                <span>y: <span className="text-blue-600">{(rt?.y ?? sprite.y).toFixed(1)}</span></span>
                <span>dir: <span className="text-purple-600">{(rt?.direction ?? sprite.direction).toFixed(0)}°</span></span>
                <span>size: <span className="text-orange-600">{(rt?.size ?? sprite.size).toFixed(0)}%</span></span>
                <span>visible: <span className={rt?.visible ?? sprite.visible ? "text-green-600" : "text-red-600"}>{String(rt?.visible ?? sprite.visible)}</span></span>
                {rt?.sayText && <span>say: <span className="text-pink-600">"{rt.sayText}"</span></span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// 変数タブ
// ============================================================

function VariablesView({ runtimeRef }: { runtimeRef: React.RefObject<Runtime | null> }) {
  const isRunning = useAppSelector((s) => s.runtime.isRunning)
  const [variables, setVariables] = useState<Array<{ name: string; value: unknown }>>([])
  const prevValuesRef = useRef<Map<string, unknown>>(new Map())
  const [flashKeys, setFlashKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!isRunning) {
      setVariables([])
      prevValuesRef.current.clear()
      setFlashKeys(new Set())
      return
    }

    const id = setInterval(() => {
      const runtime = runtimeRef.current
      if (!runtime) return

      const vars = runtime.getVariables()
      const entries: Array<{ name: string; value: unknown }> = []
      const newFlash = new Set<string>()

      for (const [name, value] of vars) {
        entries.push({ name, value })
        // 値が変わったらフラッシュ
        if (prevValuesRef.current.has(name) && prevValuesRef.current.get(name) !== value) {
          newFlash.add(name)
        }
        prevValuesRef.current.set(name, value)
      }

      setVariables(entries)

      if (newFlash.size > 0) {
        setFlashKeys(newFlash)
        setTimeout(() => setFlashKeys(new Set()), 400)
      }
    }, 100)

    return () => clearInterval(id)
  }, [isRunning, runtimeRef])

  return (
    <div className="p-2 text-xs">
      <span className="font-semibold text-muted-foreground block mb-2">
        変数一覧 {isRunning && <span className="text-green-600">({variables.length} 個)</span>}
      </span>
      {!isRunning ? (
        <div className="text-zinc-400 text-center py-4">(停止中)</div>
      ) : variables.length === 0 ? (
        <div className="text-zinc-400 text-center py-4">変数なし</div>
      ) : (
        <div className="space-y-1">
          {variables.map(({ name, value }) => {
            const isFlashing = flashKeys.has(name)
            const valueType = typeof value
            return (
              <div
                key={name}
                className="flex items-center gap-2 rounded px-2 py-1.5 font-mono text-[11px] border transition-all duration-200"
                style={{
                  backgroundColor: isFlashing ? "#FFFDE7" : "#FAFAFA",
                  borderColor: isFlashing ? "#FDD835" : "#E5E5E5",
                  boxShadow: isFlashing ? "0 0 6px 1px rgba(253, 216, 53, 0.4)" : "none",
                }}
              >
                <span className="font-semibold text-orange-700 min-w-0 shrink-0">{name}</span>
                <span className="text-zinc-300">=</span>
                <span className="text-blue-700 truncate">{formatArgValue(value)}</span>
                <span className="ml-auto text-[9px] text-zinc-400 shrink-0">{valueType}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================================
// VM タブ
// ============================================================

function VMView({ runtimeRef }: { runtimeRef: React.RefObject<Runtime | null> }) {
  const isRunning = useAppSelector((s) => s.runtime.isRunning)
  const [vmInfo, setVmInfo] = useState<ReturnType<Runtime["getVMInfo"]> | null>(null)

  useEffect(() => {
    if (!isRunning) {
      setVmInfo(null)
      return
    }

    const id = setInterval(() => {
      const info = runtimeRef.current?.getVMInfo()
      if (info) setVmInfo(info)
    }, 100)

    return () => clearInterval(id)
  }, [isRunning, runtimeRef])

  if (!isRunning) {
    return (
      <div className="p-2 text-xs">
        <span className="font-semibold text-muted-foreground block mb-2">VM 状態</span>
        <div className="text-zinc-400 text-center py-4">(停止中)</div>
      </div>
    )
  }

  if (!vmInfo) {
    return (
      <div className="p-2 text-xs">
        <span className="font-semibold text-muted-foreground block mb-2">VM 状態</span>
        <div className="text-zinc-400 text-center py-4">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="p-2 text-xs">
      <span className="font-semibold text-muted-foreground block mb-2">
        VM 状態 <span className="text-green-600">(実行中{vmInfo.isPaused ? " - 一時停止" : ""})</span>
      </span>

      {/* サマリカード */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        <SummaryCard label="スレッド" value={vmInfo.threadCount} color="#2E7D32" />
        <SummaryCard label="スクリプト" value={vmInfo.scriptCount} color="#1565C0" />
        <SummaryCard label="変数" value={vmInfo.variableCount} color="#EF6C00" />
        <SummaryCard label="無効ウォッチャー" value={vmInfo.disabledWatcherCount} color="#C62828" />
      </div>

      {/* 押下中キー */}
      {vmInfo.pressedKeys.length > 0 && (
        <div className="mb-3">
          <span className="text-[10px] font-medium text-zinc-500 block mb-1">押下中キー</span>
          <div className="flex flex-wrap gap-1">
            {vmInfo.pressedKeys.map((key) => (
              <span
                key={key}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200"
              >
                {key}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* スレッド詳細 */}
      <div>
        <span className="text-[10px] font-medium text-zinc-500 block mb-1">
          スレッド一覧 ({vmInfo.threads.length})
        </span>
        {vmInfo.threads.length === 0 ? (
          <div className="text-zinc-400 text-center py-2 text-[10px]">(アクティブスレッドなし)</div>
        ) : (
          <div className="space-y-1">
            {vmInfo.threads.map((t, i) => {
              const statusColor = STATUS_COLORS[t.status] ?? STATUS_COLORS.done
              return (
                <div
                  key={i}
                  className="bg-zinc-50 rounded p-1.5 border border-zinc-100 font-mono text-[10px]"
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold text-zinc-600">#{i}</span>
                    <span
                      className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
                      style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                    >
                      {t.status}
                    </span>
                    <span className="text-zinc-400 ml-auto">stack: {t.stackDepth}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-zinc-500">sprite: <span className="text-purple-600">{t.spriteId}</span></span>
                    <span className="text-zinc-500">
                      opcode: <span className="text-blue-600">{t.currentOpcode ?? "(none)"}</span>
                    </span>
                  </div>
                  {t.context && Object.keys(t.context).length > 0 && (
                    <div className="mt-0.5 text-[9px] text-zinc-400">
                      ctx: {JSON.stringify(t.context)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-zinc-50 rounded p-2 border border-zinc-100 text-center">
      <div className="text-lg font-bold font-mono" style={{ color }}>{value}</div>
      <div className="text-[10px] text-zinc-500">{label}</div>
    </div>
  )
}

// ============================================================
// 疑似コードタブ
// ============================================================

function PseudocodeView({ runtimeRef: _runtimeRef }: { runtimeRef: React.RefObject<Runtime | null> }) {
  const sprites = useAppSelector((s) => s.sprites.list)
  const selectedSpriteId = useAppSelector((s) => s.sprites.selectedId)
  const blockDataMap = useAppSelector((s) => s.sprites.blockDataMap)
  const [fullCode, setFullCode] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    try {
      const classCodes: string[] = []

      for (const sprite of sprites) {
        let program: CompiledProgram | null = null

        if (sprite.id === selectedSpriteId) {
          const controller = getController()
          if (controller) {
            program = buildScripts(controller)
          }
        } else {
          const data = blockDataMap[sprite.id]
          if (data && data.workspace.blocks.length > 0) {
            try {
              program = compileProgramFromProjectData(data)
            } catch {
              // コンパイルエラーはスキップ
            }
          }
        }

        if (program && program.eventScripts.length > 0) {
          classCodes.push(programToClassCode(program, sprite.name))
        }
      }

      setFullCode(classCodes.join("\n\n"))
      setError(null)
    } catch (e) {
      setError(String(e))
    }
  }, [sprites, selectedSpriteId, blockDataMap])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 2000)
    return () => clearInterval(id)
  }, [refresh])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(fullCode)
  }, [fullCode])

  return (
    <div className="p-2 text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-muted-foreground">全体の疑似コード</span>
        <div className="flex gap-1">
          <button
            onClick={handleCopy}
            className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-[10px] font-medium"
          >
            コピー
          </button>
          <button
            onClick={refresh}
            className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-[10px] font-medium"
          >
            更新
          </button>
        </div>
      </div>
      {error && (
        <div className="p-2 mb-2 bg-red-50 border border-red-200 rounded text-red-700 text-[10px]">
          {error}
        </div>
      )}
      {fullCode.length === 0 ? (
        <div className="text-zinc-400 text-center py-4">スクリプトなし</div>
      ) : (
        <div className="rounded-lg border border-zinc-200 overflow-hidden">
          <pre className="p-3 bg-zinc-50 text-[11px] font-mono leading-relaxed whitespace-pre overflow-x-auto text-zinc-800">
            {fullCode}
          </pre>
        </div>
      )}
    </div>
  )
}

// ============================================================
// メインパネル
// ============================================================

export function DebugPanel({ runtimeRef }: DebugPanelProps) {
  const [tab, setTab] = useState<DebugTab>("ast")

  const tabs: { id: DebugTab; label: string }[] = [
    { id: "ast", label: "AST" },
    { id: "sprites", label: "スプライト" },
    { id: "variables", label: "変数" },
    { id: "vm", label: "VM" },
    { id: "pseudocode", label: "疑似コード" },
  ]

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.id
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        {tab === "ast" && <AstView runtimeRef={runtimeRef} />}
        {tab === "sprites" && <SpritesView runtimeRef={runtimeRef} />}
        {tab === "variables" && <VariablesView runtimeRef={runtimeRef} />}
        {tab === "vm" && <VMView runtimeRef={runtimeRef} />}
        {tab === "pseudocode" && <PseudocodeView runtimeRef={runtimeRef} />}
      </ScrollArea>
    </div>
  )
}
