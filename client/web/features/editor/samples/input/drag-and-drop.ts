// Input Example: ドラッグ＆ドロップ
// アイテムをターゲットゾーンにドロップする

import { sp, type SampleProject } from "../_helpers"

export const dragAndDrop: SampleProject = {
  id: "input-drag-and-drop",
  name: "ドラッグ＆ドロップ",
  description: "アイテムをターゲットにドロップ",
  category: "input",
  sprites: [
    sp("s-target1", "ターゲット1", "🎯", { w: 100, h: 100, color: "#333333", radius: 8, border: "#ffcc00" }, { x: -300, y: -200 }),
    sp("s-target2", "ターゲット2", "🎯", { w: 100, h: 100, color: "#333333", radius: 8, border: "#ff6633" }, { x: 300, y: -200 }),
    sp("s-item1", "アイテム1", "🟡", { w: 70, h: 70, color: "#ffcc00", radius: 35 }, { x: -300, y: 200 }),
    sp("s-item2", "アイテム2", "🟠", { w: 70, h: 70, color: "#ff6633", radius: 35 }, { x: 300, y: 200 }),
  ],
  pseudocode: `
class ターゲット1 {
  onCreate() {
    this.setPhysics("static")
    this.addTextAt("info", "Drag items to targets", -500, 490, 28, "#ffffff")
  }
}
class ターゲット2 {
  onCreate() {
    this.setPhysics("static")
  }
}
class アイテム1 {
  var placed = 0
  var dist = distanceTo("ターゲット1")
  onCreate() {
    this.enableDrag()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.placed = 0
  }
  onUpdate() {
    if (this.placed == 0) {
      this.dist = this.distanceTo("ターゲット1")
      if (this.dist < 80) {
        if (!this.mouseDown) {
          this.setPosition(-300, -200)
          this.placed = 1
          this.setTint("#88ff88")
          this.tweenScale(1.2, 0.2)
          this.emitParticles(this.x, this.y, 15, "#ffcc00", 150)
          this.wait(0.2)
          this.tweenScale(1, 0.2)
        }
      }
    }
  }
}
class アイテム2 {
  var placed = 0
  var dist = distanceTo("ターゲット2")
  onCreate() {
    this.enableDrag()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.placed = 0
  }
  onUpdate() {
    if (this.placed == 0) {
      this.dist = this.distanceTo("ターゲット2")
      if (this.dist < 80) {
        if (!this.mouseDown) {
          this.setPosition(300, -200)
          this.placed = 1
          this.setTint("#88ff88")
          this.tweenScale(1.2, 0.2)
          this.emitParticles(this.x, this.y, 15, "#ff6633", 150)
          this.wait(0.2)
          this.tweenScale(1, 0.2)
        }
      }
    }
  }
}
`,
}
