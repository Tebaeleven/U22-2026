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
    // マウスポインタとの距離で簡易判定
    const mx = util.getMouseX()
    const my = util.getMouseY()
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
