import type { BlockArgs, BlockUtil } from "../types"

/** ステージ全体の重力を設定 */
export function physics_setgravity(args: BlockArgs, util: BlockUtil) {
  const y = Number(args.GRAVITY ?? 300)
  const scene = util.getScene()
  if (scene) scene.setGravity(y)
}

/** スプライトの物理モードを設定 */
export function physics_setmode(args: BlockArgs, util: BlockUtil) {
  const mode = String(args.MODE ?? "dynamic")
  if (mode !== "dynamic" && mode !== "static" && mode !== "none") return
  const sprite = util.getSprite()
  sprite.physicsMode = mode
  const scene = util.getScene()
  if (scene) scene.setSpritePhysicsMode(sprite.id, mode)
}

/** 速度ベクトルを設定 (x, y) */
export function physics_setvelocity(args: BlockArgs, util: BlockUtil) {
  const vx = Number(args.VX ?? 0)
  const vy = Number(args.VY ?? 0)
  const sprite = util.getSprite()
  sprite.velocityX = vx
  sprite.velocityY = vy
}

/** X 方向の速度のみ設定 */
export function physics_setvelocityX(args: BlockArgs, util: BlockUtil) {
  const vx = Number(args.VX ?? 0)
  const sprite = util.getSprite()
  sprite.velocityX = vx
}

/** Y 方向の速度のみ設定 */
export function physics_setvelocityY(args: BlockArgs, util: BlockUtil) {
  const vy = Number(args.VY ?? 0)
  const sprite = util.getSprite()
  sprite.velocityY = vy
}

/** 現在の X 速度を返す */
export function physics_velocityX(_args: BlockArgs, util: BlockUtil): number {
  return util.getSprite().velocityX
}

/** 現在の Y 速度を返す */
export function physics_velocityY(_args: BlockArgs, util: BlockUtil): number {
  return util.getSprite().velocityY
}

/** 接地しているか判定 */
export function physics_onground(_args: BlockArgs, util: BlockUtil): boolean {
  const scene = util.getScene()
  if (!scene) return false
  return scene.isOnGround(util.getSprite().id)
}
