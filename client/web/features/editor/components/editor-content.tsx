"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react"
import { useSearchParams } from "next/navigation"
import {
  Mosaic,
  MosaicWindow,
  type MosaicNode,
  type MosaicPath,
} from "react-mosaic-component"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  setSprites,
  selectSprite,
  addSprite,
  deleteSprite,
  addCostume,
  deleteCostume,
  updateCostume,
  updateSprite,
  setCostumeIndex,
  setCollider,
  batchUpdatePositions,
  saveSnapshot,
  restoreSnapshot,
  saveBlockData,
  loadAllBlockData,
} from "@/lib/store/slices/sprites"
import { setProjectName } from "@/lib/store/slices/project"
import { startRuntime, stopRuntime, pauseRuntime, resumeRuntime } from "@/lib/store/slices/runtime"
import { setSelectedCategory } from "@/lib/store/slices/ui"
import { EditorHeader, type EditorTileId, TILE_TITLES } from "@/features/editor/components/editor-header"
import { BlockPalette } from "@/features/editor/components/block-palette"
import { BlockWorkspace } from "@/features/editor/components/block-workspace"
import { SpriteList } from "@/features/editor/components/sprite-list"
import { HierarchyPanel } from "@/features/editor/components/hierarchy-panel"
import { InspectorPanel } from "@/features/editor/components/inspector-panel"
import { CostumeEditor } from "@/features/editor/components/costume-editor"
import { SpriteColliderEditor } from "@/features/editor/components/sprite-collider-editor"
import { useProjectSave } from "@/features/editor/hooks/use-project-save"
import { PhaserStage, type PhaserStageHandle } from "@/features/editor/renderer/phaser-stage"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { VisuallyHidden } from "radix-ui"
import { DebugPanel } from "@/features/editor/components/debug-panel"
import { buildProgramsForSprites } from "@/features/editor/engine/program-builder"
import { Runtime } from "@/features/editor/engine/runtime"
import {
  getController,
  getWorkspace,
  openProcedureEditorForProcedure,
} from "@/features/editor/components/block-workspace"
import { DEFAULT_BLOCK_PROJECT_DATA } from "@/features/editor/block-editor/blocks"
import type { BlockProjectData } from "@/features/editor/block-editor/types"
import {
  createDefaultCostume,
  resolveSpriteEmoji,
  type BlockCategoryId,
  type ColliderDef,
} from "@/features/editor/constants"
import { Flag, Pause, Square } from "lucide-react"
import { Button } from "@/components/ui/button"

// ─── Mosaic レイアウト ──────────────────────────────

const DEFAULT_LAYOUT: MosaicNode<EditorTileId> = {
  type: "split",
  direction: "row",
  children: [
    "palette",
    "workspace",
    {
      type: "split",
      direction: "column",
      children: [
        "stage",
        "sprites",
        {
          type: "split",
          direction: "row",
          children: ["hierarchy", "inspector"],
          splitPercentages: [35, 65],
        },
      ],
      splitPercentages: [35, 25, 40],
    },
  ],
  splitPercentages: [13, 57, 30],
}

// ─── Mosaic ツリー操作ユーティリティ ─────────────────

/** 分割ノードかどうかの型ガード */
function isSplitNode(node: MosaicNode<EditorTileId>): node is { type: "split"; direction: "row" | "column"; children: MosaicNode<EditorTileId>[]; splitPercentages?: number[] } {
  return typeof node === "object" && "type" in node && node.type === "split"
}

/** ツリーに含まれるタイルIDを収集 */
function getVisibleTiles(node: MosaicNode<EditorTileId> | null): Set<EditorTileId> {
  const tiles = new Set<EditorTileId>()
  if (!node) return tiles
  if (typeof node === "string") {
    tiles.add(node)
    return tiles
  }
  if (isSplitNode(node)) {
    for (const child of node.children) {
      for (const t of getVisibleTiles(child)) tiles.add(t)
    }
  }
  return tiles
}

