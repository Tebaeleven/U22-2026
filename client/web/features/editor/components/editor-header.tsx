"use client"

import Link from "next/link"
import { Flag, Square, Globe, FolderOpen, ChevronLeft, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface EditorHeaderProps {
  projectName: string
  onProjectNameChange: (name: string) => void
  isRunning: boolean
  onRun: () => void
  onStop: () => void
  isSaving: boolean
  onSave: () => void
  onShare: () => void
}

export function EditorHeader({
  projectName,
  onProjectNameChange,
  isRunning,
  onRun,
  onStop,
  isSaving,
  onSave,
  onShare,
}: EditorHeaderProps) {
  return (
    <header className="flex h-11 items-center gap-2 border-b bg-[#4d97ff] px-3 text-white">
      {/* 戻るボタン */}
      <Link href="/">
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-white hover:bg-white/10"
        >
          <ChevronLeft className="size-5" />
        </Button>
      </Link>

      {/* ロゴ */}
      <span className="text-sm font-bold hidden sm:inline">GameEngine</span>

      {/* 実行/停止 */}
      <div className="flex items-center gap-1 ml-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className={`hover:bg-white/10 ${isRunning ? "text-white/50" : "text-green-200"}`}
          onClick={onRun}
          disabled={isRunning}
        >
          <Flag className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className={`hover:bg-white/10 ${!isRunning ? "text-white/50" : "text-red-200"}`}
          onClick={onStop}
          disabled={!isRunning}
        >
          <Square className="size-4" />
        </Button>
      </div>

      {/* プロジェクト名 */}
      <Input
        value={projectName}
        onChange={(e) => onProjectNameChange(e.target.value)}
        className="h-7 w-48 bg-white/15 border-white/20 text-white text-sm placeholder:text-white/50"
      />

      {/* 保存ボタン */}
      <Button
        variant="ghost"
        size="sm"
        className="text-white/80 hover:text-white hover:bg-white/10 text-xs"
        onClick={onSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <Loader2 className="size-3.5 mr-1 animate-spin" />
        ) : (
          <Save className="size-3.5 mr-1" />
        )}
        {isSaving ? "保存中..." : "保存"}
      </Button>

      <div className="flex-1" />

      {/* 右側ボタン */}
      <Link href="/mystuff">
        <Button
          variant="ghost"
          size="sm"
          className="text-white/80 hover:text-white hover:bg-white/10 text-xs"
        >
          <FolderOpen className="size-3.5 mr-1" />
          作品一覧
        </Button>
      </Link>
      <Button
        size="sm"
        className="bg-white text-[#4d97ff] hover:bg-white/90 text-xs"
        onClick={onShare}
        disabled={isSaving}
      >
        <Globe className="size-3.5 mr-1" />
        共有する
      </Button>
    </header>
  )
}
