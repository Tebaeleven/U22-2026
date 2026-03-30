// 関係種別ごとのエッジ描画スタイル定義
import type { EdgeType } from "headless-vpl"
import type { RelationType } from "./types"

export type EdgeStyleDef = {
  edgeType: EdgeType
  color: string
  strokeWidth: number
  strokeDasharray?: string
  markerEnd: { type: "arrow" | "arrowClosed"; color?: string }
  markerStart?: { type: "arrow" | "arrowClosed"; color?: string }
  labelPrefix: string
}

export const RELATION_STYLES: Record<RelationType, EdgeStyleDef> = {
  "event-send": {
    edgeType: "straight",
    color: "#F59E0B",
    strokeWidth: 1.5,
    markerEnd: { type: "arrowClosed" },
    labelPrefix: "Event",
  },
  "variable-watch": {
    edgeType: "straight",
    color: "#8B5CF6",
    strokeWidth: 1.5,
    strokeDasharray: "6 3",
    markerEnd: { type: "arrow" },
    labelPrefix: "Watch",
  },
  "clone-create": {
    edgeType: "straight",
    color: "#10B981",
    strokeWidth: 1.5,
    markerEnd: { type: "arrowClosed" },
    labelPrefix: "Clone",
  },
  "collision-detect": {
    edgeType: "straight",
    color: "#3B82F6",
    strokeWidth: 1.5,
    strokeDasharray: "4 4",
    markerEnd: { type: "arrowClosed" },
    markerStart: { type: "arrow" },
    labelPrefix: "Collision",
  },
  custom: {
    edgeType: "straight",
    color: "#6B7280",
    strokeWidth: 1.5,
    markerEnd: { type: "arrow" },
    labelPrefix: "",
  },
}
