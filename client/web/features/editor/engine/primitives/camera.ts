import type { BlockArgs, BlockUtil } from "../types"

/** カメラをこのスプライトに追従させる */
export function camera_follow(_args: BlockArgs, util: BlockUtil) {
  const sprite = util.getSprite()
  util.getScene()?.cameraFollow(sprite.id)
}

/** カメラ追従を解除 */
export function camera_stopfollow(_args: BlockArgs, util: BlockUtil) {
  util.getScene()?.cameraStopFollow()
}

/** カメラシェイク */
export function camera_shake(args: BlockArgs, util: BlockUtil) {
  const duration = Number(args.DURATION ?? 200)
  const intensity = Number(args.INTENSITY ?? 0.01)
  util.getScene()?.cameraShake(duration, intensity)
}

/** カメラズーム */
export function camera_zoom(args: BlockArgs, util: BlockUtil) {
  const scale = Number(args.SCALE ?? 1)
  util.getScene()?.cameraZoom(scale)
}

/** カメラフェードアウト */
export function camera_fade(args: BlockArgs, util: BlockUtil) {
  const duration = Number(args.DURATION ?? 1000)
  const scene = util.getScene()
  const frame = util.stackFrame

  if (!frame.fadeStarted) {
    frame.fadeStarted = true
    if (scene) {
      scene.cameraFade(duration).then(() => {
        frame.fadeDone = true
      })
    } else {
      frame.fadeDone = true
    }
  }

  if (!frame.fadeDone) {
    util.yield()
  }
}
