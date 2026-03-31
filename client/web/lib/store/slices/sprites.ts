import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import {
  DEFAULT_COLLIDER,
  createDefaultCostume,
  resolveSpriteEmoji,
  type SpriteDef,
  type Costume,
  type ColliderDef,
  type SoundDef,
} from "@/features/editor/constants"
import type { BlockProjectData } from "@/features/editor/block-editor/types"
import { applySpriteRenameToBlockProjectData } from "@/features/editor/block-editor/block-data-sprite-rename"
import { SAMPLE_PROJECTS, resolveSample } from "@/features/editor/samples/index"

// ─── デフォルトのサンプルプロジェクトからデータ生成 ──────────

const DEFAULT_SAMPLE = resolveSample(SAMPLE_PROJECTS[0])

// ─── Redux Slice ──────────────────────────────────────

interface SpritesState {
  list: SpriteDef[]
  selectedId: string
  /** 実行前のスナップショット（停止時に復元用） */
  snapshotBeforeRun: SpriteDef[] | null
  /** スプライトごとのブロックデータ（spriteId → BlockProjectData） */
  blockDataMap: Record<string, BlockProjectData>
}

const initialState: SpritesState = {
  list: DEFAULT_SAMPLE.sprites,
  selectedId: DEFAULT_SAMPLE.sprites[0].id,
  snapshotBeforeRun: null,
  blockDataMap: DEFAULT_SAMPLE.blockDataMap,
}

