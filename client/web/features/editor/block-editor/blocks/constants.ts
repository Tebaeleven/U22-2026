// 寸法定数・形状設定
import type { BlockShape, ShapeConfig } from "../types"

// --- 寸法定数 ---
export const CONN_OFFSET_X = 40
export const C_BODY_ENTRY_OFFSET_X = 50
export const C_BODY_ENTRY_OFFSET_Y = 0
export const C_BODY_ENTRY_HIT_RADIUS = 8
export const C_BODY_LAYOUT_OFFSET_X = 16
export const C_BODY_MIN_H = 40
export const C_HEADER_H = 40
export const C_FOOTER_H = 20
export const C_DIVIDER_H = 28
export const C_W = 220
export const INLINE_PADDING_X = 12
export const INLINE_GAP = 6
export const INLINE_SLOT_BASE_H = 24
export const INLINE_HEIGHT_PADDING = 8
export const BOOLEAN_SLOT_W = 36
/** value/slot の Connector.hitRadius。当たり・デバッグ SVG の円半径は headless-vpl が同じ値で描く。 */
export const BOOLEAN_CONNECTOR_HIT_RADIUS = 12
export const HAT_REPORTER_CHIP_MIN_W = 48
export const INPUT_MIN_W = 40
export const INPUT_TEXT_MIN_W = 48
export const INPUT_DROPDOWN_MIN_W = 56
export const INPUT_MAX_W = 180
export const INLINE_REPORTER_INPUT_MIN_W = 28
export const INLINE_REPORTER_INPUT_MAX_W = 84

export const STARTER_DEFINE_BLOCK_ID = "starter-define"
export const DEFAULT_VARIABLES = ["my variable", "score", "timer"]
export const GENERIC_RETURN_BLOCK_ID = "custom-return"
export const CUSTOM_DEFINE_PREFIX = "custom-define:"
export const CUSTOM_CALL_PREFIX = "custom-call:"
export const CUSTOM_ARGUMENT_PREFIX = "custom-argument:"

// --- ShapeConfig ---
export const SHAPE_CONFIGS: Record<BlockShape, ShapeConfig> = {
  hat: { size: { w: 200, h: 52 }, connectors: { top: false, bottom: true } },
  stack: { size: { w: 200, h: 42 }, connectors: { top: true, bottom: true } },
  "c-block": {
    size: { w: C_W, h: C_HEADER_H + C_BODY_MIN_H + C_FOOTER_H },
    connectors: { top: true, bottom: true },
    bodies: [{ minHeight: C_BODY_MIN_H }],
  },
  "c-block-else": {
    size: {
      w: C_W,
      h: C_HEADER_H + C_BODY_MIN_H + C_DIVIDER_H + C_BODY_MIN_H + C_FOOTER_H,
    },
    connectors: { top: true, bottom: true },
    bodies: [{ minHeight: C_BODY_MIN_H }, { minHeight: C_BODY_MIN_H }],
  },
  "cap-c": {
    size: { w: C_W, h: C_HEADER_H + C_BODY_MIN_H + C_FOOTER_H },
    connectors: { top: true, bottom: true },
    bodies: [{ minHeight: C_BODY_MIN_H }],
  },
  reporter: {
    size: { w: 60, h: 32 },
    connectors: { top: false, bottom: false, value: true },
  },
  boolean: {
    size: { w: 60, h: 32 },
    connectors: { top: false, bottom: false, value: true },
  },
}
