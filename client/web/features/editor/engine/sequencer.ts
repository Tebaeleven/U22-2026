import { Thread } from "./thread"
import { getBlockFunction } from "./block-registry"
import type {
  BlockArgs,
  BlockUtil,
  CompiledProcedure,
  GameSceneProxy,
  ScriptBlock,
  SpriteRuntime,
} from "./types"
import { STAGE_WIDTH, STAGE_HEIGHT } from "./types"

/** Sequencer が Runtime から受け取るコールバック群 */
export interface SequencerCallbacks {
  getSprite: (id: string) => SpriteRuntime | undefined
  getAllSprites: () => SpriteRuntime[]
  getSpriteByName: (name: string) => SpriteRuntime | undefined
  getVariable: (name: string) => unknown
  setVariable: (name: string, value: unknown) => void
  sendEvent: (name: string, data: unknown) => void
  disableWatcher: (varName: string, spriteId: string) => void
  isKeyPressed: (key: string) => boolean
  getMouseX: () => number
  getMouseY: () => number
  getScene: () => GameSceneProxy | null
  getProcedure: (procedureId: string) => CompiledProcedure | undefined
  cacheReporterPreview: (blockId: string, spriteId: string, value: unknown) => void
  createClone: (requestingSpriteId: string, targetId?: string) => void
  deleteClone: (spriteId: string) => void
  registerCollisionCallback: (spriteId: string, targetName: string, eventName: string) => void
  restartGame: () => void
  now: () => number
  addInterval: (spriteId: string, eventName: string, ms: number) => void
  removeInterval: (spriteId: string, eventName: string) => void
  addTimeout: (spriteId: string, eventName: string, ms: number) => void
  spawnThread: (spriteId: string, script: ScriptBlock) => void
  switchScene: (name: string) => void
  getCurrentScene: () => string
  setTimeScale: (scale: number) => void
  beginBatch: () => void
  endBatch: () => void
  registerLiveVariable: (spriteId: string, name: string, expressionBlock: ScriptBlock) => void
}

/**
 * Sequencer — スレッド実行スケジューラ
 * Scratch VM の Sequencer に対応。フレーム時間の予算内でスレッドを実行する。
 */
export type SpeedMode = "normal" | "fast" | "turbo"

export class Sequencer {
  private callbacks: SequencerCallbacks
  /** フレーム時間予算（ms）。16.67ms の約72% でレンダリングに余裕を残す */
  private static readonly FRAME_BUDGET_NORMAL = 12
  private static readonly FRAME_BUDGET_FAST = 14
  /** ラウンドロビン用：次フレームの開始スレッドインデックス */
  private threadStartIndex = 0
  /** 実行速度モード */
  speedMode: SpeedMode = "normal"

  constructor(callbacks: SequencerCallbacks) {
    this.callbacks = callbacks
  }

  stepThreads(threads: Thread[]): Thread[] {
    const budget = this.speedMode === "fast" || this.speedMode === "turbo"
      ? Sequencer.FRAME_BUDGET_FAST
      : Sequencer.FRAME_BUDGET_NORMAL
    const start = performance.now()
    const len = threads.length
    for (let i = 0; i < len; i++) {
      const idx = (this.threadStartIndex + i) % len
      const thread = threads[idx]
      if (thread.isFinished) continue
      this.stepThread(thread)
      if (performance.now() - start > budget) {
        this.threadStartIndex = (this.threadStartIndex + i + 1) % Math.max(len, 1)
        return threads.filter((t) => !t.isFinished)
      }
    }
    this.threadStartIndex = 0
    return threads.filter((t) => !t.isFinished)
  }

