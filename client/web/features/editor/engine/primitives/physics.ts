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

/** バウンス（反発係数）を設定 */
export function physics_setbounce(args: BlockArgs, util: BlockUtil) {
  const bounce = Number(args.BOUNCE ?? 0)
  const sprite = util.getSprite()
  sprite.bounce = bounce
  const scene = util.getScene()
  if (scene) scene.setSpriteBounce(sprite.id, bounce, bounce)
}

/** ワールド境界との衝突を設定 */
export function physics_setcollideworldbounds(args: BlockArgs, util: BlockUtil) {
  const enabled = String(args.ENABLED ?? "on") === "on"
  const sprite = util.getSprite()
  sprite.collideWorldBounds = enabled
  const scene = util.getScene()
  if (scene) scene.setSpriteCollideWorldBounds(sprite.id, enabled)
}

/** 物理ボディを無効にする（非表示 + 衝突無効） */
export function physics_disablebody(_args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  sprite.bodyEnabled = false
  sprite.visible = false
  const scene = util.getScene()
  if (scene) scene.setSpriteBodyEnabled(sprite.id, false)
}

/** 物理ボディを有効にする（表示 + 衝突有効） */
export function physics_enablebody(_args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  sprite.bodyEnabled = true
  sprite.visible = true
  const scene = util.getScene()
  if (scene) scene.setSpriteBodyEnabled(sprite.id, true)
}

/** 衝突コールバックを登録 */
export function physics_oncollide(args: BlockArgs, util: BlockUtil) {
  const targetName = String(args.TARGET ?? "Sprite1")
  const eventName = String(args.EVENT_NAME ?? "collision")
  util.onCollide(targetName, eventName)
}

/** 衝突コンテキストからターゲット名を取得 */
export function physics_collisiontarget(_args: BlockArgs, util: BlockUtil): string {
  return util.getCollisionTarget()
}

/** 個別の重力有効/無効 */
export function physics_setallowgravity(args: BlockArgs, util: BlockUtil) {
  const enabled = String(args.ENABLED ?? "on") === "on"
  const sprite = util.getSprite()
  sprite.allowGravity = enabled
  const scene = util.getScene()
  if (scene) scene.setSpriteAllowGravity(sprite.id, enabled)
}
