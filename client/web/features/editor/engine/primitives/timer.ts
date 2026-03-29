import type { BlockArgs, BlockUtil } from "../types"

/** 周期的にイベントを発火するインターバルを登録 */
export function timer_setinterval(args: BlockArgs, util: BlockUtil) {
  const eventName = String(args.EVENT ?? "")
  const ms = Number(args.MS ?? 1000)
  if (eventName) util.addInterval(eventName, ms)
}

/** インターバルを解除 */
export function timer_clearinterval(args: BlockArgs, util: BlockUtil) {
  const eventName = String(args.EVENT ?? "")
  if (eventName) util.removeInterval(eventName)
}

/** 一定時間後にイベントを発火するタイムアウトを登録 */
export function timer_settimeout(args: BlockArgs, util: BlockUtil) {
  const eventName = String(args.EVENT ?? "")
  const ms = Number(args.MS ?? 1000)
  if (eventName) util.addTimeout(eventName, ms)
}
