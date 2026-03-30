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
  renameSpriteInBlockDataMap,
  duplicateSprite,
  moveSprite,
  addSound,
  deleteSound,
} from "@/lib/store/slices/sprites"
import { setProjectName } from "@/lib/store/slices/project"
import { startRuntime, stopRuntime, pauseRuntime, resumeRuntime } from "@/lib/store/slices/runtime"
import { setSelectedCategory } from "@/lib/store/slices/ui"
import { EditorHeader, type EditorTileId, TILE_TITLES } from "@/features/editor/components/editor-header"
import { BlockPalette } from "@/features/editor/components/block-palette"
import { BlockWorkspace } from "@/features/editor/components/block-workspace"
import { TextEditor } from "@/features/editor/components/text-editor"
import { SpriteList } from "@/features/editor/components/sprite-list"
import { HierarchyPanel } from "@/features/editor/components/hierarchy-panel"
import { InspectorPanel } from "@/features/editor/components/inspector-panel"
import { CostumeEditor } from "@/features/editor/components/costume-editor"
import { SpriteColliderEditor } from "@/features/editor/components/sprite-collider-editor"
import { SoundEditor } from "@/features/editor/components/sound-editor"
import { useProjectSave } from "@/features/editor/hooks/use-project-save"
import { PhaserStage, type PhaserStageHandle } from "@/features/editor/renderer/phaser-stage"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { VisuallyHidden } from "radix-ui"
import { DebugPanel } from "@/features/editor/components/debug-panel"
import { ShortcutsDialog } from "@/features/editor/components/shortcuts-dialog"
import { ConsolePanel } from "@/features/editor/components/console-panel"
import { SampleBrowser } from "@/features/editor/components/sample-browser"
import { AssetBrowser } from "@/features/editor/components/asset-browser"
import { ModelDiagramWorkspace } from "@/features/editor/model-diagram/components/model-diagram-workspace"
import { buildProgramsForSprites, compileProgramFromProjectData } from "@/features/editor/engine/program-builder"
import { codeToBlockData } from "@/features/editor/codegen"
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
import { SAMPLE_PROJECTS, resolveSample } from "@/features/editor/samples/index"
import { Flag, Pause, Square, StepForward, Zap, Rabbit, Gauge, Maximize2, Minimize2 } from "lucide-react"
import type { SpeedMode } from "@/features/editor/engine/sequencer"
import { Button } from "@/components/ui/button"

// ─── Mosaic レイアウトプリセット ──────────────────────

