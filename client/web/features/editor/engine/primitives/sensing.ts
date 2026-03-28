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
    // マウスポインタとの矩形判定（コスチュームサイズを考慮）
    const mx = util.getMouseX()
    const my = util.getMouseY()
    const scene = util.getScene()
    if (scene) {
      // Phaser ボディがあればそちらで判定
      const mouseSprites = util.getAllSprites()
      const self = mouseSprites.find((s) => s.id === sprite.id)
      if (self) {
        const halfW = 24 * (sprite.size / 100)
        const halfH = 24 * (sprite.size / 100)
        return Math.abs(sprite.x - mx) < halfW && Math.abs(sprite.y - my) < halfH
      }
    }
    const dx = sprite.x - mx
    const dy = sprite.y - my
    const threshold = (sprite.size / 100) * 24
    return dx * dx + dy * dy < threshold * threshold
  }

  // スプライト名で検索して Phaser の overlap 判定
  const scene = util.getScene()
  if (!scene) return false

  const allSprites = util.getAllSprites()
  const targetSprite = allSprites.find((s) => s.name === target)
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
let timerStart = Date.now()
export function sensing_timer(_args: BlockArgs, _util: BlockUtil): number {
  return (Date.now() - timerStart) / 1000
}

/** タイマーをリセット */
export function sensing_resettimer(_args: BlockArgs, _util: BlockUtil) {
  timerStart = Date.now()
}
