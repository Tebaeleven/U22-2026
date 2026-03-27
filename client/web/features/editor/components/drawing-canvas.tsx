"use client"

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react"
import {
  Stage,
  Layer,
  Group,
  Line,
  Rect,
  Ellipse,
  Text,
  Transformer,
  Image as KonvaImage,
} from "react-konva"
import type Konva from "konva"
import {
  MousePointer2,
  Paintbrush,
  Minus as LineIcon,
  Square,
  Circle,
  Type,
  PaintBucket,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Save,
  Minus,
  Plus,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Shield,
} from "lucide-react"
import { STAGE_WIDTH, STAGE_HEIGHT, type ColliderDef } from "@/features/editor/constants"
import {
  getVisiblePixelBounds,
  shouldQueueAutoSave,
} from "@/features/editor/utils/image-bounds"

// ─── ツール定義 ─────────────────────────────────────

type Tool =
  | "select"
  | "brush"
  | "line"
  | "rect"
  | "ellipse"
  | "text"
  | "fill"
  | "eraser"

interface ElementTransform {
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
}

interface TransformableElement {
  transform: ElementTransform
}

// ─── 描画要素の型定義 ───────────────────────────────

interface BrushElement extends TransformableElement {
  type: "brush"
  points: number[]
  color: string
  strokeWidth: number
}

interface EraserElement extends TransformableElement {
  type: "eraser"
  points: number[]
  strokeWidth: number
}

interface LineElement extends TransformableElement {
  type: "line"
  points: number[] // [x1, y1, x2, y2]
  color: string
  strokeWidth: number
}

interface RectElement extends TransformableElement {
  type: "rect"
  x: number
  y: number
  width: number
  height: number
  color: string
  strokeWidth: number
  filled: boolean
}

interface EllipseElement extends TransformableElement {
  type: "ellipse"
  x: number
  y: number
  radiusX: number
  radiusY: number
  color: string
  strokeWidth: number
  filled: boolean
}

interface TextElement extends TransformableElement {
  type: "text"
  x: number
  y: number
  text: string
  color: string
  fontSize: number
}

interface FillElement extends TransformableElement {
  type: "fill"
  image: HTMLImageElement
  x: number
  y: number
  width: number
  height: number
}

type DrawElement =
  | BrushElement
  | EraserElement
  | LineElement
  | RectElement
  | EllipseElement
  | TextElement
  | FillElement

// ─── 定数 ────────────────────────────────────────────

const PRESET_COLORS = [
  "#000000", "#FFFFFF", "#FF0000", "#FF8C00", "#FFD700",
  "#00C853", "#2196F3", "#9C27B0", "#795548", "#607D8B",
  "#FF69B4", "#00BCD4", "#8BC34A", "#FF5722", "#3F51B5",
] as const

const MIN_BRUSH_SIZE = 1
const MAX_BRUSH_SIZE = 50
const GUIDE_GRID_SIZE = 40
const MIN_TRANSFORM_SIZE = 12
const COSTUME_EXPORT_PADDING = 4

const CURSOR_STYLE: Record<Tool, string> = {
  select: "default",
  brush: "crosshair",
  line: "crosshair",
  rect: "crosshair",
  ellipse: "crosshair",
  text: "text",
  fill: "crosshair",
  eraser: "crosshair",
}

const TOOL_DEFS: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: "select", icon: <MousePointer2 size={16} />, label: "選択" },
  { id: "brush", icon: <Paintbrush size={16} />, label: "ブラシ" },
  { id: "line", icon: <LineIcon size={16} />, label: "直線" },
  { id: "rect", icon: <Square size={16} />, label: "矩形" },
  { id: "ellipse", icon: <Circle size={16} />, label: "楕円" },
  { id: "text", icon: <Type size={16} />, label: "テキスト" },
  { id: "fill", icon: <PaintBucket size={16} />, label: "塗りつぶし" },
  { id: "eraser", icon: <Eraser size={16} />, label: "消しゴム" },
]

const DEFAULT_ELEMENT_TRANSFORM: ElementTransform = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
}

// ─── 塗りつぶしアルゴリズム ──────────────────────────

/** hex を [r,g,b,a] に変換 */
function hexToRgba(hex: string): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b, 255]
}

/** 2色が同じか（許容範囲付き） */
function colorsMatch(
  data: Uint8ClampedArray,
  idx: number,
  target: [number, number, number, number],
  tolerance: number
): boolean {
  return (
    Math.abs(data[idx] - target[0]) <= tolerance &&
    Math.abs(data[idx + 1] - target[1]) <= tolerance &&
    Math.abs(data[idx + 2] - target[2]) <= tolerance &&
    Math.abs(data[idx + 3] - target[3]) <= tolerance
  )
}

