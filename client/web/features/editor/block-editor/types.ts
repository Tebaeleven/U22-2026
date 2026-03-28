// ブロックエディタの型定義
import type { AutoLayout, Connector, Container, Position } from "headless-vpl"

// ─── ブロック形状 ───

/** ブロックの形状を表す識別子 */
export type BlockShape =
  | "hat"
  | "stack"
  | "c-block"
  | "c-block-else"
  | "cap-c"
  | "reporter"
  | "boolean"

/** 値を返すブロック形状（スロットにはめ込み可能） */
export type ValueBlockShape = "reporter" | "boolean"

// ─── カスタム手続き（マイブロック） ───

/** 手続きパラメータの値型 */
export type ProcedureParamType = "text" | "number"

/** カスタム手続きのパラメータ定義 */
export type CustomProcedureParam = {
  id: string
  name: string
  valueType: ProcedureParamType
}

/** 手続きのトークン（ラベルまたはパラメータ参照） */
export type CustomProcedureToken =
  | {
      id: string
      type: "label"
      text: string
    }
  | {
      id: string
      type: "param"
      paramId: string
    }

/** カスタム手続きの定義情報 */
export type CustomProcedure = {
  id: string
  name: string
  tokens: CustomProcedureToken[]
  params: CustomProcedureParam[]
  returnsValue: boolean
}

// ─── ブロックソース（ブロックの生成元） ───

/** ビルトインブロック */
export type BuiltinBlockSource = {
  kind: "builtin"
}

/** マイブロック定義の初期テンプレート */
export type StarterDefineBlockSource = {
  kind: "starter-define"
}

/** カスタム手続きのディファインブロック */
export type CustomDefineBlockSource = {
  kind: "custom-define"
  procedureId: string
}

/** カスタム手続きのコールブロック */
export type CustomCallBlockSource = {
  kind: "custom-call"
  procedureId: string
}

/** カスタム手続きの引数ブロック */
export type CustomArgumentBlockSource = {
  kind: "custom-argument"
  procedureId: string
  paramId: string
}

/** カスタム手続きの戻り値ブロック */
export type CustomReturnBlockSource = {
  kind: "custom-return"
}

/** ブロックの生成元を表す判別共用体 */
export type BlockSource =
  | BuiltinBlockSource
  | StarterDefineBlockSource
  | CustomDefineBlockSource
  | CustomCallBlockSource
  | CustomArgumentBlockSource
  | CustomReturnBlockSource

// ─── ブロック定義・入力 ───

/** ハットブロック上のヘッダーレポーターコピー定義 */
export type HeaderReporterCopy = {
  label?: string
  labelInputIndex?: number
  blockName?: string
  targetOpcode?: string
  targetShape?: ValueBlockShape
  inputBindings?: Record<number, number>
}

/** ブロックの入力スロット定義（ラベル・数値・テキスト・ドロップダウン等） */
export type InputDef =
  | {
      type: "number"
      default: number
      placeholder?: string
      paramId?: string
      minWidth?: number
      maxWidth?: number
    }
  | {
      type: "text"
      default: string
      placeholder?: string
      paramId?: string
      minWidth?: number
      maxWidth?: number
    }
  | {
      type: "variable-name"
      default: string
      placeholder?: string
      editable?: boolean
      appearance?: "inline-reporter"
      copySource?: HeaderReporterCopy
      minWidth?: number
      maxWidth?: number
    }
  | {
      type: "dropdown"
      default: string
      options: string[]
      minWidth?: number
      maxWidth?: number
    }
  | {
      type: "param-chip"
      paramId: string
      label: string
      valueType: ProcedureParamType
    }
  | {
      type: "boolean-slot"
      minWidth?: number
      maxWidth?: number
    }
  | { type: "label"; text: string }

/** ブロックのカテゴリ（パレットのタブに対応） */
export type BlockCategory =
  | "motion"
  | "looks"
  | "sound"
  | "events"
  | "control"
  | "sensing"
  | "operators"
  | "variables"
  | "lists"
  | "myblocks"
  | "physics"

