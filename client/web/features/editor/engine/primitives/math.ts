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

/** tan（度数法） */
export function math_tan(args: BlockArgs): number {
  const deg = Number(args.DEG ?? 0)
  return Math.tan(deg * (Math.PI / 180))
}

/** 線形補間 */
export function math_lerp(args: BlockArgs): number {
  const a = Number(args.A ?? 0)
  const b = Number(args.B ?? 0)
  const t = Number(args.T ?? 50) / 100
  return a + (b - a) * t
}

/** 範囲制限 */
export function math_clamp(args: BlockArgs): number {
  const val = Number(args.VAL ?? 0)
  const min = Number(args.MIN ?? 0)
  const max = Number(args.MAX ?? 100)
  return Math.max(min, Math.min(max, val))
}

/** 切り捨て */
export function math_floor(args: BlockArgs): number {
  return Math.floor(Number(args.NUM ?? 0))
}

/** 切り上げ */
export function math_ceil(args: BlockArgs): number {
  return Math.ceil(Number(args.NUM ?? 0))
}

/** 平方根 */
export function math_sqrt(args: BlockArgs): number {
  return Math.sqrt(Math.abs(Number(args.NUM ?? 0)))
}

/** べき乗 */
export function math_pow(args: BlockArgs): number {
  return Math.pow(Number(args.BASE ?? 0), Number(args.EXP ?? 0))
}

/** atan2（度数法） */
export function math_atan2(args: BlockArgs): number {
  const y = Number(args.Y ?? 0)
  const x = Number(args.X ?? 0)
  return Math.atan2(y, x) * (180 / Math.PI)
}

/** 符号 */
export function math_sign(args: BlockArgs): number {
  return Math.sign(Number(args.NUM ?? 0))
}

/** 線形再マッピング */
export function math_remap(args: BlockArgs): number {
  const val = Number(args.VAL ?? 0)
  const fromMin = Number(args.FROM_MIN ?? 0)
  const fromMax = Number(args.FROM_MAX ?? 100)
  const toMin = Number(args.TO_MIN ?? 0)
  const toMax = Number(args.TO_MAX ?? 1)
  if (fromMax === fromMin) return toMin
  return toMin + ((val - fromMin) / (fromMax - fromMin)) * (toMax - toMin)
}

/** 円周率 */
export function math_pi(): number {
  return Math.PI
}
