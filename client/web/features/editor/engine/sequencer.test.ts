// @ts-expect-error Bun のテストランナー上でのみ解決される
import { describe, expect, test } from "bun:test"
import { Sequencer, type SequencerCallbacks } from "./sequencer"
import { Thread } from "./thread"
import type { CompiledProcedure, ScriptBlock, SpriteRuntime } from "./types"

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

function createSequencer(
  procedures: Record<string, CompiledProcedure>,
  variables: Map<string, unknown>,
  previewCache: Map<string, unknown>
): Sequencer {
  const sprite: SpriteRuntime = {
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
    costumeNames: [],
    costumeSizes: [],
    physicsMode: "none",
    velocityX: 0,
    velocityY: 0,
    grounded: false,
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
    originX: 0.5,
    originY: 0.5,
    scrollFactorX: 1,
    scrollFactorY: 1,
    scaleTweening: false,
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
    currentState: "default",
    layer: 0,
    tags: new Set<string>(),
  }

  const callbacks: SequencerCallbacks = {
    getSprite: () => sprite,
    getAllSprites: () => [sprite],
    getSpriteByName: () => undefined,
    getVariable: (name) => variables.get(name),
    setVariable: (name, value) => void variables.set(name, value),
    getSpriteVariable: (spriteName, varName) => variables.get(`${spriteName}::${varName}`),
    setSpriteVariable: (spriteName, varName, value) => void variables.set(`${spriteName}::${varName}`, value),
    sendEvent: () => undefined,
    disableWatcher: () => undefined,
    isKeyPressed: () => false,
    getMouseX: () => 0,
    getMouseY: () => 0,
    getScene: () => null,
    getProcedure: (procedureId) => procedures[procedureId],
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
    spawnThread: () => undefined,
    switchScene: () => undefined,
    getCurrentScene: () => "default",
    setTimeScale: () => undefined,
    beginBatch: () => undefined,
    endBatch: () => undefined,
    registerLiveVariable: () => undefined,
  }

  return new Sequencer(callbacks)
}

function runThreadToCompletion(sequencer: Sequencer, thread: Thread, maxSteps = 20) {
  let guard = 0
  while (!thread.isFinished && guard < maxSteps) {
    sequencer.stepThreads([thread])
    guard += 1
  }
  if (!thread.isFinished) {
    throw new Error("thread did not finish in time")
  }
}

describe("custom procedures", () => {
  test("reporter call returns argument value and caches preview", () => {
    const variables = new Map<string, unknown>()
    const previewCache = new Map<string, unknown>()

    const procedureScript = createScriptBlock({
      id: "return-text",
      opcode: "procedures_return",
      inputBlocks: {
        VALUE: createScriptBlock({
          id: "argument-text",
          opcode: "procedures_argument",
          args: { PARAM_ID: "text-param" },
        }),
      },
    })

    const procedures: Record<string, CompiledProcedure> = {
      proc: {
        procedureId: "proc",
        defineBlockId: "define-proc",
        returnsValue: true,
        parameterIds: ["text-param"],
        script: procedureScript,
      },
    }

    const root = createScriptBlock({
      id: "set-answer",
      opcode: "data_setvariableto",
      args: { VARIABLE: "answer" },
      inputBlocks: {
        VALUE: createScriptBlock({
          id: "call-proc",
          opcode: "procedures_call_reporter",
          args: { PROCEDURE_ID: "proc", "text-param": "hello" },
        }),
      },
    })

    const sequencer = createSequencer(procedures, variables, previewCache)
    const thread = new Thread(root, "sprite1")
    runThreadToCompletion(sequencer, thread)

    expect(variables.get("answer")).toBe("hello")
    expect(previewCache.get("sprite1:call-proc")).toBe("hello")
  })

  test("stack call respects early return and resumes caller next block", () => {
    const variables = new Map<string, unknown>()
    const previewCache = new Map<string, unknown>()

    const procedureScript = createScriptBlock({
      id: "set-first",
      opcode: "data_setvariableto",
      args: { VARIABLE: "result", VALUE: "first" },
      next: createScriptBlock({
        id: "return-now",
        opcode: "procedures_return",
        args: { VALUE: "stop" },
        next: createScriptBlock({
          id: "set-second",
          opcode: "data_setvariableto",
          args: { VARIABLE: "result", VALUE: "second" },
        }),
      }),
    })

    const procedures: Record<string, CompiledProcedure> = {
      proc: {
        procedureId: "proc",
        defineBlockId: "define-proc",
        returnsValue: false,
        parameterIds: [],
        script: procedureScript,
      },
    }

    const root = createScriptBlock({
      id: "call-stack",
      opcode: "procedures_call_stack",
      args: { PROCEDURE_ID: "proc" },
      next: createScriptBlock({
        id: "after-call",
        opcode: "data_setvariableto",
        args: { VARIABLE: "after", VALUE: "done" },
      }),
    })

    const sequencer = createSequencer(procedures, variables, previewCache)
    const thread = new Thread(root, "sprite1")
    runThreadToCompletion(sequencer, thread)

    expect(variables.get("result")).toBe("first")
    expect(variables.get("after")).toBe("done")
  })

  test("reporter call without return falls back to empty string", () => {
    const variables = new Map<string, unknown>()
    const previewCache = new Map<string, unknown>()

    const procedureScript = createScriptBlock({
      id: "set-side-effect",
      opcode: "data_setvariableto",
      args: { VARIABLE: "side", VALUE: "effect" },
    })

    const procedures: Record<string, CompiledProcedure> = {
      proc: {
        procedureId: "proc",
        defineBlockId: "define-proc",
        returnsValue: true,
        parameterIds: [],
        script: procedureScript,
      },
    }

    const root = createScriptBlock({
      id: "set-answer",
      opcode: "data_setvariableto",
      args: { VARIABLE: "answer" },
      inputBlocks: {
        VALUE: createScriptBlock({
          id: "call-no-return",
          opcode: "procedures_call_reporter",
          args: { PROCEDURE_ID: "proc" },
        }),
      },
    })

    const sequencer = createSequencer(procedures, variables, previewCache)
    const thread = new Thread(root, "sprite1")
    runThreadToCompletion(sequencer, thread)

    expect(variables.get("side")).toBe("effect")
    expect(variables.get("answer")).toBe("")
    expect(previewCache.get("sprite1:call-no-return")).toBe("")
  })
})
