// @ts-expect-error Bun のテストランナー上でのみ解決される
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { Workspace } from "headless-vpl"
import type { BlockProjectData } from "../block-editor/types"
import { findBuiltinBlockDefId } from "../block-editor/blocks"
import { BlockEditorController } from "../block-editor/controller"
import type { SpriteDef } from "../constants"
import { buildProgramsForSprites } from "./program-builder"

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

function createFlagMoveProjectData(dx: number): BlockProjectData {
  return {
    customProcedures: [],
    workspace: {
      blocks: [
        {
          instanceId: "flag",
          defId: findBuiltinBlockDefId("When 🏴 clicked"),
          inputValues: {},
          position: { x: 0, y: 0 },
          nextId: "move",
          bodyChildren: [],
          slotChildren: {},
        },
        {
          instanceId: "move",
          defId: findBuiltinBlockDefId("Change x by", "stack"),
          inputValues: { "0": String(dx) },
          position: { x: 0, y: 60 },
          nextId: null,
          bodyChildren: [],
          slotChildren: {},
        },
      ],
    },
  }
}

function createMountedController(projectData: BlockProjectData) {
  const workspace = new Workspace()
  const controller = new BlockEditorController()
  controller.loadProjectData(projectData)
  const unmount = controller.mount(workspace, [])
  return { controller, unmount }
}

describe("buildProgramsForSprites", () => {
  test("選択中スプライトが先頭でなくても各スプライトのコードを分離してビルドする", () => {
    const cat = createSprite("cat", "ネコ")
    const dog = createSprite("dog", "イヌ")
    const catData = createFlagMoveProjectData(10)
    const dogData = createFlagMoveProjectData(20)
    const { controller, unmount } = createMountedController(dogData)

    try {
      const before = controller.exportProjectData()
      const programs = buildProgramsForSprites({
        sprites: [cat, dog],
        selectedSpriteId: dog.id,
        controller,
        blockDataMap: {
          [cat.id]: catData,
          [dog.id]: dogData,
        },
      })

      expect(programs[cat.id]?.eventScripts[0]?.script.args.DX).toBe("10")
      expect(programs[dog.id]?.eventScripts[0]?.script.args.DX).toBe("20")
      expect(controller.exportProjectData()).toEqual(before)
    } finally {
      unmount()
    }
  })
})
