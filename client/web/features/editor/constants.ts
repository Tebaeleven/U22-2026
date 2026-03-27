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

function createCostumeCanvas() {
  if (typeof document === "undefined") return null
  const canvas = document.createElement("canvas")
  canvas.width = DEFAULT_COSTUME_SIZE
  canvas.height = DEFAULT_COSTUME_SIZE
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

export function createEmojiCostume(name: string, emoji: string): Costume {
  return {
    id: `costume-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    dataUrl: renderEmojiCostumeDataUrl(emoji),
    width: DEFAULT_COSTUME_SIZE,
    height: DEFAULT_COSTUME_SIZE,
  }
}

export function createDefaultCostume(name: string, emoji: string): Costume {
  return createEmojiCostume(name, emoji)
}

export const DEFAULT_COLLIDER: ColliderDef = {
  type: "bbox",
}

const defaultSpriteEmoji = resolveSpriteEmoji(undefined, 0)

export const DEFAULT_SPRITES: SpriteDef[] = [
  {
    id: "sprite-1",
    name: "ネコ",
    emoji: defaultSpriteEmoji,
    costumes: [createDefaultCostume("コスチューム1", defaultSpriteEmoji)],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: 0,
    y: 0,
    size: 300,
    direction: 90,
    visible: true,
  },
]
