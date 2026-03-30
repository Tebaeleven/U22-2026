// スプライトカード用の Container + Connector を生成する
import { Connector, Container, Edge } from "headless-vpl"
import type { Workspace } from "headless-vpl"
import type { CreatedSpriteCard, CreatedEdge, CreatedNote, SpriteNode, DiagramRelation, DiagramNote } from "./types"
import { RELATION_STYLES } from "./edge-styles"

/** スプライトカードの幅 */
const CARD_WIDTH = 240
/** コネクタのヒット半径 */
const CONNECTOR_HIT_RADIUS = 14

/**
 * カードの高さを計算（sprite-card.tsx の DOM 構造に合わせた定数）
 *
 * ヘッダー: py-2 (8+8) + text-sm (20px) = 36px
 * border-t: 1px
 * セクション: py-1 (4+4) + 見出し(14px + mb 2px) + 行×N(15px each)
 * 手続きセクション: py-1 pb-1.5 (4+6) + 見出し + 行×N
 */
function computeCardHeight(node: SpriteNode): number {
  const HEADER = 36
  const BORDER = 1
  const SECTION_LABEL = 16   // 見出し text-[10px] + mb-0.5
  const ROW = 15             // font-mono text-xs + py-[1px]
  const VAR_PAD = 8          // py-1 (4+4)
  const PROC_PAD = 10        // py-1 pb-1.5 (4+6)

  const varRows = Math.max(node.variables.length, 1)
  const procRows = Math.max(node.procedures.length, 1)

  return (
    HEADER +
    BORDER + VAR_PAD + SECTION_LABEL + varRows * ROW +
    BORDER + PROC_PAD + SECTION_LABEL + procRows * ROW
  )
}

/** スプライトカード用の Container + Connector を生成 */
export function createSpriteCard(
  ws: Workspace,
  node: SpriteNode,
  x: number,
  y: number
): CreatedSpriteCard {
  const height = computeCardHeight(node)

  const container = new Container({
    workspace: ws,
    name: `sprite-card-${node.spriteId}`,
    position: [x, y],
    width: CARD_WIDTH,
    height,
    widthMode: "fixed",
    heightMode: "fixed",
    color: "#1e1e2e",
  })

  // 左側コネクタ（input）— エッジの終端
  const inputConnector = new Connector({
    name: `${node.spriteId}-input`,
    type: "input",
    hitRadius: CONNECTOR_HIT_RADIUS,
  })
  inputConnector.setAnchor(
    { target: "parent", origin: "top-center", offset: { x: 0, y: 0 } },
    container
  )
  container.addChild("input", inputConnector)

  // 右側コネクタ（output）— エッジの始端
  const outputConnector = new Connector({
    name: `${node.spriteId}-output`,
    type: "output",
    hitRadius: CONNECTOR_HIT_RADIUS,
  })
  outputConnector.setAnchor(
    { target: "parent", origin: "bottom-center", offset: { x: 0, y: 0 } },
    container
  )
  container.addChild("output", outputConnector)

  return { container, inputConnector, outputConnector, node }
}

/** 関係線用の Edge を生成 */
export function createRelationEdge(
  ws: Workspace,
  relation: DiagramRelation,
  fromConnector: Connector,
  toConnector: Connector
): CreatedEdge {
  const style = RELATION_STYLES[relation.type]
  // Edge コンストラクタ内で workspace.addEdge が自動呼出しされる
  const edge = new Edge({
    workspace: ws,
    start: fromConnector,
    end: toConnector,
    edgeType: style.edgeType,
    label: relation.label,
    markerEnd: style.markerEnd,
    markerStart: style.markerStart,
  })

  return { edge, relation }
}

// ─── ノート ───

/** ノートの幅 */
const NOTE_WIDTH = 180
/** ノートの行高さ */
const NOTE_LINE_HEIGHT = 18
/** ノートの最小高さ */
const NOTE_MIN_HEIGHT = 40
/** ノートのパディング */
const NOTE_PADDING = 16

/** ノートの高さを計算 */
function computeNoteHeight(text: string): number {
  const lines = Math.max(text.split("\n").length, 1)
  return Math.max(NOTE_MIN_HEIGHT, NOTE_PADDING * 2 + lines * NOTE_LINE_HEIGHT)
}

/** ノート用の Container を生成 */
export function createNoteContainer(
  ws: Workspace,
  note: DiagramNote
): CreatedNote {
  const height = computeNoteHeight(note.text)

  const container = new Container({
    workspace: ws,
    name: `diagram-note-${note.id}`,
    position: [note.position.x, note.position.y],
    width: NOTE_WIDTH,
    height,
    widthMode: "fixed",
    heightMode: "fixed",
    color: "#FFFDE7",
  })

  return { container, note }
}

/** 全カードと全エッジを一括削除 */
export function clearDiagram(
  ws: Workspace,
  cards: CreatedSpriteCard[],
  edges: CreatedEdge[]
): void {
  for (const { edge } of edges) {
    ws.removeEdge(edge)
  }
  for (const { container } of cards) {
    ws.removeContainer(container)
  }
}
