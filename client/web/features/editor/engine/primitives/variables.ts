import type { BlockArgs, BlockUtil } from "../types"

/** 変数の値を取得 (reporter) */
export function data_variable(args: BlockArgs, util: BlockUtil): unknown {
  return util.getVariable(String(args.VARIABLE))
}

/** 変数に値を設定 */
export function data_setvariableto(args: BlockArgs, util: BlockUtil) {
  util.setVariable(String(args.VARIABLE), args.VALUE)
}

/** 変数の値を増減 */
export function data_changevariableby(args: BlockArgs, util: BlockUtil) {
  const name = String(args.VARIABLE)
  const current = Number(util.getVariable(name)) || 0
  util.setVariable(name, current + Number(args.VALUE))
}

/** 変数モニターを表示（未実装スタブ） */
export function data_showvariable(_args: BlockArgs, _util: BlockUtil) {
  // TODO: 変数モニター表示
}

/** 変数モニターを非表示（未実装スタブ） */
export function data_hidevariable(_args: BlockArgs, _util: BlockUtil) {
  // TODO: 変数モニター非表示
}

// ─── リスト操作 ────────────────────────────────────

function getList(util: BlockUtil, name: string): unknown[] {
  const list = util.getVariable(name)
  if (Array.isArray(list)) return list
  const newList: unknown[] = []
  util.setVariable(name, newList)
  return newList
}

/** リストに追加 */
export function data_addtolist(args: BlockArgs, util: BlockUtil) {
  const list = getList(util, String(args.LIST))
  list.push(args.ITEM ?? "")
  util.setVariable(String(args.LIST), [...list])
}

/** リストの_番目を削除 */
export function data_deleteoflist(args: BlockArgs, util: BlockUtil) {
  const list = getList(util, String(args.LIST))
  const index = Number(args.INDEX) - 1
  if (index >= 0 && index < list.length) {
    list.splice(index, 1)
    util.setVariable(String(args.LIST), [...list])
  }
}

/** リストの_番目 */
export function data_itemoflist(args: BlockArgs, util: BlockUtil): unknown {
  const list = getList(util, String(args.LIST))
  const index = Number(args.INDEX) - 1
  if (index >= 0 && index < list.length) return list[index]
  return ""
}

/** リストの長さ */
export function data_lengthoflist(args: BlockArgs, util: BlockUtil): number {
  const list = getList(util, String(args.LIST))
  return list.length
}
