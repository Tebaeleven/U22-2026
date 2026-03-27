"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent as ReactMouseEvent,
} from "react"
import {
  Workspace,
  SvgRenderer,
  screenToWorld,
  type Container,
  type Connector,
} from "headless-vpl"
import { DomSyncHelper, bindWheelZoom } from "headless-vpl/helpers"
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
}: {
  runtimeRef?: React.RefObject<Runtime | null>
  selectedSpriteId?: string | null
  isActive?: boolean
}) {
  const dispatch = useAppDispatch()
  const blockDataMap = useAppSelector((s) => s.sprites.blockDataMap)

  const svgRef = useRef<SVGSVGElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const [contextMenu, setContextMenu] = useState<BlockContextMenuState>(null)
  const [editorState, setEditorState] = useState<ProcedureEditorState>(null)
  const [previewState, setPreviewState] = useState<ReporterPreviewState>(null)

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

      const def = getBlockDefById(defId, snapshot.customProcedures)
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
    [beginDragForBlock, snapshot.customProcedures]
  )

  const handleHeaderReporterMouseDown = useCallback(
    (
      sourceBlockId: string,
      copy: HeaderReporterCopy,
      event: ReactMouseEvent<HTMLElement>
    ) => {
      const defs = getBlockDefs(snapshot.customProcedures)
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

  const handleProcedureDefineClick = useCallback(
    (block: BlockState, event: ReactMouseEvent<HTMLDivElement>) => {
      if (block.def.source.kind !== "custom-define") return
      event.stopPropagation()
      setContextMenu(null)
      setPreviewState(null)
      setEditorState({
        blockId: block.id,
        procedureId: block.def.source.procedureId,
        x: event.clientX + 8,
        y: event.clientY + 8,
      })
    },
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
      const workspace = new Workspace()
      workspaceRef.current = workspace
      sharedWorkspace = workspace
      new SvgRenderer(svgElement, workspace)
      controller.mount(workspace, containersRef.current)
    }

    const workspace = workspaceRef.current!
    if (!isFirstMount) {
      new SvgRenderer(svgElement, workspace)
    }

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
      }
    }
    canvasElement.addEventListener("contextmenu", handleContextMenu)

    const handleWheel = () => {
      setContextMenu(null)
      setEditorState(null)
      setPreviewState(null)
    }
    canvasElement.addEventListener("wheel", handleWheel, { passive: true })

    // 上に別ブロックが重なっている場合、下のブロックの select/input クリックを抑制
    // ※ .dom-overlay は pointer-events: none のため elementsFromPoint ではブロック div を検出できない
    //    → Container 座標で手動ヒットテストを行う（contextmenu ハンドラと同じ方式）
    const preventOccludedFormClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const tag = target.tagName
      if (tag !== "SELECT" && tag !== "INPUT" && tag !== "TEXTAREA") return

      const blockEl = target.closest("[id^=\"node-\"]") as HTMLElement | null
      if (!blockEl) return
      const blockId = blockEl.id.replace("node-", "")

      const rect = canvasElement.getBoundingClientRect()
      const screenPos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
      const worldPos = screenToWorld(screenPos, workspace.viewport)

      // containersRef はレンダー順（後ほど高い z-index）
      const containers = containersRef.current
      const ourIndex = containers.findIndex((c) => c.id === blockId)
      if (ourIndex === -1) return

      // より高い z-index のコンテナがこの位置を覆っているか確認
      for (let i = containers.length - 1; i > ourIndex; i--) {
        const c = containers[i]
        const pos = c.position
        if (
          worldPos.x >= pos.x &&
          worldPos.x <= pos.x + c.width &&
          worldPos.y >= pos.y &&
          worldPos.y <= pos.y + c.height
        ) {
          e.preventDefault()
          return
        }
      }
    }
    overlayElement.addEventListener("mousedown", preventOccludedFormClick, true)

    const cleanupZoom = bindWheelZoom(canvasElement, { workspace })

    const tick = () => {
      interactionRef.current?.tick(mouse.mousePosition, mouse.buttonState)
      domSyncRef.current?.syncAll(containersRef.current)
      rafIdRef.current = requestAnimationFrame(tick)
    }
    rafIdRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafIdRef.current)
      keyboardRef.current?.destroy()
      keyboardRef.current = null
      interaction.destroy()
      cleanupZoom()
      canvasElement.removeEventListener("mousedown", preventMiddleMouse)
      canvasElement.removeEventListener("contextmenu", handleContextMenu)
      canvasElement.removeEventListener("wheel", handleWheel)
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

  const editingProcedure = editorState
    ? controller.getCustomProcedure(editorState.procedureId) ?? null
    : null

  return (
    <div
      ref={canvasRef}
      className="vpl-canvas"
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
      <div ref={overlayRef} className="dom-overlay">
        {snapshot.blocks.map((block, index) => (
          <BlockView
            key={block.id}
            block={block}
            container={controller.getContainer(block.id)}
            createdBlock={controller.getCreatedBlock(block.id)}
            cBlockRef={controller.getCBlockRef(block.id)}
            zIndex={index + 1}
            nestedSlots={snapshot.nestedSlots}
            onInputValueChange={controller.updateInputValue.bind(controller)}
            onHeaderReporterMouseDown={handleHeaderReporterMouseDown}
            onParamChipMouseDown={handleParamChipMouseDown}
            onProcedureDefineClick={handleProcedureDefineClick}
            onCustomReporterClick={handleCustomReporterClick}
          />
        ))}
      </div>

      <BlockContextMenu
        state={contextMenu}
        onClose={() => setContextMenu(null)}
        onDelete={(id) => controller.deleteBlock(id)}
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
        onMoveToken={(procedureId, tokenId, direction) =>
          controller.moveProcedureToken(procedureId, tokenId, direction)
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
      />

      <ReporterPreviewPopover
        state={previewState}
        onClose={() => setPreviewState(null)}
      />
    </div>
  )
}
