import type { BlockArgs, BlockUtil } from "../types"

// --- 変数監視 ---

/** 変数が変わったとき — Hat ブロック（Runtime が直接スレッドを生成する） */
export function observer_whenvarchanges(_args: BlockArgs, _util: BlockUtil) {
  // Hat ブロック — Runtime.onVariableChanged が Thread を spawn
}

/** 新しい値 (reporter) — Observer コンテキストから取得 */
export function observer_newvalue(_args: BlockArgs, util: BlockUtil): unknown {
  return util.getContext("newValue")
}

/** 前の値 (reporter) — Observer コンテキストから取得 */
export function observer_oldvalue(_args: BlockArgs, util: BlockUtil): unknown {
  return util.getContext("oldValue")
}

/** 変数の監視を停止 */
export function observer_stopwatching(args: BlockArgs, util: BlockUtil) {
  util.disableWatcher(String(args.VARIABLE))
}

// --- 値付きイベント ---

/** イベントを送る */
export function observer_sendevent(args: BlockArgs, util: BlockUtil) {
  const name = String(args.EVENT_NAME)
  const data = args.DATA
  util.sendEvent(name, data)
}

/** イベントを受け取ったとき — Hat ブロック（Runtime が直接スレッドを生成する） */
export function observer_wheneventreceived(_args: BlockArgs, _util: BlockUtil) {
  // Hat ブロック — Runtime.emitEvent が Thread を spawn
}

/** イベントデータ (reporter) — Observer コンテキストから取得 */
export function observer_eventdata(_args: BlockArgs, util: BlockUtil): unknown {
  return util.getContext("eventData")
}
