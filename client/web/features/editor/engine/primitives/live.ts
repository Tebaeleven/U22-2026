import type { BlockArgs, BlockUtil } from "../types"

// --- Live Variable ハットブロック ---

/** when: Live 変数が変わるたびに実行 — Hat ブロック（Runtime が直接スレッドを生成する） */
export function live_when(_args: BlockArgs, _util: BlockUtil) {
  // Hat ブロック — Runtime.onVariableChanged が live_when を検出してスレッドを spawn
}

/** upon: Live 変数の条件成立で一度だけ実行 — Hat ブロック
 *  実行後に自動で監視を停止する */
export function live_upon(_args: BlockArgs, util: BlockUtil) {
  // Hat ブロック — Runtime.onVariableChanged が live_upon を検出してスレッドを spawn
  // upon は1回発火したら自動停止（Runtime 側で処理）
}
