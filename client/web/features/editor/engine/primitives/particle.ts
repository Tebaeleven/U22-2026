import type { BlockArgs, BlockUtil } from "../types"

/** ワールド座標にパーティクルを発射 */
export function particle_emit(args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  const x = Number(args.X ?? sprite.x)
  const y = Number(args.Y ?? sprite.y)
  const count = Number(args.COUNT ?? 10)
  const colorStr = String(args.COLOR ?? "#ffffff")
  const speed = Number(args.SPEED ?? 200)

  // "#rrggbb" → 0xrrggbb
  const color = parseInt(colorStr.replace("#", ""), 16) || 0xffffff

  util.getScene()?.emitParticles(x, y, count, color, speed)
}
