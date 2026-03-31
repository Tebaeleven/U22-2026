import type { BlockArgs, BlockUtil } from "../types"

/** 他スプライトのプロパティを取得 */
export function sprite_getprop(args: BlockArgs, util: BlockUtil): unknown {
  const name = String(args.SPRITE ?? "")
  const prop = String(args.PROP ?? "x")
  const target = util.getSpriteByName(name)
  if (!target) return ""
  switch (prop) {
    case "x": return target.x
    case "y": return target.y
    case "direction": return target.direction
    case "size": return target.size
    case "state": return target.currentState
    case "costume #": return target.costumeIndex
    case "layer": return target.layer
    default: return ""
  }
}

/** 他スプライトの変数を取得 */
export function sprite_getvariable(args: BlockArgs, util: BlockUtil): unknown {
  const spriteName = String(args.SPRITE ?? "")
  const varName = String(args.VARIABLE ?? "")
  return util.getSpriteVariable(spriteName, varName)
}

/** 他スプライトの変数に値を設定 */
export function sprite_setvariableto(args: BlockArgs, util: BlockUtil) {
  const spriteName = String(args.SPRITE ?? "")
  const varName = String(args.VARIABLE ?? "")
  util.setSpriteVariable(spriteName, varName, args.VALUE)
}

/** 他スプライトの変数の値を増減 */
export function sprite_changevariableby(args: BlockArgs, util: BlockUtil) {
  const spriteName = String(args.SPRITE ?? "")
  const varName = String(args.VARIABLE ?? "")
  const current = Number(util.getSpriteVariable(spriteName, varName)) || 0
  util.setSpriteVariable(spriteName, varName, current + Number(args.VALUE))
}

/** レイヤーを設定 */
export function sprite_setlayer(args: BlockArgs, util: BlockUtil) {
  util.getSprite().layer = Number(args.LAYER ?? 0)
}

/** レイヤーを取得 */
export function sprite_getlayer(_args: BlockArgs, util: BlockUtil): number {
  return util.getSprite().layer
}

/** タグを追加 */
export function sprite_addtag(args: BlockArgs, util: BlockUtil) {
  util.getSprite().tags.add(String(args.TAG ?? ""))
}

/** タグを削除 */
export function sprite_removetag(args: BlockArgs, util: BlockUtil) {
  util.getSprite().tags.delete(String(args.TAG ?? ""))
}

/** タグを持っているか */
export function sprite_hastag(args: BlockArgs, util: BlockUtil): boolean {
  return util.getSprite().tags.has(String(args.TAG ?? ""))
}

type ForTagState = {
  sprites: { id: string; name: string }[]
  index: number
}

/** タグを持つスプライトについて繰り返す */
export function sprite_withtagdo(args: BlockArgs, util: BlockUtil) {
  const frame = util.stackFrame as typeof util.stackFrame & {
    forTagState?: ForTagState
  }

  if (frame.forTagState === undefined) {
    const tag = String(args.TAG ?? "")
    const sprites = util.getAllSprites()
      .filter((s) => s.tags.has(tag))
      .map((s) => ({ id: s.id, name: s.name }))
    frame.forTagState = { sprites, index: 0 }
  }

  const state = frame.forTagState
  if (state.index >= state.sprites.length) return

  state.index += 1
  util.startBranch(0, true)
}

/** タグループの現在のスプライト名 */
export function sprite_taglooptarget(_args: BlockArgs, util: BlockUtil): string {
  const frame = util.stackFrame as typeof util.stackFrame & {
    forTagState?: ForTagState
  }
  if (!frame.forTagState) return ""
  const idx = Math.max(0, frame.forTagState.index - 1)
  return frame.forTagState.sprites[idx]?.name ?? ""
}
