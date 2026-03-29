// @ts-expect-error Bun のテストランナー上でのみ解決される
import { describe, expect, test } from "bun:test"
import { Workspace } from "headless-vpl"
import { connectStackPairs } from "headless-vpl/blocks"
import type { BlockEditorController } from "../block-editor/controller"
import {
  buildProcedureBlockDefs,
  createDefaultProcedure,
  findBuiltinBlockDefId,
  GENERIC_RETURN_BLOCK_ID,
  getBlockDefById,
  normalizeProcedure,
} from "../block-editor/blocks"
import { createBlock } from "../block-editor/factory"
import type { CreatedBlock } from "../block-editor/types"
import { buildScripts } from "./script-builder"
import { Sequencer, type SequencerCallbacks } from "./sequencer"
import { Thread } from "./thread"
import type { SpriteRuntime } from "./types"

function createRuntimeSprite(): SpriteRuntime {
  return {
    id: "sprite1",
    name: "Sprite1",
    x: 0,
    y: 0,
    direction: 90,
    size: 100,
    visible: true,
    sayText: "",
    sayTimer: null,
    costumeIndex: 0,
    costumeCount: 1,
    physicsMode: "none",
    velocityX: 0,
    velocityY: 0,
    bodyEnabled: true,
    bounce: 0,
    collideWorldBounds: false,
    allowGravity: null,
    opacity: 100,
    tint: null,
    flipX: false,
    sayTextX: 0,
    sayTextY: 0,
    angle: 0,
    accelerationX: 0,
    accelerationY: 0,
    dragX: 0,
    dragY: 0,
    useDamping: false,
    maxVelocityX: 10000,
    maxVelocityY: 10000,
    angularVelocity: 0,
    immovable: false,
    mass: 1,
    pushable: true,
    mouseDown: false,
    mouseWheelDelta: 0,
    _velocityDirty: false,
  }
}

function buildProcedureSayController() {
  const workspace = new Workspace()
  const procedure = normalizeProcedure({
    ...createDefaultProcedure(),
    returnsValue: true,
  })
  const [defineDef, callDef, argDef] = buildProcedureBlockDefs(procedure)
  const returnDef = getBlockDefById(GENERIC_RETURN_BLOCK_ID, [procedure])
  const flagDef = getBlockDefById(
    findBuiltinBlockDefId("When 🏴 clicked", "hat"),
    [procedure]
  )
  const sayDef = getBlockDefById(
    findBuiltinBlockDefId("Say", "stack"),
    [procedure]
  )

  if (!returnDef || !flagDef || !sayDef) {
    throw new Error("必要なブロック定義を解決できませんでした")
  }

  const define = createBlock(workspace, defineDef, 0, 0)
  const returnBlock = createBlock(workspace, returnDef, 0, 60)
  const argument = createBlock(workspace, argDef, 0, 120)
  const flag = createBlock(workspace, flagDef, 220, 0)
  const say = createBlock(workspace, sayDef, 220, 60)
  const call = createBlock(workspace, callDef, 320, 120)

  const parameterIndex = call.state.def.inputs.findIndex(
    (input) => input.type !== "label"
  )
  call.state.inputValues[parameterIndex] = "hello"

  returnBlock.slotLayouts[0]?.layout.insertElement(argument.container, 0)
  say.slotLayouts[0]?.layout.insertElement(call.container, 0)
  connectStackPairs({
    workspace,
    snapConnections: [],
    pairs: [
      [returnBlock, define],
      [say, flag],
    ],
  })

  const createdMap = new Map<string, CreatedBlock>([
    [define.container.id, define],
    [returnBlock.container.id, returnBlock],
    [argument.container.id, argument],
    [flag.container.id, flag],
    [say.container.id, say],
    [call.container.id, call],
  ])

  const snapshot = {
    blocks: [
      define.state,
      returnBlock.state,
      argument.state,
      flag.state,
      say.state,
      call.state,
    ],
    nestedSlots: {
      [`${returnBlock.state.id}-0`]: argument.state.id,
      [`${say.state.id}-0`]: call.state.id,
    },
    customProcedures: [procedure],
  }

  const controller = {
    getSnapshot: () => snapshot,
    getCreatedBlock: (id: string) => createdMap.get(id),
    getCustomProcedure: (id: string) =>
      id === procedure.id ? procedure : undefined,
  } as unknown as BlockEditorController

  return {
    controller,
    callBlockId: call.state.id,
  }
}

describe("buildScripts", () => {
  test("custom reporter の戻り値を Say の入力へ流せる", () => {
    const { controller, callBlockId } = buildProcedureSayController()
    const program = buildScripts(controller)
    const eventScript = program.eventScripts[0]
    const previewCache = new Map<string, unknown>()
    const sprite = createRuntimeSprite()

    expect(eventScript).toBeDefined()

    const callbacks: SequencerCallbacks = {
      getSprite: () => sprite,
      getAllSprites: () => [sprite],
      getSpriteByName: () => undefined,
      getVariable: () => undefined,
      setVariable: () => undefined,
      sendEvent: () => undefined,
      disableWatcher: () => undefined,
      isKeyPressed: () => false,
      getMouseX: () => 0,
      getMouseY: () => 0,
      getScene: () => null,
      getProcedure: (procedureId) => program.procedures[procedureId],
      cacheReporterPreview: (blockId, spriteId, value) => {
        previewCache.set(`${spriteId}:${blockId}`, value)
      },
      createClone: () => undefined,
      deleteClone: () => undefined,
      registerCollisionCallback: () => undefined,
      restartGame: () => undefined,
      now: () => Date.now(),
      addInterval: () => undefined,
      removeInterval: () => undefined,
      addTimeout: () => undefined,
    }

    const sequencer = new Sequencer(callbacks)
    const thread = new Thread(eventScript.script, sprite.id, eventScript.hatBlockId)

    sequencer.stepThreads([thread])

    expect(sprite.sayText).toBe("hello")
    expect(sprite.sayText).not.toBe("Hello!")
    expect(previewCache.get(`${sprite.id}:${callBlockId}`)).toBe("hello")
  })
})
