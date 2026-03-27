import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { BLOCK_CATEGORIES, type BlockCategoryId } from "@/features/editor/constants"

interface UiState {
  selectedCategory: BlockCategoryId
}

const initialState: UiState = {
  selectedCategory: BLOCK_CATEGORIES[0].id,
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSelectedCategory(state, action: PayloadAction<BlockCategoryId>) {
      state.selectedCategory = action.payload
    },
  },
})

export const { setSelectedCategory } = uiSlice.actions
export default uiSlice.reducer
