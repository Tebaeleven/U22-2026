"use client"

import { useState, useCallback } from "react"
import {
  BLOCK_CATEGORIES,
  DEFAULT_SPRITES,
  type BlockCategoryId,
  type SpriteDef,
} from "@/features/editor/constants"

export function useEditorState() {
  const [projectName, setProjectName] = useState("無題のプロジェクト")
  const [sprites, setSprites] = useState<SpriteDef[]>(DEFAULT_SPRITES)
  const [selectedSpriteId, setSelectedSpriteId] = useState<string>(
    DEFAULT_SPRITES[0].id
  )
  const [selectedCategory, setSelectedCategory] = useState<BlockCategoryId>(
    BLOCK_CATEGORIES[0].id
  )
  const [isRunning, setIsRunning] = useState(false)

  const selectedSprite = sprites.find((s) => s.id === selectedSpriteId)

  const addSprite = useCallback(() => {
    const emojis = ["🐶", "🐰", "🦊", "🐸", "🐧", "🦁", "🐻", "🐼"]
    const id = `sprite-${Date.now()}`
    const newSprite: SpriteDef = {
      id,
      name: `スプライト${sprites.length + 1}`,
      emoji: emojis[sprites.length % emojis.length],
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100,
      size: 100,
      direction: 90,
      visible: true,
    }
    setSprites((prev) => [...prev, newSprite])
    setSelectedSpriteId(id)
  }, [sprites.length])

  const deleteSprite = useCallback(
    (id: string) => {
      if (sprites.length <= 1) return
      setSprites((prev) => prev.filter((s) => s.id !== id))
      if (selectedSpriteId === id) {
        setSelectedSpriteId(sprites[0].id === id ? sprites[1].id : sprites[0].id)
      }
    },
    [sprites, selectedSpriteId]
  )

  const handleRun = useCallback(() => setIsRunning(true), [])
  const handleStop = useCallback(() => setIsRunning(false), [])

  return {
    projectName,
    setProjectName,
    sprites,
    setSprites,
    selectedSpriteId,
    setSelectedSpriteId,
    selectedSprite,
    selectedCategory,
    setSelectedCategory,
    isRunning,
    handleRun,
    handleStop,
    addSprite,
    deleteSprite,
  }
}
