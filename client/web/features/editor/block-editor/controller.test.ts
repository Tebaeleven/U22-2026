// @ts-expect-error Bun のテストランナー上でのみ解決される
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { Workspace, type Container } from "headless-vpl"
import { InteractionManager } from "headless-vpl/recipes"
import { getBlockDefs } from "./blocks"
import { BlockEditorController } from "./controller"
import type { BlockProjectData } from "./types"

function getDefIdByOpcode(opcode: string): string {
  const def = getBlockDefs([]).find((item) => item.opcode === opcode)
  if (!def) {
    throw new Error(`missing block def: ${opcode}`)
  }
  return def.id
}

function createProjectData(
  opcode: "control_forever" | "control_if",
  childOpcode: "motion_movesteps" | "control_if" = "motion_movesteps"
): BlockProjectData {
  return {
    customProcedures: [],
    customVariables: [],
    workspace: {
      blocks: [
        {
          instanceId: "owner",
          defId: getDefIdByOpcode(opcode),
          inputValues: {},
          position: { x: 40, y: 40 },
          nextId: null,
          bodyChildren: [[]],
          slotChildren: {},
        },
        {
          instanceId: "child",
          defId: getDefIdByOpcode(childOpcode),
          inputValues: {},
          position: { x: 280, y: 40 },
          nextId: null,
          bodyChildren: [],
          slotChildren: {},
        },
      ],
    },
  }
}

function createCanvasElement(): HTMLElement {
  return {
    getBoundingClientRect: () => ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      toJSON: () => ({}),
    }),
  } as unknown as HTMLElement
}

function createPointerTarget(): EventTarget {
  return {
    closest: () => null,
  } as unknown as EventTarget
}

function getBlockIdByOpcode(
  controller: BlockEditorController,
  opcode: string
): string {
  const block = controller.getSnapshot().blocks.find(
    (item) => item.def.opcode === opcode
  )
  if (!block) {
    throw new Error(`missing block in snapshot: ${opcode}`)
  }
  return block.id
}

function exerciseNestLifecycle(
  opcode: "control_forever" | "control_if",
  childOpcode: "motion_movesteps" | "control_if" = "motion_movesteps"
) {
  const controller = new BlockEditorController()
  controller.loadProjectData(createProjectData(opcode, childOpcode))

  const workspace = new Workspace()
  const containers: Container[] = []
  const unmount = controller.mount(workspace, containers)

  try {
    const ownerId = getBlockIdByOpcode(controller, opcode)
    const childId = getBlockIdByOpcode(controller, childOpcode)
    const ownerContainer = controller.getContainer(ownerId)
    const childContainer = controller.getContainer(childId)
    const ownerRef = controller.getCBlockRef(ownerId)
    if (!ownerContainer || !childContainer || !ownerRef) {
      throw new Error(`missing controller objects for ${opcode}`)
    }

    const bodyZone = controller.nestingZones.find(
      (zone) =>
        zone.target === ownerContainer &&
        zone.layout === ownerRef.bodyLayouts[0]
    )
    if (!bodyZone) {
      throw new Error(`missing body zone for ${opcode}`)
    }

    const initialHeight = ownerContainer.height
    expect(ownerRef.bodyLayouts[0].Children).toHaveLength(0)

    bodyZone.nest(childContainer, 0)
    controller.interactionOverrides.onNest?.(childContainer, bodyZone)

    const nestedHeight = ownerContainer.height
    expect(ownerRef.bodyLayouts[0].Children).toHaveLength(1)
    expect(ownerRef.bodyLayouts[0].Children[0]?.id).toBe(childContainer.id)
    expect(nestedHeight).toBeGreaterThan(initialHeight)

    bodyZone.unnest(childContainer)
    controller.interactionOverrides.onUnnest?.(childContainer, bodyZone)

    expect(ownerRef.bodyLayouts[0].Children).toHaveLength(0)
    expect(ownerContainer.height).toBe(initialHeight)

    return {
      initialHeight,
      nestedHeight,
    }
  } finally {
    unmount()
  }
}

const originalRequestAnimationFrame = globalThis.requestAnimationFrame
const originalCancelAnimationFrame = globalThis.cancelAnimationFrame

beforeEach(() => {
  globalThis.requestAnimationFrame = () => 0
  globalThis.cancelAnimationFrame = () => {}
})

