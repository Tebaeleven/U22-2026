// Physics Example: 重力デモ
// 異なる重力設定で落下する3つのブロック

import { sp, type SampleProject } from "../_helpers"

export const gravityDemo: SampleProject = {
  id: "physics-gravity-demo",
  name: "重力デモ",
  description: "異なる重力設定で落下する3つのブロック",
  category: "physics",
  sprites: [
    sp("s-block1", "軽いブロック", "🟨", { w: 60, h: 60, color: "#eecc33", radius: 6 }, { x: -300, y: 300 }),
    sp("s-block2", "重いブロック", "🟧", { w: 60, h: 60, color: "#ee8833", radius: 6 }, { x: 0, y: 300 }),
    sp("s-block3", "浮くブロック", "🟦", { w: 60, h: 60, color: "#3388ee", radius: 6 }, { x: 300, y: 300 }),
    sp("s-ground", "地面", "⬛", { w: 1920, h: 60, color: "#555555" }, { x: 0, y: -480 }),
    sp("s-hud", "HUD", "📊", { w: 4, h: 4, color: "#000000" }, { x: 0, y: 0 }, { visible: false }),
  ],
  pseudocode: `
class 軽いブロック {
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(300)
    this.setBounce(0.4)
    this.setCollideWorldBounds(true)
    this.addTextAt("l1", "重力: 300", -360, 400, 20, "#eecc33")
  }
}
class 重いブロック {
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(900)
    this.setBounce(0.4)
    this.setCollideWorldBounds(true)
    this.addTextAt("l2", "重力: 900", -60, 400, 20, "#ee8833")
  }
}
class 浮くブロック {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.addTextAt("l3", "重力: なし", 240, 400, 20, "#3388ee")
  }
}
class 地面 {
  onCreate() {
    this.setPhysics("static")
  }
}
class HUD {
}
`,
}
