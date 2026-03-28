// ブロック振る舞い解決・形状ヘルパー
import type { BlockBehavior, BlockDef, BlockShape, ValueBlockShape } from "../types"
import { C_DIVIDER_H, SHAPE_CONFIGS } from "./constants"

type BlockBehaviorOverride = {
  connectors?: Partial<BlockBehavior["connectors"]>
  bodies?: Array<Partial<BlockBehavior["bodies"][number]>>
  contentGap?: number
}

const BLOCK_BEHAVIOR_OVERRIDES: Partial<
  Record<string, BlockBehaviorOverride>
> = {
  control_forever: {
    connectors: {
      bottom: true,
    },
  },
}

/** ブロック定義または形状名から振る舞い（サイズ・コネクタ・ボディ）を解決する */
export function resolveBlockBehavior(blockOrShape: BlockDef | BlockShape): BlockBehavior {
  const def = typeof blockOrShape === "string" ? null : blockOrShape
  const shape = typeof blockOrShape === "string" ? blockOrShape : blockOrShape.shape
  const shapeConfig = SHAPE_CONFIGS[shape]
  const override = def?.opcode
    ? BLOCK_BEHAVIOR_OVERRIDES[def.opcode]
    : undefined

  return {
    size: shapeConfig.size,
    connectors: {
      top: override?.connectors?.top ?? shapeConfig.connectors.top,
      bottom: override?.connectors?.bottom ?? shapeConfig.connectors.bottom,
      value: override?.connectors?.value ?? !!shapeConfig.connectors.value,
    },
    bodies: (shapeConfig.bodies ?? []).map((body, index) => ({
      minHeight: override?.bodies?.[index]?.minHeight ?? body.minHeight,
      hasEntryConnector:
        override?.bodies?.[index]?.hasEntryConnector ?? true,
    })),
    contentGap:
      override?.contentGap ??
      (shape === "c-block-else" ? C_DIVIDER_H : undefined),
  }
}

/** 形状からブロックのデフォルトサイズを取得する */
export function getBlockSize(shape: BlockShape): { w: number; h: number } {
  return resolveBlockBehavior(shape).size
}

/** 形状が上部コネクタを持つかを判定する */
export function hasTopConnector(shape: BlockShape): boolean {
  return resolveBlockBehavior(shape).connectors.top
}

/** 形状が下部コネクタを持つかを判定する */
export function hasBottomConnector(shape: BlockShape): boolean {
  return resolveBlockBehavior(shape).connectors.bottom
}

/** 形状がCブロック系（ボディを持つ）かを判定する */
export function isCBlockShape(shape: BlockShape): boolean {
  return resolveBlockBehavior(shape).bodies.length > 0
}

/** 形状がインライン値ブロック（reporter/boolean）かを判定する */
export function isInlineValueShape(shape: BlockShape): boolean {
  return resolveBlockBehavior(shape).connectors.value
}

/** 形状がスロットにはめ込み可能な値ブロックかを判定する（型ガード） */
export function isValueBlockShape(shape: BlockShape): shape is ValueBlockShape {
  return isInlineValueShape(shape)
}
