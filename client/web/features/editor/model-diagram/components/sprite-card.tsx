"use client"

import type { SpriteNode } from "../types"

type SpriteCardProps = {
  node: SpriteNode
  isSelected: boolean
}

/** モダンスタイルのスプライトカード */
export function SpriteCard({ node, isSelected }: SpriteCardProps) {
  return (
    <div
      className={`
        select-none rounded-lg overflow-hidden
        transition-all duration-150 bg-white
        ${isSelected
          ? "ring-2 ring-blue-500 shadow-lg shadow-blue-500/10"
          : "ring-1 ring-zinc-300 shadow-sm"
        }
      `}
      style={{ width: 240 }}
    >
      {/* ヘッダー */}
      <div
        className={`
          px-3 py-2 text-center
          ${isSelected ? "bg-blue-50" : "bg-zinc-100"}
        `}
      >
        <div className="font-bold text-sm text-zinc-900 truncate">
          {node.spriteName}
        </div>
      </div>

      {/* 変数（プロパティ）セクション */}
      <div className={`border-t ${isSelected ? "border-blue-200" : "border-zinc-300"}`} />
      <div className="px-3 py-1">
        <div className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${isSelected ? "text-blue-400" : "text-zinc-400"}`}>
          変数
        </div>
        {node.variables.length > 0 ? (
          node.variables.map((v) => (
            <div
              key={v.name}
              className="font-mono text-xs text-zinc-700 py-[1px] flex items-center gap-1.5"
            >
              <span className={`text-[10px] ${
                v.isLive
                  ? "text-violet-500"
                  : v.isWatched
                    ? "text-emerald-500"
                    : "text-zinc-400"
              }`}>
                {v.isLive ? "⚡" : v.isWatched ? "●" : "○"}
              </span>
              <span>{v.name}</span>
              {v.isLive && (
                <span className="text-[9px] text-violet-400 font-sans">live</span>
              )}
            </div>
          ))
        ) : (
          <div className="text-[11px] text-zinc-300 py-[1px]">なし</div>
        )}
      </div>

      {/* 手続き（メソッド）セクション */}
      <div className={`border-t ${isSelected ? "border-blue-200" : "border-zinc-300"}`} />
      <div className="px-3 py-1 pb-1.5">
        <div className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${isSelected ? "text-blue-400" : "text-zinc-400"}`}>
          手続き
        </div>
        {node.procedures.length > 0 ? (
          node.procedures.map((p) => (
            <div
              key={p.id}
              className="font-mono text-xs text-zinc-700 py-[1px] flex items-center gap-1.5"
            >
              <span className="text-amber-500 text-[10px]">▸</span>
              <span>
                {p.name}({p.params.map((a) => a.name).join(", ")})
                {p.returnsValue && (
                  <span className="text-zinc-400 ml-0.5">→ val</span>
                )}
              </span>
            </div>
          ))
        ) : (
          <div className="text-[11px] text-zinc-300 py-[1px]">なし</div>
        )}
      </div>
    </div>
  )
}
