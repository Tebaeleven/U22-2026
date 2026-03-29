// Physics Example: バウンステスト
// 5つのボールが異なるバウンス値で落下

import { sp, type SampleProject } from "../_helpers"

export const bounceTest: SampleProject = {
  id: "physics-bounce-test",
  name: "バウンステスト",
  description: "5つのボールが異なるバウンス値で落下する",
  category: "physics",
  sprites: [
    sp("s-b0", "ボール0", "⚫", { w: 48, h: 48, color: "#666666", radius: 24 }, { x: -600, y: 400 }),
    sp("s-b25", "ボール25", "🟤", { w: 48, h: 48, color: "#aa6633", radius: 24 }, { x: -300, y: 350 }),
    sp("s-b50", "ボール50", "🟡", { w: 48, h: 48, color: "#ddcc33", radius: 24 }, { x: 0, y: 300 }),
    sp("s-b75", "ボール75", "🟠", { w: 48, h: 48, color: "#ee8833", radius: 24 }, { x: 300, y: 250 }),
    sp("s-b100", "ボール100", "🔴", { w: 48, h: 48, color: "#ee3333", radius: 24 }, { x: 600, y: 200 }),
    sp("s-ground", "地面", "⬛", { w: 1920, h: 60, color: "#555555" }, { x: 0, y: -480 }),
  ],
  pseudocode: `
class ボール0 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(600)
    this.setBounce(0)
    this.setCollideWorldBounds(true)
    this.addTextAt("t0", "bounce: 0", -660, 460, 18, "#666666")
  }
}
class ボール25 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(600)
    this.setBounce(0.25)
    this.setCollideWorldBounds(true)
    this.addTextAt("t25", "bounce: 0.25", -360, 460, 18, "#aa6633")
  }
}
class ボール50 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(600)
    this.setBounce(0.5)
    this.setCollideWorldBounds(true)
    this.addTextAt("t50", "bounce: 0.5", -60, 460, 18, "#ddcc33")
  }
}
class ボール75 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(600)
    this.setBounce(0.75)
    this.setCollideWorldBounds(true)
    this.addTextAt("t75", "bounce: 0.75", 240, 460, 18, "#ee8833")
  }
}
class ボール100 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(600)
    this.setBounce(1.0)
    this.setCollideWorldBounds(true)
    this.addTextAt("t100", "bounce: 1.0", 540, 460, 18, "#ee3333")
  }
}
class 地面 {
  onCreate() {
    this.setPhysics("static")
  }
}
`,
}
