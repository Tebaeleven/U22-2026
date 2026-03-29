import type { BlockArgs, BlockUtil } from "../types"

/** 整数乱数 */
export function math_randomint(args: BlockArgs): number {
  const from = Math.ceil(Number(args.FROM ?? 0))
  const to = Math.floor(Number(args.TO ?? 100))
  return Math.floor(Math.random() * (to - from + 1)) + from
}

/** 指定スプライトへの角度（度数法、0°=右）
 *  cos(角度)*speed → VX, sin(角度)*speed → VY でそのまま使える
 *  （Phaser座標系: Y正=下 に合わせてdyを反転） */
export function math_angleto(args: BlockArgs, util: BlockUtil): number {
  const targetName = String(args.TARGET ?? "")
  const sprite = util.getSprite()
  const target = util.getAllSprites().find((s) => s.name === targetName)
  if (!target) return 0
  const dx = target.x - sprite.x
  // ステージ座標Y上正 → Phaser座標Y下正 に変換するため反転
  const dy = -(target.y - sprite.y)
  return Math.atan2(dy, dx) * (180 / Math.PI)
}

/** 指定スプライトとの距離 */
export function math_distanceto(args: BlockArgs, util: BlockUtil): number {
  const targetName = String(args.TARGET ?? "")
  const sprite = util.getSprite()
  const target = util.getAllSprites().find((s) => s.name === targetName)
  if (!target) return 0
  const dx = target.x - sprite.x
  const dy = target.y - sprite.y
  return Math.sqrt(dx * dx + dy * dy)
}

/** 絶対値 */
export function math_abs(args: BlockArgs): number {
  return Math.abs(Number(args.NUM ?? 0))
}

/** 最小値 */
export function math_min(args: BlockArgs): number {
  return Math.min(Number(args.A ?? 0), Number(args.B ?? 0))
}

/** 最大値 */
export function math_max(args: BlockArgs): number {
  return Math.max(Number(args.A ?? 0), Number(args.B ?? 0))
}

/** sin（度数法） */
export function math_sin(args: BlockArgs): number {
  const deg = Number(args.DEG ?? 0)
  return Math.sin(deg * (Math.PI / 180))
}

/** cos（度数法） */
export function math_cos(args: BlockArgs): number {
  const deg = Number(args.DEG ?? 0)
  return Math.cos(deg * (Math.PI / 180))
}
