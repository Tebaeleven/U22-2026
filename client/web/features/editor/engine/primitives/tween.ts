import type { BlockArgs, BlockUtil } from "../types"

/** スケールを Tween でアニメーション */
export function tween_scale(args: BlockArgs, util: BlockUtil) {
  const scale = Number(args.SCALE ?? 1)
  const secs = Number(args.SECS ?? 1)
  const sprite = util.getSprite()
  const scene = util.getScene()
  const frame = util.stackFrame

  if (!frame.tweenStarted) {
    frame.tweenStarted = true
    if (scene) {
      scene.tweenSpriteScale(sprite.id, scale, secs * 1000, sprite).then(() => {
        frame.tweenDone = true
      })
    } else {
      sprite.size = Math.max(1, scale * 100)
      frame.tweenDone = true
    }
  }

  if (!frame.tweenDone) {
    util.yield()
  }
}

/** 透明度を Tween でアニメーション */
export function tween_alpha(args: BlockArgs, util: BlockUtil) {
  const alpha = Number(args.ALPHA ?? 1)
  const secs = Number(args.SECS ?? 1)
  const sprite = util.getSprite()
  const scene = util.getScene()
  const frame = util.stackFrame

  if (!frame.tweenStarted) {
    frame.tweenStarted = true
    if (scene) {
      scene.tweenSpriteAlpha(sprite.id, alpha, secs * 1000).then(() => {
        frame.tweenDone = true
      })
    } else {
      frame.tweenDone = true
    }
  }

  if (!frame.tweenDone) {
    util.yield()
  }
}

/** 角度を Tween でアニメーション */
export function tween_angle(args: BlockArgs, util: BlockUtil) {
  const angle = Number(args.ANGLE ?? 0)
  const secs = Number(args.SECS ?? 1)
  const sprite = util.getSprite()
  const scene = util.getScene()
  const frame = util.stackFrame

  if (!frame.tweenStarted) {
    frame.tweenStarted = true
    if (scene) {
      scene.tweenSpriteAngle(sprite.id, angle, secs * 1000).then(() => {
        frame.tweenDone = true
      })
    } else {
      frame.tweenDone = true
    }
  }

  if (!frame.tweenDone) {
    util.yield()
  }
}

// ─── イージング付き Tween ───

/** イージング付き移動 Tween */
export function motion_tweento_ease(args: BlockArgs, util: BlockUtil) {
  const x = Number(args.X ?? 0)
  const y = Number(args.Y ?? 0)
  const secs = Number(args.SECS ?? 1)
  const _ease = String(args.EASE ?? "linear")
  const sprite = util.getSprite()
  const scene = util.getScene()
  const frame = util.stackFrame

  if (!frame.tweenStarted) {
    frame.tweenStarted = true
    if (scene) {
      scene.tweenSprite(sprite.id, x, y, secs * 1000).then(() => {
        frame.tweenDone = true
      })
    } else {
      frame.tweenDone = true
    }
  }

  if (!frame.tweenDone) {
    util.yield()
  }
}

/** イージング付きスケール Tween */
export function tween_scale_ease(args: BlockArgs, util: BlockUtil) {
  const scale = Number(args.SCALE ?? 1)
  const secs = Number(args.SECS ?? 1)
  const _ease = String(args.EASE ?? "linear")
  const sprite = util.getSprite()
  const scene = util.getScene()
  const frame = util.stackFrame

  if (!frame.tweenStarted) {
    frame.tweenStarted = true
    if (scene) {
      scene.tweenSpriteScale(sprite.id, scale, secs * 1000, sprite).then(() => {
        frame.tweenDone = true
      })
    } else {
      sprite.size = Math.max(1, scale * 100)
      frame.tweenDone = true
    }
  }

  if (!frame.tweenDone) {
    util.yield()
  }
}

/** イージング付き透明度 Tween */
export function tween_alpha_ease(args: BlockArgs, util: BlockUtil) {
  const alpha = Number(args.ALPHA ?? 1)
  const secs = Number(args.SECS ?? 1)
  const _ease = String(args.EASE ?? "linear")
  const sprite = util.getSprite()
  const scene = util.getScene()
  const frame = util.stackFrame

  if (!frame.tweenStarted) {
    frame.tweenStarted = true
    if (scene) {
      scene.tweenSpriteAlpha(sprite.id, alpha, secs * 1000).then(() => {
        frame.tweenDone = true
      })
    } else {
      frame.tweenDone = true
    }
  }

  if (!frame.tweenDone) {
    util.yield()
  }
}

/** イージング付き角度 Tween */
export function tween_angle_ease(args: BlockArgs, util: BlockUtil) {
  const angle = Number(args.ANGLE ?? 0)
  const secs = Number(args.SECS ?? 1)
  const _ease = String(args.EASE ?? "linear")
  const sprite = util.getSprite()
  const scene = util.getScene()
  const frame = util.stackFrame

  if (!frame.tweenStarted) {
    frame.tweenStarted = true
    if (scene) {
      scene.tweenSpriteAngle(sprite.id, angle, secs * 1000).then(() => {
        frame.tweenDone = true
      })
    } else {
      frame.tweenDone = true
    }
  }

  if (!frame.tweenDone) {
    util.yield()
  }
}
