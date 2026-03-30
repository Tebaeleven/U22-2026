"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import {
  Workspace,
  SvgRenderer,
  type Container,
  type Connector,
} from "headless-vpl"
import { DomSyncHelper } from "headless-vpl/helpers"
import { InteractionManager } from "headless-vpl/recipes"
import { getMouseState } from "headless-vpl/util/mouse"
import { ModelDiagramController } from "../controller"
import { SpriteCard } from "./sprite-card"
import { DiagramNoteCard } from "./diagram-note"
import { DiagramToolbar } from "./diagram-toolbar"
import { RELATION_STYLES } from "../edge-styles"
import { ALL_RELATION_TYPES, type RelationType } from "../types"
import type { BlockProjectData } from "../../block-editor/types"

const SVG_NS = "http://www.w3.org/2000/svg"

const controller = new ModelDiagramController()

export function getModelDiagramController(): ModelDiagramController {
  return controller
}

type ModelDiagramWorkspaceProps = {
  sprites: { id: string; name: string }[]
  blockDataMap: Record<string, BlockProjectData>
  pseudocode?: string
  onNavigateToSprite?: (spriteId: string) => void
}

// ─── エッジルーティング ───

type Pt = { x: number; y: number }

/** 矩形中心から target へ向かう直線が矩形境界と交差する点 */
function rectBorderPoint(
  cx: number, cy: number,
  w: number, h: number,
  targetX: number, targetY: number
): Pt {
  const dx = targetX - cx
  const dy = targetY - cy
  if (dx === 0 && dy === 0) return { x: cx, y: cy }

  const hw = w / 2
  const hh = h / 2
  const scaleX = dx !== 0 ? hw / Math.abs(dx) : Infinity
  const scaleY = dy !== 0 ? hh / Math.abs(dy) : Infinity
  const scale = Math.min(scaleX, scaleY)

  return { x: cx + dx * scale, y: cy + dy * scale }
}

/** 線分が矩形（margin拡張済み）と交差するか — Liang-Barsky */
function lineIntersectsRect(
  x1: number, y1: number, x2: number, y2: number,
  rx: number, ry: number, rw: number, rh: number,
  margin: number
): boolean {
  const left = rx - margin
  const top = ry - margin
  const right = rx + rw + margin
  const bottom = ry + rh + margin

  const dx = x2 - x1
  const dy = y2 - y1

  const p = [-dx, dx, -dy, dy]
  const q = [x1 - left, right - x1, y1 - top, bottom - y1]

  let tMin = 0
  let tMax = 1

  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false
    } else {
      const t = q[i] / p[i]
      if (p[i] < 0) {
        tMin = Math.max(tMin, t)
      } else {
        tMax = Math.min(tMax, t)
      }
      if (tMin > tMax) return false
    }
  }
  return true
}

const OBSTACLE_MARGIN = 40

type ObstacleInfo = {
  cx: number
  cy: number
  hw: number
  hh: number
  /** 線上の射影パラメータ (0..1) */
  t: number
}

/** 直線上の障害物ノードを検出 */
function findObstacles(
  start: Pt, end: Pt,
  fromId: string, toId: string,
  cardMap: Map<string, Container>
): ObstacleInfo[] {
  const obstacles: ObstacleInfo[] = []
  const lx = end.x - start.x
  const ly = end.y - start.y
  const lenSq = lx * lx + ly * ly
  if (lenSq === 0) return []

  for (const [spriteId, container] of cardMap) {
    if (spriteId === fromId || spriteId === toId) continue
    const pos = container.position
    const w = container.width
    const h = container.height

    if (!lineIntersectsRect(start.x, start.y, end.x, end.y, pos.x, pos.y, w, h, OBSTACLE_MARGIN)) {
      continue
    }

    const cx = pos.x + w / 2
    const cy = pos.y + h / 2
    const t = ((cx - start.x) * lx + (cy - start.y) * ly) / lenSq

    obstacles.push({ cx, cy, hw: w / 2, hh: h / 2, t })
  }

  obstacles.sort((a, b) => a.t - b.t)
  return obstacles
}

