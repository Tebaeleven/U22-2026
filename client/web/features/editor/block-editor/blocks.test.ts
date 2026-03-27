// @ts-expect-error Bun のテストランナー上でのみ解決される
import { describe, expect, test } from "bun:test"
import { getBlockDefs, inputWidth } from "./blocks"
import type { InputDef } from "./types"

describe("control_for_range", () => {
  test("loop 変数入力をインライン reporter として定義する", () => {
    const def = getBlockDefs([]).find((item) => item.opcode === "control_for_range")

    expect(def).toBeDefined()
    expect(def?.headerReporterCopies).toBeUndefined()

    const loopVariableInput = def?.inputs[0]
    expect(loopVariableInput?.type).toBe("variable-name")
    if (!loopVariableInput || loopVariableInput.type !== "variable-name") {
      throw new Error("control_for_range の先頭入力が variable-name ではありません")
    }

    expect(loopVariableInput.editable).toBe(false)
    expect(loopVariableInput.appearance).toBe("inline-reporter")
    expect(loopVariableInput.copySource).toEqual({
      targetOpcode: "control_loop_variable",
      targetShape: "reporter",
      inputBindings: { 0: 0 },
    })
  })
})

describe("inputWidth", () => {
  test("インライン reporter の variable-name は通常よりコンパクトになる", () => {
    const standardInput: InputDef = {
      type: "variable-name",
      default: "loopIndex",
    }
    const compactInput: InputDef = {
      type: "variable-name",
      default: "loopIndex",
      appearance: "inline-reporter",
    }

    expect(inputWidth(compactInput)).toBeLessThan(inputWidth(standardInput))
  })

  test("インライン reporter の幅は長い名前のときだけ上限に達する", () => {
    const compactInput: InputDef = {
      type: "variable-name",
      default: "i",
      appearance: "inline-reporter",
      maxWidth: 72,
    }
    const longInput: InputDef = {
      ...compactInput,
      default: "veryLongLoopVariableName",
    }

    expect(inputWidth(compactInput)).toBeLessThan(72)
    expect(inputWidth(longInput)).toBe(72)
  })
})