const spritesSlice = createSlice({
  name: "sprites",
  initialState,
  reducers: {
    setSprites(state, action: PayloadAction<SpriteDef[]>) {
      state.list = action.payload
    },
    selectSprite(state, action: PayloadAction<string>) {
      state.selectedId = action.payload
    },
    addSprite(state) {
      const id = `sprite-${Date.now()}`
      const emoji = resolveSpriteEmoji(undefined, state.list.length)
      const newSprite: SpriteDef = {
        id,
        name: `スプライト${state.list.length + 1}`,
        emoji,
        costumes: [createDefaultCostume("コスチューム1", emoji)],
        currentCostumeIndex: 0,
        collider: { ...DEFAULT_COLLIDER },
        x: Math.random() * 200 - 100,
        y: Math.random() * 200 - 100,
        size: 100,
        direction: 90,
        visible: true,
      }
      state.list.push(newSprite)
      state.selectedId = id
    },
    deleteSprite(state, action: PayloadAction<string>) {
      if (state.list.length <= 1) return
      const id = action.payload
      state.list = state.list.filter((s) => s.id !== id)
      if (state.selectedId === id) {
        state.selectedId = state.list[0].id
      }
    },
    updateSprite(
      state,
      action: PayloadAction<{ id: string; changes: Partial<SpriteDef> }>
    ) {
      const sprite = state.list.find((s) => s.id === action.payload.id)
      if (sprite) {
        Object.assign(sprite, action.payload.changes)
      }
    },

    // ─── コスチューム操作 ──────────────────────────

    /** コスチュームを追加 */
    addCostume(
      state,
      action: PayloadAction<{ spriteId: string; costume: Costume }>
    ) {
      const sprite = state.list.find((s) => s.id === action.payload.spriteId)
      if (sprite) {
        sprite.costumes.push(action.payload.costume)
      }
    },
    /** コスチュームを更新（dataUrl 等） */
    updateCostume(
      state,
      action: PayloadAction<{
        spriteId: string
        costumeId: string
        changes: Partial<Costume>
      }>
    ) {
      const sprite = state.list.find((s) => s.id === action.payload.spriteId)
      if (!sprite) return
      const costume = sprite.costumes.find(
        (c) => c.id === action.payload.costumeId
      )
      if (costume) {
        Object.assign(costume, action.payload.changes)
      }
    },
    /** コスチュームを削除（最低1つは残す） */
    deleteCostume(
      state,
      action: PayloadAction<{ spriteId: string; costumeId: string }>
    ) {
      const sprite = state.list.find((s) => s.id === action.payload.spriteId)
      if (!sprite || sprite.costumes.length <= 1) return
      const idx = sprite.costumes.findIndex(
        (c) => c.id === action.payload.costumeId
      )
      if (idx === -1) return
      sprite.costumes.splice(idx, 1)
      // インデックスが範囲外にならないように調整
      if (sprite.currentCostumeIndex >= sprite.costumes.length) {
        sprite.currentCostumeIndex = sprite.costumes.length - 1
      }
    },
    /** 現在のコスチュームを切り替え */
    setCostumeIndex(
      state,
      action: PayloadAction<{ spriteId: string; index: number }>
    ) {
      const sprite = state.list.find((s) => s.id === action.payload.spriteId)
      if (sprite && action.payload.index >= 0 && action.payload.index < sprite.costumes.length) {
        sprite.currentCostumeIndex = action.payload.index
      }
    },

    // ─── 当たり判定設定 ─────────────────────────────

    /** 当たり判定の設定を更新 */
    setCollider(
      state,
      action: PayloadAction<{ spriteId: string; collider: ColliderDef }>
    ) {
      const sprite = state.list.find((s) => s.id === action.payload.spriteId)
      if (sprite) {
        sprite.collider = action.payload.collider
      }
    },

    // ─── サウンド操作 ───────────────────────────────

    addSound(state, action: PayloadAction<{ spriteId: string; sound: SoundDef }>) {
      const sprite = state.list.find((s) => s.id === action.payload.spriteId)
      if (sprite) {
        if (!sprite.sounds) sprite.sounds = []
        sprite.sounds.push(action.payload.sound)
      }
    },
    deleteSound(state, action: PayloadAction<{ spriteId: string; soundId: string }>) {
      const sprite = state.list.find((s) => s.id === action.payload.spriteId)
      if (sprite?.sounds) {
        sprite.sounds = sprite.sounds.filter((s) => s.id !== action.payload.soundId)
      }
    },

    // ─── スナップショット ───────────────────────────

    saveSnapshot(state) {
      state.snapshotBeforeRun = state.list.map((s) => ({
        ...s,
        costumes: s.costumes.map((c) => ({ ...c })),
        collider: { ...s.collider },
      }))
    },
    restoreSnapshot(state) {
      if (state.snapshotBeforeRun) {
        // 実行終了時の最終位置を保持
        const finalPositions = new Map(
          state.list.map((s) => [s.id, { x: s.x, y: s.y, direction: s.direction }])
        )
        state.list = state.snapshotBeforeRun
        // スナップショットに最終位置を適用
        for (const sprite of state.list) {
          const pos = finalPositions.get(sprite.id)
          if (pos) {
            sprite.x = pos.x
            sprite.y = pos.y
            sprite.direction = pos.direction
          }
        }
        state.snapshotBeforeRun = null
      }
    },
    // ─── スプライトごとのブロックデータ ────────────

    /** 指定スプライトのブロックデータを保存 */
    saveBlockData(
      state,
      action: PayloadAction<{ spriteId: string; data: BlockProjectData }>
    ) {
      state.blockDataMap[action.payload.spriteId] = action.payload.data
    },
    /** プロジェクト読み込み時に全スプライトのブロックデータを一括セット */
    loadAllBlockData(
      state,
      action: PayloadAction<Record<string, BlockProjectData>>
    ) {
      state.blockDataMap = action.payload
    },

    /** 全スプライトの blockDataMap に保存されたブロック入力のスプライト名参照を置換する */
    renameSpriteInBlockDataMap(
      state,
      action: PayloadAction<{ oldName: string; newName: string }>
    ) {
      const { oldName, newName } = action.payload
      for (const spriteId of Object.keys(state.blockDataMap)) {
        const prev = state.blockDataMap[spriteId]
        const next = applySpriteRenameToBlockProjectData(prev, oldName, newName)
        if (next !== prev) {
          state.blockDataMap[spriteId] = next
        }
      }
    },

    /** スプライトを複製する */
    duplicateSprite(state, action: PayloadAction<string>) {
      const source = state.list.find((s) => s.id === action.payload)
      if (!source) return

      const newId = `sprite-${Date.now()}`
      const newCostumes: Costume[] = source.costumes.map((c, i) => ({
        ...c,
        id: `costume-${Date.now()}-${i}`,
      }))

      const newSprite: SpriteDef = {
        id: newId,
        name: `${source.name} (コピー)`,
        emoji: source.emoji,
        costumes: newCostumes,
        currentCostumeIndex: source.currentCostumeIndex,
        collider: { ...source.collider },
        x: source.x + 30,
        y: source.y - 30,
        size: source.size,
        direction: source.direction,
        visible: source.visible,
      }

      state.list.push(newSprite)

      // ブロックデータも複製
      const sourceBlockData = state.blockDataMap[action.payload]
      if (sourceBlockData) {
        state.blockDataMap[newId] = JSON.parse(JSON.stringify(sourceBlockData))
      }

      state.selectedId = newId
    },

    /** スプライトの並び順を移動 */
    moveSprite(state, action: PayloadAction<{ id: string; direction: "up" | "down" }>) {
      const { id, direction } = action.payload
      const idx = state.list.findIndex((s) => s.id === id)
      if (idx === -1) return
      const targetIdx = direction === "up" ? idx - 1 : idx + 1
      if (targetIdx < 0 || targetIdx >= state.list.length) return
      const temp = state.list[idx]
      state.list[idx] = state.list[targetIdx]
      state.list[targetIdx] = temp
    },

    // VM から一括でスプライト位置を更新
    batchUpdatePositions(
      state,
      action: PayloadAction<
        Array<{ id: string; x: number; y: number; direction: number; costumeIndex?: number }>
      >
    ) {
      for (const update of action.payload) {
        const sprite = state.list.find((s) => s.id === update.id)
        if (sprite) {
          sprite.x = update.x
          sprite.y = update.y
          sprite.direction = update.direction
          if (update.costumeIndex !== undefined) {
            sprite.currentCostumeIndex = update.costumeIndex
          }
        }
      }
    },
  },
})

export const {
  setSprites,
  selectSprite,
  addSprite,
  deleteSprite,
  updateSprite,
  addCostume,
  updateCostume,
  deleteCostume,
  setCostumeIndex,
  setCollider,
  saveSnapshot,
  restoreSnapshot,
  batchUpdatePositions,
  saveBlockData,
  loadAllBlockData,
  renameSpriteInBlockDataMap,
  duplicateSprite,
  moveSprite,
  addSound,
  deleteSound,
} = spritesSlice.actions
export default spritesSlice.reducer
