import type { BlockArgs, BlockUtil } from "../types"

/** _と言う */
export function looks_say(args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  sprite.sayText = String(args.MESSAGE ?? "")
}

/** _と_秒言う */
export function looks_sayforsecs(args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  const secs = Number(args.SECS) || 2
  const frame = util.stackFrame

  if (frame.startTime === undefined) {
    sprite.sayText = String(args.MESSAGE ?? "")
    frame.startTime = Date.now()
    frame.duration = secs * 1000
  }

  const elapsed = Date.now() - (frame.startTime as number)
  if (elapsed < (frame.duration as number)) {
    util.yield()
  } else {
    sprite.sayText = ""
  }
}

/** _と考える */
export function looks_think(args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  sprite.sayText = String(args.MESSAGE ?? "")
}

/** 表示する */
export function looks_show(_args: BlockArgs, util: BlockUtil) {
  util.getSprite().visible = true
}

/** 隠す */
export function looks_hide(_args: BlockArgs, util: BlockUtil) {
  util.getSprite().visible = false
}

/** 大きさを_にする */
export function looks_setsizeto(args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  sprite.size = Math.max(1, Number(args.SIZE) || 100)
}

/** 大きさを_ずつ変える */
export function looks_changesizeby(args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  sprite.size = Math.max(1, sprite.size + (Number(args.CHANGE) || 0))
}
