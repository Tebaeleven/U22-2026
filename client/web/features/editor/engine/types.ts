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
}
