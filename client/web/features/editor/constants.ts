import type { BlockCategory } from "./block-editor/types"

// Scratch準拠のブロックカテゴリ色
export const BLOCK_CATEGORIES: { id: BlockCategory; name: string; color: string }[] = [
  { id: "events", name: "イベント", color: "#FFBF00" },
  { id: "motion", name: "動き", color: "#4C97FF" },
  { id: "looks", name: "見た目", color: "#9966FF" },
  { id: "control", name: "制御", color: "#FFAB19" },
  { id: "sensing", name: "調べる", color: "#5CB1D6" },
  { id: "operators", name: "演算", color: "#59C059" },
  { id: "variables", name: "変数", color: "#FF8C1A" },
  { id: "lists", name: "リスト", color: "#FF661A" },
  { id: "myblocks", name: "マイブロック", color: "#FF6680" },
  { id: "physics", name: "物理", color: "#FF4D6A" },
]

export type BlockCategoryId = BlockCategory

// ステージサイズ
export const STAGE_WIDTH = 1920
export const STAGE_HEIGHT = 1080

// ─── コスチューム ──────────────────────────────────

export interface Costume {
  id: string
  name: string
  /** PNG の base64 データURL */
  dataUrl: string
  width: number
  height: number
}

export const DEFAULT_COSTUME_SIZE = 120
export const DEFAULT_SPRITE_EMOJIS = [
  "🐱",
  "🐶",
  "🐰",
  "🐻",
  "🦊",
  "🐼",
  "🐸",
  "🐵",
] as const

// ─── 当たり判定 ────────────────────────────────────

export type ColliderType = "bbox" | "circle"

export interface ColliderDef {
  type: ColliderType
  /** bbox 用: コスチュームに対するオフセット・サイズ（省略時はコスチューム全体） */
  offsetX?: number
  offsetY?: number
  width?: number
  height?: number
  /** circle 用: 半径（省略時はコスチュームの短辺の半分） */
  radius?: number
}

// ─── スプライト定義 ─────────────────────────────────

export interface SpriteDef {
  id: string
  name: string
  emoji?: string
  costumes: Costume[]
  currentCostumeIndex: number
  collider: ColliderDef
  x: number
  y: number
  size: number
  direction: number
  visible: boolean
}

export function resolveSpriteEmoji(
  sprite?: Pick<SpriteDef, "emoji">,
  index: number = 0,
): string {
  return sprite?.emoji ?? DEFAULT_SPRITE_EMOJIS[index % DEFAULT_SPRITE_EMOJIS.length]
}

function createCostumeCanvas(w = DEFAULT_COSTUME_SIZE, h = DEFAULT_COSTUME_SIZE) {
  if (typeof document === "undefined") return null
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  return canvas
}

function renderEmojiCostumeDataUrl(emoji: string): string {
  const canvas = createCostumeCanvas()
  if (!canvas) return ""

  const ctx = canvas.getContext("2d")
  if (!ctx) return ""

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.font = `${Math.round(DEFAULT_COSTUME_SIZE * 0.78)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(emoji, canvas.width / 2, canvas.height / 2 + 2)
  return canvas.toDataURL("image/png")
}

function costumeId(): string {
  return `costume-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function createEmojiCostume(name: string, emoji: string): Costume {
  return {
    id: costumeId(),
    name,
    dataUrl: renderEmojiCostumeDataUrl(emoji),
    width: DEFAULT_COSTUME_SIZE,
    height: DEFAULT_COSTUME_SIZE,
  }
}

export function createDefaultCostume(name: string, emoji: string): Costume {
  return createEmojiCostume(name, emoji)
}

/**
 * 矩形コスチュームを生成する
 * 任意の幅・高さ・色で塗りつぶした PNG を返す
 */
export function createRectCostume(
  name: string,
  width: number,
  height: number,
  color: string,
  options?: { borderColor?: string; borderWidth?: number; borderRadius?: number },
): Costume {
  const canvas = createCostumeCanvas(width, height)
  if (!canvas) {
    return { id: costumeId(), name, dataUrl: "", width, height }
  }
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    return { id: costumeId(), name, dataUrl: "", width, height }
  }

  const r = options?.borderRadius ?? 0
  ctx.beginPath()
  if (r > 0) {
    ctx.roundRect(0, 0, width, height, r)
  } else {
    ctx.rect(0, 0, width, height)
  }
  ctx.fillStyle = color
  ctx.fill()

  if (options?.borderColor) {
    const bw = options.borderWidth ?? 2
    ctx.lineWidth = bw
    ctx.strokeStyle = options.borderColor
    ctx.stroke()
  }

  return {
    id: costumeId(),
    name,
    dataUrl: canvas.toDataURL("image/png"),
    width,
    height,
  }
}

export const DEFAULT_COLLIDER: ColliderDef = {
  type: "bbox",
}

// ステージ: 1920×1080, 中心(0,0)
// 地面上端 y=-300, プレイヤー底辺=地面上端
export const DEFAULT_SPRITES: SpriteDef[] = [
  {
    id: "sprite-player",
    name: "プレイヤー",
    emoji: "🏃",
    costumes: [createRectCostume("プレイヤー", 128, 192, "#4488ff", { borderRadius: 12 })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: -600,
    y: -204,
    size: 100,
    direction: 90,
    visible: true,
  },
  {
    id: "sprite-ground",
    name: "地面",
    emoji: "🟫",
    costumes: [createRectCostume("地面", 1920, 160, "#6B4F14")],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: 0,
    y: -380,
    size: 100,
    direction: 90,
    visible: true,
  },
  {
    id: "sprite-platform1",
    name: "浮島1",
    emoji: "📦",
    costumes: [createRectCostume("浮島1", 400, 48, "#66aa44", { borderRadius: 6 })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: -400,
    y: -40,
    size: 100,
    direction: 90,
    visible: true,
  },
  {
    id: "sprite-platform2",
    name: "浮島2",
    emoji: "📦",
    costumes: [createRectCostume("浮島2", 400, 48, "#66aa44", { borderRadius: 6 })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: 400,
    y: 200,
    size: 100,
    direction: 90,
    visible: true,
  },
  {
    id: "sprite-coin",
    name: "コイン",
    emoji: "⭐",
    costumes: [createRectCostume("コイン", 80, 80, "#ffcc00", { borderRadius: 40 })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: 400,
    y: 280,
    size: 100,
    direction: 90,
    visible: true,
  },
  {
    id: "sprite-enemy",
    name: "敵",
    emoji: "👾",
    costumes: [createRectCostume("敵", 128, 128, "#ff4444", { borderRadius: 8 })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: 200,
    y: -236,
    size: 100,
    direction: 90,
    visible: true,
  },
  {
    id: "sprite-bullet",
    name: "弾",
    emoji: "•",
    costumes: [createRectCostume("弾", 48, 16, "#ff6600", { borderRadius: 8 })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: 9999,
    y: 9999,
    size: 100,
    direction: 90,
    visible: false,
  },
  {
    id: "sprite-hpbar",
    name: "HPバー",
    emoji: "❤",
    costumes: [createRectCostume("HPバー", 4, 4, "#000000", { borderRadius: 0 })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: 0,
    y: 0,
    size: 100,
    direction: 90,
    visible: false,
  },
]
