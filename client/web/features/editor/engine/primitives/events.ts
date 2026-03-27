import type { BlockArgs, BlockUtil } from "../types"

// Hat ブロック（イベントトリガー）はランタイムが直接処理するため、
// ここではスタブとして定義。実行時は自動的にスキップされる。

/** 🏴が押されたとき */
export function event_whenflagclicked(_args: BlockArgs, _util: BlockUtil) {
  // Hat ブロック — Runtime が直接スレッドを生成する
}

/** _キーが押されたとき */
export function event_whenkeypressed(_args: BlockArgs, _util: BlockUtil) {
  // Hat ブロック — Runtime が直接スレッドを生成する
}

// Broadcast は Observer の Send event / When event で代替
