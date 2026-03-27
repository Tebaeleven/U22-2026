"use client"

import { useEffect, useRef } from "react"
import {
  Workspace,
  Container,
  Connector,
  Edge,
  Position,
  SvgRenderer,
} from "headless-vpl"
import { DomSyncHelper, bindWheelZoom } from "headless-vpl/helpers"
import { InteractionManager } from "headless-vpl/recipes"
import { getMouseState } from "headless-vpl/util/mouse"

const NODES = [
  { name: "nodeA", x: 100, y: 100, label: "開始", color: "#3b82f6" },
  { name: "nodeB", x: 400, y: 80, label: "処理", color: "#10b981" },
  { name: "nodeC", x: 400, y: 260, label: "分岐", color: "#f59e0b" },
] as const

const NODE_W = 160
const NODE_H = 60

export default function SamplePage() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  useEffect(() => {
    const canvas = canvasRef.current
    const svg = svgRef.current
    const overlay = overlayRef.current
    if (!canvas || !svg || !overlay) return

    // 1. Workspace + SvgRenderer
    const workspace = new Workspace()
    new SvgRenderer(svg, workspace)

    // 2. Container を作成
    const containers = NODES.map(
      (n) =>
        new Container({
          workspace,
          position: new Position(n.x, n.y),
          name: n.name,
          width: NODE_W,
          height: NODE_H,
          children: {
            output: new Connector({
              name: "out",
              type: "output",
              anchor: { target: "parent", origin: "center-right" },
            }),
            input: new Connector({
              name: "in",
              type: "input",
              anchor: { target: "parent", origin: "center-left" },
            }),
          },
        })
    )

    // 3. Edge で接続 (A→B, A→C)
    new Edge({
      start: containers[0].children.output,
      end: containers[1].children.input,
      edgeType: "bezier",
    })
    new Edge({
      start: containers[0].children.output,
      end: containers[2].children.input,
      edgeType: "bezier",
    })

    // 4. DomSync
    const domSync = new DomSyncHelper({
      workspace,
      overlayElement: overlay,
      canvasElement: canvas,
      gridSize: 24,
      resolveElement: (container) => nodeRefs.current.get(container.name) ?? null,
    })

    // 5. InteractionManager
    const interaction = new InteractionManager({
      workspace,
      canvasElement: canvas,
      containers: () => containers,
    })

    // 6. マウストラッキング
    const mouse = getMouseState(canvas, {
      mousedown: (_bs, mp, ev) => interaction.handlePointerDown(mp, ev),
      mouseup: (_bs, mp) => interaction.handlePointerUp(mp),
    })

    // 7. ホイールズーム
    const cleanupZoom = bindWheelZoom(canvas, { workspace })

    // 8. アニメーションループ
    let rafId = 0
    const tick = () => {
      interaction.tick(mouse.mousePosition, mouse.buttonState)
      domSync.syncAll(containers)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      cleanupZoom()
    }
  }, [])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-zinc-950">
      {/* キャンバス（グリッド背景） */}
      <div
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        {/* SVGワイヤーフレーム（デバッグ用・半透明） */}
        <svg
          ref={svgRef}
          className="absolute inset-0 h-full w-full pointer-events-none opacity-20"
        />

        {/* DOMオーバーレイ */}
        <div ref={overlayRef} className="absolute inset-0">
          {NODES.map((n) => (
            <div
              key={n.name}
              ref={(el) => {
                if (el) nodeRefs.current.set(n.name, el)
              }}
              className="absolute top-0 left-0 flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-sm text-zinc-100 shadow-lg select-none"
              style={{ width: NODE_W, height: NODE_H }}
            >
              <div
                className="mr-2 h-3 w-3 rounded-full"
                style={{ backgroundColor: n.color }}
              />
              {n.label}
            </div>
          ))}
        </div>
      </div>

      {/* 操作ガイド */}
      <div className="absolute bottom-4 left-4 rounded-md border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-400">
        ドラッグ: ノード移動 ／ 中クリックドラッグ: パン ／ ホイール: ズーム
      </div>
    </div>
  )
}
