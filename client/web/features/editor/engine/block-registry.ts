import type { BlockFunction } from "./types"
import * as motionPrimitives from "./primitives/motion"
import * as looksPrimitives from "./primitives/looks"
import * as controlPrimitives from "./primitives/control"
import * as eventsPrimitives from "./primitives/events"
import * as sensingPrimitives from "./primitives/sensing"
import * as operatorsPrimitives from "./primitives/operators"
import * as variablesPrimitives from "./primitives/variables"
import * as observerPrimitives from "./primitives/observer"
import * as physicsPrimitives from "./primitives/physics"
import * as clonePrimitives from "./primitives/clone"
import * as cameraPrimitives from "./primitives/camera"
import * as tweenPrimitives from "./primitives/tween"
import * as mathPrimitives from "./primitives/math"
import * as timerPrimitives from "./primitives/timer"
import * as textPrimitives from "./primitives/text"
import * as particlePrimitives from "./primitives/particle"
import { anim_create, anim_play, anim_stop, anim_oncomplete } from "./primitives/anim"
import * as soundPrimitives from "./primitives/sound"

const registry = new Map<string, BlockFunction>()

function registerAll(primitives: Record<string, BlockFunction>) {
  for (const [key, fn] of Object.entries(primitives)) {
    registry.set(key, fn)
  }
}

registerAll(motionPrimitives)
registerAll(looksPrimitives)
registerAll(controlPrimitives)
registerAll(eventsPrimitives)
registerAll(sensingPrimitives)
registerAll(operatorsPrimitives)
registerAll(variablesPrimitives)
registerAll(observerPrimitives)
registerAll(physicsPrimitives)
registerAll(clonePrimitives)
registerAll(cameraPrimitives)
registerAll(tweenPrimitives)
registerAll(mathPrimitives)
registerAll(timerPrimitives)
registerAll(textPrimitives)
registerAll(particlePrimitives)
registerAll({ anim_create, anim_play, anim_stop, anim_oncomplete })
registerAll(soundPrimitives)

export function getBlockFunction(opcode: string): BlockFunction | undefined {
  return registry.get(opcode)
}

export function getAllOpcodes(): string[] {
  return Array.from(registry.keys())
}
