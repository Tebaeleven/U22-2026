// モデル関係図エディタの型定義
import type { Container, Connector, Edge } from "headless-vpl"

// ─── ノード（スプライトカード） ───

/** スプライトの変数情報 */
export type VariableInfo = {
  name: string
  /** 他スプライトから監視されているか */
  isWatched: boolean
  /** Live Variable（式による自動再計算）か */
  isLive: boolean
}

/** スプライトの手続き情報 */
export type ProcedureInfo = {
  id: string
  name: string
  params: { name: string }[]
  returnsValue: boolean
}

/** スプライトカード1つのデータ */
export type SpriteNode = {
  spriteId: string
  spriteName: string
  variables: VariableInfo[]
  procedures: ProcedureInfo[]
}

// ─── エッジ（関係線） ───

/** 関係の種別 */
export type RelationType =
  | "event-send"
  | "variable-watch"
  | "clone-create"
  | "collision-detect"
  | "custom"

/** フィルター可能な全関係種別 */
export const ALL_RELATION_TYPES: RelationType[] = [
  "event-send",
  "variable-watch",
  "clone-create",
  "collision-detect",
  "custom",
]

/** 関係種別の日本語ラベル */
export const RELATION_TYPE_LABELS: Record<RelationType, string> = {
  "event-send": "イベント",
  "variable-watch": "変数監視",
  "clone-create": "クローン",
  "collision-detect": "衝突",
  custom: "カスタム",
}

/** フィルターUI用の識別色（エッジ描画色と同期） */
export const RELATION_FILTER_COLORS: Record<RelationType, string> = {
  "event-send": "#F59E0B",
  "variable-watch": "#8B5CF6",
  "clone-create": "#10B981",
  "collision-detect": "#3B82F6",
  custom: "#6B7280",
}

/** スプライト間の1つの関係 */
export type DiagramRelation = {
  id: string
  fromSpriteId: string
  toSpriteId: string
  type: RelationType
  label: string
  /** 自動解析で生成されたか、手動追加か */
  source: "auto" | "manual"
  /** 双方向（A→B と B→A がマージされた）か */
  _bidirectional?: boolean
}

// ─── ダイアグラム全体の状態 ───

/** React購読用の不変スナップショット */
export type DiagramSnapshot = {
  nodes: SpriteNode[]
  autoRelations: DiagramRelation[]
  manualRelations: DiagramRelation[]
  notes: DiagramNote[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
}

// ─── 生成済みノード（headless-vpl統合） ───

/** ワークスペース上に配置されたスプライトカード */
export type CreatedSpriteCard = {
  container: Container
  inputConnector: Connector
  outputConnector: Connector
  node: SpriteNode
}

/** ワークスペース上のエッジとメタデータ */
export type CreatedEdge = {
  edge: Edge
  relation: DiagramRelation
}

// ─── ノート ───

/** ダイアグラム上のノート（PlantUML風の付箋） */
export type DiagramNote = {
  id: string
  text: string
  /** 接続先のスプライトID（null なら独立ノート） */
  attachedToSpriteId: string | null
  position: { x: number; y: number }
  /** 自動生成かユーザー手動か（auto はコードコメントから生成、永続化しない） */
  source: "auto" | "manual"
}

/** ワークスペース上に配置されたノート */
export type CreatedNote = {
  container: Container
  note: DiagramNote
}

// ─── 永続化 ───

/** 手動追加エッジのシリアライズ形式 */
export type SerializedManualEdge = {
  id: string
  fromSpriteId: string
  toSpriteId: string
  type: RelationType
  label: string
}

/** ノートのシリアライズ形式 */
export type SerializedNote = {
  id: string
  text: string
  attachedToSpriteId: string | null
  position: { x: number; y: number }
}

/** 手動編集分の永続化データ */
export type DiagramPersistenceData = {
  manualEdges: SerializedManualEdge[]
  /** ノード位置のオーバーライド（ユーザーがドラッグした場合） */
  nodePositions: Record<string, { x: number; y: number }>
  /** ノートデータ */
  notes?: SerializedNote[]
}
