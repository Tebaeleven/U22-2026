import type { BlockArgs, BlockUtil } from "../types"

type ForRangeState = {
  name: string
  nextValue: number
  to: number
  step: number
  activeValue: number
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

/** _秒待つ */
export function control_wait(args: BlockArgs, util: BlockUtil) {
  const secs = Number(args.DURATION) || 1
  const frame = util.stackFrame

  if (frame.startTime === undefined) {
    frame.startTime = util.now()
    frame.duration = secs * 1000
  }

  const elapsed = util.now() - (frame.startTime as number)
  if (elapsed < (frame.duration as number)) {
    util.yield()
  }
}

/** _回繰り返す — Scratch と同様にイテレーション間で yield */
export function control_repeat(args: BlockArgs, util: BlockUtil) {
  const times = Math.round(Number(args.TIMES) || 0)
  const frame = util.stackFrame

  if (frame.loopCounter === undefined) {
    frame.loopCounter = times
  }

  frame.loopCounter = (frame.loopCounter as number) - 1
  if ((frame.loopCounter as number) >= 0) {
    // true = isLoop: body 実行後に再びこのブロックに戻る
    // body 実行後に1フレーム yield するため、アニメーションが見える
    util.startBranch(0, true)
  }
}

/** for _ = _ to _ */
export function control_for_range(args: BlockArgs, util: BlockUtil) {
  const frame = util.stackFrame as typeof util.stackFrame & {
    forRangeState?: ForRangeState
  }

  if (frame.forRangeState === undefined) {
    const from = toFiniteNumber(args.FROM)
    const to = toFiniteNumber(args.TO)
    frame.forRangeState = {
      name: String(args.NAME ?? "i"),
      nextValue: from,
      to,
      step: from <= to ? 1 : -1,
      activeValue: from,
    }
  }

  const state = frame.forRangeState
  const current = state.nextValue
  const done =
    state.step > 0 ? current > state.to : current < state.to

  if (done) {
    return
  }

  state.activeValue = current
  state.nextValue = current + state.step
  util.startBranch(0, true)
}

/** for の現在のループ変数 */
export function control_loop_variable(args: BlockArgs, util: BlockUtil): unknown {
  return util.getLoopVariable(String(args.NAME ?? ""))
}

/** ずっと — 毎フレーム body を1回実行 */
export function control_forever(_args: BlockArgs, util: BlockUtil) {
  util.startBranch(0, true)
}

/** もし_なら */
export function control_if(args: BlockArgs, util: BlockUtil) {
  const condition = Boolean(args.CONDITION)
  if (condition) {
    util.startBranch(0, false)
  }
}

/** もし_なら / でなければ */
export function control_if_else(args: BlockArgs, util: BlockUtil) {
  const condition = Boolean(args.CONDITION)
  if (condition) {
    util.startBranch(0, false)
  } else {
    util.startBranch(1, false)
  }
}

/** _まで繰り返す */
export function control_repeat_until(args: BlockArgs, util: BlockUtil) {
  const condition = Boolean(args.CONDITION)
  if (!condition) {
    util.startBranch(0, true)
  }
}

/** _まで待つ */
export function control_wait_until(args: BlockArgs, util: BlockUtil) {
  const condition = Boolean(args.CONDITION)
  if (!condition) {
    util.yield()
  }
}

/** すべてを止める */
export function control_stop(_args: BlockArgs, _util: BlockUtil) {
  // Runtime が stop() を呼ぶ
}

/** ゲームをリスタート */
export function control_restart(_args: BlockArgs, util: BlockUtil) {
  util.restartGame()
}

/** ループを抜ける */
export function control_break(_args: BlockArgs, util: BlockUtil) {
  util.breakLoop()
}

/** 次の繰り返しへスキップ */
export function control_continue(_args: BlockArgs, util: BlockUtil) {
  util.continueLoop()
}

type ForEachState = {
  name: string
  list: unknown[]
  index: number
  activeValue: unknown
}

/** リストの各要素について繰り返す */
export function control_for_each(args: BlockArgs, util: BlockUtil) {
  const frame = util.stackFrame as typeof util.stackFrame & {
    forEachState?: ForEachState
  }

  if (frame.forEachState === undefined) {
    const listName = String(args.LIST ?? "")
    const rawList = util.getVariable(listName)
    const list = Array.isArray(rawList) ? rawList : []
    frame.forEachState = {
      name: String(args.NAME ?? "item"),
      list,
      index: 0,
      activeValue: list[0],
    }
  }

  const state = frame.forEachState
  if (state.index >= state.list.length) return

  state.activeValue = state.list[state.index]
  state.index += 1
  util.startBranch(0, true)
}

/** for-each のループ変数 */
export function control_foreach_variable(args: BlockArgs, util: BlockUtil): unknown {
  return util.getLoopVariable(String(args.NAME ?? ""))
}

/** body を新スレッドとして並行実行 */
export function control_spawn(_args: BlockArgs, util: BlockUtil) {
  util.spawnThread()
}

/** batch: Observer 通知を遅延して一括実行する C ブロック */
export function control_batch(_args: BlockArgs, util: BlockUtil) {
  const frame = util.stackFrame
  if (!frame.batchStarted) {
    frame.batchStarted = true
    util.beginBatch()
    util.startBranch(0, false)
  } else {
    util.endBatch()
  }
}