afterEach(() => {
  globalThis.requestAnimationFrame = originalRequestAnimationFrame
  globalThis.cancelAnimationFrame = originalCancelAnimationFrame
})

describe("BlockEditorController C-block nesting", () => {
  test("control_forever と control_if は同じ nest / unnest レイアウト更新を行う", () => {
    const forever = exerciseNestLifecycle("control_forever")
    const ifBlock = exerciseNestLifecycle("control_if")

    expect(forever.initialHeight).toBe(ifBlock.initialHeight)
    expect(forever.nestedHeight - forever.initialHeight).toBe(
      ifBlock.nestedHeight - ifBlock.initialHeight
    )
  })

  test("control_forever は control_if を body に nest / unnest して高さを更新する", () => {
    const result = exerciseNestLifecycle("control_forever", "control_if")

    expect(result.nestedHeight).toBeGreaterThan(result.initialHeight)
  })

  test("control_if body 内の途中ブロックをドラッグすると後続チェーンも一緒に移動する", () => {
    const controller = new BlockEditorController()
    controller.loadProjectData({
      customProcedures: [],
      customVariables: [],
      workspace: {
        blocks: [
          {
            instanceId: "owner",
            defId: getDefIdByOpcode("control_if"),
            inputValues: {},
            position: { x: 40, y: 40 },
            nextId: null,
            bodyChildren: [["child1", "child2", "child3"]],
            slotChildren: {},
          },
          {
            instanceId: "child1",
            defId: getDefIdByOpcode("motion_movesteps"),
            inputValues: {},
            position: { x: 280, y: 40 },
            nextId: null,
            bodyChildren: [],
            slotChildren: {},
          },
          {
            instanceId: "child2",
            defId: getDefIdByOpcode("control_wait"),
            inputValues: {},
            position: { x: 280, y: 100 },
            nextId: null,
            bodyChildren: [],
            slotChildren: {},
          },
          {
            instanceId: "child3",
            defId: getDefIdByOpcode("physics_setmode"),
            inputValues: {},
            position: { x: 280, y: 160 },
            nextId: null,
            bodyChildren: [],
            slotChildren: {},
          },
        ],
      },
    })

    const workspace = new Workspace()
    const containers: Container[] = []
    const unmount = controller.mount(workspace, containers)

    try {
      const middleId = getBlockIdByOpcode(controller, "control_wait")
      const tailId = getBlockIdByOpcode(controller, "physics_setmode")
      const ownerId = getBlockIdByOpcode(controller, "control_if")
      const middle = controller.getContainer(middleId)
      const tail = controller.getContainer(tailId)
      const ownerRef = controller.getCBlockRef(ownerId)
      if (!middle || !tail || !ownerRef) {
        throw new Error("missing containers for drag test")
      }

      const interaction = new InteractionManager({
        workspace,
        canvasElement: createCanvasElement(),
        containers: () => containers,
        connectors: () => [],
        ...controller.interactionOverrides,
      })

      const start = {
        x: middle.position.x + middle.width / 2,
        y: middle.position.y + middle.height / 2,
      }
      const beforeMiddle = { x: middle.position.x, y: middle.position.y }
      const beforeTail = { x: tail.position.x, y: tail.position.y }

      interaction.handlePointerDown(start, {
        button: 0,
        shiftKey: false,
        target: createPointerTarget(),
      })
      interaction.tick(start, { leftButton: "down", middleButton: "up" })

      const moved = {
        x: start.x + 24,
        y: start.y + 24,
      }
      interaction.tick(moved, { leftButton: "down", middleButton: "up" })

      expect(ownerRef.bodyLayouts[0].Children.map((child) => child.id)).toEqual([
        controller.getContainer(getBlockIdByOpcode(controller, "motion_movesteps"))?.id,
      ])
      expect(middle.position.x - beforeMiddle.x).not.toBe(0)
      expect(middle.position.y - beforeMiddle.y).not.toBe(0)
      expect(tail.position.x - beforeTail.x).toBe(
        middle.position.x - beforeMiddle.x
      )
      expect(tail.position.y - beforeTail.y).toBe(
        middle.position.y - beforeMiddle.y
      )
    } finally {
      unmount()
    }
  })

})
