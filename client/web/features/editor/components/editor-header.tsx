"use client"

import Link from "next/link"
import { Globe, FolderOpen, ChevronLeft, Save, Loader2, RotateCcw, WifiOff } from "lucide-react"
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

export type EditorTileId = "palette" | "workspace" | "stage" | "sprites" | "hierarchy" | "inspector" | "debug"

export const TILE_TITLES: Record<EditorTileId, string> = {
  palette: "ブロックパレット",
  workspace: "ワークスペース",
  stage: "ステージ",
  sprites: "スプライト",
  hierarchy: "ヒエラルキー",
  inspector: "インスペクター",
  debug: "デバッグ",
}

const ALL_TILES: EditorTileId[] = ["palette", "workspace", "stage", "hierarchy", "inspector", "sprites", "debug"]

interface EditorHeaderProps {
  projectName: string
  onProjectNameChange: (name: string) => void
  isSaving: boolean
  isOffline?: boolean
  onSave: () => void
  onShare: () => void
  visibleTiles: Set<EditorTileId>
  onToggleTile: (tile: EditorTileId) => void
  onResetLayout: () => void
  debugView?: boolean
  onToggleDebugView?: () => void
}

export function EditorHeader({
  projectName,
  onProjectNameChange,
  isSaving,
  isOffline = false,
  onSave,
  onShare,
  visibleTiles,
  onToggleTile,
  onResetLayout,
  debugView = false,
  onToggleDebugView,
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
              <MenubarCheckboxItem
                checked={debugView}
                onCheckedChange={() => onToggleDebugView?.()}
              >
                デバッグ表示
              </MenubarCheckboxItem>
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
          disabled={isSaving || isOffline}
        >
          {isSaving ? (
            <Loader2 className="size-3.5 mr-1 animate-spin" />
          ) : isOffline ? (
            <WifiOff className="size-3.5 mr-1" />
          ) : (
            <Save className="size-3.5 mr-1" />
          )}
          {isSaving ? "保存中..." : isOffline ? "オフライン" : "保存"}
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
          disabled={isSaving || isOffline}
        >
          <Globe className="size-3.5 mr-1" />
          共有する
        </Button>
      </div>
    </header>
  )
}
