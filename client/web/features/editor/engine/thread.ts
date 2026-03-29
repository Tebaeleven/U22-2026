import type {
  BlockArgs,
  ProcedureReturnTarget,
  ScriptBlock,
  StackFrame,
  ThreadStatus,
} from "./types"

type ProcedureFrame = {
  procedureId: string
  callerBlockId: string | null
  callerDepth: number
  argBindings: BlockArgs
  returnTarget: ProcedureReturnTarget
  returnValue: unknown
}

/**
 * 実行スレッド
 * Scratch VM の Thread クラスに対応。1つのスクリプト（Hat ブロックから始まるチェーン）を実行する。
 */
export class Thread {
  status: ThreadStatus = "running"
  /** 実行スタック: 現在実行中のブロック */
  private blockStack: ScriptBlock[] = []
  /** スタックフレーム: ブロックごとの状態（ループカウンタ等の状態保持用） */
  private frameStack: StackFrame[] = []
  /** カスタム手続き呼び出しフレーム */
  private procedureFrames: ProcedureFrame[] = []
  /** Promise 待機中 */
  pendingPromise: Promise<void> | null = null
  /** スプライト ID */
  readonly spriteId: string
  /** この Thread を生成した Hat ブロックの ID（リスタート判定用） */
  readonly hatBlockId: string | null
  /** Hat ブロックから渡されるコンテキスト（変数の新旧値、イベントデータ等） */
  context: Record<string, unknown> = {}
  /** 直近のカスタム手続きの戻り値 */
  private lastProcedureReturnValue: unknown = ""

  constructor(topBlock: ScriptBlock, spriteId: string, hatBlockId: string | null = null) {
    this.spriteId = spriteId
    this.hatBlockId = hatBlockId
    this.pushBlock(topBlock)
  }

  get currentBlock(): ScriptBlock | null {
    return this.blockStack.length > 0
      ? this.blockStack[this.blockStack.length - 1]
      : null
  }

  get currentFrame(): StackFrame {
    if (this.frameStack.length === 0) {
      const frame: StackFrame = {}
      this.frameStack.push(frame)
      return frame
    }
    return this.frameStack[this.frameStack.length - 1]
  }

  get stackDepth(): number {
    return this.blockStack.length
  }

  get isFinished(): boolean {
    return this.status === "done"
  }

  get latestProcedureReturnValue(): unknown {
    return this.lastProcedureReturnValue
  }

  pushBlock(block: ScriptBlock) {
    this.blockStack.push(block)
    this.frameStack.push({})
  }

  popBlock() {
    this.blockStack.pop()
    this.frameStack.pop()
  }

  /** 次のブロックに進む */
  advanceToNext() {
    const current = this.currentBlock
    if (!current) {
      this.status = "done"
      return
    }

    if (current.next) {
      this.popBlock()
      this.pushBlock(current.next)
      return
    }

    this.popBlock()

    if (this.finishProcedureIfNeeded()) {
      return
    }

    if (this.blockStack.length === 0) {
      this.status = "done"
    }
  }

  /** C-block の body を実行開始 */
  startBranch(branchIndex: number, isLoop: boolean) {
    const current = this.currentBlock
    if (!current) return

    const branch = current.branches[branchIndex]
    if (branch) {
      if (isLoop) {
        // ループの場合: 現在のブロックはスタックに残し、body を push
        this.pushBlock(branch)
      } else {
        // 非ループの場合: 現在を pop してから body を push し、next を push
        const next = current.next
        this.popBlock()
        if (next) this.pushBlock(next)
        this.pushBlock(branch)
      }
    } else if (!isLoop) {
      // body が空なら next に進む
      this.advanceToNext()
    }
    // isLoop で body が空なら → カウンタ続行、次のティックで再実行
  }

