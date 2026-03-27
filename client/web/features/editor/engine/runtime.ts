import { Thread } from "./thread"
import { Sequencer } from "./sequencer"
import type {
  CompiledProcedure,
  CompiledProgram,
  GameSceneProxy,
  SpriteRuntime,
} from "./types"
import type { SpriteDef } from "../constants"

/**
 * Runtime — ゲームのメインループ
 * Scratch VM の Runtime に対応。60FPS で実行され、スレッド管理・スプライト状態を管理する。
 */
export class Runtime {
  private threads: Thread[] = []
  private sequencer: Sequencer
  private sprites: Map<string, SpriteRuntime> = new Map()
  private running = false
  private paused = false
  private rafId = 0
  private scripts: Array<{
    opcode: string
    script: CompiledProgram["eventScripts"][number]["script"]
    spriteId: string
    hatBlockId: string
    hatArgs: CompiledProgram["eventScripts"][number]["hatArgs"]
  }> = []
  private procedures: Record<string, CompiledProcedure> = {}
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null
  private _keyupHandler: ((e: KeyboardEvent) => void) | null = null
  private pressedKeys = new Set<string>()
  /** GameScene への参照（物理演算・当たり判定用） */
  private scene: GameSceneProxy | null = null
  /** カスタム reporter の直近評価結果 */
  private reporterPreviewCache = new Map<string, unknown>()

  // --- Observer: 変数ストア ---
  private variables: Map<string, unknown> = new Map()
  // --- Observer: 監視停止リスト（変数名 → 停止したスプライトID集合） ---
  private disabledWatchers: Map<string, Set<string>> = new Map()
  // --- Observer: 再帰防止ガード ---
  private notifyingVariable: string | null = null

  /** 外部コールバック: スプライト状態が更新された時 */
  onSpritesUpdate: ((sprites: SpriteRuntime[]) => void) | null = null
  /** 外部コールバック: 実行が停止した時 */
  onStop: (() => void) | null = null

  constructor() {
    this.sequencer = new Sequencer({
      getSprite: (id) => this.sprites.get(id),
      getAllSprites: () => Array.from(this.sprites.values()),
      getVariable: (name) => this.getVariable(name),
      setVariable: (name, value) => this.setVariable(name, value),
      sendEvent: (name, data) => this.emitEvent(name, data),
      disableWatcher: (varName, spriteId) => this.disableWatcher(varName, spriteId),
      isKeyPressed: (key) => this.isKeyPressed(key),
      getMouseX: () => this.scene?.getMousePosition().x ?? 0,
      getMouseY: () => this.scene?.getMousePosition().y ?? 0,
      getScene: () => this.scene,
      getProcedure: (procedureId) => this.procedures[procedureId],
      cacheReporterPreview: (blockId, spriteId, value) => {
        this.reporterPreviewCache.set(this.getReporterPreviewKey(blockId, spriteId), value)
      },
    })
  }

  /**
   * 実行を開始
   * @param spriteDefs 初期スプライト定義
   * @param program スクリプトリストと手続き定義（buildScripts() の結果）
   */
  start(
    spriteDefs: SpriteDef[],
    programs: Record<string, CompiledProgram>,
    scene?: GameSceneProxy
  ) {
    this.stop()

    this.reporterPreviewCache.clear()
    this.scene = scene ?? null

    // 全スプライトのプロシージャをマージ
    this.procedures = {}
    for (const program of Object.values(programs)) {
      Object.assign(this.procedures, program.procedures)
    }

    this.sprites.clear()
    for (const def of spriteDefs) {
      this.sprites.set(def.id, {
        id: def.id,
        name: def.name,
        x: def.x,
        y: def.y,
        direction: def.direction,
        size: def.size,
        visible: def.visible,
        sayText: "",
        sayTimer: null,
        costumeIndex: def.currentCostumeIndex,
        costumeCount: def.costumes.length,
        physicsMode: "none",
        velocityX: 0,
        velocityY: 0,
      })
    }

    // 各スプライトに対応するプログラムのスクリプトのみを登録
    this.scripts = []
    for (const sprite of spriteDefs) {
      const program = programs[sprite.id] ?? { eventScripts: [], procedures: {} }
      for (const s of program.eventScripts) {
        this.scripts.push({
          opcode: s.opcode,
          script: s.script,
          hatBlockId: s.hatBlockId,
          spriteId: sprite.id,
          hatArgs: s.hatArgs,
        })
      }
    }

    this.threads = []
    for (const s of this.scripts) {
      if (s.opcode === "event_whenflagclicked") {
        this.threads.push(new Thread(s.script, s.spriteId, s.hatBlockId))
      }
    }

    this.pressedKeys.clear()
    const gameKeys = new Set(["space", "up arrow", "down arrow", "left arrow", "right arrow"])
    const keydownHandler = (e: KeyboardEvent) => {
      if (!this.running) return
      const key = this.normalizeKey(e.key)
      if (gameKeys.has(key)) {
        e.preventDefault()
      }
      this.pressedKeys.add(key)
      if (!e.repeat) {
        this.startKeyPressedScripts(key)
      }
    }
    const keyupHandler = (e: KeyboardEvent) => {
      const key = this.normalizeKey(e.key)
      if (gameKeys.has(key)) {
        e.preventDefault()
      }
      this.pressedKeys.delete(key)
    }
    this.keydownHandler = keydownHandler
    this._keyupHandler = keyupHandler
    if (typeof document !== "undefined") {
      document.addEventListener("keydown", keydownHandler)
      document.addEventListener("keyup", keyupHandler)
    }

    this.running = true
    this.tick()
  }

