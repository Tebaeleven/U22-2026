// Scratch準拠のブロックカテゴリ色
export const BLOCK_CATEGORIES = [
  { id: "motion", name: "動き", color: "#4C97FF" },
  { id: "looks", name: "見た目", color: "#9966FF" },
  { id: "sound", name: "音", color: "#CF63CF" },
  { id: "events", name: "イベント", color: "#FFBF00" },
  { id: "control", name: "制御", color: "#FFAB19" },
  { id: "sensing", name: "調べる", color: "#5CB1D6" },
  { id: "operators", name: "演算", color: "#59C059" },
  { id: "variables", name: "変数", color: "#FF8C1A" },
] as const

export type BlockCategoryId = (typeof BLOCK_CATEGORIES)[number]["id"]

// ブロック定義
export interface BlockDef {
  id: string
  categoryId: BlockCategoryId
  label: string
}

export const MOCK_BLOCKS: BlockDef[] = [
  // 動き
  { id: "move_steps", categoryId: "motion", label: "10歩動かす" },
  { id: "turn_right", categoryId: "motion", label: "15度回す ↻" },
  { id: "turn_left", categoryId: "motion", label: "15度回す ↺" },
  { id: "go_to_xy", categoryId: "motion", label: "x:0 y:0 へ行く" },
  { id: "glide_to", categoryId: "motion", label: "1秒でx:0 y:0 へ滑る" },
  { id: "change_x", categoryId: "motion", label: "x座標を10ずつ変える" },
  { id: "change_y", categoryId: "motion", label: "y座標を10ずつ変える" },
  // 見た目
  { id: "say", categoryId: "looks", label: "Hello!と言う" },
  { id: "say_for", categoryId: "looks", label: "Hello!と2秒言う" },
  { id: "show", categoryId: "looks", label: "表示する" },
  { id: "hide", categoryId: "looks", label: "隠す" },
  { id: "change_size", categoryId: "looks", label: "大きさを10ずつ変える" },
  // 音
  { id: "play_sound", categoryId: "sound", label: "ニャーの音を鳴らす" },
  { id: "stop_sounds", categoryId: "sound", label: "すべての音を止める" },
  { id: "change_volume", categoryId: "sound", label: "音量を-10ずつ変える" },
  // イベント
  { id: "when_flag", categoryId: "events", label: "🏴 が押されたとき" },
  { id: "when_key", categoryId: "events", label: "スペースキーが押されたとき" },
  { id: "when_clicked", categoryId: "events", label: "このスプライトが押されたとき" },
  // 制御
  { id: "wait", categoryId: "control", label: "1秒待つ" },
  { id: "repeat", categoryId: "control", label: "10回繰り返す" },
  { id: "forever", categoryId: "control", label: "ずっと" },
  { id: "if_then", categoryId: "control", label: "もし〜なら" },
  { id: "if_else", categoryId: "control", label: "もし〜なら / でなければ" },
  // 調べる
  { id: "touching", categoryId: "sensing", label: "マウスのポインターに触れた" },
  { id: "ask", categoryId: "sensing", label: "あなたの名前は？と聞いて待つ" },
  { id: "mouse_x", categoryId: "sensing", label: "マウスのx座標" },
  // 演算
  { id: "add", categoryId: "operators", label: "◯ + ◯" },
  { id: "subtract", categoryId: "operators", label: "◯ - ◯" },
  { id: "multiply", categoryId: "operators", label: "◯ * ◯" },
  { id: "random", categoryId: "operators", label: "1から10までの乱数" },
  // 変数
  { id: "set_var", categoryId: "variables", label: "変数を0にする" },
  { id: "change_var", categoryId: "variables", label: "変数を1ずつ変える" },
  { id: "show_var", categoryId: "variables", label: "変数を表示する" },
]

// ステージサイズ
export const STAGE_WIDTH = 480
export const STAGE_HEIGHT = 360

// スプライト定義
export interface SpriteDef {
  id: string
  name: string
  emoji: string
  x: number
  y: number
  size: number
  direction: number
  visible: boolean
}

export const DEFAULT_SPRITES: SpriteDef[] = [
  {
    id: "sprite-1",
    name: "ネコ",
    emoji: "🐱",
    x: 0,
    y: 0,
    size: 100,
    direction: 90,
    visible: true,
  },
]
