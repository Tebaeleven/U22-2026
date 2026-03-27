"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BLOCK_CATEGORIES,
  MOCK_BLOCKS,
  type BlockCategoryId,
} from "@/features/editor/constants"

interface BlockPaletteProps {
  selectedCategory: BlockCategoryId
  onSelectCategory: (id: BlockCategoryId) => void
}

export function BlockPalette({
  selectedCategory,
  onSelectCategory,
}: BlockPaletteProps) {
  const categoryColor =
    BLOCK_CATEGORIES.find((c) => c.id === selectedCategory)?.color ?? "#4C97FF"
  const filteredBlocks = MOCK_BLOCKS.filter(
    (b) => b.categoryId === selectedCategory
  )

  return (
    <div className="flex h-full flex-col bg-[#f9f9f9]">
      {/* カテゴリボタン */}
      <div className="flex flex-wrap gap-1 p-2 border-b">
        {BLOCK_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-white transition-opacity"
            style={{
              backgroundColor: cat.color,
              opacity: selectedCategory === cat.id ? 1 : 0.6,
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* ブロック一覧 */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1.5 p-2">
          {filteredBlocks.map((block) => (
            <div
              key={block.id}
              draggable
              className="cursor-grab rounded-md px-3 py-2 text-xs font-medium text-white shadow-sm active:cursor-grabbing"
              style={{ backgroundColor: categoryColor }}
            >
              {block.label}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