/**
 * 障害物がある場合のベジェ迂回パスを計算。
 *
 * 二次ベジェ Q(t) の直線からの偏差は controlOffset * 2t(1-t)。
 * 障害物の t 位置での偏差が、障害物の迂回側の端 + margin を超える必要がある。
 *
 * neededDeviation = 障害物端（迂回側）の直線からの距離 + margin
 * controlOffset >= neededDeviation / (2t(1-t))
 */
function computeAvoidancePath(
  start: Pt, end: Pt, obstacles: ObstacleInfo[]
): { path: string; cp: Pt } | null {
  if (obstacles.length === 0) return null

  const mx = (start.x + end.x) / 2
  const my = (start.y + end.y) / 2

  const dx = end.x - start.x
  const dy = end.y - start.y
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return null

  // 単位法線（左側を正方向）
  const nx = -dy / len
  const ny = dx / len

  // まず迂回方向を決定（障害物中心が多い側の反対）
  let sideSign = 0
  for (const obs of obstacles) {
    const signedDist = (obs.cx - start.x) * nx + (obs.cy - start.y) * ny
    sideSign += signedDist >= 0 ? -1 : 1
  }
  sideSign = sideSign >= 0 ? 1 : -1

  let maxControlOffset = 0

  for (const obs of obstacles) {
    // 障害物中心の直線からの符号付き距離（法線方向が正）
    const signedDist = (obs.cx - start.x) * nx + (obs.cy - start.y) * ny

    // 法線方向の障害物半幅: 法線が矩形のどの軸に近いかで決まる
    // |nx| が大きい → 障害物の hw が効く、|ny| が大きい → hh が効く
    const halfExtentAlongNormal = Math.abs(nx) * obs.hw + Math.abs(ny) * obs.hh

    // 迂回側における障害物端の直線からの距離
    // sideSign > 0 なら法線正方向に迂回 → 障害物の法線正方向の端 = signedDist + halfExtent
    // sideSign < 0 なら法線負方向に迂回 → 障害物の法線負方向の端 = -(signedDist - halfExtent) = halfExtent - signedDist
    const obstacleEdgeDist = sideSign > 0
      ? signedDist + halfExtentAlongNormal
      : halfExtentAlongNormal - signedDist

    // 迂回に必要な偏差: 障害物端 + margin（負ならそもそも迂回不要）
    const neededDeviation = Math.max(0, obstacleEdgeDist + OBSTACLE_MARGIN)
    if (neededDeviation === 0) continue

    const tClamped = Math.max(0.15, Math.min(0.85, obs.t))
    const bezierFactor = 2 * tClamped * (1 - tClamped)
    const controlOffset = neededDeviation / bezierFactor

    maxControlOffset = Math.max(maxControlOffset, controlOffset)
  }

  if (maxControlOffset === 0) return null

  const cp: Pt = {
    x: mx + nx * sideSign * maxControlOffset,
    y: my + ny * sideSign * maxControlOffset,
  }

  return {
    path: `Q ${cp.x} ${cp.y}, ${end.x} ${end.y}`,
    cp,
  }
}

// ─── 同一辺に接続するエッジの接続点を均等分散 ───

type Side = "top" | "bottom" | "left" | "right"

/** 矩形のどの辺に点が接触しているか判定 */
function detectSide(pt: Pt, cx: number, cy: number, hw: number, hh: number): Side {
  const distTop = Math.abs(pt.y - (cy - hh))
  const distBottom = Math.abs(pt.y - (cy + hh))
  const distLeft = Math.abs(pt.x - (cx - hw))
  const distRight = Math.abs(pt.x - (cx + hw))
  const min = Math.min(distTop, distBottom, distLeft, distRight)
  if (min === distTop) return "top"
  if (min === distBottom) return "bottom"
  if (min === distLeft) return "left"
  return "right"
}

type EdgeEndInfo = {
  edgeIdx: number
  side: Side
  /** ソート用: 相手ノードの位置（top/bottom なら x, left/right なら y） */
  sortKey: number
}

/**
 * 全エッジの接続点を計算。同一ノードの同一辺に複数エッジが接続する場合、
 * 辺上に均等分散して自然な隙間を作る。
 * visibleTypes: 現在表示中の関係タイプ。非表示エッジは分散計算から除外する。
 */
