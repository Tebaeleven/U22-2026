"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent as ReactMouseEvent,
} from "react"
import { createPortal } from "react-dom"
import {
  Workspace,
  SvgRenderer,
  screenToWorld,
  type Container,
  type Connector,
} from "headless-vpl"
import { DomSyncHelper } from "headless-vpl/helpers"
import { InteractionManager, bindDefaultShortcuts } from "headless-vpl/recipes"
import { getMouseState } from "headless-vpl/util/mouse"
import {
  CUSTOM_ARGUMENT_PREFIX,
  DEFAULT_BLOCK_PROJECT_DATA,
  getBlockDefById,
  getBlockDefs,
  getBlockSize,
  getInputValue,
} from "../block-editor/blocks"
import { BlockEditorController } from "../block-editor/controller"
import { BlockView } from "../block-editor/view"
import type { BlockState, HeaderReporterCopy } from "../block-editor/types"
import type { Runtime } from "../engine/runtime"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { saveBlockData } from "@/lib/store/slices/sprites"
import {
  BlockContextMenu,
  type BlockContextMenuState,
} from "./block-context-menu"
import {
  ProcedureEditorPopover,
  type ProcedureEditorState,
} from "./procedure-editor-popover"
import {
  ReporterPreviewPopover,
  type ReporterPreviewState,
} from "./reporter-preview-popover"
import { BlockSearchPopover } from "./block-search-popover"

const controller = new BlockEditorController()
let sharedWorkspace: Workspace | null = null
let _openProcedureEditor: ((state: ProcedureEditorState) => void) | null = null
let _pendingProcedureEditorState: ProcedureEditorState = null

export function getController(): BlockEditorController {
  return controller
}

export function getWorkspace(): Workspace | null {
  return sharedWorkspace
}

/** パレット等から手続きエディタを開く */
export function openProcedureEditorForProcedure(procedureId: string, x: number, y: number) {
  const blocks = controller.getSnapshot().blocks
  let blockId = procedureId
  for (const block of blocks) {
    const cb = controller.getCreatedBlock(block.id)
    if (cb?.state.def.source.kind === "custom-define" && cb.state.def.source.procedureId === procedureId) {
      blockId = block.id
      break
    }
  }
  const nextState = { blockId, procedureId, x, y }
  if (_openProcedureEditor) {
    _openProcedureEditor(nextState)
    _pendingProcedureEditorState = null
    return
  }
  _pendingProcedureEditorState = nextState
}

type DragBootstrapInteraction = {
  _dragContainers: Container[]
  dragEligible: boolean
  dragStarts: Map<string, { x: number; y: number }>
  dragPointerStart: { x: number; y: number } | null
  gridVirtualPos: { x: number; y: number } | null
  pendingUnnest: null
  prevMouse: { x: number; y: number }
  setMode: (mode: "dragging") => void
  unlockSnapConnections: () => void
}

