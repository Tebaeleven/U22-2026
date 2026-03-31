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
  if (mode !== "dynamic") {
    sprite.grounded = false
  }
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
  sprite._velocityDirty = true
}

/** X 方向の速度のみ設定 */
export function physics_setvelocityX(args: BlockArgs, util: BlockUtil) {
  const vx = Number(args.VX ?? 0)
  const sprite = util.getSprite()
  sprite.velocityX = vx
  sprite._velocityDirty = true
}

/** Y 方向の速度のみ設定 */
export function physics_setvelocityY(args: BlockArgs, util: BlockUtil) {
  const vy = Number(args.VY ?? 0)
  const sprite = util.getSprite()
  sprite.velocityY = vy
  sprite._velocityDirty = true
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
  return util.getSprite().grounded
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
  const val = args.ENABLED ?? "on"
  const enabled = val === true || val === "on" || val === "true"
  const sprite = util.getSprite()
  sprite.collideWorldBounds = enabled
  const scene = util.getScene()
  if (scene) scene.setSpriteCollideWorldBounds(sprite.id, enabled)
}

/** 物理ボディを無効にする（非表示 + 衝突無効） */
export function physics_disablebody(_args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  sprite.bodyEnabled = false
  sprite.grounded = false
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
  const val = args.ENABLED ?? "on"
  const enabled = val === true || val === "on" || val === "true"
  const sprite = util.getSprite()
  sprite.allowGravity = enabled
  const scene = util.getScene()
  if (scene) scene.setSpriteAllowGravity(sprite.id, enabled)
}

// ── Phase 1: 物理プロパティ拡張 ──────────────────────────

/** 加速度を設定 (x, y) */
export function physics_setacceleration(args: BlockArgs, util: BlockUtil) {
  const ax = Number(args.AX ?? 0)
  const ay = Number(args.AY ?? 0)
  const sprite = util.getSprite()
  sprite.accelerationX = ax
  sprite.accelerationY = ay
  const scene = util.getScene()
  if (scene) scene.setSpriteAcceleration(sprite.id, ax, ay)
}

/** X方向の加速度のみ設定 */
export function physics_setaccelerationx(args: BlockArgs, util: BlockUtil) {
  const ax = Number(args.AX ?? 0)
  const sprite = util.getSprite()
  sprite.accelerationX = ax
  const scene = util.getScene()
  if (scene) scene.setSpriteAcceleration(sprite.id, ax, sprite.accelerationY)
}

/** Y方向の加速度のみ設定 */
export function physics_setaccelerationy(args: BlockArgs, util: BlockUtil) {
  const ay = Number(args.AY ?? 0)
  const sprite = util.getSprite()
  sprite.accelerationY = ay
  const scene = util.getScene()
  if (scene) scene.setSpriteAcceleration(sprite.id, sprite.accelerationX, ay)
}

/** 抗力（ドラッグ）を設定 */
export function physics_setdrag(args: BlockArgs, util: BlockUtil) {
  const dx = Number(args.DX ?? 0)
  const dy = Number(args.DY ?? 0)
  const sprite = util.getSprite()
  sprite.dragX = dx
  sprite.dragY = dy
  const scene = util.getScene()
  if (scene) scene.setSpriteDrag(sprite.id, dx, dy)
}

/** ダンピングモードを有効/無効 */
export function physics_setdamping(args: BlockArgs, util: BlockUtil) {
  const val = args.ENABLED ?? "on"
  const enabled = val === true || val === "on" || val === "true"
  const sprite = util.getSprite()
  sprite.useDamping = enabled
  const scene = util.getScene()
  if (scene) scene.setSpriteDamping(sprite.id, enabled)
}

/** 最大速度を設定 */
export function physics_setmaxvelocity(args: BlockArgs, util: BlockUtil) {
  const vx = Number(args.VX ?? 10000)
  const vy = Number(args.VY ?? 10000)
  const sprite = util.getSprite()
  sprite.maxVelocityX = vx
  sprite.maxVelocityY = vy
  const scene = util.getScene()
  if (scene) scene.setSpriteMaxVelocity(sprite.id, vx, vy)
}