/** BFS ベースの塗りつぶし */
function floodFill(
  canvas: HTMLCanvasElement,
  startX: number,
  startY: number,
  fillColor: string
): HTMLCanvasElement | null {
  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  const { width, height } = canvas
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  const sx = Math.floor(startX)
  const sy = Math.floor(startY)
  if (sx < 0 || sx >= width || sy < 0 || sy >= height) return null

  const startIdx = (sy * width + sx) * 4
  const targetColor: [number, number, number, number] = [
    data[startIdx],
    data[startIdx + 1],
    data[startIdx + 2],
    data[startIdx + 3],
  ]
  const fill = hexToRgba(fillColor)

  // 塗りつぶし色とターゲット色が同じなら何もしない
  if (
    targetColor[0] === fill[0] &&
    targetColor[1] === fill[1] &&
    targetColor[2] === fill[2] &&
    targetColor[3] === fill[3]
  ) {
    return null
  }

  const tolerance = 30
  const queue: number[] = [sx, sy]
  const visited = new Uint8Array(width * height)

  while (queue.length > 0) {
    const y = queue.pop()!
    const x = queue.pop()!
    const vi = y * width + x
    if (visited[vi]) continue
    visited[vi] = 1

    const idx = vi * 4
    if (!colorsMatch(data, idx, targetColor, tolerance)) continue

    data[idx] = fill[0]
    data[idx + 1] = fill[1]
    data[idx + 2] = fill[2]
    data[idx + 3] = fill[3]

    if (x > 0) queue.push(x - 1, y)
    if (x < width - 1) queue.push(x + 1, y)
    if (y > 0) queue.push(x, y - 1)
    if (y < height - 1) queue.push(x, y + 1)
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

function createFillElement(
  image: HTMLImageElement,
  width: number,
  height: number,
  x: number = 0,
  y: number = 0,
): FillElement {
  return {
    type: "fill",
    image,
    x,
    y,
    width,
    height,
    transform: { ...DEFAULT_ELEMENT_TRANSFORM },
  }
}

function createElementTransform(): ElementTransform {
  return { ...DEFAULT_ELEMENT_TRANSFORM }
}

function getCenteredPosition(
  stageWidth: number,
  stageHeight: number,
  width: number,
  height: number,
) {
  return {
    x: Math.round((stageWidth - width) / 2),
    y: Math.round((stageHeight - height) / 2),
  }
}

function getSingleFillElement(elements: DrawElement[]): FillElement | null {
  return elements.length === 1 && elements[0]?.type === "fill"
    ? elements[0]
    : null
}

function centerFillElement(
  element: FillElement,
  stageWidth: number,
  stageHeight: number,
): FillElement {
  const position = getCenteredPosition(
    stageWidth,
    stageHeight,
    element.width,
    element.height,
  )

  if (element.x === position.x && element.y === position.y) {
    return element
  }

  return {
    ...element,
    x: position.x,
    y: position.y,
  }
}

function trimCanvasToVisibleBounds(
  sourceCanvas: HTMLCanvasElement,
  padding: number = COSTUME_EXPORT_PADDING,
): { canvas: HTMLCanvasElement; width: number; height: number } | null {
  const ctx = sourceCanvas.getContext("2d")
  if (!ctx || sourceCanvas.width <= 0 || sourceCanvas.height <= 0) return null

  const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height)
  const bounds = getVisiblePixelBounds({
    data: imageData.data,
    width: sourceCanvas.width,
    height: sourceCanvas.height,
    padding,
  })

  if (!bounds) return null

  const trimmedCanvas = document.createElement("canvas")
  trimmedCanvas.width = bounds.width
  trimmedCanvas.height = bounds.height
  const trimmedCtx = trimmedCanvas.getContext("2d")
  if (!trimmedCtx) return null

  trimmedCtx.drawImage(
    sourceCanvas,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    0,
    0,
    bounds.width,
    bounds.height,
  )

  return {
    canvas: trimmedCanvas,
    width: bounds.width,
    height: bounds.height,
  }
}

function getElementBounds(element: DrawElement) {
  switch (element.type) {
    case "brush":
    case "eraser":
    case "line": {
      const xs = element.points.filter((_, index) => index % 2 === 0)
      const ys = element.points.filter((_, index) => index % 2 === 1)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      const padding = element.strokeWidth / 2
      return {
        x: minX - padding,
        y: minY - padding,
        width: Math.max(1, maxX - minX + padding * 2),
        height: Math.max(1, maxY - minY + padding * 2),
      }
    }
    case "rect":
      return {
        x: element.x,
        y: element.y,
        width: Math.max(1, element.width),
        height: Math.max(1, element.height),
      }
    case "ellipse":
      return {
        x: element.x - element.radiusX,
        y: element.y - element.radiusY,
        width: Math.max(1, element.radiusX * 2),
        height: Math.max(1, element.radiusY * 2),
      }
    case "text":
      return {
        x: element.x,
        y: element.y,
        width: Math.max(element.fontSize * 0.7, element.text.length * element.fontSize * 0.6),
        height: Math.max(1, element.fontSize * 1.2),
      }
    case "fill":
      return {
        x: element.x,
        y: element.y,
        width: Math.max(1, element.width),
        height: Math.max(1, element.height),
      }
    default:
      return { x: 0, y: 0, width: 1, height: 1 }
  }
}

function getElementNodeProps(element: DrawElement) {
  const bounds = getElementBounds(element)
  const pivotX = bounds.x + bounds.width / 2
  const pivotY = bounds.y + bounds.height / 2

  return {
    x: pivotX + element.transform.x,
    y: pivotY + element.transform.y,
    offsetX: pivotX,
    offsetY: pivotY,
    scaleX: element.transform.scaleX,
    scaleY: element.transform.scaleY,
    rotation: element.transform.rotation,
  }
}

function applyNodeTransform(element: DrawElement, node: Konva.Node): DrawElement {
  return {
    ...element,
    transform: {
      x: node.x() - node.offsetX(),
      y: node.y() - node.offsetY(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
      rotation: node.rotation(),
    },
  }
}

// ─── メインコンポーネント ────────────────────────────

interface DrawingCanvasProps {
  onExport?: (dataUrl: string) => void
  /** コスチュームとして保存 (dataUrl, width, height) */
  onSave?: (dataUrl: string, width: number, height: number) => void
  /** 編集対象のコスチューム画像 */
  initialDataUrl?: string
  /** デバッグ用当たり判定の定義 */
  collider?: ColliderDef
  /** コスチュームの元サイズ（ピクセル） */
  costumeSize?: { width: number; height: number }
}

export function DrawingCanvas({
  onExport,
  onSave,
  initialDataUrl,
  collider,
  costumeSize,
}: DrawingCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const initialDataUrlRef = useRef(initialDataUrl)
  const transformerRef = useRef<Konva.Transformer>(null)
  const elementNodeRefs = useRef(new Map<number, Konva.Node>())
  const initialElementLoadedRef = useRef(false)
  const suppressNextContentVersionRef = useRef(false)
  const pristineInitialLayoutRef = useRef(false)
  const hasMountedElementsRef = useRef(false)
  const lastQueuedAutoSaveVersionRef = useRef(0)
  const onSaveRef = useRef(onSave)

  // ツール状態
  const [tool, setTool] = useState<Tool>("brush")
  const [color, setColor] = useState("#000000")
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [fontSize, setFontSize] = useState(24)
  const [filled, setFilled] = useState(true)

  // 要素管理
  const [elements, setElements] = useState<DrawElement[]>([])
  const [redoStack, setRedoStack] = useState<DrawElement[]>([])

  // 描画中の状態
  const isDrawing = useRef(false)
  const dragStart = useRef<{ x: number; y: number } | null>(null)

  // 図形プレビュー
  const [preview, setPreview] = useState<DrawElement | null>(null)

  // テキスト入力
  const [textInput, setTextInput] = useState<{
    x: number
    y: number
    stageX: number
    stageY: number
  } | null>(null)
  const [textValue, setTextValue] = useState("")
  const textInputRef = useRef<HTMLInputElement>(null)

  // 選択
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  // 当たり判定オーバーレイの表示状態
  const [showCollider, setShowCollider] = useState(false)

  // キャンバスサイズ
  const [stageSize, setStageSize] = useState({
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
  })
  const stageSizeRef = useRef(stageSize)
  const [isStageMeasured, setIsStageMeasured] = useState(false)
  const [contentVersion, setContentVersion] = useState(0)
  const guideCenter = useMemo(
    () => ({
      x: Math.round(stageSize.width / 2),
      y: Math.round(stageSize.height / 2),
    }),
    [stageSize.height, stageSize.width]
  )
  // 当たり判定の SVG 座標系での形状（applyCollider と同じ計算）
  const hitboxShape = useMemo(() => {
    if (!collider || !costumeSize) return null
    const { width: cw, height: ch } = costumeSize
    if (cw <= 0 || ch <= 0) return null

    const imageTL = {
      x: guideCenter.x - cw / 2,
      y: guideCenter.y - ch / 2,
    }

    if (collider.type === "circle") {
      const r = collider.radius ?? Math.min(cw, ch) / 2
      const ox = collider.offsetX ?? (cw / 2 - r)
      const oy = collider.offsetY ?? (ch / 2 - r)
      return { kind: "circle" as const, cx: imageTL.x + ox + r, cy: imageTL.y + oy + r, r }
    }

    const w = collider.width ?? cw
    const h = collider.height ?? ch
    const ox = collider.offsetX ?? (cw - w) / 2
    const oy = collider.offsetY ?? (ch - h) / 2
    return { kind: "rect" as const, x: imageTL.x + ox, y: imageTL.y + oy, width: w, height: h }
  }, [collider, costumeSize, guideCenter])

  const guideLines = useMemo(() => {
    const vertical: number[] = []
    const horizontal: number[] = []

    for (let x = guideCenter.x; x <= stageSize.width; x += GUIDE_GRID_SIZE) {
      vertical.push(x)
    }
    for (let x = guideCenter.x - GUIDE_GRID_SIZE; x >= 0; x -= GUIDE_GRID_SIZE) {
      vertical.push(x)
    }
    for (let y = guideCenter.y; y <= stageSize.height; y += GUIDE_GRID_SIZE) {
      horizontal.push(y)
    }
    for (let y = guideCenter.y - GUIDE_GRID_SIZE; y >= 0; y -= GUIDE_GRID_SIZE) {
      horizontal.push(y)
    }

    return {
      vertical: vertical.sort((a, b) => a - b),
      horizontal: horizontal.sort((a, b) => a - b),
    }
  }, [guideCenter.x, guideCenter.y, stageSize.height, stageSize.width])

  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  useEffect(() => {
    stageSizeRef.current = stageSize
  }, [stageSize])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setStageSize({ width: Math.floor(width), height: Math.floor(height) })
      setIsStageMeasured(true)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!initialDataUrlRef.current || !isStageMeasured || initialElementLoadedRef.current) {
      return
    }
    if (stageSize.width <= 0 || stageSize.height <= 0) {
      return
    }

    const img = new window.Image()
    img.onload = () => {
      const centeredElement = centerFillElement(
        createFillElement(img, img.width, img.height),
        stageSize.width,
        stageSize.height,
      )
      initialElementLoadedRef.current = true
      pristineInitialLayoutRef.current = true
      suppressNextContentVersionRef.current = true
      setElements([centeredElement])
    }
    img.src = initialDataUrlRef.current
  }, [isStageMeasured, stageSize.height, stageSize.width])

  useEffect(() => {
    if (!initialElementLoadedRef.current || !pristineInitialLayoutRef.current) {
      return
    }
    if (!isStageMeasured || stageSize.width <= 0 || stageSize.height <= 0) {
      return
    }

    setElements((prev) => {
      const fillElement = getSingleFillElement(prev)
      if (!fillElement) return prev

      const centered = centerFillElement(fillElement, stageSize.width, stageSize.height)
      if (centered === fillElement) return prev

      suppressNextContentVersionRef.current = true
      return [centered]
    })
  }, [isStageMeasured, stageSize.height, stageSize.width])

  // テキスト入力フォーカス
  useEffect(() => {
    if (textInput) textInputRef.current?.focus()
  }, [textInput])

  useEffect(() => {
    const transformer = transformerRef.current
    if (!transformer) return

    if (tool !== "select" || selectedIdx === null) {
      transformer.nodes([])
      transformer.getLayer()?.batchDraw()
      return
    }

    const node = elementNodeRefs.current.get(selectedIdx)
    if (!node) return

    transformer.nodes([node])
    transformer.getLayer()?.batchDraw()
  }, [elements, selectedIdx, tool])

  useEffect(() => {
    if (!hasMountedElementsRef.current) {
      hasMountedElementsRef.current = true
      return
    }
    if (suppressNextContentVersionRef.current) {
      suppressNextContentVersionRef.current = false
      return
    }
    pristineInitialLayoutRef.current = false
    setContentVersion((prev) => prev + 1)
  }, [elements])

  // ポインタ位置を取得
  const getPos = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      return e.target.getStage()?.getPointerPosition() ?? null
    },
    []
  )

  const setStageCursor = useCallback((cursor: string) => {
    stageRef.current?.container().style.setProperty("cursor", cursor)
  }, [])

  const registerElementNode = useCallback((index: number, node: Konva.Node | null) => {
    if (node) {
      elementNodeRefs.current.set(index, node)
    } else {
      elementNodeRefs.current.delete(index)
    }
  }, [])

  const handleElementTransform = useCallback(
    (index: number, node: Konva.Node) => {
      setRedoStack([])
      setElements((prev) => {
        const element = prev[index]
        if (!element) return prev
        const updated = [...prev]
        updated[index] = applyNodeTransform(element, node)
        return updated
      })
    },
    []
  )

  const moveSelectedLayer = useCallback(
    (mode: "front" | "forward" | "backward" | "back") => {
      if (selectedIdx === null) return

      setRedoStack([])
      setElements((prev) => {
        if (prev.length < 2 || !prev[selectedIdx]) return prev

        let nextIndex = selectedIdx
        if (mode === "front") nextIndex = prev.length - 1
        if (mode === "forward") nextIndex = Math.min(prev.length - 1, selectedIdx + 1)
        if (mode === "backward") nextIndex = Math.max(0, selectedIdx - 1)
        if (mode === "back") nextIndex = 0
        if (nextIndex === selectedIdx) return prev

        const updated = [...prev]
        const [element] = updated.splice(selectedIdx, 1)
        updated.splice(nextIndex, 0, element)
        setSelectedIdx(nextIndex)
        return updated
      })
    },
    [selectedIdx]
  )

  // ─── マウスイベント ──────────────────────────────

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const pos = getPos(e)
      if (!pos) return

      // テキスト入力中にキャンバスクリックで確定
      if (textInput) return

      // 選択ツール: 要素のクリック判定
      if (tool === "select") {
        const target = e.target
        const stage = target.getStage()
        if (target === stage) {
          setSelectedIdx(null)
          setStageCursor("default")
        }
        return
      }

      // 塗りつぶしツール
      if (tool === "fill") {
        const stage = stageRef.current
        if (!stage) return
        // 一旦全体を Canvas 化
        const stageCanvas = stage.toCanvas({
          pixelRatio: 1,
        })
        const result = floodFill(stageCanvas, pos.x, pos.y, color)
        if (result) {
          const img = new window.Image()
          img.src = result.toDataURL()
          img.onload = () => {
            setRedoStack([])
            setSelectedIdx(null)
            setElements([createFillElement(img, stageSize.width, stageSize.height)])
          }
        }
        return
      }

      // テキストツール
      if (tool === "text") {
        // Stage上の位置とDOM上の位置を計算
        const stageEl = stageRef.current?.container()
        if (!stageEl) return
        const rect = stageEl.getBoundingClientRect()
        setTextInput({
          x: pos.x,
          y: pos.y,
          stageX: rect.left + pos.x,
          stageY: rect.top + pos.y,
        })
        setTextValue("")
        return
      }

      isDrawing.current = true
      dragStart.current = pos
      setRedoStack([])
      setSelectedIdx(null)

      if (tool === "brush" || tool === "eraser") {
        const newEl: DrawElement =
          tool === "brush"
            ? {
                type: "brush",
                points: [pos.x, pos.y],
                color,
                strokeWidth,
                transform: createElementTransform(),
              }
            : {
                type: "eraser",
                points: [pos.x, pos.y],
                strokeWidth: strokeWidth * 2,
                transform: createElementTransform(),
              }
        setElements((prev) => [...prev, newEl])
      }
    },
    [tool, color, strokeWidth, getPos, textInput, stageSize, setStageCursor]
  )

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (!isDrawing.current) return
      const pos = getPos(e)
      if (!pos || !dragStart.current) return

      const start = dragStart.current

      if (tool === "brush" || tool === "eraser") {
        setElements((prev) => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (!last || (last.type !== "brush" && last.type !== "eraser"))
            return prev
          updated[updated.length - 1] = {
            ...last,
            points: [...last.points, pos.x, pos.y],
          }
          return updated
        })
        return
      }

      // 図形プレビュー
      if (tool === "line") {
        setPreview({
          type: "line",
          points: [start.x, start.y, pos.x, pos.y],
          color,
          strokeWidth,
          transform: createElementTransform(),
        })
      } else if (tool === "rect") {
        const x = Math.min(start.x, pos.x)
        const y = Math.min(start.y, pos.y)
        const w = Math.abs(pos.x - start.x)
        const h = Math.abs(pos.y - start.y)
        setPreview({
          type: "rect",
          x,
          y,
          width: w,
          height: h,
          color,
          strokeWidth,
          filled,
          transform: createElementTransform(),
        })
      } else if (tool === "ellipse") {
        const cx = (start.x + pos.x) / 2
        const cy = (start.y + pos.y) / 2
        const rx = Math.abs(pos.x - start.x) / 2
        const ry = Math.abs(pos.y - start.y) / 2
        setPreview({
          type: "ellipse",
          x: cx,
          y: cy,
          radiusX: rx,
          radiusY: ry,
          color,
          strokeWidth,
          filled,
          transform: createElementTransform(),
        })
      }
    },
    [tool, color, strokeWidth, filled, getPos]
  )

  const handleMouseUp = useCallback(() => {
    if (!isDrawing.current) return
    isDrawing.current = false

    // プレビューを確定
    if (preview) {
      setElements((prev) => [...prev, preview])
      setPreview(null)
    }

    dragStart.current = null
  }, [preview])

  // ─── テキスト確定 ─────────────────────────────────

  const commitText = useCallback(() => {
    if (textInput && textValue.trim()) {
      setRedoStack([])
      setElements((prev) => [
        ...prev,
        {
          type: "text",
          x: textInput.x,
          y: textInput.y,
          text: textValue.trim(),
          color,
          fontSize,
          transform: createElementTransform(),
        },
      ])
    }
    setTextInput(null)
    setTextValue("")
  }, [textInput, textValue, color, fontSize])

  const handleTextKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") commitText()
      if (e.key === "Escape") {
        setTextInput(null)
        setTextValue("")
      }
    },
    [commitText]
  )

  // ─── Undo / Redo / Clear / Export ─────────────────

  const handleUndo = useCallback(() => {
    setElements((prev) => {
      if (prev.length === 0) return prev
      const removed = prev[prev.length - 1]
      setRedoStack((redo) => [...redo, removed])
      return prev.slice(0, -1)
    })
    setSelectedIdx(null)
  }, [])

  const handleRedo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev
      const restored = prev[prev.length - 1]
      setElements((els) => [...els, restored])
      return prev.slice(0, -1)
    })
  }, [])

  const handleClear = useCallback(() => {
    setElements([])
    setRedoStack([])
    setSelectedIdx(null)
  }, [])

  const handleExport = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return
    transformerRef.current?.visible(false)
    transformerRef.current?.getLayer()?.batchDraw()
    const stageCanvas = stage.toCanvas({ pixelRatio: 2 })
    transformerRef.current?.visible(true)
    transformerRef.current?.getLayer()?.batchDraw()
    const dataUrl = stageCanvas.toDataURL("image/png")
    onExport?.(dataUrl)
    const link = document.createElement("a")
    link.download = "sprite.png"
    link.href = dataUrl
    link.click()
  }, [onExport])

  const handleSave = useCallback(() => {
    const stage = stageRef.current
    const latestOnSave = onSaveRef.current
    const latestStageSize = stageSizeRef.current
    if (!stage || !latestOnSave) return
    if (latestStageSize.width <= 0 || latestStageSize.height <= 0) return

    transformerRef.current?.visible(false)
    transformerRef.current?.getLayer()?.batchDraw()
    const stageCanvas = stage.toCanvas({ pixelRatio: 1 })
    transformerRef.current?.visible(true)
    transformerRef.current?.getLayer()?.batchDraw()

    const trimmed = trimCanvasToVisibleBounds(stageCanvas)
    if (!trimmed) return

    latestOnSave(
      trimmed.canvas.toDataURL("image/png"),
      trimmed.width,
      trimmed.height,
    )
  }, [])

  // 描画操作後に自動保存（デバウンス）
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!shouldQueueAutoSave({
      hasOnSave: Boolean(onSaveRef.current),
      elementCount: elements.length,
      contentVersion,
      lastQueuedContentVersion: lastQueuedAutoSaveVersionRef.current,
    })) {
      return
    }

    lastQueuedAutoSaveVersionRef.current = contentVersion
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      handleSave()
    }, 400)
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [contentVersion, elements.length, handleSave])

  useEffect(() => {
    setStageCursor(CURSOR_STYLE[tool])
  }, [tool, setStageCursor])

  // ─── 要素をレンダリング ───────────────────────────

  const renderElement = (el: DrawElement, i: number) => {
    const nodeProps = getElementNodeProps(el)
    const common = {
      ...nodeProps,
      draggable: tool === "select",
      onClick:
        tool === "select"
          ? () => setSelectedIdx(i)
          : undefined,
      onTap:
        tool === "select"
          ? () => setSelectedIdx(i)
          : undefined,
      onMouseEnter:
        tool === "select"
          ? () => setStageCursor("grab")
          : undefined,
      onMouseLeave:
        tool === "select"
          ? () => setStageCursor("default")
          : undefined,
      onDragStart:
        tool === "select"
          ? () => {
              setSelectedIdx(i)
              setStageCursor("grabbing")
            }
          : undefined,
      onDragEnd:
        tool === "select"
          ? (e: Konva.KonvaEventObject<DragEvent>) => {
              handleElementTransform(i, e.target)
              setSelectedIdx(i)
              setStageCursor("grab")
            }
          : undefined,
      onTransformStart:
        tool === "select"
          ? () => setStageCursor("grabbing")
          : undefined,
      onTransformEnd:
        tool === "select"
          ? (e: Konva.KonvaEventObject<Event>) => {
              handleElementTransform(i, e.target)
              setSelectedIdx(i)
              setStageCursor("grab")
            }
          : undefined,
      ref: i >= 0 ? (node: Konva.Node | null) => registerElementNode(i, node) : undefined,
    }

    let child: React.ReactNode = null

    switch (el.type) {
      case "brush":
        child = (
          <Line
            points={el.points}
            stroke={el.color}
            strokeWidth={el.strokeWidth}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
            globalCompositeOperation="source-over"
          />
        )
        break
      case "eraser":
        child = (
          <Line
            points={el.points}
            stroke="#000000"
            strokeWidth={el.strokeWidth}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
            globalCompositeOperation="destination-out"
          />
        )
        break
      case "line":
        child = (
          <Line
            points={el.points}
            stroke={el.color}
            strokeWidth={el.strokeWidth}
            lineCap="round"
          />
        )
        break
      case "rect":
        child = (
          <Rect
            x={el.x}
            y={el.y}
            width={el.width}
            height={el.height}
            fill={el.filled ? el.color : undefined}
            stroke={el.color}
            strokeWidth={el.filled ? 0 : el.strokeWidth}
            cornerRadius={0}
          />
        )
        break
      case "ellipse":
        child = (
          <Ellipse
            x={el.x}
            y={el.y}
            radiusX={el.radiusX}
            radiusY={el.radiusY}
            fill={el.filled ? el.color : undefined}
            stroke={el.color}
            strokeWidth={el.filled ? 0 : el.strokeWidth}
          />
        )
        break
      case "text":
        child = (
          <Text
            x={el.x}
            y={el.y}
            text={el.text}
            fill={el.color}
            fontSize={el.fontSize}
            fontFamily="sans-serif"
          />
        )
        break
      case "fill":
        child = (
          <KonvaImage
            image={el.image}
            x={el.x}
            y={el.y}
            width={el.width}
            height={el.height}
          />
        )
        break
      default:
        return null
    }

    return (
      <Group key={i} {...common}>
        {child}
      </Group>
    )
  }

  // 塗り/枠の選択が必要なツールか
  const showFillToggle = tool === "rect" || tool === "ellipse"
  const showFontSize = tool === "text"
  const hasSelectedLayer = tool === "select" && selectedIdx !== null

  return (
    <div className="flex flex-col h-full w-full bg-white">
      {/* ツールバー */}
      <div className="flex h-12 items-center gap-1.5 overflow-x-auto border-b border-gray-200 bg-gray-50 px-2 [&::-webkit-scrollbar]:hidden">
        {/* ツール選択 */}
        {TOOL_DEFS.map((t) => (
          <ToolButton
            key={t.id}
            active={tool === t.id}
            onClick={() => {
              setTool(t.id)
              setSelectedIdx(null)
            }}
            title={t.label}
          >
            {t.icon}
          </ToolButton>
        ))}

        <Separator />

        {/* ブラシサイズ / フォントサイズ */}
        {showFontSize ? (
          <>
            <span className="text-[10px] text-gray-500">サイズ</span>
            <ToolButton
              onClick={() => setFontSize((s) => Math.max(8, s - 2))}
              title="小さく"
            >
              <Minus size={14} />
            </ToolButton>
            <span className="text-xs text-gray-600 w-6 text-center tabular-nums">
              {fontSize}
            </span>
            <ToolButton
              onClick={() => setFontSize((s) => Math.min(120, s + 2))}
              title="大きく"
            >
              <Plus size={14} />
            </ToolButton>
          </>
        ) : (
          <>
            <span className="text-[10px] text-gray-500">太さ</span>
            <ToolButton
              onClick={() =>
                setStrokeWidth((s) => Math.max(MIN_BRUSH_SIZE, s - 1))
              }
              title="細く"
            >
              <Minus size={14} />
            </ToolButton>
            <span className="text-xs text-gray-600 w-6 text-center tabular-nums">
              {strokeWidth}
            </span>
            <ToolButton
              onClick={() =>
                setStrokeWidth((s) => Math.min(MAX_BRUSH_SIZE, s + 1))
              }
              title="太く"
            >
              <Plus size={14} />
            </ToolButton>
          </>
        )}

        {/* 塗り/枠トグル */}
        {showFillToggle && (
          <>
            <Separator />
            <button
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                filled ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setFilled((f) => !f)}
              title={filled ? "塗りつぶし" : "枠線のみ"}
            >
              {filled ? "塗り" : "枠線"}
            </button>
          </>
        )}

        <Separator />

        {/* カラーパレット */}
        <div className="flex shrink-0 items-center gap-0.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              className="w-5 h-5 rounded-sm border cursor-pointer transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: color === c ? "#4d97ff" : "#d1d5db",
                borderWidth: color === c ? 2 : 1,
              }}
              onClick={() => setColor(c)}
              title={c}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setColor(e.target.value)
            }
            className="w-5 h-5 cursor-pointer border border-gray-300 rounded-sm"
            title="カスタムカラー"
          />
        </div>

        <Separator />

        <div className="flex h-8 w-[170px] shrink-0 items-center gap-1 rounded-md border border-gray-200 bg-white px-2">
          <span className="text-[9px] font-semibold tracking-[0.16em] text-gray-500">
            LAYER
          </span>
          <div className="ml-auto flex items-center gap-0.5">
            <ToolButton
              onClick={() => moveSelectedLayer("front")}
              title="最前面へ"
              disabled={!hasSelectedLayer}
            >
              <ChevronsUp size={13} />
            </ToolButton>
            <ToolButton
              onClick={() => moveSelectedLayer("forward")}
              title="一つ前へ"
              disabled={!hasSelectedLayer}
            >
              <ChevronUp size={13} />
            </ToolButton>
            <ToolButton
              onClick={() => moveSelectedLayer("backward")}
              title="一つ後ろへ"
              disabled={!hasSelectedLayer}
            >
              <ChevronDown size={13} />
            </ToolButton>
            <ToolButton
              onClick={() => moveSelectedLayer("back")}
              title="最背面へ"
              disabled={!hasSelectedLayer}
            >
              <ChevronsDown size={13} />
            </ToolButton>
          </div>
        </div>

        <Separator />

        {/* 操作ボタン */}
        <ToolButton
          onClick={handleUndo}
          disabled={elements.length === 0}
          title="元に戻す (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </ToolButton>
        <ToolButton
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          title="やり直し (Ctrl+Y)"
        >
          <Redo2 size={16} />
        </ToolButton>
        <ToolButton onClick={handleClear} title="全消去">
          <Trash2 size={16} />
        </ToolButton>
        <Separator />
        {onSave && (
          <ToolButton onClick={handleSave} title="コスチュームに保存">
            <Save size={16} />
          </ToolButton>
        )}
        <ToolButton onClick={handleExport} title="画像として保存">
          <Download size={16} />
        </ToolButton>
        {collider && costumeSize && (
          <>
            <Separator />
            <ToolButton
              active={showCollider}
              onClick={() => setShowCollider((v) => !v)}
              title="当たり判定を表示"
            >
              <Shield size={16} />
            </ToolButton>
          </>
        )}
      </div>

      {/* キャンバス */}
      <div ref={containerRef} className="flex-1 min-h-0 overflow-hidden relative">
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          style={{ cursor: CURSOR_STYLE[tool] }}
        >
          <Layer>
            {/* 確定済みの要素 */}
            {elements.map((el, i) => renderElement(el, i))}

            {/* ドラッグ中のプレビュー */}
            {preview && renderElement(preview, -1)}

            <Transformer
              ref={transformerRef}
              rotateEnabled
              resizeEnabled
              flipEnabled
              enabledAnchors={[
                "top-left",
                "top-center",
                "top-right",
                "middle-right",
                "bottom-right",
                "bottom-center",
                "bottom-left",
                "middle-left",
              ]}
              anchorSize={8}
              borderDash={[4, 4]}
              borderStroke="#4d97ff"
              anchorStroke="#4d97ff"
              anchorFill="#ffffff"
              boundBoxFunc={(oldBox, newBox) => {
                if (
                  Math.abs(newBox.width) < MIN_TRANSFORM_SIZE ||
                  Math.abs(newBox.height) < MIN_TRANSFORM_SIZE
                ) {
                  return oldBox
                }
                return newBox
              }}
            />
          </Layer>
        </Stage>

        <svg
          className="absolute inset-0 pointer-events-none"
          width={stageSize.width}
          height={stageSize.height}
          viewBox={`0 0 ${stageSize.width} ${stageSize.height}`}
          aria-hidden
        >
          {guideLines.vertical.map((x) => (
            <line
              key={`vx-${x}`}
              x1={x}
              y1={0}
              x2={x}
              y2={stageSize.height}
              stroke={x === guideCenter.x ? "#4d97ff" : "#9ca3af"}
              strokeWidth={x === guideCenter.x ? 1.5 : 1}
              strokeDasharray={x === guideCenter.x ? "8 6" : "2 10"}
              opacity={x === guideCenter.x ? 0.45 : 0.12}
            />
          ))}
          {guideLines.horizontal.map((y) => (
            <line
              key={`hy-${y}`}
              x1={0}
              y1={y}
              x2={stageSize.width}
              y2={y}
              stroke={y === guideCenter.y ? "#ef4444" : "#9ca3af"}
              strokeWidth={y === guideCenter.y ? 1.5 : 1}
              strokeDasharray={y === guideCenter.y ? "8 6" : "2 10"}
              opacity={y === guideCenter.y ? 0.45 : 0.12}
            />
          ))}
          <circle
            cx={guideCenter.x}
            cy={guideCenter.y}
            r={5}
            fill="white"
            fillOpacity={0.85}
            stroke="#111827"
            strokeOpacity={0.55}
            strokeWidth={1}
          />
          <text
            x={guideCenter.x + 10}
            y={guideCenter.y - 10}
            fontSize={11}
            fill="#374151"
            opacity={0.92}
          >
            0, 0
          </text>
          <text
            x={guideCenter.x + GUIDE_GRID_SIZE + 6}
            y={guideCenter.y - 8}
            fontSize={10}
            fill="#4b5563"
            opacity={0.8}
          >
            {GUIDE_GRID_SIZE}
          </text>
          <text
            x={guideCenter.x - GUIDE_GRID_SIZE - 22}
            y={guideCenter.y - 8}
            fontSize={10}
            fill="#4b5563"
            opacity={0.8}
          >
            -{GUIDE_GRID_SIZE}
          </text>
          <text
            x={guideCenter.x + 8}
            y={guideCenter.y - GUIDE_GRID_SIZE - 8}
            fontSize={10}
            fill="#4b5563"
            opacity={0.8}
          >
            {GUIDE_GRID_SIZE}
          </text>
          <text
            x={guideCenter.x + 8}
            y={guideCenter.y + GUIDE_GRID_SIZE + 14}
            fontSize={10}
            fill="#4b5563"
            opacity={0.8}
          >
            -{GUIDE_GRID_SIZE}
          </text>

          {/* 当たり判定オーバーレイ */}
          {showCollider && hitboxShape && (
            hitboxShape.kind === "circle" ? (
              <circle
                cx={hitboxShape.cx}
                cy={hitboxShape.cy}
                r={hitboxShape.r}
                fill="#ff6400"
                fillOpacity={0.15}
                stroke="#ff6400"
                strokeWidth={1.5}
                strokeDasharray="6 4"
              />
            ) : (
              <rect
                x={hitboxShape.x}
                y={hitboxShape.y}
                width={hitboxShape.width}
                height={hitboxShape.height}
                fill="#ff6400"
                fillOpacity={0.15}
                stroke="#ff6400"
                strokeWidth={1.5}
                strokeDasharray="6 4"
              />
            )
          )}
        </svg>

        {/* テキスト入力オーバーレイ */}
        {textInput && (
          <input
            ref={textInputRef}
            type="text"
            value={textValue}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setTextValue(e.target.value)
            }
            onKeyDown={handleTextKeyDown}
            onBlur={commitText}
            className="absolute border-2 border-blue-400 bg-transparent outline-none px-1"
            style={{
              left: textInput.x,
              top: textInput.y,
              fontSize: `${fontSize}px`,
              color,
              fontFamily: "sans-serif",
              minWidth: 60,
            }}
          />
        )}
      </div>
    </div>
  )
}

// ─── UI 部品 ─────────────────────────────────────────

function ToolButton({
  children,
  active,
  disabled,
  onClick,
  title,
}: {
  children: React.ReactNode
  active?: boolean
  disabled?: boolean
  onClick: () => void
  title: string
}) {
  return (
    <button
      className={`inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md px-1.5 text-[11px] font-medium transition-colors ${
        active
          ? "bg-blue-500 text-white"
          : disabled
            ? "cursor-not-allowed text-gray-300"
            : "text-gray-600 hover:bg-gray-200"
      }`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  )
}

function Separator() {
  return <div className="mx-1 h-6 w-px shrink-0 bg-gray-300" />
}
