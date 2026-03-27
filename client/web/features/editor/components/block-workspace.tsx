"use client"

import { useEffect, useRef, useSyncExternalStore } from "react"
import {
  Workspace,
  SvgRenderer,
  type Container,
  type Connector,
} from "headless-vpl"
import { DomSyncHelper, bindWheelZoom } from "headless-vpl/helpers"
import {
  InteractionManager,
  bindDefaultShortcuts,
} from "headless-vpl/recipes"
import { getMouseState } from "headless-vpl/util/mouse"
import { BlockEditorController } from "../block-editor/controller"
import { BlockView } from "../block-editor/view"

const controller = new BlockEditorController()

export function BlockWorkspace() {
  const svgRef = useRef<SVGSVGElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot
  )

  useEffect(() => {
    const svgElement = svgRef.current
    const overlayElement = overlayRef.current
    const canvasElement = canvasRef.current
    if (!svgElement || !overlayElement || !canvasElement) return

    // Workspace + SvgRenderer 初期化
    const workspace = new Workspace()
    new SvgRenderer(svgElement, workspace)

    const containersRef: Container[] = []
    const connectorsRef: Connector[] = []

    // マウス入力
    let interactionRef: InteractionManager | null = null
    const mouse = getMouseState(canvasElement, {
      mousedown: (_bs, mp, ev) => {
        if (ev.button === 1) ev.preventDefault()
        interactionRef?.handlePointerDown(mp, ev)
      },
      mouseup: (_bs, mp) => {
        interactionRef?.handlePointerUp(mp)
      },
    })

    // DOM同期
    const domSync = new DomSyncHelper({
      workspace,
      overlayElement,
      canvasElement,
      gridSize: 24,
      resolveElement: (container: Container) =>
        document.getElementById(`node-${container.id}`),
    })

    // マーキー選択用 SVG rect
    const marqueeRect = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    )
    marqueeRect.setAttribute("fill", "rgba(59,130,246,0.08)")
    marqueeRect.setAttribute("stroke", "rgba(59,130,246,0.4)")
    marqueeRect.setAttribute("stroke-width", "1")
    marqueeRect.setAttribute("stroke-dasharray", "4 2")
    marqueeRect.setAttribute("display", "none")
    marqueeRect.setAttribute("rx", "2")
    svgElement.appendChild(marqueeRect)

    // InteractionManager
    const interaction = new InteractionManager({
      workspace,
      canvasElement,
      containers: () => containersRef,
      connectors: () => connectorsRef,
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
    interactionRef = interaction

    // ミドルクリック防止
    const preventMiddleMouse = (event: MouseEvent) => {
      if (event.button === 1) event.preventDefault()
    }
    canvasElement.addEventListener("mousedown", preventMiddleMouse)

    // ホイールズーム
    const cleanupZoom = bindWheelZoom(canvasElement, { workspace })

    // キーボードショートカット
    const keyboard = bindDefaultShortcuts({
      workspace,
      element: document.body,
      containers: () => containersRef,
    })

    // コントローラーをマウント
    const unmountController = controller.mount(workspace, containersRef)

    // アニメーションループ
    let rafId = 0
    const tick = () => {
      interaction.tick(mouse.mousePosition, mouse.buttonState)
      domSync.syncAll(containersRef)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      unmountController()
      keyboard.destroy()
      interaction.destroy()
      cleanupZoom()
      canvasElement.removeEventListener("mousedown", preventMiddleMouse)
    }
  }, [])

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
          />
        ))}
      </div>
    </div>
  )
}