  stop() {
    this.running = false
    this.paused = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
    this.threads = []
    this.sprites.clear()
    this.scripts = []
    this.procedures = {}
    this.pressedKeys.clear()
    this.scene = null
    this.variables.clear()
    this.disabledWatchers.clear()
    this.notifyingVariable = null

    if (this.keydownHandler && typeof document !== "undefined") {
      document.removeEventListener("keydown", this.keydownHandler)
    }
    if (this._keyupHandler && typeof document !== "undefined") {
      document.removeEventListener("keyup", this._keyupHandler)
    }
    this.keydownHandler = null
    this._keyupHandler = null
  }

  pause() {
    if (!this.running || this.paused) return
    this.paused = true
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
  }

  resume() {
    if (!this.running || !this.paused) return
    this.paused = false
    this.tick()
  }

  get isRunning(): boolean {
    return this.running
  }

  get isPaused(): boolean {
    return this.paused
  }

  /** スプライトの現在の状態を取得 */
  getSpriteStates(): SpriteRuntime[] {
    return Array.from(this.sprites.values())
  }

  /** デバッグ用: スレッド情報を取得 */
  getThreads(): ReadonlyArray<Thread> {
    return this.threads
  }

  /** デバッグ用: 全変数を取得 */
  getVariables(): ReadonlyMap<string, unknown> {
    return this.variables
  }

  /** デバッグ用: 現在実行中の全ブロック ID を収集 */
  getExecutingBlockIds(): Set<string> {
    const ids = new Set<string>()
    for (const thread of this.threads) {
      const block = thread.currentBlock
      if (block && thread.status !== "done") {
        ids.add(block.id)
      }
    }
    return ids
  }

  getReporterPreview(blockId: string, spriteId?: string | null): unknown {
    if (!spriteId) return undefined
    return this.reporterPreviewCache.get(this.getReporterPreviewKey(blockId, spriteId))
  }

  /** デバッグ用: VM 内部情報を取得 */
  getVMInfo() {
    return {
      threadCount: this.threads.length,
      scriptCount: this.scripts.length,
      procedureCount: Object.keys(this.procedures).length,
      variableCount: this.variables.size,
      disabledWatcherCount: this.disabledWatchers.size,
      pressedKeys: Array.from(this.pressedKeys),
      isPaused: this.paused,
      threads: this.threads.map((t) => ({
        status: t.status,
        spriteId: t.spriteId,
        currentOpcode: t.currentBlock?.opcode ?? null,
        stackDepth: t.stackDepth,
        hatBlockId: t.hatBlockId,
        context: t.context,
      })),
    }
  }

  /** Scratch のキー名に正規化 */
  private normalizeKey(key: string): string {
    const map: Record<string, string> = {
      " ": "space",
      ArrowUp: "up arrow",
      ArrowDown: "down arrow",
      ArrowLeft: "left arrow",
      ArrowRight: "right arrow",
    }
    return map[key] ?? key.toLowerCase()
  }

  /** 「_キーが押されたとき」スクリプトのスレッドを生成 */
  private startKeyPressedScripts(key: string) {
    for (const s of this.scripts) {
      if (s.opcode !== "event_whenkeypressed") continue

      const keyOption = String(s.hatArgs.KEY_OPTION ?? "")

      if (keyOption !== key && keyOption !== "any") continue

      this.restartThread(s.hatBlockId, s.spriteId, s.script)
    }

    this.ensureTickRunning()
  }

