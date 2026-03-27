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
}

/**
 * Sequencer — スレッド実行スケジューラ
 * Scratch VM の Sequencer に対応。フレーム時間の予算内でスレッドを実行する。
 */
export class Sequencer {
  private callbacks: SequencerCallbacks

  constructor(callbacks: SequencerCallbacks) {
    this.callbacks = callbacks
  }

  stepThreads(threads: Thread[]): Thread[] {
    for (const thread of threads) {
      if (thread.isFinished) continue
      this.stepThread(thread)
    }
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
  private executeReporter(
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
