import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import {
  DEFAULT_SPRITES,
  DEFAULT_COLLIDER,
  createDefaultCostume,
  resolveSpriteEmoji,
  type SpriteDef,
  type Costume,
  type ColliderDef,
} from "@/features/editor/constants"
import type { BlockProjectData } from "@/features/editor/block-editor/types"

interface SpritesState {
  list: SpriteDef[]
  selectedId: string
  /** 実行前のスナップショット（停止時に復元用） */
  snapshotBeforeRun: SpriteDef[] | null
  /** スプライトごとのブロックデータ（spriteId → BlockProjectData） */
  blockDataMap: Record<string, BlockProjectData>
}

const initialState: SpritesState = {
  list: DEFAULT_SPRITES,
  selectedId: DEFAULT_SPRITES[0].id,
  snapshotBeforeRun: null,
  blockDataMap: {},
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
        state.list = state.snapshotBeforeRun
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
} = spritesSlice.actions
export default spritesSlice.reducer
