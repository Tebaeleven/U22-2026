"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SAMPLE_CATEGORIES, type SampleCategory } from "../samples/index"
import { FolderOpen, FolderClosed, Play, ChevronRight } from "lucide-react"

interface SampleBrowserProps {
  currentSampleId?: string
  onLoadSample: (sampleId: string) => void
}

export function SampleBrowser({ currentSampleId, onLoadSample }: SampleBrowserProps) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(["games"]))

  const toggleCategory = (catId: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) {
        next.delete(catId)
      } else {
        next.add(catId)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b bg-zinc-50">
        <FolderOpen className="size-3.5 text-blue-600" />
        <span className="text-xs font-semibold text-zinc-700">サンプルブラウザ</span>
        <span className="text-[10px] text-zinc-400 ml-auto">
          {SAMPLE_CATEGORIES.reduce((n, c) => n + c.samples.length, 0)} examples
        </span>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-1.5">
          {SAMPLE_CATEGORIES.map((cat) => (
            <CategoryFolder
              key={cat.id}
              category={cat}
              isOpen={openCategories.has(cat.id)}
              onToggle={() => toggleCategory(cat.id)}
              currentSampleId={currentSampleId}
              onLoadSample={onLoadSample}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function CategoryFolder({
  category,
  isOpen,
  onToggle,
  currentSampleId,
  onLoadSample,
}: {
  category: SampleCategory
  isOpen: boolean
  onToggle: () => void
  currentSampleId?: string
  onLoadSample: (sampleId: string) => void
}) {
  const CATEGORY_COLORS: Record<string, string> = {
    physics: "#FF4D6A",
    camera: "#3D9970",
    tweens: "#9966FF",
    particles: "#FF8C1A",
    timer: "#FFAB19",
    math: "#59C059",
    games: "#4C97FF",
  }

  const color = CATEGORY_COLORS[category.id] ?? "#666666"
  const hasActive = category.samples.some((s) => s.id === currentSampleId)

  return (
    <div className="mb-0.5">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded hover:bg-zinc-100 transition-colors text-left group"
      >
        <ChevronRight
          className="size-3 text-zinc-400 transition-transform"
          style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
        />
        {isOpen ? (
          <FolderOpen className="size-3.5" style={{ color }} />
        ) : (
          <FolderClosed className="size-3.5" style={{ color }} />
        )}
        <span className="text-xs font-semibold flex-1" style={{ color: hasActive ? color : undefined }}>
          {category.name}
        </span>
        <span className="text-[10px] text-zinc-400">
          {category.samples.length}
        </span>
      </button>

      {isOpen && (
        <div className="ml-3 pl-3 border-l border-zinc-200">
          {category.samples.map((sample) => {
            const isActive = sample.id === currentSampleId
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => onLoadSample(sample.id)}
                className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-left transition-colors ${
                  isActive
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-zinc-50"
                }`}
              >
                <Play className={`size-3 shrink-0 ${isActive ? "text-blue-500" : "text-zinc-300"}`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-xs truncate ${isActive ? "font-bold text-blue-700" : "font-medium text-zinc-700"}`}>
                    {sample.name}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    {sample.description}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