  private stepThread(thread: Thread) {
    if (thread.status === "yield" || thread.status === "yield_tick") {
      thread.status = "running"
    }

    if (thread.status === "promise_wait") {
      return
    }

    // 1ティックで最大 500 ブロックまで実行（無限ループ防止）
    const MAX_STEPS = 500
    let steps = 0

    while (thread.status === "running" && steps < MAX_STEPS) {
      const block = thread.currentBlock
      if (!block) {
        thread.status = "done"
        break
      }

      const sprite = this.callbacks.getSprite(thread.spriteId)
      if (!sprite) {
        thread.status = "done"
        break
      }

      let branched = false
      let branchIsLoop = false
      const util: BlockUtil = {
        stackFrame: thread.currentFrame,
        startBranch: (branchIndex, isLoop) => {
          branched = true
          branchIsLoop = isLoop
          thread.startBranch(branchIndex, isLoop)
        },
        yield: () => {
          thread.status = "yield"
        },
        getSprite: () => sprite,
        getAllSprites: () => this.callbacks.getAllSprites(),
        getSpriteByName: (name: string) => this.callbacks.getSpriteByName(name),
        stageWidth: STAGE_WIDTH,
        stageHeight: STAGE_HEIGHT,
        getContext: (key: string) => thread.context[key],
        getVariable: (name: string) => this.callbacks.getVariable(name),
        getLoopVariable: (name: string) => thread.getLoopVariable(name),
        setVariable: (name: string, value: unknown) => this.callbacks.setVariable(name, value),
        sendEvent: (name: string, data: unknown) => this.callbacks.sendEvent(name, data),
        disableWatcher: (varName: string) => this.callbacks.disableWatcher(varName, thread.spriteId),
        isKeyPressed: (key: string) => this.callbacks.isKeyPressed(key),
        getMouseX: () => this.callbacks.getMouseX(),
        getMouseY: () => this.callbacks.getMouseY(),
        getScene: () => this.callbacks.getScene(),
        createClone: (targetId?: string) => this.callbacks.createClone(thread.spriteId, targetId),
        deleteClone: () => this.callbacks.deleteClone(thread.spriteId),
        onCollide: (targetName: string, callbackEvent: string) =>
          this.callbacks.registerCollisionCallback(thread.spriteId, targetName, callbackEvent),
        getCollisionTarget: () => String(thread.context.collisionTarget ?? ""),
        restartGame: () => this.callbacks.restartGame(),
        now: () => this.callbacks.now(),
        addInterval: (eventName: string, ms: number) =>
          this.callbacks.addInterval(thread.spriteId, eventName, ms),
        removeInterval: (eventName: string) =>
          this.callbacks.removeInterval(thread.spriteId, eventName),
        addTimeout: (eventName: string, ms: number) =>
          this.callbacks.addTimeout(thread.spriteId, eventName, ms),
        breakLoop: () => {
          thread.breakCurrentLoop()
        },
        continueLoop: () => {
          thread.continueCurrentLoop()
        },
        spawnThread: () => {
          const block = thread.currentBlock
          if (block && block.branches[0]) {
            this.callbacks.spawnThread(thread.spriteId, block.branches[0])
          }
        },
        switchScene: (name: string) => {
          this.callbacks.switchScene(name)
        },
        getCurrentScene: () => this.callbacks.getCurrentScene(),
        setTimeScale: (scale: number) => {
          this.callbacks.setTimeScale(scale)
        },
        beginBatch: () => this.callbacks.beginBatch(),
        endBatch: () => this.callbacks.endBatch(),
        registerLiveVariable: (name: string, expressionBlock: ScriptBlock) => {
          this.callbacks.registerLiveVariable(thread.spriteId, name, expressionBlock)
        },
      }

      const resolvedArgs = this.resolveInputBlocks(block, block.args, thread, util)

      if (block.opcode === "procedures_call_stack") {
        this.startProcedureCall(thread, block, resolvedArgs, "stack")
        steps += 1
        continue
      }

      if (block.opcode === "procedures_return") {
        if (thread.hasActiveProcedure()) {
          thread.returnFromProcedure(resolvedArgs.VALUE ?? "")
        } else {
          thread.advanceToNext()
        }
        steps += 1
        continue
      }

      // data_setlivevariable: 式ブロックをランタイムに登録（初回のみ）
      if (block.opcode === "data_setlivevariable") {
        const exprBlock = block.inputBlocks.VALUE
        if (exprBlock) {
          const varName = String(resolvedArgs.VARIABLE ?? "")
          this.callbacks.registerLiveVariable(thread.spriteId, varName, exprBlock)
        }
      }

      const fn = getBlockFunction(block.opcode)
      if (!fn) {
        thread.advanceToNext()
        steps += 1
        continue
      }

      const result = fn(resolvedArgs, util)

      if (result instanceof Promise) {
        thread.status = "promise_wait"
        thread.pendingPromise = result.then(() => {
          thread.pendingPromise = null
          if (thread.status === "promise_wait") {
            thread.status = "running"
            thread.advanceToNext()
          }
        })
        break
      }

      if ((thread.status as string) === "yield") {
        break
      }

      if (!branched) {
        thread.advanceToNext()
      }

      if (branched && branchIsLoop) {
        thread.status = "yield_tick"
        break
      }

      steps += 1
    }

    if (steps >= MAX_STEPS && thread.status === "running") {
      thread.status = "yield_tick"
    }
  }

