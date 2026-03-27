import type { BlockArgs, BlockUtil } from "../types"
import { STAGE_WIDTH, STAGE_HEIGHT } from "../types"

/** 10歩動かす */
export function motion_movesteps(args: BlockArgs, util: BlockUtil) {
  const steps = Number(args.STEPS) || 0
  const sprite = util.getSprite()
  const radians = ((90 - sprite.direction) * Math.PI) / 180
  sprite.x += steps * Math.cos(radians)
  sprite.y += steps * Math.sin(radians)
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
}

/** x座標を_ずつ変える */
export function motion_changexby(args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  sprite.x += Number(args.DX) || 0
}

/** y座標を_ずつ変える */
export function motion_changeyby(args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  sprite.y += Number(args.DY) || 0
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
    frame.startTime = Date.now()
    frame.startX = sprite.x
    frame.startY = sprite.y
    frame.duration = secs * 1000
  }

  const elapsed = Date.now() - (frame.startTime as number)
  const t = Math.min(elapsed / (frame.duration as number), 1)

  sprite.x = (frame.startX as number) + (targetX - (frame.startX as number)) * t
  sprite.y = (frame.startY as number) + (targetY - (frame.startY as number)) * t

  if (t < 1) {
    util.yield()
  }
}
