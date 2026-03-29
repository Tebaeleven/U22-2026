// Physics Example: ドラッグデモ
// 通常ドラッグとダンピングドラッグの比較

import { sp, type SampleProject } from "../_helpers"

export const dragDemo: SampleProject = {
  id: "physics-drag-demo",
  name: "ドラッグデモ",
  description: "通常ドラッグとダンピングドラッグの比較",
  category: "physics",
  sprites: [
    sp("s-normal", "通常ドラッグ", "🟥", { w: 60, h: 60, color: "#ee4444", radius: 8 }, { x: -300, y: 0 }),
    sp("s-damping", "ダンピング", "🟦", { w: 60, h: 60, color: "#4444ee", radius: 8 }, { x: -300, y: 150 }),
    sp("s-hud", "HUD", "📊", { w: 4, h: 4, color: "#000000" }, { x: 0, y: 0 }, { visible: false }),
  ],
  pseudocode: `
class 通常ドラッグ {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.setBounce(1.0)
    this.setDrag(200, 200)
    this.setVelocityX(500)
    this.addTextAt("t1", "通常ドラッグ (200)", -500, 60, 20, "#ee4444")
  }
}
class ダンピング {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.setBounce(1.0)
    this.setDamping(true)
    this.setDrag(0.02, 0.02)
    this.setVelocityX(500)
    this.addTextAt("t2", "ダンピング (0.02)", -500, 210, 20, "#4444ee")
  }
}
class HUD {
}
`,
}
