// 手動エッジ + ノード位置の永続化
import type { DiagramRelation, DiagramNote, DiagramPersistenceData, SerializedManualEdge, SerializedNote } from "./types"

/** 手動エッジを永続化形式に変換 */
export function serializeManualEdges(relations: DiagramRelation[]): SerializedManualEdge[] {
  return relations
    .filter((r) => r.source === "manual")
    .map((r) => ({
      id: r.id,
      fromSpriteId: r.fromSpriteId,
      toSpriteId: r.toSpriteId,
      type: r.type,
      label: r.label,
    }))
}

/** 永続化形式から DiagramRelation に復元 */
export function deserializeManualEdges(data: SerializedManualEdge[]): DiagramRelation[] {
  return data.map((e) => ({
    ...e,
    source: "manual" as const,
  }))
}

/** ノートを永続化形式に変換 */
export function serializeNotes(notes: DiagramNote[]): SerializedNote[] {
  return notes.map((n) => ({
    id: n.id,
    text: n.text,
    attachedToSpriteId: n.attachedToSpriteId,
    position: { ...n.position },
  }))
}

/** 永続化形式から DiagramNote に復元 */
export function deserializeNotes(data: SerializedNote[]): DiagramNote[] {
  return data.map((n) => ({ ...n, source: "manual" as const }))
}

/** 空の永続化データ */
export const EMPTY_PERSISTENCE_DATA: DiagramPersistenceData = {
  manualEdges: [],
  nodePositions: {},
  notes: [],
}
