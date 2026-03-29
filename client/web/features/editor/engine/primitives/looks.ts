import type { BlockArgs, BlockUtil } from "../types"
import { consoleLog } from "@/features/editor/components/console-panel"

/** _と言う */
export function looks_say(args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  sprite.sayText = String(args.MESSAGE ?? "")
}

/** _と_秒言う */
export function looks_sayforsecs(args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  const secs = Number(args.SECS) || 2
  const frame = util.stackFrame

  if (frame.startTime === undefined) {
    sprite.sayText = String(args.MESSAGE ?? "")
    frame.startTime = util.now()
    frame.duration = secs * 1000
  }

  const elapsed = util.now() - (frame.startTime as number)
  if (elapsed < (frame.duration as number)) {
    util.yield()
  } else {
    sprite.sayText = ""
  }
}

/** _と考える */
export function looks_think(args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  sprite.sayText = String(args.MESSAGE ?? "")
}

/** 表示する */
export function looks_show(_args: BlockArgs, util: BlockUtil) {
  util.getSprite().visible = true
}

/** 隠す */
export function looks_hide(_args: BlockArgs, util: BlockUtil) {
  util.getSprite().visible = false
}

/** 大きさを_にする */
export function looks_setsizeto(args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  sprite.size = Math.max(1, Number(args.SIZE) || 100)
}

/** 大きさを_ずつ変える */
export function looks_changesizeby(args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  sprite.size = Math.max(1, sprite.size + (Number(args.CHANGE) || 0))
}

/** コスチュームを切り替え */
export function looks_switchcostumeto(args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  const costume = String(args.COSTUME ?? "costume1")
  // "costume1" → 0, "costume2" → 1, ...
  const match = costume.match(/(\d+)$/)
  if (match) {
    const idx = parseInt(match[1], 10) - 1
    if (idx >= 0 && idx < sprite.costumeCount) {
      sprite.costumeIndex = idx
    }
  }
}

/** 次のコスチュームに切り替え */
export function looks_nextcostume(_args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  if (sprite.costumeCount > 0) {
    sprite.costumeIndex = (sprite.costumeIndex + 1) % sprite.costumeCount
  }
}

/** 現在のコスチューム番号を返す（1始まり） */
export function looks_costumenumber(_args: BlockArgs, util: BlockUtil): number {
  return util.getSprite().costumeIndex + 1
}

/** HUD テキストを表示 */
export function looks_addtext(args: BlockArgs, util: BlockUtil) {
  const text = String(args.TEXT ?? "")
  const x = Number(args.X ?? 0)
  const y = Number(args.Y ?? 0)
  const sprite = util.getSprite()
  sprite.sayText = text
  sprite.sayTextX = x
  sprite.sayTextY = y
  sprite.sayTimer = null
}

/** HUD テキストを更新 */
export function looks_updatetext(args: BlockArgs, util: BlockUtil) {
  const text = String(args.TEXT ?? "")
  const sprite = util.getSprite()
  sprite.sayText = text
}

/** HUD テキストを削除 */
export function looks_removetext(_args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  sprite.sayText = ""
}

/** 色かぶせ */
export function looks_settint(args: BlockArgs, util: BlockUtil) {
  const colorStr = String(args.COLOR ?? "#ff0000")
  const color = parseInt(colorStr.replace("#", ""), 16) || 0xff0000
  const sprite = util.getSprite()
  sprite.tint = color
  const scene = util.getScene()
  if (scene) scene.setSpriteTint(sprite.id, color)
}

/** 色かぶせ解除 */
export function looks_cleartint(_args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  sprite.tint = null
  const scene = util.getScene()
  if (scene) scene.clearSpriteTint(sprite.id)
}

/** 透明度 (0〜100%) */
export function looks_setopacity(args: BlockArgs, util: BlockUtil) {
  const opacity = Math.max(0, Math.min(100, Number(args.OPACITY ?? 100)))
  const sprite = util.getSprite()
  sprite.opacity = opacity
  const scene = util.getScene()
  if (scene) scene.setSpriteOpacity(sprite.id, opacity / 100)
}

/** 左右反転 */
export function looks_setflipx(args: BlockArgs, util: BlockUtil) {
  const val = args.ENABLED ?? "on"
  const flip = val === true || val === "on" || val === "true"
  const sprite = util.getSprite()
  sprite.flipX = flip
  const scene = util.getScene()
  if (scene) scene.setSpriteFlipX(sprite.id, flip)
}

/** 浮遊テキスト */
export function looks_floatingtext(args: BlockArgs, util: BlockUtil) {
  const text = String(args.TEXT ?? "+10")
  const sprite = util.getSprite()
  const scene = util.getScene()
  if (scene) scene.showFloatingText(text, sprite.x, sprite.y)
}

/** 矩形を描画（Phaser Graphics.fillRect 相当） */
export function graphics_fillrect(args: BlockArgs, util: BlockUtil) {
  const x = Number(args.X ?? 0)
  const y = Number(args.Y ?? 0)
  const w = Number(args.W ?? 100)
  const h = Number(args.H ?? 20)
  const colorStr = String(args.COLOR ?? "#00ff00")
  const color = parseInt(colorStr.replace("#", ""), 16) || 0x00ff00
  const sprite = util.getSprite()
  const scene = util.getScene()
  if (scene) scene.graphicsFillRect(sprite.id, x, y, w, h, color)
}

/** 描画をクリア（Phaser Graphics.clear 相当） */
export function graphics_clear(_args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  const scene = util.getScene()
  if (scene) scene.graphicsClear(sprite.id)
}

/** コンソールに出力 */
export function looks_print(args: BlockArgs, _util: BlockUtil) {
  const message = String(args.MESSAGE ?? "")
  consoleLog(message)
}

// ── Phase 4: Phaser API 拡張 ──────────────────────────────

/** スプライトの原点を設定 (Phaser setOrigin 相当) */
export function looks_setorigin(args: BlockArgs, util: BlockUtil) {
  const x = Number(args.X ?? 0.5)
  const y = Number(args.Y ?? 0.5)
  const scene = util.getScene()
  if (scene) scene.setSpriteOrigin(util.getSprite().id, x, y)
}

/** スクロールファクターを設定 (Phaser setScrollFactor 相当) */
export function looks_setscrollfactor(args: BlockArgs, util: BlockUtil) {
  const x = Number(args.X ?? 1)
  const y = Number(args.Y ?? 1)
  const scene = util.getScene()
  if (scene) scene.setSpriteScrollFactor(util.getSprite().id, x, y)
}
