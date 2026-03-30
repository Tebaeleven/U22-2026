"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { codeToBlockData } from "../codegen"
import { programToClassCode } from "../codegen/class-code-generator"
import { compileProgramFromProjectData } from "../engine/program-builder"
import type { BlockProjectData } from "../block-editor/types"
import type { SpriteDef } from "../constants"

// CodeMirror は SSR 不可なので dynamic import
const CodeMirrorEditor = dynamic(() => import("./text-editor-codemirror"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-[#1e1e1e] flex items-center justify-center text-gray-500 text-sm">
      エディタを読み込み中...
    </div>
  ),
})

export function TextEditor({
  sprites,
  blockDataMap,
  selectedSpriteId,
  onCodeChange,
}: {
  sprites: SpriteDef[]
  blockDataMap: Record<string, BlockProjectData>
  selectedSpriteId: string | null
  onCodeChange?: (code: string) => void
}) {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [synced, setSynced] = useState(false)
  const suppressSyncRef = useRef(false)

  // ブロック → テキスト: blockDataMap が変わったらコードを再生成
  useEffect(() => {
    if (suppressSyncRef.current) {
      suppressSyncRef.current = false
      return
    }
    try {
      const parts: string[] = []
      for (const sprite of sprites) {
        const data = blockDataMap[sprite.id]
        if (!data || data.workspace.blocks.length === 0) continue
        const program = compileProgramFromProjectData(data)
        if (program.eventScripts.length === 0 && Object.keys(program.procedures).length === 0) continue
        parts.push(programToClassCode(program, sprite.name))
      }
      const generated = parts.join("\n\n")
      setCode(generated)
      setError(null)
      setSynced(true)
      onCodeChange?.(generated)
    } catch {
      // コンパイルエラーの場合は既存コードを維持
    }
  }, [blockDataMap, sprites])

  // テキスト変更時
  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode)
      setSynced(false)
      onCodeChange?.(newCode)

      if (!newCode.trim()) {
        setError(null)
        return
      }
      try {
        codeToBlockData(newCode)
        setError(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    },
    [onCodeChange]
  )

  return (
    <div className="flex flex-col h-full">
      {/* ステータスバー */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 bg-gray-50 shrink-0">
        <span className="text-xs text-gray-400">テキストコード</span>
        <span className="text-xs text-gray-300">|</span>
        {error ? (
          <span className="text-xs text-red-500 truncate flex-1" title={error}>
            ✗ {error}
          </span>
        ) : synced ? (
          <span className="text-xs text-green-600">✓ 同期済み</span>
        ) : (
          <span className="text-xs text-yellow-600">● 未保存</span>
        )}
      </div>

      {/* CodeMirror エディタ */}
      <div className="flex-1 min-h-0">
        <CodeMirrorEditor
          value={code}
          onChange={handleCodeChange}
        />
      </div>
    </div>
  )
}
