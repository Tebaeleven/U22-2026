// VM エンジンの型定義
export { STAGE_WIDTH, STAGE_HEIGHT } from "../constants"

export type PhysicsMode = "dynamic" | "static" | "none"

/** GameScene の物理関連メソッドへのプロキシ */
export interface GameSceneProxy {
  checkOverlap(idA: string, idB: string): boolean
  isOnGround(spriteId: string): boolean
  getMousePosition(): { x: number; y: number }
  setGravity(y: number): void
  setSpriteVelocity(id: string, vx: number, vy: number): void
  setSpritePhysicsMode(id: string, mode: PhysicsMode): void
  readPhysicsPositions(): { id: string; x: number; y: number; vx: number; vy: number }[]
  setWorldBounds(width: number, height: number): void
  /** スプライトのバウンス(反発係数)を設定 */
  setSpriteBounce(id: string, bounceX: number, bounceY: number): void
  /** スプライトのワールド境界衝突を設定 */
  setSpriteCollideWorldBounds(id: string, enabled: boolean): void
  /** スプライトの物理ボディの有効/無効を切り替え */
  setSpriteBodyEnabled(id: string, enabled: boolean): void
  /** 衝突コールバックを登録（2つのスプライト間の衝突時にイベントを発火） */
  registerCollisionCallback(idA: string, idB: string, callback: () => void): void
  /** クローン用：スプライトを削除 */
  removeSprite(id: string): void
  /** スプライトの位置を直接設定（dynamic スプライトの gotoxy 用） */
  setSpritePosition(id: string, x: number, y: number): void
  /** 個別の重力有効/無効 */
  setSpriteAllowGravity(id: string, enabled: boolean): void
  /** 色かぶせ */
  setSpriteTint(id: string, color: number): void
  /** 色かぶせ解除 */
  clearSpriteTint(id: string): void
  /** 透明度 (0〜1) */
  setSpriteOpacity(id: string, alpha: number): void
  /** 左右反転 */
  setSpriteFlipX(id: string, flip: boolean): void
  /** スプライトの Graphics レイヤーに矩形を描画 */
  graphicsFillRect(spriteId: string, x: number, y: number, w: number, h: number, color: number): void
  /** スプライトの Graphics レイヤーをクリア */
  graphicsClear(spriteId: string): void
  /** 浮遊テキスト表示 */
  showFloatingText(text: string, x: number, y: number): void
  /** スプライトを Tween で移動（Promise で完了通知） */
  tweenSprite(id: string, x: number, y: number, duration: number): Promise<void>
  // ── カメラ ──
  /** カメラをスプライトに追従させる */
  cameraFollow(spriteId: string): void
  /** カメラ追従を解除 */
  cameraStopFollow(): void
  /** カメラシェイク */
  cameraShake(duration: number, intensity: number): void
  /** カメラズーム */
  cameraZoom(scale: number): void
  /** カメラフェードアウト */
  cameraFade(duration: number): Promise<void>
  // ── Tween 拡張 ──
  /** スプライトのスケールを Tween でアニメーション */
  tweenSpriteScale(id: string, scale: number, duration: number): Promise<void>
  /** スプライトの透明度を Tween でアニメーション */
  tweenSpriteAlpha(id: string, alpha: number, duration: number): Promise<void>
  /** スプライトの角度を Tween でアニメーション */
  tweenSpriteAngle(id: string, angle: number, duration: number): Promise<void>
  // ── 回転 ──
  /** スプライトの描画回転角度を設定 */
  setSpriteAngle(id: string, angle: number): void
  // ── テキスト拡張 ──
  /** ID付きテキストを任意位置に追加 */
  addTextAt(spriteId: string, textId: string, text: string, x: number, y: number, size: number, color: string): void
  /** ID付きテキストの内容を更新 */
  updateTextAt(spriteId: string, textId: string, text: string): void
  /** ID付きテキストを削除 */
  removeTextAt(spriteId: string, textId: string): void
  // ── パーティクル ──
  /** ワールド座標にパーティクルを発射 */
  emitParticles(x: number, y: number, count: number, color: number, speed: number): void
  // ── シーン制御 ──
  /** カメラ・テキスト等をリセット（実行開始時） */
  resetEffects(): void
  /** シーンを一時停止（物理・Tween含む） */
  pauseScene(): void
  /** シーンを再開 */
  resumeScene(): void
  // ── Phase 1-2: 物理プロパティ拡張 ──
  /** 加速度設定 */
  setSpriteAcceleration(id: string, ax: number, ay: number): void
  /** 抗力設定 */
  setSpriteDrag(id: string, dx: number, dy: number): void
  /** ダンピング設定 */
  setSpriteDamping(id: string, enabled: boolean): void
  /** 最大速度設定 */
  setSpriteMaxVelocity(id: string, vx: number, vy: number): void
  /** 角速度設定 */
  setSpriteAngularVelocity(id: string, deg: number): void
  /** 不動体設定 */
  setSpriteImmovable(id: string, enabled: boolean): void
  /** 質量設定 */
  setSpriteMass(id: string, mass: number): void
  /** 押し出し可否設定 */
  setSpritePushable(id: string, enabled: boolean): void
  /** ワールドラップ */
  worldWrap(id: string, padding: number): void
  /** スプライトの速度の大きさを取得 */
  getSpriteSpeed(id: string): number
  /** ターゲットに向かって移動 */
  moveToObject(id: string, targetX: number, targetY: number, speed: number): void
  /** ターゲットに向かって加速 */
  accelerateToObject(id: string, targetX: number, targetY: number, acceleration: number): void
  /** 角度から速度を設定 */
  velocityFromAngle(id: string, angle: number, speed: number): void
  // ── Phase 3: 入力拡張 ──
  /** マウスボタンが押されているか */
  isMouseDown(): boolean
  /** マウスホイールのデルタ値を取得 */
  getMouseWheelDelta(): number
  /** スプライトのドラッグを有効化 */
  enableSpriteDrag(id: string): void
  /** スプライトのドラッグ位置を取得 */
  getSpriteDragPosition(id: string): { x: number; y: number } | null
  // ── Phase 4: Phaser API 拡張 ──
  /** 物理ボディのサイズを変更 */
  setSpriteBodySize(id: string, width: number, height: number): void
  /** 物理ボディのオフセットを設定 */
  setSpriteBodyOffset(id: string, ox: number, oy: number): void
  /** 円形の物理ボディに変更 */
  setSpriteCircle(id: string, radius: number): void
  /** スプライトの原点を設定 */
  setSpriteOrigin(id: string, x: number, y: number): void
  /** スクロールファクターを設定 */
  setSpriteScrollFactor(id: string, x: number, y: number): void
  /** 背景色を設定 */
  setBackgroundColor(color: string): void
}

