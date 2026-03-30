"use client"

import { Bug, LayoutGrid, Maximize2, StickyNote } from "lucide-react"
import {
  ALL_RELATION_TYPES,
  RELATION_TYPE_LABELS,
  RELATION_FILTER_COLORS,
  type RelationType,
} from "../types"

type DiagramToolbarProps = {
  onAutoArrange: () => void
  onFitView: () => void
  debugView: boolean
  onToggleDebugView: () => void
  visibleRelations: Set<RelationType>
  onToggleRelation: (type: RelationType) => void
  onAddNote: () => void
  selectedNodeId: string | null
}

export function DiagramToolbar({
  onAutoArrange,
  onFitView,
  debugView,
  onToggleDebugView,
  visibleRelations,
  onToggleRelation,
  onAddNote,
  selectedNodeId,
}: DiagramToolbarProps) {
  const btnClass =
    "flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white border border-zinc-300 rounded-md text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm"
  const btnActiveClass =
    "flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-blue-50 border border-blue-300 rounded-md text-blue-700 hover:bg-blue-100 transition-colors shadow-sm"

  return (
    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
      {/* アクション行 */}
      <div className="flex gap-1.5">
        <button className={btnClass} onClick={onAutoArrange} title="自動整列">
          <LayoutGrid size={14} />
          自動整列
        </button>
        <button className={btnClass} onClick={onFitView} title="全体表示">
          <Maximize2 size={14} />
          全体表示
        </button>
        <button
          className={btnClass}
          onClick={onAddNote}
          title={selectedNodeId ? "選択中のスプライトにノートを追加" : "ノートを追加"}
        >
          <StickyNote size={14} />
          ノート追加
        </button>
        <button
          className={debugView ? btnActiveClass : btnClass}
          onClick={onToggleDebugView}
          title="SVGデバッグ表示"
        >
          <Bug size={14} />
          {debugView ? "SVG" : "DOM"}
        </button>
      </div>

      {/* 関係フィルター行 */}
      <div className="flex gap-1">
        {ALL_RELATION_TYPES.map((type) => {
          const active = visibleRelations.has(type)
          const color = RELATION_FILTER_COLORS[type]
          return (
            <button
              key={type}
              className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border transition-colors shadow-sm ${
                active
                  ? "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                  : "bg-zinc-100 border-zinc-200 text-zinc-400 hover:bg-zinc-50"
              }`}
              onClick={() => onToggleRelation(type)}
              title={`${RELATION_TYPE_LABELS[type]}の表示切替`}
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: active ? color : "#d4d4d8",
                }}
              />
              {RELATION_TYPE_LABELS[type]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
