// @ts-expect-error Bun のテストランナー上でのみ解決される
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import type { SpriteDef } from "../constants"
import { Runtime } from "./runtime"
import type { CompiledProgram, ScriptBlock } from "./types"

function createSprite(id: string, name: string): SpriteDef {
  return {
    id,
    name,
    emoji: undefined,
    costumes: [
      {
        id: `${id}-costume`,
        name: "costume",
        dataUrl: "",
        width: 120,
        height: 120,
      },
    ],
    currentCostumeIndex: 0,
    collider: { type: "bbox" },
    x: 0,
    y: 0,
    size: 100,
    direction: 90,
    visible: true,
  }
}

function createScriptBlock(
  block: Partial<ScriptBlock> & Pick<ScriptBlock, "id" | "opcode">
): ScriptBlock {
  return {
    id: block.id,
    opcode: block.opcode,
    args: block.args ?? {},
    next: block.next ?? null,
    branches: block.branches ?? [],
    inputBlocks: block.inputBlocks ?? {},
  }
}

function createProgram({
  hatBlockId,
  opcode,
  hatArgs,
  script,
}: {
  hatBlockId: string
  opcode: string
  hatArgs?: Record<string, unknown>
  script: ScriptBlock
}): CompiledProgram {
  return {
    eventScripts: [
      {
        opcode,
        script,
        hatArgs: hatArgs ?? {},
        hatBlockId,
      },
    ],
    procedures: {},
  }
}

function getSpriteStateMap(runtime: Runtime) {
  return Object.fromEntries(
    runtime.getSpriteStates().map((sprite) => [sprite.id, sprite])
  )
}

function runNextTick(runtime: Runtime) {
  ;(runtime as unknown as { tick: () => void }).tick()
}

function createSceneStub(
  getPairs: () => Array<{ idA: string; idB: string }>,
  getPhysicsPositions: () => Array<{ id: string; x: number; y: number; vx: number; vy: number; grounded: boolean }> = () => []
) {
  return {
    checkOverlap: () => false,
    readContactPairs: () => getPairs(),
    isOnGround: () => false,
    getMousePosition: () => ({ x: 0, y: 0 }),
    setGravity: () => undefined,
    setSpriteVelocity: () => undefined,
    setSpritePhysicsMode: () => undefined,
    readPhysicsPositions: () => getPhysicsPositions(),
    setWorldBounds: () => undefined,
    setSpriteBounce: () => undefined,
    setSpriteCollideWorldBounds: () => undefined,
    setSpriteBodyEnabled: () => undefined,
    removeSprite: () => undefined,
    setSpritePosition: () => undefined,
    setSpriteAllowGravity: () => undefined,
    setSpriteTint: () => undefined,
    clearSpriteTint: () => undefined,
    setSpriteOpacity: () => undefined,
    setSpriteFlipX: () => undefined,
    graphicsFillRect: () => undefined,
    graphicsClear: () => undefined,
    showFloatingText: () => undefined,
    tweenSprite: async () => undefined,
    cameraFollow: () => undefined,
    cameraStopFollow: () => undefined,
    cameraShake: () => undefined,
    cameraZoom: () => undefined,
    cameraFade: async () => undefined,
    tweenSpriteScale: async () => undefined,
    tweenSpriteAlpha: async () => undefined,
    tweenSpriteAngle: async () => undefined,
    setSpriteAngle: () => undefined,
    addTextAt: () => undefined,
    updateTextAt: () => undefined,
    removeTextAt: () => undefined,
    emitParticles: () => undefined,
    resetEffects: () => undefined,
    pauseScene: () => undefined,
    resumeScene: () => undefined,
    setSpriteAcceleration: () => undefined,
    setSpriteDrag: () => undefined,
    setSpriteDamping: () => undefined,
    setSpriteMaxVelocity: () => undefined,
    setSpriteAngularVelocity: () => undefined,
    setSpriteImmovable: () => undefined,
    setSpriteMass: () => undefined,
    setSpritePushable: () => undefined,
    worldWrap: () => undefined,
    getSpriteSpeed: () => 0,
    moveToObject: () => undefined,
    accelerateToObject: () => undefined,
    velocityFromAngle: () => undefined,
    isMouseDown: () => false,
    getMouseWheelDelta: () => 0,
    enableSpriteDrag: () => undefined,
    getSpriteDragPosition: () => null,
    setSpriteBodySize: () => undefined,
    setSpriteBodyOffset: () => undefined,
    setSpriteCircle: () => undefined,
    setSpriteOrigin: () => undefined,
    setSpriteScrollFactor: () => undefined,
    setBackgroundColor: () => undefined,
    playSpriteSound: () => false,
    stopSpriteSound: () => undefined,
    setSpriteSoundVolume: () => undefined,
  } as const
}