export function BlockWorkspace({
  runtimeRef,
  selectedSpriteId,
  isActive = true,
  debugView = false,
}: {
  runtimeRef?: React.RefObject<Runtime | null>
  selectedSpriteId?: string | null
  isActive?: boolean
  debugView?: boolean
}) {
  const dispatch = useAppDispatch()
  const blockDataMap = useAppSelector((s) => s.sprites.blockDataMap)
  const spriteNames = useAppSelector((s) => s.sprites.list.map((sp) => sp.name))

  const svgRef = useRef<SVGSVGElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const [contextMenu, setContextMenu] = useState<BlockContextMenuState>(null)
  const [bgContextMenu, setBgContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [editorState, setEditorState] = useState<ProcedureEditorState>(null)
  const [previewState, setPreviewState] = useState<ReporterPreviewState>(null)
  const [blockSearch, setBlockSearch] = useState<{ x: number; y: number } | null>(null)

  // パレット等から参照できるよう setter をモジュールレベルで共有
  useEffect(() => {
    _openProcedureEditor = setEditorState
    if (_pendingProcedureEditorState) {
      setEditorState(_pendingProcedureEditorState)
      _pendingProcedureEditorState = null
    }
    return () => { _openProcedureEditor = null }
  }, [setEditorState])

  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot
  )

  const workspaceRef = useRef<Workspace | null>(null)
  const interactionRef = useRef<InteractionManager | null>(null)
  const domSyncRef = useRef<DomSyncHelper | null>(null)
  const mouseRef = useRef<ReturnType<typeof getMouseState> | null>(null)
  const rafIdRef = useRef(0)
  const keyboardRef = useRef<ReturnType<typeof bindDefaultShortcuts> | null>(null)
  const containersRef = useRef<Container[]>([])
  const connectorsRef = useRef<Connector[]>([])
  const mountedRef = useRef(false)
  const prevSpriteIdRef = useRef<string | null>(null)
  // blockDataMap を ref でも追跡（スプライト切り替え effect の依存配列から外すため）
  const blockDataMapRef = useRef(blockDataMap)
  useEffect(() => {
    blockDataMapRef.current = blockDataMap
  }, [blockDataMap])

  // スプライト切り替え時にブロックデータを保存・復元
  useEffect(() => {
    if (prevSpriteIdRef.current === null) {
      // 初回: 記録だけして切り替えは行わない
      prevSpriteIdRef.current = selectedSpriteId ?? null
      return
    }
    if (prevSpriteIdRef.current === selectedSpriteId) return

    const prevId = prevSpriteIdRef.current
    prevSpriteIdRef.current = selectedSpriteId ?? null

    // 前のスプライトのブロックデータを Redux に保存
    dispatch(saveBlockData({ spriteId: prevId, data: controller.exportProjectData() }))

    // 新しいスプライトのブロックデータをコントローラーにロード
    const newData = blockDataMapRef.current[selectedSpriteId ?? ""] ?? DEFAULT_BLOCK_PROJECT_DATA
    controller.loadProjectData(newData)
  }, [selectedSpriteId, dispatch])

  const beginDragForBlock = useCallback(
    (
      blockId: string,
      screenPos: { x: number; y: number }
    ) => {
      const workspace = workspaceRef.current
      const interaction = interactionRef.current as unknown as
        | DragBootstrapInteraction
        | null
      const mouse = mouseRef.current
      if (!workspace || !interaction || !mouse) return

      const container = controller.getContainer(blockId)
      if (!container) return

      mouse.mousePosition.x = screenPos.x
      mouse.mousePosition.y = screenPos.y
      mouse.buttonState.leftButton = "down"

      controller.interactionOverrides.onContainerPointerDown?.(container)
      workspace.selection.deselectAll()
      workspace.selection.select(container)

      interaction.dragStarts = new Map([
        [container.id, { x: container.position.x, y: container.position.y }],
      ])
      interaction._dragContainers = [container]
      interaction.dragEligible = true
      interaction.prevMouse = { ...screenPos }
      interaction.gridVirtualPos = {
        x: container.position.x,
        y: container.position.y,
      }
      interaction.dragPointerStart = { ...screenPos }
      interaction.pendingUnnest = null
      interaction.unlockSnapConnections()
      interaction.setMode("dragging")
    },
    []
  )

  const spawnBlockAtPointer = useCallback(
    (
      defId: string,
      event: ReactMouseEvent<HTMLElement>,
      inputBindings?: Array<{ targetIndex: number; value: string }>
    ) => {
      const workspace = workspaceRef.current
      const mouse = mouseRef.current
      const canvasElement = canvasRef.current
      if (!workspace || !mouse || !canvasElement) return

      const def = getBlockDefById(defId, snapshot.customProcedures, spriteNames)
      if (!def) return

      event.preventDefault()
      event.stopPropagation()
      setContextMenu(null)
      setEditorState(null)
      setPreviewState(null)

      const rect = canvasElement.getBoundingClientRect()
      const screenPos = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
      const worldPos = screenToWorld(screenPos, workspace.viewport)
      const size = getBlockSize(def.shape)
      const blockId = controller.addBlock(
        defId,
        worldPos.x - size.w / 2,
        worldPos.y - size.h / 2
      )
      if (!blockId) return

      if (inputBindings) {
        for (const binding of inputBindings) {
          controller.updateInputValue(blockId, binding.targetIndex, binding.value)
        }
      }

      // Define ブロックを追加した直後にエディタポップアップを開く
      const newBlock = controller.getCreatedBlock(blockId)
      if (newBlock?.state.def.source.kind === "custom-define") {
        setEditorState({
          blockId,
          procedureId: newBlock.state.def.source.procedureId,
          x: event.clientX + 8,
          y: event.clientY + 8,
        })
      }

      beginDragForBlock(blockId, screenPos)
    },
    [beginDragForBlock, snapshot.customProcedures, spriteNames]
  )

  const handleHeaderReporterMouseDown = useCallback(
    (
      sourceBlockId: string,
      copy: HeaderReporterCopy,
      event: ReactMouseEvent<HTMLElement>
    ) => {
      const defs = getBlockDefs(snapshot.customProcedures, spriteNames)
      const def = copy.targetOpcode !== undefined
        ? defs.find(
            (item) =>
              item.opcode === copy.targetOpcode &&
              (copy.targetShape === undefined || item.shape === copy.targetShape)
          )
        : defs.find(
            (item) =>
              item.name === (copy.blockName ?? "") &&
              (copy.targetShape === undefined || item.shape === copy.targetShape)
          )
      if (!def) return

      const sourceBlock = controller.getCreatedBlock(sourceBlockId)
      const inputBindings =
        sourceBlock && copy.inputBindings
          ? Object.entries(copy.inputBindings).flatMap(([targetIndex, sourceIndex]) => {
              const numericSourceIndex = Number(sourceIndex)
              const input = sourceBlock.state.def.inputs[numericSourceIndex]
              if (!input) return []
              return [{
                targetIndex: Number(targetIndex),
                value: getInputValue(input, sourceBlock.state, numericSourceIndex),
              }]
            })
          : undefined

      spawnBlockAtPointer(def.id, event, inputBindings)
    },
    [snapshot.customProcedures, spawnBlockAtPointer]
  )

  const handleParamChipMouseDown = useCallback(
    (
      blockId: string,
      paramId: string,
      event: ReactMouseEvent<HTMLButtonElement>
    ) => {
      const block = controller.getCreatedBlock(blockId)
      if (!block || block.state.def.source.kind !== "custom-define") return
      const defId = `${CUSTOM_ARGUMENT_PREFIX}${block.state.def.source.procedureId}:${paramId}`
      spawnBlockAtPointer(defId, event)
    },
    [spawnBlockAtPointer]
  )

  // Define ブロックのクリックでは何もしない（編集は右クリックメニューから）
  const handleProcedureDefineClick = useCallback(
    (_block: BlockState, _event: ReactMouseEvent<HTMLDivElement>) => {},
    []
  )

  const handleCustomReporterClick = useCallback(
    (block: BlockState, event: ReactMouseEvent<HTMLDivElement>) => {
      if (block.def.source.kind !== "custom-call") return
      event.stopPropagation()
      setContextMenu(null)
      setEditorState(null)
      const runtime = runtimeRef?.current
      const spriteId = selectedSpriteId ?? undefined
      const preview = runtime?.getReporterPreview(block.id, spriteId)
      setPreviewState({
        blockId: block.id,
        x: event.clientX + 8,
        y: event.clientY + 8,
        value: preview === undefined || preview === null ? "未実行" : String(preview),
      })
    },
    [runtimeRef, selectedSpriteId]
  )

  useEffect(() => {
    const svgElement = svgRef.current
    const overlayElement = overlayRef.current
    const canvasElement = canvasRef.current
    if (!svgElement || !overlayElement || !canvasElement) return

    const isFirstMount = !mountedRef.current
    mountedRef.current = true

    if (isFirstMount) {
      // blockDataMap に初期データがあれば先にコントローラーに設定
      const initialData = blockDataMapRef.current[selectedSpriteId ?? ""]
      if (initialData) {
        controller.loadProjectData(initialData)
      }
      const workspace = new Workspace()
      workspaceRef.current = workspace
      sharedWorkspace = workspace
      // SvgRenderer はデバッグモード時のみ生成（別の useEffect で管理）
      controller.mount(workspace, containersRef.current)
    }

    const workspace = workspaceRef.current!

    const mouse = getMouseState(canvasElement, {
      mousedown: (_buttonState, mousePosition, event) => {
        if (event.button === 1) event.preventDefault()
        if (event.button === 2) return
        interactionRef.current?.handlePointerDown(mousePosition, event)
      },
      mouseup: (_buttonState, mousePosition) => {
        interactionRef.current?.handlePointerUp(mousePosition)
      },
    })
    mouseRef.current = mouse

    const domSync = new DomSyncHelper({
      workspace,
      overlayElement,
      canvasElement,
      gridSize: 24,
      resolveElement: (container: Container) =>
        document.getElementById(`node-${container.id}`),
    })
    domSyncRef.current = domSync

    const marqueeRect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
    marqueeRect.setAttribute("fill", "rgba(59,130,246,0.08)")
    marqueeRect.setAttribute("stroke", "rgba(59,130,246,0.4)")
    marqueeRect.setAttribute("stroke-width", "1")
    marqueeRect.setAttribute("stroke-dasharray", "4 2")
    marqueeRect.setAttribute("display", "none")
    marqueeRect.setAttribute("rx", "2")
    svgElement.appendChild(marqueeRect)

    const interaction = new InteractionManager({
      workspace,
      canvasElement,
      containers: () => containersRef.current,
      connectors: () => connectorsRef.current,
      gridSize: 24,
      emptyClickIntent: "pan",
      onModeChange: (mode) => {
        if (mode === "dragging" || mode === "panning") {
          canvasElement.style.cursor = "grabbing"
        } else if (mode === "edgeBuilding") {
          canvasElement.style.cursor = "crosshair"
        } else {
          canvasElement.style.cursor = ""
        }
      },
      onHover: (container) => {
        canvasElement.style.cursor = container ? "grab" : ""
      },
      onMarqueeUpdate: (rect) => {
        if (rect) {
          marqueeRect.setAttribute("display", "block")
          marqueeRect.setAttribute("x", `${rect.x}`)
          marqueeRect.setAttribute("y", `${rect.y}`)
          marqueeRect.setAttribute("width", `${rect.width}`)
          marqueeRect.setAttribute("height", `${rect.height}`)
        } else {
          marqueeRect.setAttribute("display", "none")
        }
      },
      ...controller.interactionOverrides,
    })
    interactionRef.current = interaction

    const preventMiddleMouse = (event: MouseEvent) => {
      if (event.button === 1) event.preventDefault()
    }
    canvasElement.addEventListener("mousedown", preventMiddleMouse)

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault()
      const rect = canvasElement.getBoundingClientRect()
      const screenPos = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
      const worldPos = screenToWorld(screenPos, workspace.viewport)

      const containers = containersRef.current
      let hit: Container | null = null
      for (let index = containers.length - 1; index >= 0; index -= 1) {
        const container = containers[index]
        const position = container.position
        if (
          worldPos.x >= position.x &&
          worldPos.x <= position.x + container.width &&
          worldPos.y >= position.y &&
          worldPos.y <= position.y + container.height
        ) {
          hit = container
          break
        }
      }

      if (hit) {
        setEditorState(null)
        setPreviewState(null)
        const hitBlock = controller.getCreatedBlock(hit.id)
        const hitSource = hitBlock?.state.def.source
        const procedureId =
          hitSource?.kind === "custom-define" ? hitSource.procedureId :
          hitSource?.kind === "custom-call" ? hitSource.procedureId :
          undefined
        setContextMenu({
          blockId: hit.id,
          x: event.clientX,
          y: event.clientY,
          procedureId,
        })
      } else {
        setContextMenu(null)
        setBgContextMenu({ x: event.clientX, y: event.clientY })
      }
    }
    canvasElement.addEventListener("contextmenu", handleContextMenu)

    const ZOOM_MIN = 0.1
    const ZOOM_MAX = 5
    const ZOOM_SENSITIVITY = 0.005
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      setContextMenu(null)
      setEditorState(null)
      setPreviewState(null)

      if (e.ctrlKey) {
        // ピンチズーム（トラックパッド）/ Ctrl+ホイール
        const rect = canvasElement.getBoundingClientRect()
        const factor = Math.exp(-e.deltaY * ZOOM_SENSITIVITY)
        const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, workspace.viewport.scale * factor))
        workspace.zoomAt(e.clientX - rect.left, e.clientY - rect.top, newScale)
      } else {
        // 通常スクロール（パン）
        workspace.panBy(-e.deltaX, -e.deltaY)
      }
    }
    canvasElement.addEventListener("wheel", handleWheel, { passive: false })

    // ── Ctrl+Space でブロック検索ポップオーバーを開く ──
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault()
        const rect = canvasElement.getBoundingClientRect()
        setBlockSearch({ x: rect.width / 2, y: rect.height / 3 })
      }
    }
    canvasElement.addEventListener("keydown", handleKeyDown)

    // ── フォーム要素のオクルージョン制御 ──
    // select/input がより高い z-index のブロックに覆われている場合、
    // pointer-events: none を動的に設定してイベント自体が届かないようにする。
    // これにより cursor・クリック・ドラッグすべてが上のブロックに正しく届く。
    const occludedElements = new Set<HTMLElement>()

    const isFormOccluded = (el: HTMLElement): boolean => {
      const blockEl = el.closest("[id^=\"node-\"]") as HTMLElement | null
      if (!blockEl) return false
      const blockId = blockEl.id.replace("node-", "")

      const rect = canvasElement.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      const screenPos = {
        x: (elRect.left + elRect.right) / 2 - rect.left,
        y: (elRect.top + elRect.bottom) / 2 - rect.top,
      }
      const worldPos = screenToWorld(screenPos, workspace.viewport)

      const containers = containersRef.current
      const ourIndex = containers.findIndex((c) => c.id === blockId)
      if (ourIndex === -1) return false

      for (let i = containers.length - 1; i > ourIndex; i--) {
        const c = containers[i]
        const pos = c.position
        if (
          worldPos.x >= pos.x &&
          worldPos.x <= pos.x + c.width &&
          worldPos.y >= pos.y &&
          worldPos.y <= pos.y + c.height
        ) {
          return true
        }
      }
      return false
    }

    // pointermove: 覆われた select/input に pointer-events: none を設定
    const handleFormOcclusion = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      const tag = target.tagName
      if (tag !== "SELECT" && tag !== "INPUT" && tag !== "TEXTAREA") return
      if (isFormOccluded(target)) {
        target.style.pointerEvents = "none"
        occludedElements.add(target)
      }
    }
    overlayElement.addEventListener("pointermove", handleFormOcclusion, true)

    // mousedown: pointer-events: none 設定前にクリックが届いた場合のフォールバック
    const preventOccludedFormClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const tag = target.tagName
      if (tag !== "SELECT" && tag !== "INPUT" && tag !== "TEXTAREA") return
      if (isFormOccluded(target)) {
        e.preventDefault()
        target.style.pointerEvents = "none"
        occludedElements.add(target)
      }
    }
    overlayElement.addEventListener("mousedown", preventOccludedFormClick, true)

    const tick = () => {
      // 覆われなくなった要素の pointer-events を復元
      for (const el of occludedElements) {
        if (!el.isConnected || !isFormOccluded(el)) {
          el.style.pointerEvents = ""
          occludedElements.delete(el)
        }
      }
      interactionRef.current?.tick(mouse.mousePosition, mouse.buttonState)
      domSyncRef.current?.syncAll(containersRef.current)
      rafIdRef.current = requestAnimationFrame(tick)
    }
    rafIdRef.current = requestAnimationFrame(tick)

    return () => {
      // 復元
      for (const el of occludedElements) {
        el.style.pointerEvents = ""
      }
      occludedElements.clear()
      cancelAnimationFrame(rafIdRef.current)
      keyboardRef.current?.destroy()
      keyboardRef.current = null
      interaction.destroy()
      canvasElement.removeEventListener("mousedown", preventMiddleMouse)
      canvasElement.removeEventListener("contextmenu", handleContextMenu)
      canvasElement.removeEventListener("wheel", handleWheel)
      canvasElement.removeEventListener("keydown", handleKeyDown)
      overlayElement.removeEventListener("pointermove", handleFormOcclusion, true)
      overlayElement.removeEventListener("mousedown", preventOccludedFormClick, true)
      interactionRef.current = null
      domSyncRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isActive) {
      keyboardRef.current?.destroy()
      keyboardRef.current = null
      setContextMenu(null)
      setEditorState(null)
      setPreviewState(null)
      return
    }

    const workspace = workspaceRef.current
    if (!workspace || typeof document === "undefined") return

    keyboardRef.current?.destroy()
    keyboardRef.current = bindDefaultShortcuts({
      workspace,
      element: document.body,
      containers: () => containersRef.current,
    })

    return () => {
      keyboardRef.current?.destroy()
      keyboardRef.current = null
    }
  }, [isActive])

  // デバッグ表示: SvgRenderer の条件付き生成・破棄
  // debugView=true の時だけ専用 SVG を追加して SvgRenderer を生成
  // false に戻ったらその SVG を DOM から除去（メインの SVG はマーキー用に残す）
  const debugSvgRef = useRef<SVGSVGElement | null>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const mainSvg = svgRef.current
    const workspace = workspaceRef.current
    if (!canvas || !mainSvg || !workspace) return

    if (debugView) {
      // デバッグ用 SVG を作成しメイン SVG の前に挿入
      const debugSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement
      debugSvg.style.width = "100%"
      debugSvg.style.height = "100%"
      debugSvg.style.position = "absolute"
      debugSvg.style.top = "0"
      debugSvg.style.left = "0"
      debugSvg.style.pointerEvents = "none"
      canvas.insertBefore(debugSvg, mainSvg)
      debugSvgRef.current = debugSvg

      // SvgRenderer を生成（デバッグ用 SVG に描画）
      new SvgRenderer(debugSvg, workspace)

      // 現在のビューポート位置を SvgRenderer に同期
      workspace.eventBus.emit("pan", workspace.viewport)
      workspace.eventBus.emit("zoom", workspace.viewport)

      // 既存の全要素を再描画させるため workspace の要素を再通知
      for (const el of workspace.elements) {
        workspace.eventBus.emit("add", el)
      }
      for (const edge of workspace.edges) {
        workspace.eventBus.emit("add", edge)
      }

      return () => {
        // デバッグ OFF 時: SVG を DOM から除去
        // SvgRenderer のイベントハンドラは detach された DOM に書き込むだけなので無害
        debugSvg.remove()
        debugSvgRef.current = null
      }
    }
  }, [debugView])

  const editingProcedure = editorState
    ? controller.getCustomProcedure(editorState.procedureId) ?? null
    : null

  return (
    <div
      ref={canvasRef}
      tabIndex={0}
      className="vpl-canvas outline-none"
      style={{
        backgroundColor: "#ffffff",
        backgroundImage:
          "radial-gradient(circle, #d4d4d8 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
      onClick={() => {
        setContextMenu(null)
        setPreviewState(null)
      }}
    >
      <svg ref={svgRef} />
      <div ref={overlayRef} className="dom-overlay" style={debugView ? { opacity: 0, pointerEvents: "none" } : undefined}>
        {snapshot.blocks.map((block, index) => (
          <BlockView
            key={block.id}
            block={block}
            container={controller.getContainer(block.id)}
            createdBlock={controller.getCreatedBlock(block.id)}
            cBlockRef={controller.getCBlockRef(block.id)}
            zIndex={index + 1}
            nestedSlots={snapshot.nestedSlots}
            customVariables={snapshot.customVariables}
            spriteNames={spriteNames}
            onInputValueChange={controller.updateInputValue.bind(controller)}
            onHeaderReporterMouseDown={handleHeaderReporterMouseDown}
            onParamChipMouseDown={handleParamChipMouseDown}
            onProcedureDefineClick={handleProcedureDefineClick}
            onCustomReporterClick={handleCustomReporterClick}
          />
        ))}
      </div>

      {/* 背景コンテキストメニュー */}
      {bgContextMenu && createPortal(
        <div
          className="fixed inset-0 z-[9999]"
          onClick={() => setBgContextMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setBgContextMenu(null) }}
        >
          <div
            className="absolute min-w-36 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 animate-in fade-in-0 zoom-in-95"
            style={{ left: bgContextMenu.x, top: bgContextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground"
              onClick={() => { controller.cleanupBlocks(); setBgContextMenu(null) }}
            >
              ブロックを整頓
            </button>
          </div>
        </div>,
        document.body
      )}

      <BlockContextMenu
        state={contextMenu}
        onClose={() => setContextMenu(null)}
        onDelete={(id) => controller.deleteBlock(id)}
        onDeleteChain={(id) => {
          const chainIds = controller.getChainIds(id)
          for (const cid of chainIds) controller.deleteBlock(cid)
        }}
        onDuplicate={(id) => controller.duplicateBlock(id)}
        onEdit={contextMenu?.procedureId ? (blockId) => {
          const procedureId = contextMenu.procedureId!
          setContextMenu(null)
          setEditorState({
            blockId,
            procedureId,
            x: contextMenu.x,
            y: contextMenu.y,
          })
        } : undefined}
      />

      <ProcedureEditorPopover
        state={editorState}
        procedure={editingProcedure}
        onClose={() => setEditorState(null)}
        onAddLabel={(procedureId) => controller.createProcedureLabel(procedureId)}
        onAddParam={(procedureId, valueType) =>
          controller.createProcedureParam(procedureId, valueType)
        }
        onReorderToken={(procedureId, fromIndex, toIndex) =>
          controller.reorderProcedureToken(procedureId, fromIndex, toIndex)
        }
        onRemoveToken={(procedureId, tokenId) =>
          controller.removeProcedureToken(procedureId, tokenId)
        }
        onLabelChange={(procedureId, tokenId, text) =>
          controller.setProcedureLabelText(procedureId, tokenId, text)
        }
        onParamNameChange={(procedureId, paramId, name) =>
          controller.setProcedureParamName(procedureId, paramId, name)
        }
        onReturnsValueChange={(procedureId, value) =>
          controller.setProcedureReturnsValue(procedureId, value)
        }
        onChangeTokenType={(procedureId, tokenId, newType) =>
          controller.changeProcedureTokenType(procedureId, tokenId, newType)
        }
      />

      <ReporterPreviewPopover
        state={previewState}
        onClose={() => setPreviewState(null)}
      />

      <BlockSearchPopover
        open={!!blockSearch}
        position={blockSearch ?? { x: 0, y: 0 }}
        onSelect={(defId) => {
          const ws = workspaceRef.current
          if (ws) {
            const vp = ws.viewport
            const centerX = -vp.x / vp.scale + 300 / vp.scale
            const centerY = -vp.y / vp.scale + 200 / vp.scale
            controller.addBlock(defId, centerX, centerY)
          }
          setBlockSearch(null)
        }}
        onClose={() => setBlockSearch(null)}
      />

      {/* ミニマップ */}
      <Minimap containers={containersRef} workspace={workspaceRef} canvasRef={canvasRef} />
    </div>
  )
}

// ─── ミニマップ ─────────────────────────────────

const MINIMAP_W = 120
const MINIMAP_H = 80

function Minimap({
  containers,
  workspace,
  canvasRef,
}: {
  containers: React.RefObject<Container[]>
  workspace: React.RefObject<Workspace | null>
  canvasRef: React.RefObject<HTMLDivElement | null>
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let rafId = 0
    const draw = () => {
      const canvas = ref.current
      const ws = workspace.current
      const items = containers.current
      if (!canvas || !ws || !items) {
        rafId = requestAnimationFrame(draw)
        return
      }
      if (items.length === 0) {
        const ctx = canvas.getContext("2d")
        if (ctx) ctx.clearRect(0, 0, MINIMAP_W, MINIMAP_H)
        rafId = requestAnimationFrame(draw)
        return
      }

      const ctx = canvas.getContext("2d")
      if (!ctx) { rafId = requestAnimationFrame(draw); return }

      // ブロック全体のバウンディングボックスを計算
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const c of items) {
        const pos = c.position
        minX = Math.min(minX, pos.x)
        minY = Math.min(minY, pos.y)
        maxX = Math.max(maxX, pos.x + c.width)
        maxY = Math.max(maxY, pos.y + c.height)
      }

      const worldW = maxX - minX + 100
      const worldH = maxY - minY + 100
      const scale = Math.min(MINIMAP_W / worldW, MINIMAP_H / worldH)

      ctx.clearRect(0, 0, MINIMAP_W, MINIMAP_H)
      ctx.fillStyle = "rgba(255,255,255,0.85)"
      ctx.fillRect(0, 0, MINIMAP_W, MINIMAP_H)

      // ブロックを描画
      for (const c of items) {
        const pos = c.position
        const x = (pos.x - minX + 50) * scale
        const y = (pos.y - minY + 50) * scale
        const w = Math.max(c.width * scale, 2)
        const h = Math.max(c.height * scale, 1)
        ctx.fillStyle = c.color ?? "#4C97FF"
        ctx.fillRect(x, y, w, h)
      }

      // ビューポート領域を描画
      const canvasEl = canvasRef.current
      if (canvasEl) {
        const vp = ws.viewport
        const vpX = (-vp.x / vp.scale - minX + 50) * scale
        const vpY = (-vp.y / vp.scale - minY + 50) * scale
        const vpW = (canvasEl.clientWidth / vp.scale) * scale
        const vpH = (canvasEl.clientHeight / vp.scale) * scale
        ctx.strokeStyle = "rgba(59, 130, 246, 0.6)"
        ctx.lineWidth = 1
        ctx.strokeRect(vpX, vpY, vpW, vpH)
      }

      rafId = requestAnimationFrame(draw)
    }
    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [containers, workspace, canvasRef])

  return (
    <canvas
      ref={ref}
      width={MINIMAP_W}
      height={MINIMAP_H}
      className="absolute bottom-2 right-2 rounded border border-zinc-200 shadow-sm pointer-events-none"
      style={{ width: MINIMAP_W, height: MINIMAP_H }}
    />
  )
}
