// @ts-expect-error Bun のテストランナー上でのみ解決される
import { describe, expect, test } from "bun:test"
import { parseClassCode } from "./class-parser"
import { classASTToLegacyAST } from "./ast-converter"

describe("classASTToLegacyAST", () => {
  test("onUpdate を親とクローンの両方で起動するスクリプトへ展開する", () => {
    const source = `
class タイル {
  onCreate() {
    this.hide()
  }

  onClone() {
    this.show()
  }

  onUpdate() {
    if (this.touching("mouse-pointer")) {
      this.setTint("#ff8800")
    }
  }
}
`

    const program = classASTToLegacyAST(parseClassCode(source))
    const tile = program.find((sprite) => sprite.name === "タイル")

    expect(tile).toBeDefined()
    expect(tile?.scripts.map((script) => script.hat.type)).toEqual([
      "flagClicked",
      "clone",
      "flagClicked",
      "clone",
    ])

    const updateScripts = tile?.scripts.filter((script) => {
      const first = script.body[0]
      return first?.type === "forever"
    }) ?? []

    expect(updateScripts).toHaveLength(2)
    expect(updateScripts.every((script) => script.hat.type === "flagClicked" || script.hat.type === "clone")).toBe(true)
  })
})
