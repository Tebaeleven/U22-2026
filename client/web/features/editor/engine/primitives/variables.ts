import type { BlockArgs, BlockUtil } from "../types"

/** 変数の値を取得 (reporter) */
export function data_variable(args: BlockArgs, util: BlockUtil): unknown {
  return util.getVariable(String(args.VARIABLE))
}

/** 変数に値を設定 */
export function data_setvariableto(args: BlockArgs, util: BlockUtil) {
  util.setVariable(String(args.VARIABLE), args.VALUE)
}

/** Live 変数を設定: 初期値を計算し、依存変数が変わったら自動再計算する
 *  ※ 式ブロックの登録は Sequencer が data_setlivevariable を検出して行う */
export function data_setlivevariable(args: BlockArgs, util: BlockUtil) {
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

/** リストに挿入 */
export function data_insertatlist(args: BlockArgs, util: BlockUtil) {
  const list = getList(util, String(args.LIST))
  const index = Number(args.INDEX) - 1
  if (index >= 0 && index <= list.length) {
    list.splice(index, 0, args.ITEM ?? "")
    util.setVariable(String(args.LIST), [...list])
  }
}

/** リストの要素を置換 */
export function data_replaceitemoflist(args: BlockArgs, util: BlockUtil) {
  const list = getList(util, String(args.LIST))
  const index = Number(args.INDEX) - 1
  if (index >= 0 && index < list.length) {
    list[index] = args.VALUE ?? ""
    util.setVariable(String(args.LIST), [...list])
  }
}

/** リストに含まれるか */
export function data_listcontainsitem(args: BlockArgs, util: BlockUtil): boolean {
  const list = getList(util, String(args.LIST))
  return list.includes(args.ITEM ?? "")
}

// ─── 辞書操作 ────────────────────────────────────

function getDict(util: BlockUtil, name: string): Record<string, unknown> {
  const dict = util.getVariable(name)
  if (dict && typeof dict === "object" && !Array.isArray(dict)) return dict as Record<string, unknown>
  const newDict: Record<string, unknown> = {}
  util.setVariable(name, newDict)
  return newDict
}

/** 辞書にキーを設定 */
export function data_dictset(args: BlockArgs, util: BlockUtil) {
  const dict = getDict(util, String(args.DICT))
  dict[String(args.KEY ?? "")] = args.VALUE ?? ""
  util.setVariable(String(args.DICT), { ...dict })
}

/** 辞書の値を取得 */
export function data_dictget(args: BlockArgs, util: BlockUtil): unknown {
  const dict = getDict(util, String(args.DICT))
  return dict[String(args.KEY ?? "")] ?? ""
}

/** 辞書のキーを削除 */
export function data_dictdelete(args: BlockArgs, util: BlockUtil) {
  const dict = getDict(util, String(args.DICT))
  delete dict[String(args.KEY ?? "")]
  util.setVariable(String(args.DICT), { ...dict })
}

/** 辞書にキーが存在するか */
export function data_dicthas(args: BlockArgs, util: BlockUtil): boolean {
  const dict = getDict(util, String(args.DICT))
  return String(args.KEY ?? "") in dict
}

/** 辞書のキー一覧 */
export function data_dictkeys(args: BlockArgs, util: BlockUtil): string[] {
  const dict = getDict(util, String(args.DICT))
  return Object.keys(dict)
}

/** 辞書の長さ */
export function data_dictlength(args: BlockArgs, util: BlockUtil): number {
  const dict = getDict(util, String(args.DICT))
  return Object.keys(dict).length
}
