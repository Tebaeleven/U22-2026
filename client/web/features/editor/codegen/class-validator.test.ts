// @ts-expect-error Bun のテストランナー上でのみ解決される
import { describe, expect, test } from "bun:test"
import { parseClassCode } from "./class-parser"
import { validateClassProgram } from "./class-validator"

function validate(source: string) {
  return () => validateClassProgram(parseClassCode(source))
}

describe("validateClassProgram", () => {
  test("宣言済みフィールドとローカル変数は許可する", () => {
    expect(validate(`
class プレイヤー {
  var hp = 100
  let speed = 240

  onCreate() {
    var nextHp = hp - 10
    this.setPosition(0, 0)
    hp = nextHp
    this.setVelocity(speed, 0)
  }
}
`)).not.toThrow()
  })

  test("未宣言変数の使用を拒否する", () => {
    expect(validate(`
class プレイヤー {
  onCreate() {
    score = 10
  }
}
`)).toThrow(/undeclared or immutable variable "score"/)
  })

  test("未知メソッドを拒否する", () => {
    expect(validate(`
class プレイヤー {
  onCreate() {
    this.flyAway()
  }
}
`)).toThrow(/Unknown method "flyAway"/)
  })

  test("let フィールドへの再代入を拒否する", () => {
    expect(validate(`
class プレイヤー {
  let speed = 240

  onCreate() {
    speed = 300
  }
}
`)).toThrow(/undeclared or immutable variable "speed"/)
  })
})