  beginProcedureCall(options: {
    procedureId: string
    entryBlock: ScriptBlock
    argBindings: BlockArgs
    returnTarget: ProcedureReturnTarget
    callerBlockId: string | null
    pushEntry?: boolean
  }) {
    const {
      procedureId,
      entryBlock,
      argBindings,
      returnTarget,
      callerBlockId,
      pushEntry = true,
    } = options
    this.procedureFrames.push({
      procedureId,
      callerBlockId,
      callerDepth: pushEntry ? this.blockStack.length : Math.max(this.blockStack.length - 1, 0),
      argBindings,
      returnTarget,
      returnValue: "",
    })
    if (pushEntry) {
      this.pushBlock(entryBlock)
    }
  }

  hasActiveProcedure(): boolean {
    return this.procedureFrames.length > 0
  }

  getProcedureArgument(paramId: string): unknown {
    for (let index = this.procedureFrames.length - 1; index >= 0; index -= 1) {
      const frame = this.procedureFrames[index]
      if (paramId in frame.argBindings) {
        return frame.argBindings[paramId]
      }
    }
    return ""
  }

  returnFromProcedure(value: unknown) {
    const frame = this.procedureFrames[this.procedureFrames.length - 1]
    if (!frame) {
      this.advanceToNext()
      return
    }

    frame.returnValue = value
    this.lastProcedureReturnValue = value

    while (this.blockStack.length > frame.callerDepth) {
      this.popBlock()
    }

    this.finishTopProcedureFrame()
  }

  getLoopVariable(name: string): unknown {
    for (let index = this.frameStack.length - 1; index >= 0; index -= 1) {
      const frame = this.frameStack[index]
      // for-range ループ変数
      const forRangeState = frame?.forRangeState as
        | { name?: unknown; activeValue?: unknown }
        | undefined
      if (forRangeState?.name === name) {
        return forRangeState.activeValue
      }
      // for-each ループ変数
      const forEachState = frame?.forEachState as
        | { name?: unknown; activeValue?: unknown }
        | undefined
      if (forEachState?.name === name) {
        return forEachState.activeValue
      }
    }
    return undefined
  }

  /** 直近のループを抜ける（break） */
  breakCurrentLoop() {
    // blockStack を遡り、ループブロック（C-block で body を持つもの）を見つけて pop
    // ループブロック = frameStack に loopCounter, forRangeState, forEachState のいずれかを持つ
    while (this.blockStack.length > 0) {
      const frame = this.frameStack[this.frameStack.length - 1]
      const isLoopFrame = frame &&
        (frame.loopCounter !== undefined || frame.forRangeState !== undefined || frame.forEachState !== undefined)
      if (isLoopFrame) {
        // ループブロック自体を pop して次に進む
        this.popBlock()
        if (this.blockStack.length === 0) {
          this.status = "done"
        }
        return
      }
      this.popBlock()
    }
    this.status = "done"
  }

  /** 直近のループの次のイテレーションへスキップ（continue） */
  continueCurrentLoop() {
    // blockStack を遡り、ループブロックまで pop する（ループブロック自体は残す）
    while (this.blockStack.length > 1) {
      const parentFrame = this.frameStack[this.frameStack.length - 2]
      const isParentLoop = parentFrame &&
        (parentFrame.loopCounter !== undefined || parentFrame.forRangeState !== undefined || parentFrame.forEachState !== undefined)
      if (isParentLoop) {
        // 現在のブロック（body 内）を pop → ループブロックに戻る
        this.popBlock()
        return
      }
      this.popBlock()
    }
  }

  private finishProcedureIfNeeded(): boolean {
    const frame = this.procedureFrames[this.procedureFrames.length - 1]
    if (!frame || this.blockStack.length !== frame.callerDepth) {
      return false
    }

    this.lastProcedureReturnValue = frame.returnValue
    this.finishTopProcedureFrame()
    return true
  }

  private finishTopProcedureFrame() {
    const frame = this.procedureFrames.pop()
    if (!frame) {
      if (this.blockStack.length === 0) {
        this.status = "done"
      }
      return
    }

    if (
      frame.returnTarget === "stack" &&
      frame.callerBlockId &&
      this.currentBlock?.id === frame.callerBlockId
    ) {
      this.advanceToNext()
      return
    }

    if (this.blockStack.length === 0) {
      this.status = "done"
    }
  }
}