function computeDistributedPoints(
  svgElements: EdgeSvgElement[],
  cMap: Map<string, Container>,
  visibleTypes: Set<RelationType>
): { starts: Pt[]; ends: Pt[] } {
  const starts: Pt[] = new Array(svgElements.length)
  const ends: Pt[] = new Array(svgElements.length)

  // Phase 1: 素朴な接続点を計算し辺を判定（表示中のエッジのみ分散対象）
  const groups = new Map<string, EdgeEndInfo[]>()

  for (let i = 0; i < svgElements.length; i++) {
    const el = svgElements[i]
    const fc = cMap.get(el.fromSpriteId)
    const tc = cMap.get(el.toSpriteId)
    if (!fc || !tc) continue

    const fcx = fc.position.x + fc.width / 2
    const fcy = fc.position.y + fc.height / 2
    const tcx = tc.position.x + tc.width / 2
    const tcy = tc.position.y + tc.height / 2

    const rawStart = rectBorderPoint(fcx, fcy, fc.width, fc.height, tcx, tcy)
    const rawEnd = rectBorderPoint(tcx, tcy, tc.width, tc.height, fcx, fcy)

    starts[i] = rawStart
    ends[i] = rawEnd

    // 非表示エッジは分散グループに含めない（デフォルト位置のまま）
    if (!visibleTypes.has(el.relationType as RelationType)) continue

    // from 側の辺
    const fromSide = detectSide(rawStart, fcx, fcy, fc.width / 2, fc.height / 2)
    const fromKey = `${el.fromSpriteId}:${fromSide}:from`
    const fromSortKey = (fromSide === "top" || fromSide === "bottom") ? tcx : tcy
    if (!groups.has(fromKey)) groups.set(fromKey, [])
    groups.get(fromKey)!.push({ edgeIdx: i, side: fromSide, sortKey: fromSortKey })

    // to 側の辺
    const toSide = detectSide(rawEnd, tcx, tcy, tc.width / 2, tc.height / 2)
    const toKey = `${el.toSpriteId}:${toSide}:to`
    const toSortKey = (toSide === "top" || toSide === "bottom") ? fcx : fcy
    if (!groups.has(toKey)) groups.set(toKey, [])
    groups.get(toKey)!.push({ edgeIdx: i, side: toSide, sortKey: toSortKey })
  }

  // Phase 2: グループ内で均等分散
  for (const [key, members] of groups) {
    if (members.length <= 1) continue

    // ソート（交差を減らす）
    members.sort((a, b) => a.sortKey - b.sortKey)

    const parts = key.split(":")
    const spriteId = parts[0]
    const side = parts[1] as Side
    const endType = parts[2] // "from" or "to"

    const container = cMap.get(spriteId)
    if (!container) continue

    const cx = container.position.x + container.width / 2
    const cy = container.position.y + container.height / 2
    const hw = container.width / 2
    const hh = container.height / 2

    const count = members.length
    for (let j = 0; j < count; j++) {
      const ratio = (j + 1) / (count + 1) // 均等分割 (0..1)
      const offset = (ratio - 0.5) * 0.8   // -0.4 ~ +0.4

      let pt: Pt
      switch (side) {
        case "top":
          pt = { x: cx + offset * container.width, y: cy - hh }
          break
        case "bottom":
          pt = { x: cx + offset * container.width, y: cy + hh }
          break
        case "left":
          pt = { x: cx - hw, y: cy + offset * container.height }
          break
        case "right":
          pt = { x: cx + hw, y: cy + offset * container.height }
          break
      }

      if (endType === "from") {
        starts[members[j].edgeIdx] = pt
      } else {
        ends[members[j].edgeIdx] = pt
      }
    }
  }

  // Phase 3: 分散後の接続点に合わせて反対側を再計算
  // 出発点が分散でずれた → 到着点を「分散済み出発点→ターゲット中心」で再計算
  // 到着点が分散でずれた → 出発点を「分散済み到着点→ソース中心」で再計算
  for (let i = 0; i < svgElements.length; i++) {
    if (!starts[i] || !ends[i]) continue
    const el = svgElements[i]
    const fc = cMap.get(el.fromSpriteId)
    const tc = cMap.get(el.toSpriteId)
    if (!fc || !tc) continue

    const tcx = tc.position.x + tc.width / 2
    const tcy = tc.position.y + tc.height / 2
    const fcx = fc.position.x + fc.width / 2
    const fcy = fc.position.y + fc.height / 2

    // 到着点を「分散済み出発点に向かう方向」で再計算
    ends[i] = rectBorderPoint(tcx, tcy, tc.width, tc.height, starts[i].x, starts[i].y)
    // 出発点を「再計算済み到着点に向かう方向」で再計算
    starts[i] = rectBorderPoint(fcx, fcy, fc.width, fc.height, ends[i].x, ends[i].y)
  }

  return { starts, ends }
}

