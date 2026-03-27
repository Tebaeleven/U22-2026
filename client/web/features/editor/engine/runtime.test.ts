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
})
