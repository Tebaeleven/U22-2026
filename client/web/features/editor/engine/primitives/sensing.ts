import type { BlockArgs, BlockUtil } from "../types"
import { STAGE_WIDTH, STAGE_HEIGHT } from "../types"

/** マウスの x 座標 */
export function sensing_mousex(_args: BlockArgs, util: BlockUtil): number {
  return util.getMouseX()
}

/** マウスの y 座標 */
export function sensing_mousey(_args: BlockArgs, util: BlockUtil): number {
  return util.getMouseY()
}

/** _に触れた */
export function sensing_touchingobject(
  args: BlockArgs,
  util: BlockUtil
): boolean {
  const target = String(args.TOUCHINGOBJECTMENU ?? "")
  const sprite = util.getSprite()

  if (target === "edge") {
    const halfW = STAGE_WIDTH / 2
    const halfH = STAGE_HEIGHT / 2
    return (
      sprite.x >= halfW || sprite.x <= -halfW ||
      sprite.y >= halfH || sprite.y <= -halfH
    )
  }

  if (target === "mouse-pointer") {
    const mx = util.getMouseX()
    const my = util.getMouseY()
    const halfW = 24 * (sprite.size / 100)
    const halfH = 24 * (sprite.size / 100)
    return Math.abs(sprite.x - mx) < halfW && Math.abs(sprite.y - my) < halfH
  }

  // スプライト名で検索して Phaser の overlap 判定
  const scene = util.getScene()
  if (!scene) return false

  const targetSprite = util.getSpriteByName(target)
  if (!targetSprite) return false

  return scene.checkOverlap(sprite.id, targetSprite.id)
}

/** _キーが押された */
export function sensing_keypressed(
  args: BlockArgs,
  util: BlockUtil
): boolean {
  const key = String(args.KEY_OPTION ?? "space")
  return util.isKeyPressed(key)
}

/** タイマー（Runtime 開始からの秒数） */
let timerStart = 0
export function sensing_timer(_args: BlockArgs, util: BlockUtil): number {
  return (util.now() - timerStart) / 1000
}

/** タイマーをリセット */
export function sensing_resettimer(_args: BlockArgs, util: BlockUtil) {
  timerStart = util.now()
}

// ── Phase 3: 入力拡張 ──────────────────────────────────

/** マウスボタンが押されているか */
export function sensing_mousedown(_args: BlockArgs, util: BlockUtil): boolean {
  const scene = util.getScene()
  if (!scene) return false
  return scene.isMouseDown()
}

/** マウスホイールのデルタ値 */
export function sensing_mousewheel(_args: BlockArgs, util: BlockUtil): number {
  const scene = util.getScene()
  if (!scene) return 0
  return scene.getMouseWheelDelta()
}

/** キーが今押された瞬間かどうか（前フレームで押されていなかった場合のみ true） */
const prevKeyState = new Map<string, boolean>()
export function sensing_keyjustdown(args: BlockArgs, util: BlockUtil): boolean {
  const key = String(args.KEY_OPTION ?? "space")
  const isDown = util.isKeyPressed(key)
  const wasDown = prevKeyState.get(key) ?? false
  prevKeyState.set(key, isDown)
  return isDown && !wasDown
}

/** スプライトのドラッグを有効化 */
export function sensing_enabledrag(_args: BlockArgs, util: BlockUtil) {
  const scene = util.getScene()
  if (scene) scene.enableSpriteDrag(util.getSprite().id)
}
