import { createSlice } from "@reduxjs/toolkit"

interface RuntimeState {
  isRunning: boolean
  isPaused: boolean
  threadCount: number
}

const initialState: RuntimeState = {
  isRunning: false,
  isPaused: false,
  threadCount: 0,
}

const runtimeSlice = createSlice({
  name: "runtime",
  initialState,
  reducers: {
    startRuntime(state) {
      state.isRunning = true
      state.isPaused = false
    },
    stopRuntime(state) {
      state.isRunning = false
      state.isPaused = false
      state.threadCount = 0
    },
    pauseRuntime(state) {
      state.isPaused = true
    },
    resumeRuntime(state) {
      state.isPaused = false
    },
    setThreadCount(state, action) {
      state.threadCount = action.payload
    },
  },
})

export const { startRuntime, stopRuntime, pauseRuntime, resumeRuntime, setThreadCount } =
  runtimeSlice.actions
export default runtimeSlice.reducer