let originalRequestAnimationFrame: typeof globalThis.requestAnimationFrame
let originalCancelAnimationFrame: typeof globalThis.cancelAnimationFrame

beforeEach(() => {
  originalRequestAnimationFrame = globalThis.requestAnimationFrame
  originalCancelAnimationFrame = globalThis.cancelAnimationFrame
  globalThis.requestAnimationFrame = (() => 0) as typeof globalThis.requestAnimationFrame
  globalThis.cancelAnimationFrame = (() => undefined) as typeof globalThis.cancelAnimationFrame
})

afterEach(() => {
  globalThis.requestAnimationFrame = originalRequestAnimationFrame
  globalThis.cancelAnimationFrame = originalCancelAnimationFrame
})

describe("Runtime", () => {
  test("スプライトごとに別の旗クリックコードを実行する", () => {
    const cat = createSprite("cat", "ネコ")
    const dog = createSprite("dog", "イヌ")
    const runtime = new Runtime()

    runtime.start(
      [cat, dog],
      {
        cat: createProgram({
          hatBlockId: "cat-flag",
          opcode: "event_whenflagclicked",
          script: createScriptBlock({
            id: "cat-move",
            opcode: "motion_changexby",
            args: { DX: 12 },
          }),
        }),
        dog: createProgram({
          hatBlockId: "dog-flag",
          opcode: "event_whenflagclicked",
          script: createScriptBlock({
            id: "dog-move",
            opcode: "motion_changexby",
            args: { DX: 27 },
          }),
        }),
      }
    )

    const states = Object.fromEntries(
      runtime.getSpriteStates().map((sprite) => [sprite.id, sprite])
    )

    expect(states.cat.x).toBe(12)
    expect(states.dog.x).toBe(27)
  })

  test("キー入力は各スプライトの Hat 引数で個別に判定する", () => {
    const cat = createSprite("cat", "ネコ")
    const dog = createSprite("dog", "イヌ")
    const runtime = new Runtime()

    runtime.start(
      [cat, dog],
      {
        cat: createProgram({
          hatBlockId: "cat-key",
          opcode: "event_whenkeypressed",
          hatArgs: { KEY_OPTION: "space" },
          script: createScriptBlock({
            id: "cat-key-move",
            opcode: "motion_changexby",
            args: { DX: 7 },
          }),
        }),
        dog: createProgram({
          hatBlockId: "dog-key",
          opcode: "event_whenkeypressed",
          hatArgs: { KEY_OPTION: "right arrow" },
          script: createScriptBlock({
            id: "dog-key-move",
            opcode: "motion_changexby",
            args: { DX: 11 },
          }),
        }),
      }
    )

    const keydownHandler = (runtime as unknown as {
      keydownHandler: ((event: KeyboardEvent) => void) | null
    }).keydownHandler
    if (!keydownHandler) {
      throw new Error("keydown handler was not initialized")
    }

    keydownHandler({
      key: " ",
      repeat: false,
      preventDefault: () => undefined,
    } as KeyboardEvent)

    let states = Object.fromEntries(
      runtime.getSpriteStates().map((sprite) => [sprite.id, sprite])
    )
    expect(states.cat.x).toBe(7)
    expect(states.dog.x).toBe(0)

    keydownHandler({
      key: "ArrowRight",
      repeat: false,
      preventDefault: () => undefined,
    } as KeyboardEvent)

    states = Object.fromEntries(
      runtime.getSpriteStates().map((sprite) => [sprite.id, sprite])
    )
    expect(states.cat.x).toBe(7)
    expect(states.dog.x).toBe(11)

    runtime.stop()
  })

  test("変数監視は各スプライトの Hat 引数で個別に再起動する", () => {
    const cat = createSprite("cat", "ネコ")
    const dog = createSprite("dog", "イヌ")
    const runtime = new Runtime()

    runtime.start(
      [cat, dog],
      {
        cat: createProgram({
          hatBlockId: "cat-var",
          opcode: "observer_whenvarchanges",
          hatArgs: { VARIABLE: "score" },
          script: createScriptBlock({
            id: "cat-var-move",
            opcode: "motion_changexby",
            args: { DX: 5 },
          }),
        }),
        dog: createProgram({
          hatBlockId: "dog-var",
          opcode: "observer_whenvarchanges",
          hatArgs: { VARIABLE: "lives" },
          script: createScriptBlock({
            id: "dog-var-move",
            opcode: "motion_changexby",
            args: { DX: 9 },
          }),
        }),
      }
    )

    runtime.setVariable("lives", 1)

    let states = Object.fromEntries(
      runtime.getSpriteStates().map((sprite) => [sprite.id, sprite])
    )
    expect(states.cat.x).toBe(0)
    expect(states.dog.x).toBe(9)

    runtime.setVariable("score", 1)

    states = Object.fromEntries(
      runtime.getSpriteStates().map((sprite) => [sprite.id, sprite])
    )
    expect(states.cat.x).toBe(5)
    expect(states.dog.x).toBe(9)

    runtime.stop()
  })

  test("非表示スプライトから生成したクローンは onClone まで非表示を維持する", () => {
    const tile = { ...createSprite("tile", "タイル"), visible: false }
    const runtime = new Runtime()

    runtime.start(
      [tile],
      {
        tile: createProgram({
          hatBlockId: "tile-flag",
          opcode: "event_whenflagclicked",
          script: createScriptBlock({
            id: "tile-clone",
            opcode: "clone_create",
            args: { TARGET: "myself" },
          }),
        }),
      }
    )

    const states = getSpriteStateMap(runtime)
    expect(states.tile.visible).toBe(false)
    expect(states["tile__clone_1"]?.visible).toBe(false)
    runtime.stop()
  })

  test("clone_whencloned の show で次の tick にクローンが表示される", () => {
    const tile = { ...createSprite("tile", "タイル"), visible: false }
    const runtime = new Runtime()

    runtime.start(
      [tile],
      {
        tile: {
          eventScripts: [
            {
              hatBlockId: "tile-flag",
              opcode: "event_whenflagclicked",
              hatArgs: {},
              script: createScriptBlock({
                id: "tile-clone",
                opcode: "clone_create",
                args: { TARGET: "myself" },
              }),
            },
            {
              hatBlockId: "tile-clone-hat",
              opcode: "clone_whencloned",
              hatArgs: {},
              script: createScriptBlock({
                id: "tile-show",
                opcode: "looks_show",
              }),
            },
          ],
          procedures: {},
        },
      }
    )

    let states = getSpriteStateMap(runtime)
    expect(states["tile__clone_1"]?.visible).toBe(false)

    runNextTick(runtime)

    states = getSpriteStateMap(runtime)
    expect(states["tile__clone_1"]?.visible).toBe(true)

    runtime.stop()
  })

  test("表示中スプライトから生成したクローンは即表示される", () => {
    const tile = createSprite("tile", "タイル")
    const runtime = new Runtime()

    runtime.start(
      [tile],
      {
        tile: createProgram({
          hatBlockId: "tile-flag",
          opcode: "event_whenflagclicked",
          script: createScriptBlock({
            id: "tile-clone",
            opcode: "clone_create",
            args: { TARGET: "myself" },
          }),
        }),
      }
    )

    const states = getSpriteStateMap(runtime)
    expect(states.tile.visible).toBe(true)
    expect(states["tile__clone_1"]?.visible).toBe(true)

    runtime.stop()
  })

  test("別スプライト対象のクローンは複製元スプライトの位置を継承する", () => {
    const caller = { ...createSprite("caller", "呼び出し元"), x: 120, y: -220 }
    const target = { ...createSprite("target", "弾"), x: -360, y: 340 }
    const runtime = new Runtime()

    runtime.start(
      [caller, target],
      {
        caller: createProgram({
          hatBlockId: "caller-flag",
          opcode: "event_whenflagclicked",
          script: createScriptBlock({
            id: "caller-clone",
            opcode: "clone_create",
            args: { TARGET: "弾" },
          }),
        }),
      }
    )

    const states = getSpriteStateMap(runtime)
    expect(states["target__clone_1"]?.x).toBe(-360)
    expect(states["target__clone_1"]?.y).toBe(340)

    runtime.stop()
  })

  test("event_whentouched は接触開始時にだけ発火する", () => {
    const cat = createSprite("cat", "ネコ")
    const dog = createSprite("dog", "イヌ")
    const contactPairs = [{ idA: "cat", idB: "dog" }]
    const runtime = new Runtime()

    runtime.start(
      [cat, dog],
      {
        cat: createProgram({
          hatBlockId: "cat-touch",
          opcode: "event_whentouched",
          hatArgs: { TARGET: "イヌ" },
          script: createScriptBlock({
            id: "cat-touch-move",
            opcode: "motion_changexby",
            args: { DX: 5 },
          }),
        }),
      },
      createSceneStub(() => contactPairs)
    )

    let states = getSpriteStateMap(runtime)
    expect(states.cat.x).toBe(0)

    runNextTick(runtime)
    states = getSpriteStateMap(runtime)
    expect(states.cat.x).toBe(5)

    runNextTick(runtime)
    states = getSpriteStateMap(runtime)
    expect(states.cat.x).toBe(5)

    contactPairs.length = 0
    runNextTick(runtime)
    states = getSpriteStateMap(runtime)
    expect(states.cat.x).toBe(5)

    contactPairs.push({ idA: "cat", idB: "dog" })
    runNextTick(runtime)
    states = getSpriteStateMap(runtime)
    expect(states.cat.x).toBe(5)

    runNextTick(runtime)
    states = getSpriteStateMap(runtime)
    expect(states.cat.x).toBe(10)

    runtime.stop()
  })

  test("physics_oncollide は begin 時のみ event を送り collisionTarget を渡す", () => {
    const cat = createSprite("cat", "ネコ")
    const dog = createSprite("dog", "イヌ")
    const contactPairs = [{ idA: "cat", idB: "dog" }]
    const runtime = new Runtime()

    runtime.start(
      [cat, dog],
      {
        cat: {
          eventScripts: [
            {
              hatBlockId: "cat-flag",
              opcode: "event_whenflagclicked",
              hatArgs: {},
              script: createScriptBlock({
                id: "register-collision",
                opcode: "physics_oncollide",
                args: { TARGET: "イヌ", EVENT_NAME: "hit" },
              }),
            },
            {
              hatBlockId: "cat-hit",
              opcode: "observer_wheneventreceived",
              hatArgs: { EVENT_NAME: "hit" },
              script: createScriptBlock({
                id: "remember-target",
                opcode: "data_setvariableto",
                args: { VARIABLE: "lastTarget" },
                inputBlocks: {
                  VALUE: createScriptBlock({
                    id: "collision-target",
                    opcode: "physics_collisiontarget",
                  }),
                },
                next: createScriptBlock({
                  id: "move-on-hit",
                  opcode: "motion_changexby",
                  args: { DX: 4 },
                }),
              }),
            },
          ],
          procedures: {},
        },
      },
      createSceneStub(() => contactPairs)
    )

    let states = getSpriteStateMap(runtime)
    expect(states.cat.x).toBe(0)
    expect(runtime.getVariable("lastTarget")).toBeUndefined()

    runNextTick(runtime)
    states = getSpriteStateMap(runtime)
    expect(states.cat.x).toBe(4)
    expect(runtime.getVariable("lastTarget")).toBe("イヌ")

    runNextTick(runtime)
    states = getSpriteStateMap(runtime)
    expect(states.cat.x).toBe(4)

    contactPairs.length = 0
    runNextTick(runtime)
    contactPairs.push({ idA: "cat", idB: "dog" })
    runNextTick(runtime)
    states = getSpriteStateMap(runtime)
    expect(states.cat.x).toBe(4)

    runNextTick(runtime)
    states = getSpriteStateMap(runtime)
    expect(states.cat.x).toBe(8)

    runtime.stop()
  })

  test("dynamic スプライトの grounded を scene から逆同期し physics_onground が参照する", () => {
    const player = createSprite("player", "プレイヤー")
    let grounded = false
    const runtime = new Runtime()

    runtime.start(
      [player],
      {
        player: {
          eventScripts: [
            {
              hatBlockId: "player-flag",
              opcode: "event_whenflagclicked",
              hatArgs: {},
              script: createScriptBlock({
                id: "player-set-mode",
                opcode: "physics_setmode",
                args: { MODE: "dynamic" },
                next: createScriptBlock({
                  id: "player-store-grounded",
                  opcode: "data_setvariableto",
                  args: { VARIABLE: "grounded" },
                  inputBlocks: {
                    VALUE: createScriptBlock({
                      id: "player-onground",
                      opcode: "physics_onground",
                    }),
                  },
                }),
              }),
            },
            {
              hatBlockId: "player-key",
              opcode: "event_whenkeypressed",
              hatArgs: { KEY_OPTION: "space" },
              script: createScriptBlock({
                id: "player-store-grounded-from-key",
                opcode: "data_setvariableto",
                args: { VARIABLE: "grounded" },
                inputBlocks: {
                  VALUE: createScriptBlock({
                    id: "player-onground-on-key",
                    opcode: "physics_onground",
                  }),
                },
              }),
            },
          ],
          procedures: {},
        },
      },
      createSceneStub(
        () => [],
        () => [{
          id: "player",
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          grounded,
        }]
      )
    )

    expect(runtime.getVariable("grounded")).toBe(false)
    expect(getSpriteStateMap(runtime).player.grounded).toBe(false)

    grounded = true
    runNextTick(runtime)

    expect(getSpriteStateMap(runtime).player.grounded).toBe(true)

    const keydownHandler = (runtime as unknown as {
      keydownHandler: ((event: KeyboardEvent) => void) | null
    }).keydownHandler
    if (!keydownHandler) {
      throw new Error("keydown handler was not initialized")
    }

    keydownHandler({
      key: " ",
      repeat: false,
      preventDefault: () => undefined,
    } as KeyboardEvent)

    expect(runtime.getVariable("grounded")).toBe(true)

    runtime.stop()
  })
})
