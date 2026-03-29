import type { BlockArgs, BlockUtil } from "../types"

/** ID付きテキストを任意位置に追加 */
export function text_addat(args: BlockArgs, util: BlockUtil) {
  const textId = String(args.ID ?? "")
  const text = String(args.TEXT ?? "")
  const x = Number(args.X ?? 0)
  const y = Number(args.Y ?? 0)
  const size = Number(args.SIZE ?? 24)
  const color = String(args.COLOR ?? "#ffffff")
  const sprite = util.getSprite()
  util.getScene()?.addTextAt(sprite.id, textId, text, x, y, size, color)
}

/** ID付きテキストの内容を更新 */
export function text_updateat(args: BlockArgs, util: BlockUtil) {
  const textId = String(args.ID ?? "")
  const text = String(args.TEXT ?? "")
  const sprite = util.getSprite()
  util.getScene()?.updateTextAt(sprite.id, textId, text)
}

/** ID付きテキストを削除 */
export function text_removeat(args: BlockArgs, util: BlockUtil) {
  const textId = String(args.ID ?? "")
  const sprite = util.getSprite()
  util.getScene()?.removeTextAt(sprite.id, textId)
}