/** 角速度を設定 (deg/s) */
export function physics_setangularvelocity(args: BlockArgs, util: BlockUtil) {
  const deg = Number(args.DEG ?? 0)
  const sprite = util.getSprite()
  sprite.angularVelocity = deg
  const scene = util.getScene()
  if (scene) scene.setSpriteAngularVelocity(sprite.id, deg)
}

/** 不動体設定 */
export function physics_setimmovable(args: BlockArgs, util: BlockUtil) {
  const val = args.ENABLED ?? "on"
  const enabled = val === true || val === "on" || val === "true"
  const sprite = util.getSprite()
  sprite.immovable = enabled
  const scene = util.getScene()
  if (scene) scene.setSpriteImmovable(sprite.id, enabled)
}

/** 質量を設定 */
export function physics_setmass(args: BlockArgs, util: BlockUtil) {
  const mass = Math.max(0.1, Number(args.MASS ?? 1))
  const sprite = util.getSprite()
  sprite.mass = mass
  const scene = util.getScene()
  if (scene) scene.setSpriteMass(sprite.id, mass)
}

/** 速度の大きさを返す */
export function physics_speed(_args: BlockArgs, util: BlockUtil): number {
  const scene = util.getScene()
  if (!scene) return 0
  return scene.getSpriteSpeed(util.getSprite().id)
}

/** 押し出し可否を設定 */
export function physics_setpushable(args: BlockArgs, util: BlockUtil) {
  const val = args.ENABLED ?? "on"
  const enabled = val === true || val === "on" || val === "true"
  const sprite = util.getSprite()
  sprite.pushable = enabled
  const scene = util.getScene()
  if (scene) scene.setSpritePushable(sprite.id, enabled)
}

/** ワールドラップ（画面端を超えたら反対側から出てくる） */
export function physics_worldwrap(args: BlockArgs, util: BlockUtil) {
  const padding = Number(args.PADDING ?? 0)
  const scene = util.getScene()
  if (scene) scene.worldWrap(util.getSprite().id, padding)
}

// ── Phase 2: 高度な物理操作 ──────────────────────────────

/** ターゲットスプライトに向かって移動 */
export function physics_moveto(args: BlockArgs, util: BlockUtil) {
  const targetName = String(args.TARGET ?? "")
  const speed = Number(args.SPEED ?? 200)
  const target = util.getSpriteByName(targetName)
  if (!target) return
  const scene = util.getScene()
  if (scene) scene.moveToObject(util.getSprite().id, target.x, target.y, speed)
}

/** ターゲットスプライトに向かって加速 */
export function physics_accelerateto(args: BlockArgs, util: BlockUtil) {
  const targetName = String(args.TARGET ?? "")
  const accel = Number(args.SPEED ?? 100)
  const target = util.getSpriteByName(targetName)
  if (!target) return
  const scene = util.getScene()
  if (scene) scene.accelerateToObject(util.getSprite().id, target.x, target.y, accel)
}

/** 角度から速度を設定 */
export function physics_velocityfromangle(args: BlockArgs, util: BlockUtil) {
  const angle = Number(args.ANGLE ?? 0)
  const speed = Number(args.SPEED ?? 200)
  const scene = util.getScene()
  if (scene) scene.velocityFromAngle(util.getSprite().id, angle, speed)
}

// ── Phase 4: Phaser API 拡張 ──────────────────────────────

/** 物理ボディのサイズを変更 (Phaser body.setSize 相当) */
export function physics_setbodysize(args: BlockArgs, util: BlockUtil) {
  const width = Number(args.WIDTH ?? 32)
  const height = Number(args.HEIGHT ?? 32)
  const scene = util.getScene()
  if (scene) scene.setSpriteBodySize(util.getSprite().id, width, height)
}

/** 物理ボディのオフセットを設定 (Phaser body.setOffset 相当) */
export function physics_setbodyoffset(args: BlockArgs, util: BlockUtil) {
  const ox = Number(args.OX ?? 0)
  const oy = Number(args.OY ?? 0)
  const scene = util.getScene()
  if (scene) scene.setSpriteBodyOffset(util.getSprite().id, ox, oy)
}

/** 円形の物理ボディに変更 (Phaser body.setCircle 相当) */
export function physics_setcircle(args: BlockArgs, util: BlockUtil) {
  const radius = Number(args.RADIUS ?? 16)
  const scene = util.getScene()
  if (scene) scene.setSpriteCircle(util.getSprite().id, radius)
}