const LAYOUT_PRESETS: Record<string, { label: string; layout: MosaicNode<EditorTileId> }> = {
  coding: {
    label: "コーディング",
    layout: {
      type: "split",
      direction: "row",
      children: [
        {
          type: "split",
          direction: "column",
          children: ["palette", "samples"],
          splitPercentages: [60, 40],
        },
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
    },
  },
  debug: {
    label: "デバッグ",
    layout: {
      type: "split",
      direction: "row",
      children: [
        "workspace",
        {
          type: "split",
          direction: "column",
          children: ["stage", "debug", "console"],
          splitPercentages: [40, 35, 25],
        },
      ],
      splitPercentages: [55, 45],
    },
  },
  design: {
    label: "デザイン",
    layout: {
      type: "split",
      direction: "row",
      children: [
        {
          type: "split",
          direction: "column",
          children: ["hierarchy", "inspector"],
          splitPercentages: [40, 60],
        },
        "stage",
        "sprites",
      ],
      splitPercentages: [20, 60, 20],
    },
  },
}

const DEFAULT_LAYOUT: MosaicNode<EditorTileId> = {
  type: "split",
  direction: "row",
  children: [
    {
      type: "split",
      direction: "column",
      children: ["palette", "samples"],
      splitPercentages: [60, 40],
    },
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

type EditorTab = "code" | "text" | "costumes" | "collider" | "sounds" | "model-diagram"

export function EditorContent() {
  const dispatch = useAppDispatch()
  const sprites = useAppSelector((s) => s.sprites.list)
  const selectedSpriteId = useAppSelector((s) => s.sprites.selectedId)
  const blockDataMap = useAppSelector((s) => s.sprites.blockDataMap)
  const projectName = useAppSelector((s) => s.project.name)
  const isRunning = useAppSelector((s) => s.runtime.isRunning)
  const isPaused = useAppSelector((s) => s.runtime.isPaused)
  const selectedCategory = useAppSelector((s) => s.ui.selectedCategory)

  const [speedMode, setSpeedMode] = useState<SpeedMode>("normal")
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

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

  // ── URL クエリパラメータ ──
  const initialTab = (searchParams.get("tab") as EditorTab) || "code"
  const initialSample = searchParams.get("sample")

  // URL クエリを更新するヘルパー（ページ遷移せずに URL を書き換える）
  const updateQueryParam = useCallback((key: string, value: string | null) => {
    const url = new URL(window.location.href)
    if (value) {
      url.searchParams.set(key, value)
    } else {
      url.searchParams.delete(key)
    }
    window.history.replaceState({}, "", url.toString())
  }, [])

  // ワークスペースのタブ（コード / コスチューム / 当たり判定）
  const [editorTab, setEditorTabRaw] = useState<EditorTab>(initialTab)
  const setEditorTab = useCallback((tab: EditorTab) => {
    setEditorTabRaw(tab)
    updateQueryParam("tab", tab === "code" ? null : tab)
  }, [updateQueryParam])
  // テキストエディタのコード（テキストモードでの実行用）
  const textCodeRef = useRef("")
  const [stageExpanded, setStageExpanded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
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

  // URL の ?sample= パラメータから初期サンプルを読み込む
  const initialSampleLoadedRef = useRef(false)
  useEffect(() => {
    if (initialSampleLoadedRef.current || !initialSample) return
    initialSampleLoadedRef.current = true
    // handleLoadSample がまだ定義されていないので、setTimeout で遅延
    setTimeout(() => {
      const sample = SAMPLE_PROJECTS.find((s) => s.id === initialSample)
      if (sample) {
        const { sprites: newSprites, blockDataMap: newBlockData } = resolveSample(sample)
        const firstSpriteId = newSprites[0]?.id ?? ""
        dispatch(loadAllBlockData(newBlockData))
        dispatch(setSprites(newSprites))
        dispatch(selectSprite(firstSpriteId))
        dispatch(setProjectName(sample.name))
        const firstData = newBlockData[firstSpriteId] ?? DEFAULT_BLOCK_PROJECT_DATA
        getController().loadProjectData(firstData)
        setCurrentSampleId(initialSample)
      }
    }, 0)
  }, [initialSample, dispatch])

  // ブラウザフルスクリーン状態の追跡
  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handleChange)
    return () => document.removeEventListener("fullscreenchange", handleChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  }, [])

  // ? キーでショートカット一覧を表示
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return
        e.preventDefault()
        setShortcutsOpen(true)
      }
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
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

    // テキストモード: テキストコードから直接コンパイル→実行
    if (editorTab === "text" && textCodeRef.current.trim()) {
      try {
        const textBlockData = codeToBlockData(textCodeRef.current)
        const textPrograms: Record<string, import("../engine/types").CompiledProgram> = {}
        for (const sprite of sprites) {
          const data = textBlockData[sprite.name]
          if (data) {
            textPrograms[sprite.id] = compileProgramFromProjectData(data)
          } else {
            textPrograms[sprite.id] = { eventScripts: [], procedures: {} }
          }
        }

        const hasAnyScript = Object.values(textPrograms).some((p) => p.eventScripts.length > 0)
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
        runtime.onStop = () => { dispatch(stopRuntime()) }
        dispatch(saveSnapshot())
        dispatch(startRuntime())
        const scene = expandedStageRef.current?.getScene() ?? stageRef.current?.getScene() ?? undefined
        runtime.setSpeedMode(speedMode)
        runtime.start(sprites, textPrograms, scene)
        return
      } catch (e) {
        console.error("テキストコードのコンパイルに失敗:", e)
        return
      }
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
    runtime.setSpeedMode(speedMode)
    runtime.start(sprites, programs, scene)
  }, [sprites, selectedSpriteId, blockDataMap, dispatch, speedMode, editorTab])

  const handlePause = useCallback(() => {
    runtimeRef.current?.pause()
    dispatch(pauseRuntime())
  }, [dispatch])

  const handleStep = useCallback(() => {
    runtimeRef.current?.stepOnce()
  }, [])

  const handleSpeedChange = useCallback(() => {
    const modes: SpeedMode[] = ["normal", "fast", "turbo"]
    const next = modes[(modes.indexOf(speedMode) + 1) % modes.length]
    setSpeedMode(next)
    runtimeRef.current?.setSpeedMode(next)
  }, [speedMode])

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

  // ─── サンプルプロジェクト読み込み ────────────────

  const [currentSampleId, setCurrentSampleId] = useState(SAMPLE_PROJECTS[0].id)

  const sampleInfos = useMemo(
    () => SAMPLE_PROJECTS.map((s) => ({ id: s.id, name: s.name, description: s.description })),
    [],
  )

  const handleLoadSample = useCallback((sampleId: string) => {
    const sample = SAMPLE_PROJECTS.find((s) => s.id === sampleId)
    if (!sample) return

    // 実行中なら停止
    if (runtimeRef.current?.isRunning) {
      runtimeRef.current.stop()
      dispatch(stopRuntime())
    }

    const { sprites: newSprites, blockDataMap: newBlockData } = resolveSample(sample)
    const firstSpriteId = newSprites[0]?.id ?? ""

    // 全データを一括更新
    dispatch(loadAllBlockData(newBlockData))
    dispatch(setSprites(newSprites))
    dispatch(selectSprite(firstSpriteId))
    dispatch(setProjectName(sample.name))

    // コントローラーにも即座にロード
    const firstData = newBlockData[firstSpriteId] ?? DEFAULT_BLOCK_PROJECT_DATA
    getController().loadProjectData(firstData)

    setCurrentSampleId(sampleId)
    updateQueryParam("sample", sampleId)
  }, [dispatch, updateQueryParam])

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
            onAddSound={(spriteId, sound) => dispatch(addSound({ spriteId, sound }))}
            onDeleteSound={(spriteId, soundId) => dispatch(deleteSound({ spriteId, soundId }))}
            runtimeRef={runtimeRef}
            debugView={debugView}
            onTextCodeChange={(code) => { textCodeRef.current = code }}
            pseudocode={textCodeRef.current || SAMPLE_PROJECTS.find((s) => s.id === currentSampleId)?.pseudocode}
            sprites={sprites}
            blockDataMap={blockDataMap}
            onNavigateToSprite={(spriteId) => {
              dispatch(selectSprite(spriteId))
              setEditorTab("code")
            }}
          />
        ),
        stage: (
          <div className="relative h-full">
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
            {debugView && isRunning && (
              <VariableMonitor runtimeRef={runtimeRef} />
            )}
          </div>
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
            onDuplicateSprite={(id: string) => dispatch(duplicateSprite(id))}
            onMoveSprite={(id, dir) => dispatch(moveSprite({ id, direction: dir }))}
          />
        ),
        inspector: (
          <InspectorPanel
            sprite={selectedSprite ?? null}
            spriteIndex={selectedSpriteIndex}
            onUpdate={(id, changes) => {
              const oldName = changes.name !== undefined
                ? sprites.find((s) => s.id === id)?.name
                : undefined
              dispatch(updateSprite({ id, changes }))
              if (oldName && changes.name && oldName !== changes.name) {
                dispatch(
                  renameSpriteInBlockDataMap({
                    oldName,
                    newName: changes.name,
                  })
                )
                getController().renameSpriteInBlocks(oldName, changes.name)
              }
            }}
            onSetCollider={(id, collider) => handleSetCollider(id, collider)}
          />
        ),
        debug: <DebugPanel runtimeRef={runtimeRef} />,
        console: <ConsolePanel />,
        samples: (
          <SampleBrowser
            currentSampleId={currentSampleId}
            onLoadSample={handleLoadSample}
          />
        ),
        assets: <AssetBrowser sprites={sprites} />,
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
                className={`size-5 ${!(isRunning && isPaused) ? "text-muted-foreground" : "text-blue-600 hover:text-blue-700"}`}
                onClick={handleStep}
                disabled={!(isRunning && isPaused)}
                title="1フレーム進める"
              >
                <StepForward className="size-3" />
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
            <Button
              variant="ghost"
              size="icon-xs"
              className={`size-5 ml-1 ${speedMode === "turbo" ? "text-orange-500" : speedMode === "fast" ? "text-blue-500" : "text-muted-foreground"}`}
              onClick={handleSpeedChange}
              title={`速度: ${speedMode === "normal" ? "通常" : speedMode === "fast" ? "高速" : "ターボ"}`}
            >
              {speedMode === "turbo" ? <Zap className="size-3" /> : speedMode === "fast" ? <Rabbit className="size-3" /> : <Gauge className="size-3" />}
            </Button>
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
      handleStep,
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
        layoutPresets={Object.entries(LAYOUT_PRESETS).map(([id, p]) => ({ id, label: p.label }))}
        onSelectPreset={(id) => {
          const preset = LAYOUT_PRESETS[id]
          if (preset) setMosaicLayout(preset.layout)
        }}
        debugView={debugView}
        onToggleDebugView={() => setDebugView((v) => !v)}
        samples={sampleInfos}
        currentSampleId={currentSampleId}
        onLoadSample={handleLoadSample}
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
            {/* フルスクリーン・閉じるボタン */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1">
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-black/70"
                onClick={toggleFullscreen}
                title={isFullscreen ? "フルスクリーン解除" : "フルスクリーン"}
              >
                {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </button>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-black/70"
                onClick={() => setStageExpanded(false)}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="2" y1="2" x2="12" y2="12" />
                  <line x1="12" y1="2" x2="2" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ショートカット一覧ダイアログ */}
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
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
  onAddSound,
  onDeleteSound,
  runtimeRef,
  debugView,
  onTextCodeChange,
  pseudocode,
  sprites,
  blockDataMap,
  onNavigateToSprite,
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
  onAddSound: (spriteId: string, sound: import("@/features/editor/constants").SoundDef) => void
  onDeleteSound: (spriteId: string, soundId: string) => void
  runtimeRef: RefObject<Runtime | null>
  debugView?: boolean
  onTextCodeChange?: (code: string) => void
  pseudocode?: string
  sprites: import("@/features/editor/constants").SpriteDef[]
  blockDataMap: Record<string, import("@/features/editor/block-editor/types").BlockProjectData>
  onNavigateToSprite?: (spriteId: string) => void
}) {
  // モデル図は初回表示時にマウント、以降は hidden でも維持
  const [diagramMounted, setDiagramMounted] = useState(false)
  useEffect(() => {
    if (editorTab === "model-diagram") setDiagramMounted(true)
  }, [editorTab])

  return (
    <div className="flex flex-col h-full">
      {/* タブバー */}
      <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
        {/* スプライト固有タブ */}
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
        <button
          onClick={() => onTabChange("sounds")}
          className={`px-4 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
            editorTab === "sounds"
              ? "border-b-2 border-[#CF63CF] text-[#CF63CF] bg-white"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          サウンド
        </button>

        {/* 区切り線 + グローバルタブ */}
        <div className="ml-auto flex items-center">
          <div className="w-px h-4 bg-gray-300 mx-1" />
          <button
            onClick={() => onTabChange("text")}
            className={`px-4 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
              editorTab === "text"
                ? "border-b-2 border-[#FF6B6B] text-[#FF6B6B] bg-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            テキストコード
          </button>
          <button
            onClick={() => onTabChange("model-diagram")}
            className={`px-4 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
              editorTab === "model-diagram"
                ? "border-b-2 border-[#10b981] text-[#10b981] bg-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            モデル図
          </button>
        </div>
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

        <div className={editorTab === "text" ? "h-full" : "hidden h-full"}>
          <TextEditor
            sprites={sprites}
            blockDataMap={blockDataMap}
            selectedSpriteId={selectedSpriteId}
            onCodeChange={(code) => { onTextCodeChange?.(code) }}
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

        <div className={editorTab === "sounds" ? "h-full" : "hidden h-full"}>
          {selectedSprite ? (
            <SoundEditor
              sprite={selectedSprite}
              onAddSound={onAddSound}
              onDeleteSound={onDeleteSound}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              スプライトを選択してください
            </div>
          )}
        </div>

        <div className={editorTab === "model-diagram" ? "h-full" : "hidden h-full"}>
          {diagramMounted && (
            <ModelDiagramWorkspace
              sprites={sprites.map((s) => ({ id: s.id, name: s.name }))}
              blockDataMap={blockDataMap}
              pseudocode={pseudocode}
              onNavigateToSprite={onNavigateToSprite}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── 変数モニター（ステージオーバーレイ） ─────────────

function VariableMonitor({ runtimeRef }: { runtimeRef: RefObject<Runtime | null> }) {
  const [vars, setVars] = useState<Array<[string, unknown]>>([])

  useEffect(() => {
    let rafId = 0
    const update = () => {
      const runtime = runtimeRef.current
      if (runtime) {
        const entries = Array.from(runtime.getVariables().entries())
        setVars(entries)
      }
      rafId = requestAnimationFrame(update)
    }
    rafId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafId)
  }, [runtimeRef])

  if (vars.length === 0) return null

  return (
    <div className="absolute bottom-1 left-1 z-20 pointer-events-none">
      <div className="bg-black/60 text-white text-[10px] font-mono rounded px-1.5 py-1 space-y-0.5 max-h-32 overflow-hidden">
        {vars.map(([name, value]) => (
          <div key={name} className="flex gap-1.5">
            <span className="text-orange-300 shrink-0">{name}</span>
            <span className="truncate max-w-24">{String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