/** ツリーからタイルを除去（分割ノードが子1つになったら折りたたむ） */
function removeTile(
  node: MosaicNode<EditorTileId> | null,
  tile: EditorTileId,
): MosaicNode<EditorTileId> | null {
  if (!node) return null
  if (typeof node === "string") return node === tile ? null : node
  if (!isSplitNode(node)) return node
  const newChildren = node.children
    .map((child) => removeTile(child, tile))
    .filter((c): c is MosaicNode<EditorTileId> => c !== null)
  if (newChildren.length === 0) return null
  if (newChildren.length === 1) return newChildren[0]
  return { ...node, children: newChildren }
}

/** ツリーにタイルを追加（ルートの右側に25%幅で追加） */
function addTile(
  node: MosaicNode<EditorTileId> | null,
  tile: EditorTileId,
): MosaicNode<EditorTileId> {
  if (!node) return tile
  return {
    type: "split",
    direction: "row" as const,
    children: [node, tile],
    splitPercentages: [75, 25],
  }
}

// ─── エディタタブ（コード / コスチューム / 当たり判定） ──

type EditorTab = "code" | "costumes" | "collider"

export function EditorContent() {
  const dispatch = useAppDispatch()
  const sprites = useAppSelector((s) => s.sprites.list)
  const selectedSpriteId = useAppSelector((s) => s.sprites.selectedId)
  const blockDataMap = useAppSelector((s) => s.sprites.blockDataMap)
  const projectName = useAppSelector((s) => s.project.name)
  const isRunning = useAppSelector((s) => s.runtime.isRunning)
  const isPaused = useAppSelector((s) => s.runtime.isPaused)
  const selectedCategory = useAppSelector((s) => s.ui.selectedCategory)

  const searchParams = useSearchParams()
  const projectIdParam = searchParams.get("id")
  const [mosaicLayout, setMosaicLayout] =
    useState<MosaicNode<EditorTileId> | null>(DEFAULT_LAYOUT)

  const visibleTiles = useMemo(() => getVisibleTiles(mosaicLayout), [mosaicLayout])

  const handleToggleTile = useCallback((tile: EditorTileId) => {
    setMosaicLayout((prev) => {
      if (getVisibleTiles(prev).has(tile)) {
        return removeTile(prev, tile)
      }
      return addTile(prev, tile)
    })
  }, [])

  const handleResetLayout = useCallback(() => {
    setMosaicLayout(DEFAULT_LAYOUT)
  }, [])

  // ワークスペースのタブ（コード / コスチューム / 当たり判定）
  const [editorTab, setEditorTab] = useState<EditorTab>("code")
  const [stageExpanded, setStageExpanded] = useState(false)
  const [debugView, setDebugView] = useState(false)
  const [deletingSpriteId, setDeletingSpriteId] = useState<string | null>(null)

  const stageRef = useRef<PhaserStageHandle>(null)
  const expandedStageRef = useRef<PhaserStageHandle>(null)
  const runtimeRef = useRef<Runtime | null>(null)

  const selectedSprite = sprites.find((s) => s.id === selectedSpriteId)
  const selectedSpriteIndex = sprites.findIndex((s) => s.id === selectedSpriteId)

  useEffect(() => {
    runtimeRef.current = new Runtime()
    return () => {
      runtimeRef.current?.stop()
    }
  }, [])

  const project = useProjectSave({
    projectName,
    setProjectName: (name: string) => dispatch(setProjectName(name)),
    sprites,
    setSprites: (s) => dispatch(setSprites(s)),
    getBlockProjectData: () => {
      // 現在のスプライトのデータをエクスポートして、全スプライト分をまとめる
      const currentData = getController().exportProjectData()
      const result: Record<string, BlockProjectData> = {}
      for (const sprite of sprites) {
        result[sprite.id] = sprite.id === selectedSpriteId
          ? currentData
          : (blockDataMap[sprite.id] ?? DEFAULT_BLOCK_PROJECT_DATA)
      }
      return result
    },
    onLoadBlockProjectData: (data: Record<string, BlockProjectData>) => {
      // 全スプライトのブロックデータを Redux に保存
      dispatch(loadAllBlockData(data))
      // 現在選択中のスプライトのデータをコントローラーにロード
      const currentData = data[selectedSpriteId] ?? DEFAULT_BLOCK_PROJECT_DATA
      getController().loadProjectData(currentData)
    },
  })
  const {
    projectId,
    isSaving,
    isLoading,
    isOffline,
    saveProject,
    shareProject,
    loadProject,
  } = project

  useEffect(() => {
    if (projectIdParam && !projectId && !isLoading) {
      loadProject(projectIdParam)
    }
  }, [projectIdParam, projectId, isLoading, loadProject])

  // ─── 実行制御 ─────────────────────────────────────

  const handleRun = useCallback(() => {
    const runtime = runtimeRef.current
    if (!runtime) return

    if (runtime.isPaused) {
      runtime.resume()
      dispatch(resumeRuntime())
      return
    }

    const controller = getController()
    if (!controller) return

    // 現在のスプライトのデータをエクスポート（run前に保存）
    const currentSpriteData = controller.exportProjectData()
    dispatch(saveBlockData({ spriteId: selectedSpriteId, data: currentSpriteData }))

    // 選択中スプライトは現在のコントローラー、他は保存済みデータから個別にビルド
    const programs = buildProgramsForSprites({
      sprites,
      selectedSpriteId,
      controller,
      blockDataMap: {
        ...blockDataMap,
        [selectedSpriteId]: currentSpriteData,
      },
    })

    const hasAnyScript = Object.values(programs).some((p) => p.eventScripts.length > 0)
    if (!hasAnyScript) return

    runtime.onSpritesUpdate = (runtimeSprites) => {
      stageRef.current?.updateSprites(runtimeSprites)
      expandedStageRef.current?.updateSprites(runtimeSprites)
      dispatch(
        batchUpdatePositions(
          runtimeSprites.map((s) => ({
            id: s.id,
            x: s.x,
            y: s.y,
            direction: s.direction,
            costumeIndex: s.costumeIndex,
          }))
        )
      )
    }

    runtime.onStop = () => {
      dispatch(stopRuntime())
    }

    dispatch(saveSnapshot())
    dispatch(startRuntime())
    const scene = expandedStageRef.current?.getScene() ?? stageRef.current?.getScene() ?? undefined
    runtime.start(sprites, programs, scene)
  }, [sprites, selectedSpriteId, blockDataMap, dispatch])

  const handlePause = useCallback(() => {
    runtimeRef.current?.pause()
    dispatch(pauseRuntime())
  }, [dispatch])

  const handleAddBlock = useCallback((defId: string) => {
    const controller = getController()
    const workspace = getWorkspace()
    if (!controller || !workspace) return

    setEditorTab("code")

    const vp = workspace.viewport
    const centerX = -vp.x / vp.scale + 300 / vp.scale
    const centerY = -vp.y / vp.scale + 200 / vp.scale

    const blockId = controller.addBlock(defId, centerX, centerY)
    if (!blockId) return

    const created = controller.getCreatedBlock(blockId)
    if (created?.state.def.source.kind !== "custom-define") return

    const popupX = Math.max(24, window.innerWidth / 2 - 180)
    const popupY = Math.max(24, window.innerHeight / 2 - 180)
    openProcedureEditorForProcedure(
      created.state.def.source.procedureId,
      popupX,
      popupY
    )
  }, [])

  const handleStop = useCallback(() => {
    runtimeRef.current?.stop()
    dispatch(stopRuntime())
    dispatch(restoreSnapshot())
  }, [dispatch])

  // ─── コスチューム操作 ─────────────────────────────

  const handleAddCostume = useCallback(
    (spriteId: string) => {
      const sprite = sprites.find((s) => s.id === spriteId)
      const spriteIndex = sprites.findIndex((s) => s.id === spriteId)
      const idx = sprite ? sprite.costumes.length + 1 : 1
      const emoji = resolveSpriteEmoji(sprite, Math.max(spriteIndex, 0))
      const costume = createDefaultCostume(`コスチューム${idx}`, emoji)
      dispatch(addCostume({ spriteId, costume }))
      // 新しいコスチュームを選択してコスチュームタブを開く
      dispatch(setCostumeIndex({ spriteId, index: sprite ? sprite.costumes.length : 0 }))
      setEditorTab("costumes")
    },
    [sprites, dispatch]
  )

  const handleDeleteCostume = useCallback(
    (spriteId: string, costumeId: string) => {
      dispatch(deleteCostume({ spriteId, costumeId }))
    },
    [dispatch]
  )

  const handleSelectCostume = useCallback(
    (spriteId: string, index: number) => {
      dispatch(setCostumeIndex({ spriteId, index }))
    },
    [dispatch]
  )

  const handleSetCollider = useCallback(
    (spriteId: string, collider: ColliderDef) => {
      dispatch(setCollider({ spriteId, collider }))
    },
    [dispatch]
  )

  // お絵描きキャンバスからの自動保存
  const handleSaveCostume = useCallback(
    (costumeId: string, dataUrl: string, width: number, height: number) => {
      if (!selectedSpriteId) return
      dispatch(
        updateCostume({
          spriteId: selectedSpriteId,
          costumeId,
          changes: { dataUrl, width, height },
        })
      )
    },
    [selectedSpriteId, dispatch]
  )

  // ─── タイル描画 ───────────────────────────────────

  const renderTile = useCallback(
    (id: EditorTileId, path: MosaicPath) => {
      const content: Record<EditorTileId, React.ReactNode> = {
        palette: (
          <BlockPalette
            selectedCategory={selectedCategory}
            onSelectCategory={(cat: BlockCategoryId) =>
              dispatch(setSelectedCategory(cat))
            }
            onAddBlock={handleAddBlock}
          />
        ),
        workspace: (
          <WorkspaceWithTabs
            editorTab={editorTab}
            onTabChange={setEditorTab}
            selectedSprite={selectedSprite}
            selectedSpriteId={selectedSpriteId}
            selectedSpriteIndex={selectedSpriteIndex}
            onAddCostume={() => selectedSpriteId && handleAddCostume(selectedSpriteId)}
            onDeleteCostume={(costumeId) =>
              selectedSpriteId && handleDeleteCostume(selectedSpriteId, costumeId)
            }
            onSelectCostume={(idx) =>
              selectedSpriteId && handleSelectCostume(selectedSpriteId, idx)
            }
            onSetCollider={(collider) =>
              selectedSpriteId && handleSetCollider(selectedSpriteId, collider)
            }
            onSaveCostume={handleSaveCostume}
            runtimeRef={runtimeRef}
            debugView={debugView}
          />
        ),
        stage: (
          <PhaserStage
            ref={stageRef}
            sprites={sprites}
            isRunning={isRunning}
            selectedSpriteId={selectedSpriteId}
            onSelectSprite={(id) => dispatch(selectSprite(id))}
            onSpritePositionChange={(id, x, y) =>
              dispatch(updateSprite({ id, changes: { x, y } }))
            }
          />
        ),
        sprites: (
          <SpriteList
            sprites={sprites}
            selectedSpriteId={selectedSpriteId}
            onSelectSprite={(id: string) => dispatch(selectSprite(id))}
            onAddSprite={() => dispatch(addSprite())}
            onDeleteSprite={(id: string) => setDeletingSpriteId(id)}
          />
        ),
        hierarchy: (
          <HierarchyPanel
            sprites={sprites}
            selectedSpriteId={selectedSpriteId}
            onSelectSprite={(id: string) => dispatch(selectSprite(id))}
            onAddSprite={() => dispatch(addSprite())}
            onDeleteSprite={(id: string) => setDeletingSpriteId(id)}
          />
        ),
        inspector: (
          <InspectorPanel
            sprite={selectedSprite ?? null}
            spriteIndex={selectedSpriteIndex}
            onUpdate={(id, changes) => {
              if (changes.name !== undefined) {
                const oldName = sprites.find((s) => s.id === id)?.name
                if (oldName && oldName !== changes.name) {
                  getController().renameSpriteInBlocks(oldName, changes.name)
                }
              }
              dispatch(updateSprite({ id, changes }))
            }}
            onSetCollider={(id, collider) => handleSetCollider(id, collider)}
          />
        ),
        debug: <DebugPanel runtimeRef={runtimeRef} />,
      }

      const stageExpandButton = id === "stage" ? (
        <button
          type="button"
          className="flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mr-1"
          onClick={() => setStageExpanded(true)}
          title="ステージを拡大"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="8,1 13,1 13,6" />
            <polyline points="6,13 1,13 1,8" />
            <line x1="13" y1="1" x2="8" y2="6" />
            <line x1="1" y1="13" x2="6" y2="8" />
          </svg>
        </button>
      ) : <></>

      const stageRenderToolbar = id === "stage" ? (
        () => (
          <div className="mosaic-window-toolbar flex items-center w-full">
            <div className="flex items-center gap-0.5 ml-1">
              <Button
                variant="ghost"
                size="icon-xs"
                className={`size-5 ${isRunning && !isPaused ? "text-muted-foreground" : "text-green-600 hover:text-green-700"}`}
                onClick={handleRun}
                disabled={isRunning && !isPaused}
                title="実行"
              >
                <Flag className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                className={`size-5 ${!isRunning || isPaused ? "text-muted-foreground" : "text-yellow-600 hover:text-yellow-700"}`}
                onClick={handlePause}
                disabled={!isRunning || isPaused}
                title="一時停止"
              >
                <Pause className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                className={`size-5 ${!isRunning ? "text-muted-foreground" : "text-red-600 hover:text-red-700"}`}
                onClick={handleStop}
                disabled={!isRunning}
                title="停止"
              >
                <Square className="size-3" />
              </Button>
            </div>
            <div className="flex-1 text-center text-xs font-medium mosaic-window-title">{TILE_TITLES[id]}</div>
            {stageExpandButton}
          </div>
        )
      ) : undefined

      return (
        <MosaicWindow<EditorTileId>
          path={path}
          title={TILE_TITLES[id]}
          toolbarControls={id === "stage" ? <></> : undefined}
          renderToolbar={stageRenderToolbar}
        >
          {content[id]}
        </MosaicWindow>
      )
    },
    [
      sprites,
      selectedSpriteId,
      selectedSprite,
      selectedSpriteIndex,
      selectedCategory,
      editorTab,
      dispatch,
      handleAddBlock,
      handleAddCostume,
      handleDeleteCostume,
      handleSelectCostume,
      handleSetCollider,
      handleSaveCostume,
      isRunning,
      isPaused,
      handleRun,
      handlePause,
      handleStop,
      debugView,
    ]
  )

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  return (
    <>
      <EditorHeader
        projectName={projectName}
        onProjectNameChange={(name) => dispatch(setProjectName(name))}
        isSaving={isSaving}
        isOffline={isOffline}
        onSave={saveProject}
        onShare={shareProject}
        visibleTiles={visibleTiles}
        onToggleTile={handleToggleTile}
        onResetLayout={handleResetLayout}
        debugView={debugView}
        onToggleDebugView={() => setDebugView((v) => !v)}
      />

      <div className="flex-1 min-h-0">
        <Mosaic<EditorTileId>
          renderTile={renderTile}
          value={mosaicLayout}
          onChange={setMosaicLayout}
        />
      </div>

      {/* スプライト削除確認ダイアログ */}
      <Dialog open={!!deletingSpriteId} onOpenChange={(open) => { if (!open) setDeletingSpriteId(null) }}>
        <DialogContent className="sm:max-w-[340px]">
          <DialogTitle>スプライトを削除</DialogTitle>
          <p className="text-sm text-muted-foreground">
            「{sprites.find((s) => s.id === deletingSpriteId)?.name}」を削除しますか？この操作は元に戻せません。
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setDeletingSpriteId(null)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (deletingSpriteId) dispatch(deleteSprite(deletingSpriteId))
                setDeletingSpriteId(null)
              }}
            >
              削除
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ステージ拡大ダイアログ */}
      <Dialog open={stageExpanded} onOpenChange={setStageExpanded}>
        <DialogContent
          className="max-w-none w-[min(85vw,85vh*(16/9))] p-0 overflow-hidden sm:max-w-none"
          showCloseButton={false}
        >
          <VisuallyHidden.Root>
            <DialogTitle>ステージ</DialogTitle>
          </VisuallyHidden.Root>
          <div className="relative bg-black" style={{ aspectRatio: "16/9" }}>
            <PhaserStage
              ref={expandedStageRef}
              sprites={sprites}
              isRunning={isRunning}
              selectedSpriteId={selectedSpriteId}
              onSelectSprite={(id) => dispatch(selectSprite(id))}
              onSpritePositionChange={(id, x, y) =>
                dispatch(updateSprite({ id, changes: { x, y } }))
              }
            />
            {/* 実行コントロール */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1">
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded text-green-300 hover:bg-white/10 disabled:text-white/30"
                onClick={handleRun}
                disabled={isRunning && !isPaused}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><polygon points="4,2 14,8 4,14" /></svg>
              </button>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded text-red-300 hover:bg-white/10 disabled:text-white/30"
                onClick={handleStop}
                disabled={!isRunning}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="2" width="10" height="10" rx="1" /></svg>
              </button>
            </div>
            {/* 閉じるボタン */}
            <button
              type="button"
              className="absolute top-3 right-3 z-20 flex size-8 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-black/70"
              onClick={() => setStageExpanded(false)}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="2" y1="2" x2="12" y2="12" />
                <line x1="12" y1="2" x2="2" y2="12" />
              </svg>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── ワークスペース（コード / コスチューム / 当たり判定）─

function WorkspaceWithTabs({
  editorTab,
  onTabChange,
  selectedSprite,
  selectedSpriteId,
  selectedSpriteIndex,
  onAddCostume,
  onDeleteCostume,
  onSelectCostume,
  onSetCollider,
  onSaveCostume,
  runtimeRef,
  debugView,
}: {
  editorTab: EditorTab
  onTabChange: (tab: EditorTab) => void
  selectedSprite: import("@/features/editor/constants").SpriteDef | undefined
  selectedSpriteId: string | null
  selectedSpriteIndex: number
  onAddCostume: () => void
  onDeleteCostume: (costumeId: string) => void
  onSelectCostume: (index: number) => void
  onSetCollider: (collider: ColliderDef) => void
  onSaveCostume: (costumeId: string, dataUrl: string, width: number, height: number) => void
  runtimeRef: RefObject<Runtime | null>
  debugView?: boolean
}) {
  return (
    <div className="flex flex-col h-full">
      {/* タブバー */}
      <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
        <button
          onClick={() => onTabChange("code")}
          className={`px-4 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
            editorTab === "code"
              ? "border-b-2 border-[#4d97ff] text-[#4d97ff] bg-white"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          コード
        </button>
        <button
          onClick={() => onTabChange("costumes")}
          className={`px-4 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
            editorTab === "costumes"
              ? "border-b-2 border-[#9966FF] text-[#9966FF] bg-white"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          コスチューム
        </button>
        <button
          onClick={() => onTabChange("collider")}
          className={`px-4 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
            editorTab === "collider"
              ? "border-b-2 border-[#4d97ff] text-[#4d97ff] bg-white"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          当たり判定
        </button>
      </div>

      {/* タブ内容 */}
      <div className="flex-1 min-h-0 relative">
        <div className={editorTab === "code" ? "h-full" : "hidden h-full"}>
          <BlockWorkspace
            runtimeRef={runtimeRef}
            selectedSpriteId={selectedSpriteId}
            isActive={editorTab === "code"}
            debugView={debugView}
          />
        </div>

        <div className={editorTab === "costumes" ? "h-full" : "hidden h-full"}>
          {selectedSprite ? (
            <CostumeEditor
              sprite={selectedSprite}
              spriteIndex={selectedSpriteIndex}
              onAddCostume={onAddCostume}
              onDeleteCostume={onDeleteCostume}
              onSelectCostume={onSelectCostume}
              onSaveCostume={onSaveCostume}
              onAutoEstimateCollider={(bbox) =>
                onSetCollider({ ...selectedSprite.collider, ...bbox })
              }
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              スプライトを選択してください
            </div>
          )}
        </div>

        <div className={editorTab === "collider" ? "h-full" : "hidden h-full"}>
          {selectedSprite ? (
            <SpriteColliderEditor
              sprite={selectedSprite}
              onSetCollider={onSetCollider}
              currentCostumeDataUrl={
                selectedSprite.costumes[selectedSprite.currentCostumeIndex]?.dataUrl
              }
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              スプライトを選択してください
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