export type BlockArgs = Record<string, unknown>

export type ProcedureReturnTarget = "stack" | "reporter"

export interface StackFrame {
  [key: string]: unknown
}

export interface BlockUtil {
  /** 現在のスレッドのスタックフレーム（ループカウンタ等の状態保持用） */
  stackFrame: StackFrame
  /** C-block の body を実行する */
  startBranch: (branchIndex: number, isLoop: boolean) => void
  /** スレッドを一定時間 yield する */
  yield: () => void
  /** スプライトの状態を取得 */
  getSprite: () => SpriteRuntime
  /** 全スプライト取得 */
  getAllSprites: () => SpriteRuntime[]
  /** 名前でスプライトを取得（O(1)） */
  getSpriteByName: (name: string) => SpriteRuntime | undefined
  /** ステージ幅・高さ */
  stageWidth: number
  stageHeight: number
  /** スレッドコンテキストから値を取得（Observer の新しい値/前の値、イベントデータ用） */
  getContext: (key: string) => unknown
  /** 変数の値を取得 */
  getVariable: (name: string) => unknown
  /** 現在アクティブな for ループ変数の値を取得 */
  getLoopVariable: (name: string) => unknown
  /** 変数の値を設定（Observer 通知をトリガー） */
  setVariable: (name: string, value: unknown) => void
  /** 値付きイベントを送信 */
  sendEvent: (name: string, data: unknown) => void
  /** 変数監視を停止 */
  disableWatcher: (varName: string) => void
  /** キーが現在押されているか */
  isKeyPressed: (key: string) => boolean
  /** マウスの X 座標（ステージ座標系） */
  getMouseX: () => number
  /** マウスの Y 座標（ステージ座標系） */
  getMouseY: () => number
  /** GameScene プロキシ（物理演算・当たり判定用） */
  getScene: () => GameSceneProxy | null
  /** クローンを生成（元スプライトIDを渡す。省略時は自分自身） */
  createClone: (targetId?: string) => void
  /** このクローンを削除 */
  deleteClone: () => void
  /** 衝突コールバックを登録 */
  onCollide: (targetName: string, callbackEvent: string) => void
  /** 現在の衝突コンテキストからターゲット名を取得 */
  getCollisionTarget: () => string
  /** ゲームをリスタート */
  restartGame: () => void
  /** 一時停止を考慮した現在時刻（Date.now() から一時停止中の累計時間を差し引いた値） */
  now: () => number
  // ── タイマー ──
  /** 周期的にイベントを発火するインターバルを登録 */
  addInterval: (eventName: string, ms: number) => void
  /** インターバルを解除 */
  removeInterval: (eventName: string) => void
  /** 一定時間後にイベントを発火するタイムアウトを登録 */
  addTimeout: (eventName: string, ms: number) => void
  // ── 制御拡張 ──
  /** 直近のループを抜ける */
  breakLoop: () => void
  /** 直近のループの次のイテレーションへスキップ */
  continueLoop: () => void
  /** body を新スレッドとして生成する */
  spawnThread: () => void
  // ── シーン ──
  /** シーンを切り替える */
  switchScene: (name: string) => void
  /** 現在のシーン名を取得 */
  getCurrentScene: () => string
  /** タイムスケールを設定 */
  setTimeScale: (scale: number) => void
  // ── バッチ ──
  /** バッチモード開始（Observer 通知を遅延する） */
  beginBatch: () => void
  /** バッチモード終了（溜まった通知をフラッシュする） */
  endBatch: () => void
  // ── Live Variable ──
  /** Live 変数を登録（式ブロックを保存し、依存変数変更時に自動再計算） */
  registerLiveVariable: (name: string, expressionBlock: ScriptBlock) => void
}

