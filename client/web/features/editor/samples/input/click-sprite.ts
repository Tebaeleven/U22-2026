// Input Example: スプライトクリック
// クリックで色が変わるカラーボックス

import { sp, type SampleProject } from "../_helpers"

export const clickSprite: SampleProject = {
  id: "input-click-sprite",
  name: "スプライトクリック",
  description: "ボックスをクリックして色を変える",
  category: "input",
  sprites: [
    sp("s-box1", "赤箱", "🟥", { w: 100, h: 100, color: "#ee3333", radius: 8 }, { x: -300, y: 0 }),
    sp("s-box2", "青箱", "🟦", { w: 100, h: 100, color: "#3366ee", radius: 8 }, { x: 0, y: 0 }),
    sp("s-box3", "緑箱", "🟩", { w: 100, h: 100, color: "#33cc33", radius: 8 }, { x: 300, y: 0 }),
  ],
  pseudocode: `
class 赤箱 {
  var tinted = 0
  onCreate() {
    this.setPhysics("static")
    this.tinted = 0
    this.addTextAt("info", "Click the boxes!", -400, 490, 28, "#ffffff")
  }
  onUpdate() {
    if (this.touching("mouse-pointer")) {
      if (this.mouseDown) {
        if (this.tinted == 0) {
          this.setTint("#ffcc00")
          this.tweenScale(1.3, 0.2)
          this.tinted = 1
        } else {
          this.clearTint()
          this.tweenScale(1, 0.2)
          this.tinted = 0
        }
        this.wait(0.3)
      }
    }
  }
}
class 青箱 {
  var tinted = 0
  onCreate() {
    this.setPhysics("static")
    this.tinted = 0
  }
  onUpdate() {
    if (this.touching("mouse-pointer")) {
      if (this.mouseDown) {
        if (this.tinted == 0) {
          this.setTint("#ff66ff")
          this.tweenScale(1.3, 0.2)
          this.tinted = 1
        } else {
          this.clearTint()
          this.tweenScale(1, 0.2)
          this.tinted = 0
        }
        this.wait(0.3)
      }
    }
  }
}
class 緑箱 {
  var tinted = 0
  onCreate() {
    this.setPhysics("static")
    this.tinted = 0
  }
  onUpdate() {
    if (this.touching("mouse-pointer")) {
      if (this.mouseDown) {
        if (this.tinted == 0) {
          this.setTint("#00ffff")
          this.tweenScale(1.3, 0.2)
          this.tinted = 1
        } else {
          this.clearTint()
          this.tweenScale(1, 0.2)
          this.tinted = 0
        }
        this.wait(0.3)
      }
    }
  }
}
`,
}