/** ブロックの型定義。形状・色・入力・カテゴリ・オペコードを持つ */
export type BlockDef = {
  id: string
  name: string
  opcode?: string
  shape: BlockShape
  color: string
  inputs: InputDef[]
  category: BlockCategory
  source: BlockSource
  headerReporterCopies?: HeaderReporterCopy[]
  paletteHidden?: boolean
}

// ─── ランタイム状態 ───

/** ブロック1つの実行時状態。定義と入力値を持つ */
export type BlockState = {
  id: string
  def: BlockDef
  inputValues: Record<number, string>
}

/** Cブロックのレイアウト情報。ボディレイアウト・エントリコネクタ・ボトムコネクタへの参照 */
export type CBlockRef = {
  container: Container
  bodyLayouts: AutoLayout[]
  bodyEntryConnectors: Array<Connector | null>
  bottomConnector: Connector | null
}

/** スロット（レポーター/ブーリアンのはめ込み位置）の幾何情報 */
export type SlotInfo = {
  inputIndex: number
  x: number
  y: number
  w: number
  h: number
  acceptedShapes: ValueBlockShape[]
}

/** スロットのAutoLayoutとコネクタへの参照 */
export type SlotLayoutRef = {
  info: SlotInfo
  layout: AutoLayout
  connector: Connector | null
}

/** ワークスペース上に配置されたブロック。コンテナ・コネクタ・状態を一括管理 */
export type CreatedBlock = {
  container: Container
  topConn: Connector | null
  bottomConn: Connector | null
  cBlockRef: CBlockRef | null
  slotLayouts: SlotLayoutRef[]
  valueConnector: Connector | null
  state: BlockState
}

/** ブロックの状態・コンテナ・生成情報のレジストリ */
export type BlockRegistry = {
  blockMap: Map<string, BlockState>
  createdMap: Map<string, CreatedBlock>
  containerMap: Map<string, Container>
}

// ─── シリアライズ ───

/** シリアライズされたブロック1つの永続化データ */
export type SerializedBlockNode = {
  instanceId: string
  defId: string
  inputValues: Record<string, string>
  position: {
    x: number
    y: number
  }
  nextId: string | null
  bodyChildren: string[][]
  slotChildren: Record<string, string>
}

/** ワークスペース全体のシリアライズデータ */
export type BlockWorkspaceData = {
  blocks: SerializedBlockNode[]
}

/** スプライト1つ分のプロジェクトデータ。カスタム手続き + ワークスペースデータ */
export type BlockProjectData = {
  customProcedures: CustomProcedure[]
  customVariables?: string[]
  workspace: BlockWorkspaceData
}

// ─── ゾーン・接続メタデータ ───

/** スロットゾーンのメタ情報（どのブロックのどの入力か） */
export type SlotZoneMeta = {
  blockId: string
  inputIndex: number
}

/** ボディゾーンのメタ情報（Cブロックのエントリコネクタ） */
export type BodyZoneMeta = {
  bodyEntryConnector: Connector | null | undefined
}

/** ボディレイアウトへのドラッグヒット結果 */
export type BodyLayoutHit = {
  insertIndex: number
  targetConnector: Connector
  draggedBlock: CreatedBlock
}

/** サンプルシーンの初期ブロック群 */
export type SampleScene = {
  created: CreatedBlock[]
  definitions: Record<string, CreatedBlock>
}

// ─── ブロック振る舞い設定 ───

/** 形状ごとの基本設定（サイズ・コネクタ・ボディ） */
export type ShapeConfig = {
  size: { w: number; h: number }
  connectors: { top: boolean; bottom: boolean; value?: boolean }
  bodies?: { minHeight: number }[]
}

/** Cブロックのボディ1つの振る舞い */
export type BlockBodyBehavior = {
  minHeight: number
  hasEntryConnector: boolean
}

/** ブロックの振る舞い（形状設定 + オーバーライドを解決した最終結果） */
export type BlockBehavior = {
  size: { w: number; h: number }
  connectors: { top: boolean; bottom: boolean; value: boolean }
  bodies: BlockBodyBehavior[]
  contentGap?: number
}

/** 近接判定のヒット結果。ドラッグ中のスナップ候補を表す */
export type ProximityHit = {
  source: Container
  sourcePosition: Position
  targetPosition: Position
  snapDistance: number
}