export type BlockFunction = (
  args: BlockArgs,
  util: BlockUtil
) => void | Promise<void> | unknown

export type ThreadStatus =
  | "running"
  | "yield"
  | "yield_tick"
  | "promise_wait"
  | "done"

export interface ScriptBlock {
  id: string
  opcode: string
  args: BlockArgs
  next: ScriptBlock | null
  /** C-block の body（branches[0] = if body, branches[1] = else body） */
  branches: (ScriptBlock | null)[]
  /** スロットにネストされた Reporter/Boolean ブロック（引数名 → ScriptBlock） */
  inputBlocks: Record<string, ScriptBlock>
}

export interface CompiledEventScript {
  opcode: string
  script: ScriptBlock
  /** Run 開始時点の Hat 引数スナップショット */
  hatArgs: Record<string, unknown>
  hatBlockId: string
}

export interface CompiledProcedure {
  procedureId: string
  defineBlockId: string
  returnsValue: boolean
  parameterIds: string[]
  script: ScriptBlock | null
}

export interface CompiledProgram {
  eventScripts: CompiledEventScript[]
  procedures: Record<string, CompiledProcedure>
}

export interface SpriteRuntime {
  id: string
  name: string
  x: number
  y: number
  direction: number
  size: number
  visible: boolean
  sayText: string
  sayTextX: number
  sayTextY: number
  sayTimer: number | null
  /** 現在のコスチュームインデックス */
  costumeIndex: number
  /** コスチューム総数 */
  costumeCount: number
  /** 物理モード: none=従来通りVMが位置管理, static=衝突有効だが不動, dynamic=重力・速度・衝突応答あり */
  physicsMode: PhysicsMode
  /** X方向速度（physicsMode === "dynamic" 時に使用） */
  velocityX: number
  /** Y方向速度（physicsMode === "dynamic" 時に使用） */
  velocityY: number
  /** クローン元のスプライトID（クローンでなければ undefined） */
  parentId?: string
  /** 物理ボディが有効か */
  bodyEnabled: boolean
  /** 反発係数 (0〜1) */
  bounce: number
  /** ワールド境界と衝突するか */
  collideWorldBounds: boolean
  /** 個別の重力有効フラグ（null = physicsMode に従う） */
  allowGravity: boolean | null
  /** 透明度 (0〜100) */
  opacity: number
  /** 色かぶせ（null = なし） */
  tint: number | null
  /** 左右反転 */
  flipX: boolean
  /** 描画回転角度（direction とは独立） */
  angle: number
  // ── Phase 1-2: 物理プロパティ拡張 ──
  /** X方向加速度 (px/s²) */
  accelerationX: number
  /** Y方向加速度 (px/s²) */
  accelerationY: number
  /** X方向抗力 */
  dragX: number
  /** Y方向抗力 */
  dragY: number
  /** ダンピング方式の抗力を使用するか */
  useDamping: boolean
  /** X方向最大速度 */
  maxVelocityX: number
  /** Y方向最大速度 */
  maxVelocityY: number
  /** 角速度 (deg/s) */
  angularVelocity: number
  /** 不動体フラグ */
  immovable: boolean
  /** 質量 */
  mass: number
  /** 押し出し可能フラグ */
  pushable: boolean
  // ── Phase 3: 入力拡張 ──
  /** マウスボタンが押されているか */
  mouseDown: boolean
  /** マウスホイールのデルタ値 */
  mouseWheelDelta: number
  // ── 状態マシン ──
  /** 現在の状態名 */
  currentState: string
  // ── レイヤー ──
  /** 描画レイヤー（大きいほど手前） */
  layer: number
  // ── タグ ──
  /** スプライトに付けられたタグの集合 */
  tags: Set<string>
  // ── 内部フラグ ──
  /** VM 側で velocity を変更したときに true にする（Phaser への書き戻しを制御） */
  _velocityDirty: boolean
}
