import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface ProjectState {
  name: string
  id: string | null
  isSaving: boolean
  isLoading: boolean
}

const initialState: ProjectState = {
  name: "無題のプロジェクト",
  id: null,
  isSaving: false,
  isLoading: false,
}

const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setProjectName(state, action: PayloadAction<string>) {
      state.name = action.payload
    },
    setProjectId(state, action: PayloadAction<string | null>) {
      state.id = action.payload
    },
    setSaving(state, action: PayloadAction<boolean>) {
      state.isSaving = action.payload
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
  },
})

export const { setProjectName, setProjectId, setSaving, setLoading } =
  projectSlice.actions
export default projectSlice.reducer
