import { configureStore } from "@reduxjs/toolkit"
import { useDispatch, useSelector } from "react-redux"
import spritesReducer from "./slices/sprites"
import projectReducer from "./slices/project"
import runtimeReducer from "./slices/runtime"
import uiReducer from "./slices/ui"

export const store = configureStore({
  reducer: {
    sprites: spritesReducer,
    project: projectReducer,
    runtime: runtimeReducer,
    ui: uiReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