/** 二次ベジェ上の点 (De Casteljau, t=0.5) */
function quadBezierMid(p0: Pt, cp: Pt, p2: Pt): Pt {
  return {
    x: 0.25 * p0.x + 0.5 * cp.x + 0.25 * p2.x,
    y: 0.25 * p0.y + 0.5 * cp.y + 0.25 * p2.y,
  }
}

// ─── SVG マーカー定義 ───

function createMarkerDefs(): SVGDefsElement {
  const defs = document.createElementNS(SVG_NS, "defs")
  for (const [type, style] of Object.entries(RELATION_STYLES)) {
    const marker = document.createElementNS(SVG_NS, "marker")
    marker.setAttribute("id", `arrow-${type}`)
    marker.setAttribute("viewBox", "0 0 10 10")
    marker.setAttribute("refX", "10")
    marker.setAttribute("refY", "5")
    marker.setAttribute("markerWidth", "8")
    marker.setAttribute("markerHeight", "8")
    marker.setAttribute("orient", "auto-start-reverse")

    const path = document.createElementNS(SVG_NS, "path")
    if (style.markerEnd.type === "arrowClosed") {
      path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z")
      path.setAttribute("fill", style.color)
      path.setAttribute("stroke", style.color)
      path.setAttribute("stroke-width", "1")
    } else {
      path.setAttribute("d", "M 0 0 L 10 5 L 0 10")
      path.setAttribute("fill", "none")
      path.setAttribute("stroke", style.color)
      path.setAttribute("stroke-width", "1.5")
    }
    marker.appendChild(path)
    defs.appendChild(marker)
  }
  return defs
}

// ─── エッジ SVG 要素 ───

type EdgeSvgElement = {
  group: SVGGElement
  pathEl: SVGPathElement
  textEl: SVGTextElement
  textBgEl: SVGRectElement
  edgeId: string
  relationType: string
  fromSpriteId: string
  toSpriteId: string
}

function createEdgeSvgElement(
  relationType: string,
  edgeId: string,
  fromSpriteId: string,
  toSpriteId: string,
  isBidirectional: boolean
): EdgeSvgElement {
  const style = RELATION_STYLES[relationType as keyof typeof RELATION_STYLES]
  const group = document.createElementNS(SVG_NS, "g")
  group.setAttribute("data-edge-id", edgeId)

  const pathEl = document.createElementNS(SVG_NS, "path")
  pathEl.setAttribute("fill", "none")
  pathEl.setAttribute("stroke", style.color)
  pathEl.setAttribute("stroke-width", String(style.strokeWidth))
  if (style.strokeDasharray) {
    pathEl.setAttribute("stroke-dasharray", style.strokeDasharray)
  }
  pathEl.setAttribute("marker-end", `url(#arrow-${relationType})`)
  if (style.markerStart || isBidirectional) {
    pathEl.setAttribute("marker-start", `url(#arrow-${relationType})`)
  }
  group.appendChild(pathEl)

  const textBgEl = document.createElementNS(SVG_NS, "rect")
  textBgEl.setAttribute("fill", "white")
  textBgEl.setAttribute("rx", "2")
  textBgEl.setAttribute("opacity", "0.85")
  textBgEl.setAttribute("display", "none")
  group.appendChild(textBgEl)

  const textEl = document.createElementNS(SVG_NS, "text")
  textEl.setAttribute("text-anchor", "middle")
  textEl.setAttribute("fill", style.color)
  textEl.setAttribute("font-size", "11")
  textEl.setAttribute("font-family", "sans-serif")
  textEl.setAttribute("font-weight", "500")
  group.appendChild(textEl)

  return { group, pathEl, textEl, textBgEl, edgeId, relationType, fromSpriteId, toSpriteId }
}

