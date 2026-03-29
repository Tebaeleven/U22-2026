import type { BlockArgs, BlockUtil } from "../types"
import { STAGE_WIDTH, STAGE_HEIGHT } from "../types"

/** dynamic スプライトの場合、Phaser のボディ位置も同期する */
function syncPositionToPhysics(util: BlockUtil) {
  const sprite = util.getSprite()
  if (sprite.physicsMode === "dynamic" || sprite.physicsMode === "static") {
    const scene = util.getScene()
    scene?.setSpritePosition(sprite.id, sprite.x, sprite.y)
  }
}

/** 10歩動かす */
export function motion_movesteps(args: BlockArgs, util: BlockUtil) {
  const steps = Number(args.STEPS) || 0
  const sprite = util.getSprite()
  const radians = ((90 - sprite.direction) * Math.PI) / 180
  sprite.x += steps * Math.cos(radians)
  sprite.y += steps * Math.sin(radians)
  syncPositionToPhysics(util)
}

/** 右に回す */
export function motion_turnright(args: BlockArgs, util: BlockUtil) {
  const degrees = Number(args.DEGREES) || 0
  const sprite = util.getSprite()
  sprite.direction = (sprite.direction + degrees) % 360
}

/** 左に回す */
export function motion_turnleft(args: BlockArgs, util: BlockUtil) {
  const degrees = Number(args.DEGREES) || 0
  const sprite = util.getSprite()
  sprite.direction = (sprite.direction - degrees + 360) % 360
}

/** x:_ y:_ へ行く */
export function motion_gotoxy(args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  sprite.x = Number(args.X) || 0
  sprite.y = Number(args.Y) || 0
  syncPositionToPhysics(util)
}

/** x座標を_ずつ変える */
export function motion_changexby(args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  sprite.x += Number(args.DX) || 0
  syncPositionToPhysics(util)
}

/** y座標を_ずつ変える */
export function motion_changeyby(args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  sprite.y += Number(args.DY) || 0
  syncPositionToPhysics(util)
}

/** x座標を_にする */
export function motion_setx(args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  sprite.x = Number(args.X) || 0
  syncPositionToPhysics(util)
}

/** y座標を_にする */
export function motion_sety(args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  sprite.y = Number(args.Y) || 0
  syncPositionToPhysics(util)
}

/** x座標（レポーター） */
export function motion_xposition(_args: BlockArgs, util: BlockUtil): number {
  return util.getSprite().x
}

/** y座標（レポーター） */
export function motion_yposition(_args: BlockArgs, util: BlockUtil): number {
  return util.getSprite().y
}

/** 向き（レポーター） */
export function motion_direction(_args: BlockArgs, util: BlockUtil): number {
  return util.getSprite().direction
}

/** 描画回転角度を設定 */
export function motion_setangle(args: BlockArgs, util: BlockUtil) {
  const angle = Number(args.ANGLE ?? 0)
  const sprite = util.getSprite()
  sprite.angle = angle
  util.getScene()?.setSpriteAngle(sprite.id, angle)
}

/** 描画回転角度（レポーター） */
export function motion_angle(_args: BlockArgs, util: BlockUtil): number {
  return util.getSprite().angle
}

/** もし端に着いたら跳ね返る */
export function motion_ifonedgebounce(_args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  const halfW = STAGE_WIDTH / 2
  const halfH = STAGE_HEIGHT / 2
  let bounced = false

  if (sprite.x > halfW) {
    sprite.x = halfW
    sprite.direction = 180 - sprite.direction
    bounced = true
  } else if (sprite.x < -halfW) {
    sprite.x = -halfW
    sprite.direction = 180 - sprite.direction
    bounced = true
  }

  if (sprite.y > halfH) {
    sprite.y = halfH
    sprite.direction = -sprite.direction
    bounced = true
  } else if (sprite.y < -halfH) {
    sprite.y = -halfH
    sprite.direction = -sprite.direction
    bounced = true
  }

  if (bounced) {
    sprite.direction = ((sprite.direction % 360) + 360) % 360
  }
}

/** _秒で x:_ y:_ へ滑る */
export function motion_glidesecstoxy(args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  const secs = Number(args.SECS) || 1
  const targetX = Number(args.X) || 0
  const targetY = Number(args.Y) || 0
  const frame = util.stackFrame

  if (frame.startTime === undefined) {
    frame.startTime = util.now()
    frame.startX = sprite.x
    frame.startY = sprite.y
    frame.duration = secs * 1000
  }

  const elapsed = util.now() - (frame.startTime as number)
  const t = Math.min(elapsed / (frame.duration as number), 1)

  sprite.x = (frame.startX as number) + (targetX - (frame.startX as number)) * t
  sprite.y = (frame.startY as number) + (targetY - (frame.startY as number)) * t
  syncPositionToPhysics(util)

  if (t < 1) {
    util.yield()
  }
}

/** Tween で x:_ y:_ に移動（Phaser Tween 連携） */
export function motion_tweento(args: BlockArgs, util: BlockUtil) {
  const x = Number(args.X ?? 0)
  const y = Number(args.Y ?? 0)
  const secs = Number(args.SECS ?? 1)
  const sprite = util.getSprite()
  const scene = util.getScene()
  const frame = util.stackFrame

  if (!frame.tweenStarted) {
    frame.tweenStarted = true
    if (scene) {
      frame.tweenPromise = scene.tweenSprite(sprite.id, x, y, secs * 1000)
    } else {
      // シーンなし: glide と同じ動作にフォールバック
      frame.startTime = util.now()
      frame.startX = sprite.x
      frame.startY = sprite.y
      frame.duration = secs * 1000
      frame.targetX = x
      frame.targetY = y
    }
  }

  if (frame.tweenPromise) {
    // Phaser Tween 完了待ち（VM 側の位置はシーンから読み取る）
    util.yield()
    return
  }

  // フォールバック: 手動補間
  const elapsed = util.now() - (frame.startTime as number)
  const t = Math.min(elapsed / (frame.duration as number), 1)
  sprite.x = (frame.startX as number) + ((frame.targetX as number) - (frame.startX as number)) * t
  sprite.y = (frame.startY as number) + ((frame.targetY as number) - (frame.startY as number)) * t
  syncPositionToPhysics(util)
  if (t < 1) util.yield()
}
