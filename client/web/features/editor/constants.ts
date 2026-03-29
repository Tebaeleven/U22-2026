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
  { id: "camera", name: "カメラ", color: "#3D9970" },
  { id: "sound", name: "音", color: "#D65CD6" },
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

// ─── サウンド定義 ─────────────────────────────────

export interface SoundDef {
  id: string
  name: string
  /** Base64 エンコードされた音声データ（data URL） */
  dataUrl: string
}

// ─── スプライト定義 ─────────────────────────────────

export interface SpriteDef {
  id: string
  name: string
  emoji?: string
  costumes: Costume[]
  currentCostumeIndex: number
  collider: ColliderDef
  /** サウンドアセット */
  sounds?: SoundDef[]
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
// 地面上端 y≈-300 (地面 160px 高、中心 y=-380)
export const DEFAULT_SPRITES: SpriteDef[] = [
  // ── キャラクター ──
  {
    id: "sprite-player",
    name: "プレイヤー",
    emoji: "🏃",
    costumes: [createRectCostume("プレイヤー", 96, 144, "#3377ff", { borderRadius: 14, borderColor: "#1a4fcc", borderWidth: 3 })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: -750,
    y: -228,
    size: 100,
    direction: 90,
    visible: true,
  },
  {
    id: "sprite-enemy",
    name: "敵",
    emoji: "👾",
    costumes: [createRectCostume("敵", 100, 100, "#ee3333", { borderRadius: 10, borderColor: "#aa0000", borderWidth: 2 })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: -100,
    y: -250,
    size: 100,
    direction: 90,
    visible: true,
  },
  {
    id: "sprite-enemy2",
    name: "敵2",
    emoji: "👾",
    costumes: [createRectCostume("敵2", 80, 80, "#dd6600", { borderRadius: 8, borderColor: "#993300", borderWidth: 2 })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: 250,
    y: 140,
    size: 100,
    direction: 90,
    visible: true,
  },
  {
    id: "sprite-boss",
    name: "ボス",
    emoji: "🐉",
    costumes: [createRectCostume("ボス", 160, 200, "#880022", { borderRadius: 12, borderColor: "#550011", borderWidth: 4 })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: 700,
    y: -200,
    size: 100,
    direction: 90,
    visible: true,
  },

  // ── 地形 ──
  {
    id: "sprite-ground",
    name: "地面",
    emoji: "🟫",
    costumes: [createRectCostume("地面", 1920, 160, "#5a4012", { borderColor: "#3d2b0a", borderWidth: 2 })],
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
    costumes: [createRectCostume("浮島1", 360, 40, "#448833", { borderRadius: 6, borderColor: "#2d5c22", borderWidth: 2 })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: -550,
    y: -100,
    size: 100,
    direction: 90,
    visible: true,
  },
  {
    id: "sprite-platform2",
    name: "浮島2",
    emoji: "📦",
    costumes: [createRectCostume("浮島2", 360, 40, "#448833", { borderRadius: 6, borderColor: "#2d5c22", borderWidth: 2 })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: 250,
    y: 100,
    size: 100,
    direction: 90,
    visible: true,
  },
  {
    id: "sprite-platform3",
    name: "浮島3",
    emoji: "📦",
    costumes: [createRectCostume("浮島3", 300, 40, "#448833", { borderRadius: 6, borderColor: "#2d5c22", borderWidth: 2 })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: -200,
    y: 280,
    size: 100,
    direction: 90,
    visible: true,
  },
  {
    id: "sprite-movingPlatform",
    name: "移動床",
    emoji: "↔",
    costumes: [createRectCostume("移動床", 240, 36, "#2299aa", { borderRadius: 8, borderColor: "#166677", borderWidth: 2 })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: -100,
    y: -200,
    size: 100,
    direction: 90,
    visible: true,
  },

  // ── アイテム ──
  {
    id: "sprite-coin1",
    name: "コイン",
    emoji: "⭐",
    costumes: [createRectCostume("コイン", 60, 60, "#ffcc00", { borderRadius: 30, borderColor: "#cc9900", borderWidth: 2 })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: -550,
    y: -30,
    size: 100,
    direction: 90,
    visible: true,
  },
  {
    id: "sprite-coin2",
    name: "コイン2",
    emoji: "⭐",
    costumes: [createRectCostume("コイン2", 60, 60, "#ffcc00", { borderRadius: 30, borderColor: "#cc9900", borderWidth: 2 })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: 250,
    y: 170,
    size: 100,
    direction: 90,
    visible: true,
  },
  {
    id: "sprite-coin3",
    name: "コイン3",
    emoji: "⭐",
    costumes: [createRectCostume("コイン3", 60, 60, "#ffcc00", { borderRadius: 30, borderColor: "#cc9900", borderWidth: 2 })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: -200,
    y: 350,
    size: 100,
    direction: 90,
    visible: true,
  },
  {
    id: "sprite-heal",
    name: "回復",
    emoji: "💚",
    costumes: [createRectCostume("回復", 56, 56, "#33cc66", { borderRadius: 28, borderColor: "#229944", borderWidth: 2 })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: -100,
    y: -140,
    size: 100,
    direction: 90,
    visible: true,
  },

  // ── 障害物 ──
  {
    id: "sprite-trap",
    name: "トラップ",
    emoji: "⚠",
    costumes: [createRectCostume("トラップ", 200, 40, "#cc2222", { borderColor: "#880000", borderWidth: 2 })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: 100,
    y: -280,
    size: 100,
    direction: 90,
    visible: true,
  },

  // ── ゴール ──
  {
    id: "sprite-goal",
    name: "ゴール",
    emoji: "🏁",
    costumes: [createRectCostume("ゴール", 80, 200, "#ffd700", { borderRadius: 8, borderColor: "#cca300", borderWidth: 3 })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: 880,
    y: -200,
    size: 100,
    direction: 90,
    visible: true,
  },

  // ── 弾丸 ──
  {
    id: "sprite-bullet",
    name: "弾",
    emoji: "•",
    costumes: [createRectCostume("弾", 36, 12, "#ff8800", { borderRadius: 6 })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: 9999,
    y: 9999,
    size: 100,
    direction: 90,
    visible: false,
  },
  {
    id: "sprite-bossBullet",
    name: "ボス弾",
    emoji: "•",
    costumes: [createRectCostume("ボス弾", 40, 40, "#cc00cc", { borderRadius: 20, borderColor: "#880088", borderWidth: 2 })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: 9999,
    y: 9999,
    size: 100,
    direction: 90,
    visible: false,
  },

  // ── HUD（不可視、グラフィック描画用） ──
  {
    id: "sprite-hud",
    name: "HUD",
    emoji: "📊",
    costumes: [createRectCostume("HUD", 4, 4, "#000000")],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: 0,
    y: 0,
    size: 100,
    direction: 90,
    visible: false,
  },
]
