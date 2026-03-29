import type { BlockArgs, BlockUtil } from "../types"

/** 状態を設定 */
export function state_set(args: BlockArgs, util: BlockUtil) {
  const state = String(args.STATE ?? "idle")
  const sprite = util.getSprite()
  const prev = sprite.currentState
  sprite.currentState = state
  if (prev !== state) {
    util.sendEvent(`__state_changed:${sprite.id}`, state)
  }
}

/** 現在の状態を取得 */
export function state_get(_args: BlockArgs, util: BlockUtil): string {
  return util.getSprite().currentState
}

/** 状態が一致するか判定 */
export function state_is(args: BlockArgs, util: BlockUtil): boolean {
  return util.getSprite().currentState === String(args.STATE ?? "")
}

/** 状態が変わったとき（Hat ブロック — Runtime が状態変更イベントで起動） */
export function state_when(_args: BlockArgs, _util: BlockUtil) {
  // Hat ブロック — Runtime が __state_changed イベント経由でスレッドを生成する
}