  /** Live Variable の式を評価する（onVariableChanged から呼ばれる） */
  evaluateExpression(expressionBlock: ScriptBlock, spriteId: string): unknown {
    const sprite = this.callbacks.getSprite(spriteId)
    if (!sprite) return undefined
    const dummyThread = new Thread(expressionBlock, spriteId, null)
    const util: BlockUtil = {
      stackFrame: {},
      startBranch: () => {},
      yield: () => {},
      getSprite: () => sprite,
      getAllSprites: () => this.callbacks.getAllSprites(),
      getSpriteByName: (name: string) => this.callbacks.getSpriteByName(name),
      stageWidth: STAGE_WIDTH,
      stageHeight: STAGE_HEIGHT,
      getContext: () => undefined,
      getVariable: (name: string) => this.callbacks.getVariable(name),
      getLoopVariable: () => undefined,
      setVariable: (name: string, value: unknown) => this.callbacks.setVariable(name, value),
      sendEvent: () => {},
      disableWatcher: () => {},
      isKeyPressed: (key: string) => this.callbacks.isKeyPressed(key),
      getMouseX: () => this.callbacks.getMouseX(),
      getMouseY: () => this.callbacks.getMouseY(),
      getScene: () => this.callbacks.getScene(),
      createClone: () => {},
      deleteClone: () => {},
      onCollide: () => {},
      getCollisionTarget: () => "",
      restartGame: () => {},
      now: () => this.callbacks.now(),
      addInterval: () => {},
      removeInterval: () => {},
      addTimeout: () => {},
      breakLoop: () => {},
      continueLoop: () => {},
      spawnThread: () => {},
      switchScene: () => {},
      getCurrentScene: () => this.callbacks.getCurrentScene(),
      setTimeScale: () => {},
      beginBatch: () => {},
      endBatch: () => {},
      registerLiveVariable: () => {},
    }
    return this.executeReporter(expressionBlock, dummyThread, util)
  }

  /** スロット内 Reporter/Boolean の戻り値で引数を上書き */
  private resolveInputBlocks(
    block: ScriptBlock,
    args: BlockArgs,
    thread: Thread,
    util: BlockUtil
  ): BlockArgs {
    if (!block.inputBlocks || Object.keys(block.inputBlocks).length === 0) {
      return args
    }
    const resolved = { ...args }
    for (const [argName, reporterBlock] of Object.entries(block.inputBlocks)) {
      resolved[argName] = this.executeReporter(reporterBlock, thread, util)
    }
    return resolved
  }

  /** Reporter/Boolean ブロックを実行して戻り値を返す（再帰対応） */
  private reporterDepth = 0
  private executeReporter(
    block: ScriptBlock,
    thread: Thread,
    util: BlockUtil
  ): unknown {
    if (this.reporterDepth > 50) return undefined
    this.reporterDepth += 1
    try {
      return this.executeReporterInner(block, thread, util)
    } finally {
      this.reporterDepth -= 1
    }
  }

  private executeReporterInner(
    block: ScriptBlock,
    thread: Thread,
    util: BlockUtil
  ): unknown {
    const resolvedArgs = this.resolveInputBlocks(block, block.args, thread, util)

    if (block.opcode === "procedures_argument") {
      return thread.getProcedureArgument(String(resolvedArgs.PARAM_ID ?? ""))
    }

    if (block.opcode === "procedures_call_reporter") {
      const value = this.executeProcedureReporter(block, resolvedArgs, thread)
      this.callbacks.cacheReporterPreview(block.id, thread.spriteId, value)
      return value
    }

    const fn = getBlockFunction(block.opcode)
    if (!fn) return undefined
    return fn(resolvedArgs, util)
  }

  private startProcedureCall(
    thread: Thread,
    block: ScriptBlock,
    resolvedArgs: BlockArgs,
    returnTarget: "stack"
  ) {
    const procedureId = String(resolvedArgs.PROCEDURE_ID ?? "")
    const procedure = this.callbacks.getProcedure(procedureId)
    if (!procedure?.script) {
      thread.advanceToNext()
      return
    }

    thread.beginProcedureCall({
      procedureId,
      entryBlock: procedure.script,
      argBindings: this.collectProcedureArgs(procedure, resolvedArgs),
      returnTarget,
      callerBlockId: block.id,
    })
  }

  private executeProcedureReporter(
    block: ScriptBlock,
    resolvedArgs: BlockArgs,
    parentThread: Thread
  ): unknown {
    const procedureId = String(resolvedArgs.PROCEDURE_ID ?? "")
    const procedure = this.callbacks.getProcedure(procedureId)
    if (!procedure?.script) {
      return ""
    }

    const reporterThread = new Thread(procedure.script, parentThread.spriteId)
    reporterThread.context = { ...parentThread.context }
    reporterThread.beginProcedureCall({
      procedureId,
      entryBlock: procedure.script,
      argBindings: this.collectProcedureArgs(procedure, resolvedArgs),
      returnTarget: "reporter",
      callerBlockId: block.id,
      pushEntry: false,
    })

    let guard = 0
    while (!reporterThread.isFinished && guard < 10000) {
      this.stepThread(reporterThread)
      if (
        reporterThread.status === "promise_wait" ||
        reporterThread.status === "yield"
      ) {
        break
      }
      guard += 1
    }

    const value = reporterThread.latestProcedureReturnValue
    return value === undefined ? "" : value
  }

  private collectProcedureArgs(
    procedure: CompiledProcedure,
    resolvedArgs: BlockArgs
  ): BlockArgs {
    return Object.fromEntries(
      procedure.parameterIds.map((paramId) => [paramId, resolvedArgs[paramId] ?? ""])
    )
  }
}