// ─── ノート接続線 SVG 要素 ───

type NoteLinkSvgElement = {
  group: SVGGElement
  pathEl: SVGPathElement
  noteId: string
}

function createNoteLinkSvgElement(noteId: string): NoteLinkSvgElement {
  const group = document.createElementNS(SVG_NS, "g")
  group.setAttribute("data-note-link", noteId)

  const pathEl = document.createElementNS(SVG_NS, "path")
  pathEl.setAttribute("fill", "none")
  pathEl.setAttribute("stroke", "#9CA3AF")
  pathEl.setAttribute("stroke-width", "1")
  pathEl.setAttribute("stroke-dasharray", "4 3")
  group.appendChild(pathEl)

  return { group, pathEl, noteId }
}

// ─── メインコンポーネント ───

export function ModelDiagramWorkspace({
  sprites,
  blockDataMap,
  pseudocode,
  onNavigateToSprite,
}: ModelDiagramWorkspaceProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const interactionRef = useRef<InteractionManager | null>(null)
  const domSyncRef = useRef<DomSyncHelper | null>(null)
  const rafIdRef = useRef<number>(0)
  const containersRef = useRef<Container[]>([])
  const connectorsRef = useRef<Connector[]>([])
  const workspaceRef = useRef<Workspace | null>(null)

  const viewportGroupRef = useRef<SVGGElement | null>(null)
  const edgeSvgElementsRef = useRef<EdgeSvgElement[]>([])
  const noteLinkSvgElementsRef = useRef<NoteLinkSvgElement[]>([])

  const [debugView, setDebugView] = useState(false)
  const [visibleRelations, setVisibleRelations] = useState<Set<RelationType>>(
    () => new Set(ALL_RELATION_TYPES)
  )
  const visibleRelationsRef = useRef(visibleRelations)
  visibleRelationsRef.current = visibleRelations
  const debugSvgRef = useRef<SVGSVGElement | null>(null)
  const svgRendererRef = useRef<SvgRenderer | null>(null)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)

  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot
  )

  // カード Container のルックアップ用 Map（毎フレーム線形探索を避ける）
  const cardMapRef = useRef<Map<string, Container>>(new Map())

  // ─── 初期化 ───
  useEffect(() => {
    const canvasElement = canvasRef.current
    const svgElement = svgRef.current
    const overlayElement = overlayRef.current
    if (!svgElement || !overlayElement || !canvasElement) return

    const workspace = new Workspace()
    workspaceRef.current = workspace
    controller.mount(workspace)

    const defs = createMarkerDefs()
    svgElement.appendChild(defs)

    const viewportGroup = document.createElementNS(SVG_NS, "g")
    viewportGroup.setAttribute("data-role", "viewport")
    svgElement.appendChild(viewportGroup)
    viewportGroupRef.current = viewportGroup

    const marqueeRect = document.createElementNS(SVG_NS, "rect")
    marqueeRect.setAttribute("fill", "rgba(59,130,246,0.08)")
    marqueeRect.setAttribute("stroke", "rgba(59,130,246,0.4)")
    marqueeRect.setAttribute("stroke-width", "1")
    marqueeRect.setAttribute("stroke-dasharray", "4 2")
    marqueeRect.setAttribute("display", "none")
    marqueeRect.setAttribute("rx", "2")
    svgElement.appendChild(marqueeRect)

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

    const domSync = new DomSyncHelper({
      workspace,
      overlayElement,
      canvasElement,
      gridSize: 24,
      resolveElement: (container: Container) => {
        const spriteEl = document.getElementById(`diagram-node-${container.id}`)
        if (spriteEl) return spriteEl
        return document.getElementById(`diagram-note-${container.id}`)
      },
    })
    domSyncRef.current = domSync

    const interaction = new InteractionManager({
      workspace,
      canvasElement,
      containers: () => containersRef.current,
      connectors: () => connectorsRef.current,
      emptyClickIntent: "pan",
      onModeChange: (mode) => {
        if (mode === "dragging" || mode === "panning") {
          canvasElement.style.cursor = "grabbing"
        } else {
          canvasElement.style.cursor = ""
        }
      },
      onHover: (container) => {
        canvasElement.style.cursor = container ? "grab" : ""
      },
      onContainerPointerDown: (container) => {
        // ドラッグ開始時に選択（クリックを挟まず直接ドラッグ可能にする）
        const card = controller.getCards().find((c) => c.container.id === container.id)
        if (card) {
          controller.selectNode(card.node.spriteId)
        }
      },
      onDragEnd: (containers) => {
        for (const container of containers) {
          const card = controller.getCards().find((c) => c.container.id === container.id)
          if (card) {
            controller.saveNodePosition(
              card.node.spriteId,
              container.position.x,
              container.position.y
            )
          }
          const note = controller.getNotes().find((n) => n.container.id === container.id)
          if (note) {
            controller.saveNotePosition(
              note.note.id,
              container.position.x,
              container.position.y
            )
          }
        }
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
    })
    interactionRef.current = interaction

    const ZOOM_MIN = 0.2
    const ZOOM_MAX = 3
    const ZOOM_SENSITIVITY = 0.005
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey) {
        const rect = canvasElement.getBoundingClientRect()
        const factor = Math.exp(-e.deltaY * ZOOM_SENSITIVITY)
        const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, workspace.viewport.scale * factor))
        workspace.zoomAt(e.clientX - rect.left, e.clientY - rect.top, newScale)
      } else {
        workspace.panBy(-e.deltaX, -e.deltaY)
      }
    }
    canvasElement.addEventListener("wheel", handleWheel, { passive: false })

    const preventMiddleMouse = (event: MouseEvent) => {
      if (event.button === 1) event.preventDefault()
    }
    canvasElement.addEventListener("mousedown", preventMiddleMouse)

    // ─── アニメーションループ ───
    const tick = () => {
      interactionRef.current?.tick(mouse.mousePosition, mouse.buttonState)
      domSyncRef.current?.syncAll(containersRef.current)

      const vg = viewportGroupRef.current
      if (vg) {
        const { x, y, scale } = workspace.viewport
        vg.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`)
      }

      // エッジパス: 同一辺の接続点を分散 + 障害物迂回
      const cMap = cardMapRef.current
      const svgElements = edgeSvgElementsRef.current
      const edgesData = controller.getEdges()

      // 全エッジの接続点を一括計算（表示中のエッジのみ分散対象）
      const { starts, ends } = computeDistributedPoints(svgElements, cMap, visibleRelationsRef.current)

      for (let i = 0; i < svgElements.length; i++) {
        const el = svgElements[i]
        const startPt = starts[i]
        const endPt = ends[i]
        if (!startPt || !endPt) continue

        // 障害物検出 + 迂回パス計算
        const obstacles = findObstacles(startPt, endPt, el.fromSpriteId, el.toSpriteId, cMap)
        const avoidance = computeAvoidancePath(startPt, endPt, obstacles)

        let labelPt: Pt
        if (avoidance) {
          el.pathEl.setAttribute("d", `M ${startPt.x} ${startPt.y} ${avoidance.path}`)
          labelPt = quadBezierMid(startPt, avoidance.cp, endPt)
        } else {
          el.pathEl.setAttribute("d", `M ${startPt.x} ${startPt.y} L ${endPt.x} ${endPt.y}`)
          labelPt = { x: (startPt.x + endPt.x) / 2, y: (startPt.y + endPt.y) / 2 }
        }

        const label = edgesData.find((e) => e.relation.id === el.edgeId)?.relation.label ?? ""
        el.textEl.setAttribute("x", `${labelPt.x}`)
        el.textEl.setAttribute("y", `${labelPt.y - 6}`)
        el.textEl.textContent = label

        if (label) {
          const labelWidth = label.length * 7 + 8
          el.textBgEl.setAttribute("x", `${labelPt.x - labelWidth / 2}`)
          el.textBgEl.setAttribute("y", `${labelPt.y - 18}`)
          el.textBgEl.setAttribute("width", `${labelWidth}`)
          el.textBgEl.setAttribute("height", "16")
          el.textBgEl.setAttribute("display", "inline")
        } else {
          el.textBgEl.setAttribute("display", "none")
        }
      }

      // ノート接続線（中心→中心、境界クリップ）
      const createdNotes = controller.getNotes()
      const noteLinks = noteLinkSvgElementsRef.current
      for (const link of noteLinks) {
        const noteObj = createdNotes.find((n) => n.note.id === link.noteId)
        if (!noteObj || !noteObj.note.attachedToSpriteId) continue

        const cardContainer = cMap.get(noteObj.note.attachedToSpriteId)
        if (!cardContainer) continue

        const nc = noteObj.container
        const ncx = nc.position.x + nc.width / 2
        const ncy = nc.position.y + nc.height / 2
        const ccx = cardContainer.position.x + cardContainer.width / 2
        const ccy = cardContainer.position.y + cardContainer.height / 2

        const noteEdge = rectBorderPoint(ncx, ncy, nc.width, nc.height, ccx, ccy)
        const cardEdge = rectBorderPoint(ccx, ccy, cardContainer.width, cardContainer.height, ncx, ncy)
        link.pathEl.setAttribute("d", `M ${noteEdge.x} ${noteEdge.y} L ${cardEdge.x} ${cardEdge.y}`)
      }

      rafIdRef.current = requestAnimationFrame(tick)
    }
    rafIdRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafIdRef.current)
      interaction.destroy()
      canvasElement.removeEventListener("wheel", handleWheel)
      canvasElement.removeEventListener("mousedown", preventMiddleMouse)
      interactionRef.current = null
      domSyncRef.current = null
      viewportGroupRef.current = null
      edgeSvgElementsRef.current = []
      noteLinkSvgElementsRef.current = []
      controller.unmount()
      workspaceRef.current = null
    }
  }, [])

  // ─── スプライト構成が変わった時のみ再構築（静的解析なのでリアルタイム更新不要） ───
  // スプライトの ID リストをキーにして、構成変更を検出する
  const spriteIdsKey = sprites.map((s) => s.id).sort().join(",")
  const prevSpriteIdsRef = useRef("")

  useEffect(() => {
    if (!workspaceRef.current) return
    // スプライト構成が同じなら再構築しない
    if (prevSpriteIdsRef.current === spriteIdsKey && controller.getCards().length > 0) return
    prevSpriteIdsRef.current = spriteIdsKey

    controller.loadSprites(sprites, blockDataMap, pseudocode)

    const cards = controller.getCards()
    const notes = controller.getNotes()
    containersRef.current = [
      ...cards.map((c) => c.container),
      ...notes.map((n) => n.container),
    ]
    connectorsRef.current = cards.flatMap((c) => [c.inputConnector, c.outputConnector])

    const newMap = new Map<string, Container>()
    for (const card of cards) {
      newMap.set(card.node.spriteId, card.container)
    }
    cardMapRef.current = newMap

    rebuildEdgeSvg()
    rebuildNoteLinkSvg()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spriteIdsKey, blockDataMap])

  // ─── エッジ SVG 再構築 ───
  function rebuildEdgeSvg() {
    const vg = viewportGroupRef.current
    if (!vg) return

    for (const el of edgeSvgElementsRef.current) {
      el.group.remove()
    }
    edgeSvgElementsRef.current = []

    const edges = controller.getEdges()
    for (const createdEdge of edges) {
      const el = createEdgeSvgElement(
        createdEdge.relation.type,
        createdEdge.relation.id,
        createdEdge.relation.fromSpriteId,
        createdEdge.relation.toSpriteId,
        createdEdge.relation._bidirectional ?? false
      )
      vg.appendChild(el.group)
      edgeSvgElementsRef.current.push(el)
    }
  }

  // ─── ノート接続線 SVG 再構築 ───
  function rebuildNoteLinkSvg() {
    const vg = viewportGroupRef.current
    if (!vg) return

    for (const link of noteLinkSvgElementsRef.current) {
      link.group.remove()
    }
    noteLinkSvgElementsRef.current = []

    const notes = controller.getNotes()
    for (const createdNote of notes) {
      if (!createdNote.note.attachedToSpriteId) continue
      const link = createNoteLinkSvgElement(createdNote.note.id)
      vg.appendChild(link.group)
      noteLinkSvgElementsRef.current.push(link)
    }
  }

  // ─── 関係フィルター ───
  useEffect(() => {
    for (const el of edgeSvgElementsRef.current) {
      const visible = visibleRelations.has(el.relationType as RelationType)
      el.group.setAttribute("display", visible ? "inline" : "none")
    }
  }, [visibleRelations])

  // ─── SvgRenderer デバッグ ───
  useEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace) return

    if (debugView) {
      const debugSvg = document.createElementNS(SVG_NS, "svg")
      debugSvg.style.width = "100%"
      debugSvg.style.height = "100%"
      debugSvg.style.position = "absolute"
      debugSvg.style.inset = "0"
      debugSvg.style.pointerEvents = "none"
      debugSvg.style.zIndex = "5"
      canvasRef.current?.appendChild(debugSvg)
      debugSvgRef.current = debugSvg

      const renderer = new SvgRenderer(debugSvg, workspace)
      svgRendererRef.current = renderer
    }

    return () => {
      if (debugSvgRef.current) {
        debugSvgRef.current.remove()
        debugSvgRef.current = null
      }
      svgRendererRef.current = null
    }
  }, [debugView])

  // ─── 選択 ───
  const handleDeselectAll = useCallback(() => {
    controller.selectNode(null)
    setSelectedNoteId(null)
  }, [])

  // ─── ノート変更時にコンテナリスト更新 ───
  useEffect(() => {
    const cards = controller.getCards()
    const notes = controller.getNotes()
    containersRef.current = [
      ...cards.map((c) => c.container),
      ...notes.map((n) => n.container),
    ]
    rebuildNoteLinkSvg()
  }, [snapshot.notes])

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
      onClick={handleDeselectAll}
    >
      <svg ref={svgRef} />

      <div
        ref={overlayRef}
        className="dom-overlay"
        style={debugView ? { opacity: 0.3, pointerEvents: "none" } : undefined}
      >
        {snapshot.nodes.map((node) => {
          const card = controller.getCards().find((c) => c.node.spriteId === node.spriteId)
          if (!card) return null
          return (
            <div
              key={node.spriteId}
              id={`diagram-node-${card.container.id}`}
              style={{ position: "absolute", pointerEvents: "none" }}
            >
              <SpriteCard
                node={node}
                isSelected={snapshot.selectedNodeId === node.spriteId}
              />
            </div>
          )
        })}

        {snapshot.notes.map((note) => {
          const created = controller.getNotes().find((n) => n.note.id === note.id)
          if (!created) return null
          return (
            <div
              key={note.id}
              id={`diagram-note-${created.container.id}`}
              style={{ position: "absolute", pointerEvents: "auto" }}
            >
              <DiagramNoteCard
                note={note}
                isSelected={selectedNoteId === note.id}
                onClick={() => {
                  controller.selectNode(null)
                  setSelectedNoteId(
                    selectedNoteId === note.id ? null : note.id
                  )
                }}
                onTextChange={(text) => controller.updateNoteText(note.id, text)}
                onRemove={() => {
                  controller.removeNote(note.id)
                  setSelectedNoteId(null)
                }}
              />
            </div>
          )
        })}
      </div>

      <DiagramToolbar
        onAutoArrange={() => controller.autoArrange()}
        onFitView={() => {
          const ws = workspaceRef.current
          const canvas = canvasRef.current
          if (ws && canvas) {
            ws.fitView(canvas.clientWidth, canvas.clientHeight, 60)
          }
        }}
        debugView={debugView}
        onToggleDebugView={() => setDebugView((v) => !v)}
        visibleRelations={visibleRelations}
        onToggleRelation={(type) => {
          setVisibleRelations((prev) => {
            const next = new Set(prev)
            if (next.has(type)) {
              next.delete(type)
            } else {
              next.add(type)
            }
            return next
          })
        }}
        onAddNote={() => {
          const attachTo = snapshot.selectedNodeId
          controller.addNote("ノート", attachTo)
        }}
        selectedNodeId={snapshot.selectedNodeId}
      />
    </div>
  )
}
