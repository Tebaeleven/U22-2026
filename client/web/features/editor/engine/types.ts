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
}
