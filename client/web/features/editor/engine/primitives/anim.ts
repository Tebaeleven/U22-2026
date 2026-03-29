import type { BlockArgs, BlockUtil, SpriteRuntime } from "../types"

interface AnimDef {
  startFrame: number
  endFrame: number
  rate: number
  loop: boolean
}

interface AnimState {
  name: string
  frame: number
  rate: number
  loop: boolean
  playing: boolean
  lastFrameTime: number
}

// SpriteRuntime を拡張するためのメタデータストア
const spriteAnimDefs = new Map<string, Record<string, AnimDef>>()
const spriteAnimStates = new Map<string, AnimState>()
const spriteAnimCompleteEvents = new Map<string, string>()

/** フレームベースアニメーションを定義 */
export function anim_create(args: BlockArgs, util: BlockUtil) {
  const name = String(args.NAME ?? "walk")
  const startFrame = Number(args.START ?? 0)
  const endFrame = Number(args.END ?? 3)
  const rate = Number(args.RATE ?? 10)
  const val = args.LOOP ?? "on"
  const loop = val === true || val === "on" || val === "true"
  const sprite = util.getSprite()

  let anims = spriteAnimDefs.get(sprite.id)
  if (!anims) {
    anims = {}
    spriteAnimDefs.set(sprite.id, anims)
  }
  anims[name] = { startFrame, endFrame, rate, loop }
}

/** アニメーションを再生（コスチュームの自動切り替え） */
export function anim_play(args: BlockArgs, util: BlockUtil) {
  const name = String(args.NAME ?? "walk")
  const sprite = util.getSprite()
  const anims = spriteAnimDefs.get(sprite.id)
  if (!anims?.[name]) return

  const anim = anims[name]
  spriteAnimStates.set(sprite.id, {
    name,
    frame: anim.startFrame,
    rate: anim.rate,
    loop: anim.loop,
    playing: true,
    lastFrameTime: util.now(),
  })

  sprite.costumeIndex = anim.startFrame
}

/** アニメーションを停止 */
export function anim_stop(_args: BlockArgs, util: BlockUtil) {
  const state = spriteAnimStates.get(util.getSprite().id)
  if (state) state.playing = false
}

/** アニメーション完了イベントを登録 */
export function anim_oncomplete(args: BlockArgs, util: BlockUtil) {
  const eventName = String(args.EVENT ?? "anim_done")
  spriteAnimCompleteEvents.set(util.getSprite().id, eventName)
}

/**
 * アニメーションのフレーム更新（Runtime の tick から呼ばれる想定）
 */
export function tickAnimations(sprites: SpriteRuntime[], now: number, sendEvent: (name: string, data: unknown) => void) {
  for (const sprite of sprites) {
    const state = spriteAnimStates.get(sprite.id)
    if (!state?.playing) continue

    const anims = spriteAnimDefs.get(sprite.id)
    if (!anims?.[state.name]) continue

    const anim = anims[state.name]
    const interval = 1000 / state.rate
    if (now - state.lastFrameTime >= interval) {
      state.frame++
      state.lastFrameTime = now

      if (state.frame > anim.endFrame) {
        if (anim.loop) {
          state.frame = anim.startFrame
        } else {
          state.frame = anim.endFrame
          state.playing = false
          const completeEvent = spriteAnimCompleteEvents.get(sprite.id)
          if (completeEvent) {
            sendEvent(completeEvent, state.name)
          }
        }
      }

      sprite.costumeIndex = state.frame
    }
  }
}
