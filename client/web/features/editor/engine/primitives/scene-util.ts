import type { BlockArgs, BlockUtil } from "../types"

/** シーンを切り替える */
export function scene_switch(args: BlockArgs, util: BlockUtil) {
  const sceneName = String(args.SCENE ?? "")
  util.switchScene(sceneName)
}

/** 現在のシーン名を取得 */
export function scene_current(_args: BlockArgs, util: BlockUtil): string {
  return util.getCurrentScene()
}

/** ゲーム速度（タイムスケール）を設定 */
export function scene_timescale(args: BlockArgs, util: BlockUtil) {
  const scale = Math.max(0, Number(args.SCALE ?? 1))
  util.setTimeScale(scale)
}

/** キーに値をセーブ（localStorage） */
export function scene_save(args: BlockArgs, _util: BlockUtil) {
  const key = String(args.KEY ?? "")
  const value = args.VALUE ?? ""
  try {
    localStorage.setItem(`vpl_save:${key}`, JSON.stringify(value))
  } catch {
    // ストレージ容量超過時は無視
  }
}

/** キーから値をロード（localStorage） */
export function scene_load(args: BlockArgs, _util: BlockUtil): unknown {
  const key = String(args.KEY ?? "")
  try {
    const raw = localStorage.getItem(`vpl_save:${key}`)
    if (raw === null) return ""
    return JSON.parse(raw)
  } catch {
    return ""
  }
}

/** 背景色を設定 (Phaser cameras.main.setBackgroundColor 相当) */
export function scene_setbackground(args: BlockArgs, util: BlockUtil) {
  const color = String(args.COLOR ?? "#000000")
  const scene = util.getScene()
  if (scene) scene.setBackgroundColor(color)
}