  /** キーが現在押されているか（sensing_keypressed 用） */
  isKeyPressed(key: string): boolean {
    if (key === "any") return this.pressedKeys.size > 0
    return this.pressedKeys.has(key)
  }

  private tick = () => {
    if (!this.running || this.paused) return

    if (this.scene) {
      const physPositions = this.scene.readPhysicsPositions()
      for (const p of physPositions) {
        const sprite = this.sprites.get(p.id)
        if (sprite && sprite.physicsMode === "dynamic") {
          sprite.x = p.x
          sprite.y = p.y
          sprite.velocityX = p.vx
          sprite.velocityY = p.vy
        }
      }
    }

    this.threads = this.sequencer.stepThreads(this.threads)

    if (this.scene) {
      for (const sprite of this.sprites.values()) {
        if (sprite.physicsMode === "dynamic") {
          this.scene.setSpriteVelocity(sprite.id, sprite.velocityX, sprite.velocityY)
        }
      }
    }

    this.onSpritesUpdate?.(this.getSpriteStates())

    const hasWaitingScripts = this.scripts.some(
      (s) =>
        s.opcode === "event_whenkeypressed" ||
        s.opcode === "observer_whenvarchanges" ||
        s.opcode === "observer_wheneventreceived"
    )

    if (this.threads.length === 0 && !hasWaitingScripts) {
      this.running = false
      this.rafId = 0
      this.onStop?.()
      return
    }

    this.rafId = requestAnimationFrame(this.tick)
  }

  /** 同じ Hat + スプライトの既存スレッドを kill し、新しいスレッドを生成 */
  private restartThread(
    hatBlockId: string,
    spriteId: string,
    script: CompiledProgram["eventScripts"][number]["script"],
    context?: Record<string, unknown>
  ): Thread {
    for (const t of this.threads) {
      if (t.hatBlockId === hatBlockId && t.spriteId === spriteId) {
        t.status = "done"
      }
    }
    const thread = new Thread(script, spriteId, hatBlockId)
    if (context) thread.context = context
    this.threads.push(thread)
    return thread
  }

  /** スレッドが追加された後にループを再開するヘルパー */
  private ensureTickRunning() {
    if (this.threads.length > 0 && !this.rafId && !this.paused && this.running) {
      this.tick()
    }
  }

  /** 変数の値を取得 */
  getVariable(name: string): unknown {
    return this.variables.get(name)
  }

  /** 変数の値を設定（値が変わった場合 Observer に通知） */
  setVariable(name: string, value: unknown) {
    const old = this.variables.get(name)
    this.variables.set(name, value)
    if (old !== value) {
      this.onVariableChanged(name, old, value)
    }
  }

  /** 変数変更時に Observer スレッドを spawn */
  private onVariableChanged(name: string, oldValue: unknown, newValue: unknown) {
    if (this.notifyingVariable === name) return
    this.notifyingVariable = name

    const disabled = this.disabledWatchers.get(name)
    for (const s of this.scripts) {
      if (s.opcode !== "observer_whenvarchanges") continue
      if (disabled?.has(s.spriteId)) continue

      const varName = String(s.hatArgs.VARIABLE ?? "")
      if (varName !== name) continue

      this.restartThread(s.hatBlockId, s.spriteId, s.script, { newValue, oldValue })
    }

    this.notifyingVariable = null
    this.ensureTickRunning()
  }

  /** イベントを送信し、対応する Observer スレッドを spawn */
  emitEvent(name: string, data: unknown) {
    for (const s of this.scripts) {
      if (s.opcode !== "observer_wheneventreceived") continue

      const eventName = String(s.hatArgs.EVENT_NAME ?? "")
      if (eventName !== name) continue

      this.restartThread(s.hatBlockId, s.spriteId, s.script, { eventData: data })
    }

    this.ensureTickRunning()
  }

  /** 特定のスプライトの変数監視を停止 */
  disableWatcher(varName: string, spriteId: string) {
    if (!this.disabledWatchers.has(varName)) {
      this.disabledWatchers.set(varName, new Set())
    }
    this.disabledWatchers.get(varName)?.add(spriteId)
  }

  private getReporterPreviewKey(blockId: string, spriteId: string): string {
    return `${spriteId}:${blockId}`
  }
}
