import type { BlockArgs, BlockUtil } from "../types"

/** 自分自身のクローンを作る */
export function clone_create(args: BlockArgs, util: BlockUtil) {
  const target = String(args.TARGET ?? "myself")
  if (target === "myself") {
    util.createClone()
  } else {
    // スプライト名から ID を探す
    const all = util.getAllSprites()
    const found = all.find((s) => s.name === target)
    if (found) util.createClone(found.id)
  }
}

/** クローンされたとき（ハットブロック — スタブ） */
export function clone_whencloned() {
  // Runtime が直接スレッドを生成するため、ここでは何もしない
}

/** このクローンを削除する */
export function clone_delete(_args: BlockArgs, util: BlockUtil) {
  util.deleteClone()
}
