import { Thread } from "./thread"
import { Sequencer } from "./sequencer"
import type {
  CompiledProcedure,
  CompiledProgram,
  GameSceneProxy,
  PhysicsMode,
  ScriptBlock,
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
  // --- Observer: バッチ更新 ---
  private batchDepth = 0
  private batchPending: Map<string, { oldValue: unknown; newValue: unknown }> = new Map()
  // --- Live Variable: 依存追跡・自動再計算 ---
  private liveVariables: Array<{
    name: string
    spriteId: string
    expressionBlock: ScriptBlock
    deps: string[]
  }> = []
  // --- クローン管理 ---
  private cloneCounter = 0
  private spriteDefs: SpriteDef[] = []
  // --- 接触イベント購読（spriteId → [{targetName, eventName}]） ---
  private collisionCallbacks: Map<string, Array<{ targetName: string; eventName: string }>> = new Map()
  // --- contact state ---
  private previousContactPairs = new Set<string>()
  private currentContactMap: Map<string, Set<string>> = new Map()
  private beganContactMap: Map<string, Set<string>> = new Map()
  // --- タイマー管理 ---
  private intervals: Map<string, { eventName: string; ms: number; elapsed: number }> = new Map()
  private timeouts: Map<string, { eventName: string; ms: number; elapsed: number }> = new Map()
  private lastTickTime = 0
  // --- 一時停止の累計時間 ---
  private pausedAt = 0
  private totalPausedDuration = 0
  // --- リスタート要求 ---
  private restartRequested = false
  // --- シーン管理 ---
  private currentScene = "default"
  private timeScale = 1
  // --- パフォーマンス最適化用キャッシュ ---
  private spriteArrayCache: SpriteRuntime[] | null = null
  private spriteNameIndex: Map<string, SpriteRuntime[]> = new Map()
  private _hasWaitingScripts = false

  /** 実行速度モードを設定 */
  setSpeedMode(mode: "normal" | "fast" | "turbo") {
    this.sequencer.speedMode = mode
  }

  getSpeedMode(): "normal" | "fast" | "turbo" {
    return this.sequencer.speedMode
  }

  /** 外部コールバック: スプライト状態が更新された時 */
  onSpritesUpdate: ((sprites: SpriteRuntime[]) => void) | null = null
  /** 外部コールバック: 実行が停止した時 */
  onStop: (() => void) | null = null
  /** 外部コールバック: リスタート要求時 */
  onRestart: (() => void) | null = null

  constructor() {
    this.sequencer = new Sequencer({
      getSprite: (id) => this.sprites.get(id),
      getAllSprites: () => this.getSpriteArray(),
      getSpriteByName: (name) => this.getSpriteByName(name),
      getVariable: (name) => this.getVariable(name),
      setVariable: (name, value) => this.setVariable(name, value),
      getSpriteVariable: (spriteName, varName) => this.getVariable(`${spriteName}::${varName}`),
      setSpriteVariable: (spriteName, varName, value) => this.setVariable(`${spriteName}::${varName}`, value),
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
      createClone: (requestingSpriteId, targetId) => this.createClone(requestingSpriteId, targetId),
      deleteClone: (spriteId) => this.deleteClone(spriteId),
      registerCollisionCallback: (spriteId, targetName, eventName) => {
        this.registerCollisionCallback(spriteId, targetName, eventName)
      },
      restartGame: () => this.requestRestart(),
      now: () => this.now(),
      addInterval: (spriteId, eventName, ms) => this.addInterval(spriteId, eventName, ms),
      removeInterval: (spriteId, eventName) => this.removeInterval(spriteId, eventName),
      addTimeout: (spriteId, eventName, ms) => this.addTimeout(spriteId, eventName, ms),
      spawnThread: (spriteId, script) => this.spawnNewThread(spriteId, script),
      switchScene: (name) => { this.currentScene = name },
      getCurrentScene: () => this.currentScene,
      setTimeScale: (scale) => { this.timeScale = scale },
      beginBatch: () => this.beginBatch(),
      endBatch: () => this.endBatch(),
      registerLiveVariable: (spriteId, name, expressionBlock) =>
        this.registerLiveVariable(spriteId, name, expressionBlock),
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
    this.scene?.resetEffects()
    this.spriteDefs = spriteDefs
    this.cloneCounter = 0
    this.totalPausedDuration = 0
    this.pausedAt = 0
    this.collisionCallbacks.clear()
    this.previousContactPairs.clear()
    this.currentContactMap.clear()
    this.beganContactMap.clear()

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
        sayTextX: 0,
        sayTextY: 0,
        sayTimer: null,
        costumeIndex: def.currentCostumeIndex,
        costumeCount: def.costumes.length,
        costumeNames: def.costumes.map(c => c.name),
        costumeSizes: def.costumes.map(c => [c.width, c.height]),
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
        currentState: "default",
        layer: 0,
        tags: new Set<string>(),
        _velocityDirty: false,
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

    this.invalidateSpriteCache()
    this.recomputeHasWaitingScripts()
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
    this.liveVariables = []
    this.intervals.clear()
    this.timeouts.clear()
    this.lastTickTime = 0
    this.cloneCounter = 0
    this.spriteDefs = []
    this.collisionCallbacks.clear()
    this.previousContactPairs.clear()
    this.currentContactMap.clear()
    this.beganContactMap.clear()
    this.restartRequested = false
    this.spriteArrayCache = null
    this.spriteNameIndex.clear()
    this._hasWaitingScripts = false

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
    this.pausedAt = Date.now()
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
    this.scene?.pauseScene()
  }

  resume() {
    if (!this.running || !this.paused) return
    this.totalPausedDuration += Date.now() - this.pausedAt
    this.paused = false
    this.lastTickTime = 0
    this.scene?.resumeScene()
    this.tick()
  }

  /** 一時停止中に1フレームだけ実行する（ステップ実行） */
  stepOnce() {
    if (!this.running || !this.paused) return

    this.paused = false
    this.inTick = true

    // 物理位置の同期
    if (this.scene) {
      const physPositions = this.scene.readPhysicsPositions()
      for (const p of physPositions) {
        const sprite = this.sprites.get(p.id)
        if (sprite && sprite.physicsMode === "dynamic") {
          sprite.x = p.x
          sprite.y = p.y
          sprite.velocityX = p.vx
          sprite.velocityY = p.vy
          sprite.grounded = p.grounded
        }
      }
    }

    this.threads = this.sequencer.stepThreads(this.threads)

    this.refreshContacts()
    this.checkCollisionCallbacks()
    this.checkTouchEvents()

    if (this.scene) {
      for (const sprite of this.sprites.values()) {
        if (sprite.physicsMode === "dynamic" && sprite._velocityDirty) {
          this.scene.setSpriteVelocity(sprite.id, sprite.velocityX, sprite.velocityY)
          sprite._velocityDirty = false
        }
      }
    }

    this.updateTimers()
    this.onSpritesUpdate?.(this.getSpriteStates())

    // 全スレッド完了チェック
    if (this.threads.length === 0 && !this._hasWaitingScripts) {
      this.running = false
      this.inTick = false
      this.onStop?.()
      return
    }

    if (this.restartRequested) {
      this.restartRequested = false
      this.inTick = false
      this.onRestart?.()
      return
    }

    this.inTick = false
    this.paused = true
  }

  /** 一時停止を考慮した現在時刻を返す */
  now(): number {
    if (this.paused) {
      return this.pausedAt - this.totalPausedDuration
    }
    return Date.now() - this.totalPausedDuration
  }

  get isRunning(): boolean {
    return this.running
  }

  get isPaused(): boolean {
    return this.paused
  }

  /** スプライトの現在の状態を取得 */
  getSpriteStates(): SpriteRuntime[] {
    return [...this.getSpriteArray()]
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

  /** スプライトキャッシュを無効化し、名前インデックスを再構築 */
  private invalidateSpriteCache() {
    this.spriteArrayCache = null
    this.spriteNameIndex.clear()
    for (const sprite of this.sprites.values()) {
      const list = this.spriteNameIndex.get(sprite.name)
      if (list) {
        list.push(sprite)
      } else {
        this.spriteNameIndex.set(sprite.name, [sprite])
      }
    }
  }

  /** キャッシュ済みのスプライト配列を返す */
  private getSpriteArray(): SpriteRuntime[] {
    if (!this.spriteArrayCache) {
      this.spriteArrayCache = Array.from(this.sprites.values())
    }
    return this.spriteArrayCache
  }

  /** 名前からスプライトを取得（O(1)） */
  private getSpriteByName(name: string): SpriteRuntime | undefined {
    return this.spriteNameIndex.get(name)?.[0]
  }

  /** hasWaitingScripts を再計算 */
  private recomputeHasWaitingScripts() {
    this._hasWaitingScripts = this.scripts.some(
      (s) =>
        s.opcode === "event_whenkeypressed" ||
        s.opcode === "observer_whenvarchanges" ||
        s.opcode === "observer_wheneventreceived" ||
        s.opcode === "clone_whencloned" ||
        s.opcode === "event_whentouched" ||
        s.opcode === "live_when" ||
        s.opcode === "live_upon"
    )
  }

  /** キーが現在押されているか（sensing_keypressed 用） */
  isKeyPressed(key: string): boolean {
    if (key === "any") return this.pressedKeys.size > 0
    return this.pressedKeys.has(key)
  }

  private tick = () => {
    if (!this.running || this.paused) return
    this.inTick = true

    if (this.scene) {
      const physPositions = this.scene.readPhysicsPositions()
      for (const p of physPositions) {
        const sprite = this.sprites.get(p.id)
        if (sprite && sprite.physicsMode === "dynamic") {
          sprite.x = p.x
          sprite.y = p.y
          sprite.velocityX = p.vx
          sprite.velocityY = p.vy
          sprite.grounded = p.grounded
        }
      }
    }

    // 速度モードに応じて1フレームあたりの実行回数を変える
    const stepsPerFrame = this.sequencer.speedMode === "turbo" ? 10
      : this.sequencer.speedMode === "fast" ? 3 : 1
    for (let i = 0; i < stepsPerFrame; i++) {
      this.threads = this.sequencer.stepThreads(this.threads)
      if (this.threads.length === 0) break
    }

    // 衝突コールバックのチェック
    this.refreshContacts()
    this.checkCollisionCallbacks()

    // event_whentouched の衝突チェック
    this.checkTouchEvents()

    if (this.scene) {
      for (const sprite of this.sprites.values()) {
        if (sprite.physicsMode === "dynamic" && sprite._velocityDirty) {
          this.scene.setSpriteVelocity(sprite.id, sprite.velocityX, sprite.velocityY)
          sprite._velocityDirty = false
        }
      }
    }

    // タイマー更新
    this.updateTimers()

    this.onSpritesUpdate?.(this.getSpriteStates())

    if (this.threads.length === 0 && !this._hasWaitingScripts) {
      this.running = false
      this.rafId = 0
      this.inTick = false
      this.onStop?.()
      return
    }

    if (this.restartRequested) {
      this.restartRequested = false
      this.inTick = false
      this.onRestart?.()
      return
    }

    this.inTick = false
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
  private inTick = false
  private ensureTickRunning() {
    if (this.inTick) return
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

      if (this.batchDepth > 0) {
        // バッチ中: 通知を遅延。最初の old 値を保持する
        if (!this.batchPending.has(name)) {
          this.batchPending.set(name, { oldValue: old, newValue: value })
        } else {
          this.batchPending.get(name)!.newValue = value
        }
      } else {
        this.onVariableChanged(name, old, value)
      }
    }
  }

  /** バッチモード開始 */
  beginBatch() {
    this.batchDepth++
  }

  /** バッチモード終了（溜まった通知をフラッシュ） */
  endBatch() {
    this.batchDepth--
    if (this.batchDepth === 0 && this.batchPending.size > 0) {
      const pending = new Map(this.batchPending)
      this.batchPending.clear()
      for (const [name, { oldValue, newValue }] of pending) {
        this.onVariableChanged(name, oldValue, newValue)
      }
    }
  }

  /** 変数変更時に Observer / Live スレッドを spawn + Live 変数を再計算 */
  private onVariableChanged(name: string, oldValue: unknown, newValue: unknown) {
    if (this.notifyingVariable === name) return
    this.notifyingVariable = name

    // Live 変数の再計算（依存変数が変わったら式を再評価）
    const changedLiveVars: string[] = []
    for (const lv of this.liveVariables) {
      if (lv.deps.includes(name)) {
        const value = this.sequencer.evaluateExpression(lv.expressionBlock, lv.spriteId)
        const oldLv = this.variables.get(lv.name)
        if (oldLv !== value) {
          this.variables.set(lv.name, value)
          changedLiveVars.push(lv.name)
        }
      }
    }

    // 変更された全変数（元の変数 + 連動更新された live 変数）に対してスクリプトを発火
    const allChanged = [name, ...changedLiveVars]
    for (const changedVar of allChanged) {
      const ctx = changedVar === name
        ? { newValue, oldValue }
        : { newValue: this.variables.get(changedVar), oldValue: undefined }

      const disabled = this.disabledWatchers.get(changedVar)
      for (const s of this.scripts) {
        // observer_whenvarchanges, live_when, live_upon の全てに対応
        const isMatch = s.opcode === "observer_whenvarchanges"
          || s.opcode === "live_when"
          || s.opcode === "live_upon"
        if (!isMatch) continue
        if (disabled?.has(s.spriteId)) continue

        const varName = String(s.hatArgs.VARIABLE ?? "")
        if (varName !== changedVar) continue

          this.restartThread(s.hatBlockId, s.spriteId, s.script, ctx)
      }
    }

    this.notifyingVariable = null
    this.ensureTickRunning()
  }

  /** Live 変数を登録: 式ブロックを保存し、依存変数を自動検出する */
  registerLiveVariable(spriteId: string, name: string, expressionBlock: ScriptBlock) {
    const deps = collectBlockDependencies(expressionBlock)
    this.liveVariables.push({ name, spriteId, expressionBlock, deps })
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

  // ─── クローン管理 ─────────────────────────────────────

  /** クローンを生成 */
  createClone(requestingSpriteId: string, targetId?: string) {
    const sourceId = targetId ?? requestingSpriteId
    const sourceSprite = this.sprites.get(sourceId)
    if (!sourceSprite) return

    this.cloneCounter += 1
    const cloneId = `${sourceId}__clone_${this.cloneCounter}`

    // クローンは複製元スプライト自身の状態を継承する。
    // 別スプライト対象の createClone は、事前に対象フィールドへ spawn 情報を
    // 明示的に書き込んでから onClone で反映する。
    const cloneSprite: SpriteRuntime = {
      ...sourceSprite,
      id: cloneId,
      parentId: sourceSprite.parentId ?? sourceId,
      x: sourceSprite.x,
      y: sourceSprite.y,
      grounded: false,
      sayText: "",
      sayTextX: 0,
      sayTextY: 0,
      sayTimer: null,
    }
    this.sprites.set(cloneId, cloneSprite)
    this.invalidateSpriteCache()

    // 元スプライトのスクリプトをクローンにも登録
    const parentId = cloneSprite.parentId
    for (const s of this.scripts) {
      if (s.spriteId !== parentId) continue
      this.scripts.push({
        opcode: s.opcode,
        script: s.script,
        hatBlockId: s.hatBlockId,
        spriteId: cloneId,
        hatArgs: s.hatArgs,
      })
    }

    this.recomputeHasWaitingScripts()

    // "clone_whencloned" スクリプトを起動
    for (const s of this.scripts) {
      if (s.spriteId !== cloneId) continue
      if (s.opcode !== "clone_whencloned") continue
      this.threads.push(new Thread(s.script, cloneId, s.hatBlockId))
    }

    this.ensureTickRunning()
  }

  /** クローンを削除 */
  deleteClone(spriteId: string) {
    const sprite = this.sprites.get(spriteId)
    if (!sprite || !sprite.parentId) return

    // スレッドを停止
    for (const t of this.threads) {
      if (t.spriteId === spriteId) t.status = "done"
    }

    // スクリプト登録を削除
    this.scripts = this.scripts.filter((s) => s.spriteId !== spriteId)

    // 衝突コールバックを削除
    this.collisionCallbacks.delete(spriteId)

    // スプライトを削除
    this.sprites.delete(spriteId)
    this.invalidateSpriteCache()
    this.recomputeHasWaitingScripts()

    // GameScene からも削除
    this.scene?.removeSprite(spriteId)
  }

  // ─── 衝突コールバック ────────────────────────────────

  /** 衝突コールバックを登録 */
  registerCollisionCallback(spriteId: string, targetName: string, eventName: string) {
    if (!this.collisionCallbacks.has(spriteId)) {
      this.collisionCallbacks.set(spriteId, [])
    }
    this.collisionCallbacks.get(spriteId)!.push({ targetName, eventName })
  }

  private refreshContacts() {
    if (!this.scene) {
      this.previousContactPairs.clear()
      this.currentContactMap.clear()
      this.beganContactMap.clear()
      return
    }

    const nextPairs = new Set<string>()
    const nextContactMap = new Map<string, Set<string>>()
    const beganContactMap = new Map<string, Set<string>>()

    for (const { idA, idB } of this.scene.readContactPairs()) {
      const key = this.getContactPairKey(idA, idB)
      nextPairs.add(key)
      this.addDirectedContact(nextContactMap, idA, idB)
      this.addDirectedContact(nextContactMap, idB, idA)

      if (!this.previousContactPairs.has(key)) {
        this.addDirectedContact(beganContactMap, idA, idB)
        this.addDirectedContact(beganContactMap, idB, idA)
      }
    }

    this.previousContactPairs = nextPairs
    this.currentContactMap = nextContactMap
    this.beganContactMap = beganContactMap
  }

  private addDirectedContact(map: Map<string, Set<string>>, fromId: string, toId: string) {
    const targets = map.get(fromId)
    if (targets) {
      targets.add(toId)
      return
    }
    map.set(fromId, new Set([toId]))
  }

  private getContactPairKey(idA: string, idB: string) {
    return [idA, idB].sort().join("::")
  }

  private getMatchingContacts(
    spriteId: string,
    targetName: string,
    contacts: Map<string, Set<string>>,
  ): SpriteRuntime[] {
    const targetIds = contacts.get(spriteId)
    if (!targetIds?.size) return []

    const matches: SpriteRuntime[] = []
    for (const targetId of targetIds) {
      const target = this.sprites.get(targetId)
      if (!target || !target.bodyEnabled) continue
      if (targetName !== "any" && target.name !== targetName) continue
      matches.push(target)
    }
    return matches
  }

  private emitCollisionEvent(name: string, collisionTarget: string, data: unknown) {
    for (const s of this.scripts) {
      if (s.opcode !== "observer_wheneventreceived") continue

      const eventName = String(s.hatArgs.EVENT_NAME ?? "")
      if (eventName !== name) continue

      this.restartThread(s.hatBlockId, s.spriteId, s.script, {
        eventData: data,
        collisionTarget,
      })
    }

    this.ensureTickRunning()
  }

  /** tick 内で衝突コールバックのチェック（begin のみ） */
  private checkCollisionCallbacks() {
    for (const [spriteId, callbacks] of this.collisionCallbacks) {
      const sprite = this.sprites.get(spriteId)
      if (!sprite) continue

      for (const { targetName, eventName } of callbacks) {
        const targets = this.getMatchingContacts(spriteId, targetName, this.beganContactMap)
        for (const target of targets) {
          this.emitCollisionEvent(eventName, target.name, {
            self: sprite.name,
            other: target.name,
          })
        }
      }
    }
  }

  // ─── タイマー管理 ─────────────────────────────────────

  addInterval(spriteId: string, eventName: string, ms: number) {
    const key = `${spriteId}:${eventName}`
    this.intervals.set(key, { eventName, ms, elapsed: 0 })
  }

  removeInterval(spriteId: string, eventName: string) {
    const key = `${spriteId}:${eventName}`
    this.intervals.delete(key)
  }

  addTimeout(spriteId: string, eventName: string, ms: number) {
    const key = `${spriteId}:${eventName}:${Date.now()}`
    this.timeouts.set(key, { eventName, ms, elapsed: 0 })
  }

  private updateTimers() {
    const now = this.now()
    const dt = this.lastTickTime > 0 ? now - this.lastTickTime : 16
    this.lastTickTime = now

    // インターバル
    for (const [, timer] of this.intervals) {
      timer.elapsed += dt
      if (timer.elapsed >= timer.ms) {
        timer.elapsed -= timer.ms
        this.emitEvent(timer.eventName, null)
      }
    }

    // タイムアウト
    const expired: string[] = []
    for (const [key, timer] of this.timeouts) {
      timer.elapsed += dt
      if (timer.elapsed >= timer.ms) {
        this.emitEvent(timer.eventName, null)
        expired.push(key)
      }
    }
    for (const key of expired) {
      this.timeouts.delete(key)
    }
  }

  /** リスタート要求 */
  /** body を新しいスレッドとして生成（spawn） */
  spawnNewThread(spriteId: string, script: ScriptBlock) {
    const newThread = new Thread(script, spriteId, null)
    this.threads.push(newThread)
  }

  requestRestart() {
    this.restartRequested = true
  }

  /** event_whentouched ハットの衝突チェック */
  private checkTouchEvents() {
    for (const s of this.scripts) {
      if (s.opcode !== "event_whentouched") continue

      const targetName = String(s.hatArgs.TARGET ?? "")
      const sprite = this.sprites.get(s.spriteId)
      if (!sprite || !sprite.bodyEnabled) continue

      const targets = this.getMatchingContacts(s.spriteId, targetName, this.beganContactMap)
      for (const target of targets) {
        this.restartThread(s.hatBlockId, s.spriteId, s.script, {
          collisionTarget: target.name,
        })
      }
    }
    // ensureTickRunning は不要（tick 内から呼ばれるため）
  }

  private getReporterPreviewKey(blockId: string, spriteId: string): string {
    return `${spriteId}:${blockId}`
  }
}

/** ScriptBlock ツリーを再帰走査し、data_variable の変数名を全て収集する */
function collectBlockDependencies(block: ScriptBlock): string[] {
  const deps = new Set<string>()
  walkBlock(block, deps)
  return [...deps]
}

function walkBlock(block: ScriptBlock, deps: Set<string>): void {
  if (block.opcode === "data_variable") {
    const varName = String(block.args.VARIABLE ?? "")
    if (varName) deps.add(varName)
  }
  for (const child of Object.values(block.inputBlocks)) {
    walkBlock(child, deps)
  }
  for (const branch of block.branches) {
    if (branch) walkBlockChain(branch, deps)
  }
}

function walkBlockChain(block: ScriptBlock | null, deps: Set<string>): void {
  let current = block
  while (current) {
    walkBlock(current, deps)
    current = current.next
  }
}
