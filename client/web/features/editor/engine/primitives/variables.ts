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
