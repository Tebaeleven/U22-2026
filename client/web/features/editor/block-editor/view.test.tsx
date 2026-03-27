// @ts-expect-error Bun のテストランナー上でのみ解決される
import { describe, expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { createInitialInputValues, getBlockDefs } from "./blocks"
import type { BlockState } from "./types"
import { BlockView } from "./view"

describe("BlockView", () => {
  test("for のループ変数は編集 input ではなくドラッグ用チップで表示される", () => {
    const def = getBlockDefs([]).find((item) => item.opcode === "control_for_range")

    expect(def).toBeDefined()
    if (!def) {
      throw new Error("control_for_range の定義が見つかりません")
    }

    const block: BlockState = {
      id: "for-block",
      def,
      inputValues: createInitialInputValues(def.inputs),
    }

    const markup = renderToStaticMarkup(
      <BlockView
        block={block}
        nestedSlots={{}}
      />
    )

    expect(markup).toContain("scratch-header-copy-chip")
    expect(markup).not.toContain("scratch-inline-reporter")
    expect(markup.match(/<input/g)?.length ?? 0).toBe(2)
  })
})
