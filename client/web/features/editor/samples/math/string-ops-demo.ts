// Operators Example: 文字列操作
// contains / substring / split / replace デモ

import { sp, type SampleProject } from "../_helpers"

export const stringOpsDemo: SampleProject = {
  id: "math-string-ops",
  name: "文字列操作",
  description: "contains / substring / replace",
  category: "math",
  sprites: [
    sp("s-player", "プレイヤー", "🏃", { w: 50, h: 50, color: "#4488ff", radius: 25 }, { x: 0, y: 0 }),
    sp("s-hud", "HUD", "📊", { w: 4, h: 4, color: "#000000" }, { x: 0, y: 0 }, { visible: false }),
  ],
  pseudocode: `
class プレイヤー {
  var result = substring("Hello World", 1, 5)
  var num = toNumber("42") + 8
  onCreate() {
    this.addTextAt("t1", "SPACE: contains", -900, 490, 22, "#ffffff")
    this.addTextAt("t2", "UP: substring", -900, 450, 22, "#ffffff")
    this.addTextAt("t3", "DOWN: replace", -900, 410, 22, "#ffffff")
    this.addTextAt("result", "---", -900, 350, 28, "#44ff44")
  }

  onKeyPress("space") {
    // contains
    if (contains("Hello World", "World")) {
      this.updateTextAt("result", "contains: true!")
    } else {
      this.updateTextAt("result", "contains: false")
    }
  }

  onKeyPress("up arrow") {
    // substring
    this.result = substring("Hello World", 1, 5)
    this.updateTextAt("result", join("substring(1,5): ", this.result))
  }

  onKeyPress("down arrow") {
    // replace
    this.result = replace("Hello World", "World", "VPL")
    this.updateTextAt("result", join("replace: ", this.result))
  }

  onKeyPress("left arrow") {
    // letterOf
    this.result = letterOf(3, "ABCDEF")
    this.updateTextAt("result", join("letter 3: ", this.result))
  }

  onKeyPress("right arrow") {
    // toNumber / toText
    this.num = toNumber("42") + 8
    this.updateTextAt("result", join("toNumber + 8 = ", toText(this.num)))
  }
}
class HUD {
}
`,
}
