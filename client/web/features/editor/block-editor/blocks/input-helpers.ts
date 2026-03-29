// 入力要素のヘルパー関数
import type { BlockDef, BlockState, HeaderReporterCopy, InputDef, SlotInfo, ValueBlockShape } from "../types"
import {
  BOOLEAN_SLOT_W,
  C_HEADER_H,
  HAT_REPORTER_CHIP_MIN_W,
  INLINE_GAP,
  INLINE_PADDING_X,
  INLINE_REPORTER_INPUT_MAX_W,
  INLINE_REPORTER_INPUT_MIN_W,
  INLINE_SLOT_BASE_H,
  INPUT_DROPDOWN_MIN_W,
  INPUT_MAX_W,
  INPUT_MIN_W,
  INPUT_TEXT_MIN_W,
} from "./constants"
import { resolveBlockBehavior } from "./block-behavior"

/** テキスト幅をピクセル単位で概算する */
export function estimateTextWidth(text: string): number {
  let w = 0
  for (let i = 0; i < text.length; i++) {
    // ASCII 範囲は半角幅、それ以外（日本語等）は全角幅
    w += text.charCodeAt(i) > 127 ? 13 : 7.5
  }
  return w
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** プレフィックス付きのユニークIDを生成する */
export function createEditorId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** インラインレポーター表示の変数名入力かを判定する（型ガード） */
export function isInlineReporterVariableInput(
  input: InputDef
): input is Extract<InputDef, { type: "variable-name" }> & {
  appearance: "inline-reporter"
} {
  return input.type === "variable-name" && input.appearance === "inline-reporter"
}

/** 入力定義のデフォルト値を文字列で取得する（ラベル等は null） */
export function getInputDefaultValue(input: InputDef): string | null {
  switch (input.type) {
    case "number":
    case "text":
    case "variable-name":
    case "dropdown":
      return String(input.default)
    case "param-chip":
    case "boolean-slot":
    case "label":
      return null
  }
}

/** 入力定義配列からデフォルト値のマップを生成する */
export function createInitialInputValues(
  inputs: InputDef[]
): Record<number, string> {
  const values: Record<number, string> = {}
  for (let index = 0; index < inputs.length; index += 1) {
    const value = getInputDefaultValue(inputs[index])
    if (value !== null) {
      values[index] = value
    }
  }
  return values
}

/** ブロックの入力値を取得する（未設定ならデフォルト値） */
export function getInputValue(
  input: InputDef,
  blockState: Pick<BlockState, "inputValues">,
  index: number
): string {
  return blockState.inputValues[index] ?? getInputDefaultValue(input) ?? ""
}

/** 入力の表示値を取得する（値がなければプレースホルダー） */
export function getInputDisplayValue(
  input: InputDef,
  blockState: Pick<BlockState, "inputValues">,
  index: number
): string {
  const value = getInputValue(input, blockState, index)
  if (value) return value
  if ("placeholder" in input && input.placeholder) return input.placeholder
  if (input.type === "param-chip") return input.label
  return ""
}

/** 入力定義が受け入れる値ブロックの形状リストを返す */
export function getAcceptedValueShapes(input: InputDef): ValueBlockShape[] {
  switch (input.type) {
    case "boolean-slot":
      return ["boolean"]
    case "number":
    case "text":
    case "dropdown":
      return ["reporter"]
    case "variable-name":
    case "param-chip":
    case "label":
      return []
  }
}

/** 入力要素の表示幅をピクセル単位で計算する */
export function inputWidth(input: InputDef, value?: string): number {
  switch (input.type) {
    case "number": {
      const text = value ?? String(input.default)
      const display = text || input.placeholder || "0"
      const minWidth = input.minWidth ?? INPUT_MIN_W
      const maxWidth = input.maxWidth ?? 120
      return clamp(
        Math.ceil(estimateTextWidth(display) + 22),
        minWidth,
        maxWidth
      )
    }
    case "text": {
      const text = value ?? input.default
      const display = text || input.placeholder || " "
      const minWidth = input.minWidth ?? INPUT_TEXT_MIN_W
      const maxWidth = input.maxWidth ?? INPUT_MAX_W
      return clamp(
        Math.ceil(estimateTextWidth(display) + 22),
        minWidth,
        maxWidth
      )
    }
    case "variable-name": {
      const text = value ?? input.default
      const display = text || input.placeholder || "i"
      const minWidth = input.minWidth ?? (
        isInlineReporterVariableInput(input)
          ? INLINE_REPORTER_INPUT_MIN_W
          : INPUT_MIN_W
      )
      const maxWidth = input.maxWidth ?? (
        isInlineReporterVariableInput(input)
          ? INLINE_REPORTER_INPUT_MAX_W
          : INPUT_MAX_W
      )
      const paddingWidth = isInlineReporterVariableInput(input) ? 16 : 22
      return clamp(
        Math.ceil(estimateTextWidth(display) + paddingWidth),
        minWidth,
        maxWidth
      )
    }
    case "dropdown": {
      const text = value ?? input.default
      const minWidth = input.minWidth ?? INPUT_DROPDOWN_MIN_W
      const maxWidth = input.maxWidth ?? INPUT_MAX_W
      return clamp(Math.ceil(estimateTextWidth(text) + 22), minWidth, maxWidth)
    }
    case "param-chip":
      return hatReporterChipWidth(input.label)
    case "boolean-slot":
      return input.minWidth ?? BOOLEAN_SLOT_W
    case "label":
      return estimateTextWidth(input.text)
  }
}

/** ブロック定義からヘッダーレポーターコピーの配列を取得する */
export function getHeaderReporterCopies(
  def: Pick<BlockDef, "headerReporterCopies">
): HeaderReporterCopy[] {
  return def.headerReporterCopies ?? []
}

/** ヘッダーレポーターコピーの表示ラベルを取得する */
export function getHeaderReporterCopyLabel(
  copy: HeaderReporterCopy,
  blockState: Pick<BlockState, "def" | "inputValues">
): string {
  if (copy.labelInputIndex !== undefined) {
    const input = blockState.def.inputs[copy.labelInputIndex]
    if (input) {
      return getInputValue(input, blockState, copy.labelInputIndex)
    }
  }
  return copy.label ?? ""
}

/** ハットブロック上のレポーターチップの表示幅を計算する */
export function hatReporterChipWidth(label: string): number {
  return clamp(
    Math.ceil(estimateTextWidth(label) + 24),
    HAT_REPORTER_CHIP_MIN_W,
    INPUT_MAX_W
  )
}

/** 入力のシリアライズ用キーを取得する（カスタムコールはparamId、それ以外はインデックス） */
export function getInputSerializationKey(
  def: BlockDef,
  input: InputDef,
  index: number
): string {
  if (def.source.kind === "custom-call") {
    if (
      (input.type === "number" || input.type === "text") &&
      input.paramId
    ) {
      return input.paramId
    }
  }
  return String(index)
}

/** シリアライズキーから入力インデックスを逆引きする */
export function getInputIndexBySerializationKey(
  def: BlockDef,
  key: string
): number {
  for (let index = 0; index < def.inputs.length; index += 1) {
    if (getInputSerializationKey(def, def.inputs[index], index) === key) {
      return index
    }
  }
  return -1
}

/** ブロック定義と入力値からスロットの位置・サイズを計算する */
export function computeSlotPositions(
  def: BlockDef,
  inputValues: Record<number, string> = createInitialInputValues(def.inputs)
): SlotInfo[] {
  let cursor =
    INLINE_PADDING_X +
    estimateTextWidth(def.name) +
    (def.name ? INLINE_GAP : 0)
  const behavior = resolveBlockBehavior(def)
  const blockH = behavior.bodies.length > 0 ? C_HEADER_H : behavior.size.h
  const slotY = (blockH - INLINE_SLOT_BASE_H) / 2
  const slots: SlotInfo[] = []

  for (let i = 0; i < def.inputs.length; i += 1) {
    const input = def.inputs[i]
    const w = inputWidth(input, inputValues[i])
    if (
      input.type !== "label" &&
      input.type !== "variable-name" &&
      input.type !== "param-chip"
    ) {
      slots.push({
        inputIndex: i,
        x: cursor,
        y: slotY,
        w,
        h: INLINE_SLOT_BASE_H,
        acceptedShapes: getAcceptedValueShapes(input),
      })
    }
    cursor += w + INLINE_GAP
  }

  return slots
}
