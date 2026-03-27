"use client"

import Link from "next/link"
import { Flag, Square, Pause, Globe, FolderOpen, ChevronLeft, Save, Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarCheckboxItem,
  MenubarSeparator,
  MenubarItem,
} from "@/components/ui/menubar"

export type EditorTileId = "palette" | "workspace" | "stage" | "sprites" | "debug"

export const TILE_TITLES: Record<EditorTileId, string> = {
  palette: "ブロックパレット",
  workspace: "ワークスペース",
  stage: "ステージ",
  sprites: "スプライト",
  debug: "デバッグ",
}

const ALL_TILES: EditorTileId[] = ["palette", "workspace", "stage", "sprites", "debug"]

interface EditorHeaderProps {
  projectName: string
  onProjectNameChange: (name: string) => void
  isRunning: boolean
  isPaused: boolean
  onRun: () => void
  onPause: () => void
  onStop: () => void
  isSaving: boolean
  onSave: () => void
  onShare: () => void
  visibleTiles: Set<EditorTileId>
  onToggleTile: (tile: EditorTileId) => void
  onResetLayout: () => void
}

export function EditorHeader({
  projectName,
  onProjectNameChange,
  isRunning,
  isPaused,
  onRun,
  onPause,
  onStop,
  isSaving,
  onSave,
  onShare,
  visibleTiles,
  onToggleTile,
  onResetLayout,
}: EditorHeaderProps) {
  return (
    <header className="relative flex h-11 items-center border-b bg-[#4d97ff] px-3 text-white">
      {/* 左側 */}
      <div className="flex items-center gap-2">
        <Link href="/">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-white/10"
          >
            <ChevronLeft className="size-5" />
          </Button>
        </Link>

        <span className="text-sm font-bold hidden sm:inline">GameEngine</span>

        <Menubar className="border-white/20 bg-white/10 h-7">
          <MenubarMenu>
            <MenubarTrigger className="text-white text-xs hover:bg-white/15 data-[state=open]:bg-white/20 px-2 py-1">
              表示
            </MenubarTrigger>
            <MenubarContent>
              {ALL_TILES.map((tile) => (
                <MenubarCheckboxItem
                  key={tile}
                  checked={visibleTiles.has(tile)}
                  onCheckedChange={() => onToggleTile(tile)}
                >
                  {TILE_TITLES[tile]}
                </MenubarCheckboxItem>
              ))}
              <MenubarSeparator />
              <MenubarItem onClick={onResetLayout}>
                <RotateCcw className="size-3.5 mr-1.5" />
                レイアウトをリセット
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>

        <Input
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          className="h-7 w-48 bg-white/15 border-white/20 text-white text-sm placeholder:text-white/50"
        />

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
      </div>

      {/* 中央 — 再生/一時停止/停止 */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          className={`hover:bg-white/10 ${isRunning && !isPaused ? "text-white/50" : "text-green-200"}`}
          onClick={onRun}
          disabled={isRunning && !isPaused}
        >
          <Flag className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className={`hover:bg-white/10 ${!isRunning || isPaused ? "text-white/50" : "text-yellow-200"}`}
          onClick={onPause}
          disabled={!isRunning || isPaused}
        >
          <Pause className="size-4" />
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

      <div className="flex-1" />

      {/* 右側 */}
      <div className="flex items-center gap-2">
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
      </div>
    </header>
  )
}
