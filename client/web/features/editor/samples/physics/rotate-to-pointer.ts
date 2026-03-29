// Physics Example: マウスに向かって回転
// マウス方向を向いて上矢印で前進する宇宙船

import { sp, type SampleProject } from "../_helpers"

export const rotateToPointer: SampleProject = {
  id: "physics-rotate-to-pointer",
  name: "マウスに向かって回転",
  description: "マウスを追いかけて前進する宇宙船",
  category: "physics",
  sprites: [
    sp("s-ship", "宇宙船", "🚀", { w: 60, h: 30, color: "#44aaff", radius: 6, border: "#2277cc" }, { x: 0, y: 0 }),
    sp("s-cursor", "カーソル", "🎯", { w: 20, h: 20, color: "#ff4444", radius: 10 }, { x: 200, y: 200 }),
  ],
  pseudocode: `
class 宇宙船 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.setDrag(100, 100)
    this.setMaxVelocity(300, 300)
    this.addTextAt("info", "マウスでカーソル移動 / 上矢印で前進", -400, 470, 22, "#44aaff")
  }
  onUpdate() {
    this.setAngle(this.angleTo("カーソル"))
    if (this.isKeyPressed("up arrow")) {
      this.velocityFromAngle(this.angle, 300)
    }
    this.emitParticles(this.x, this.y, 1, "#44aaff", 10)
  }
}
class カーソル {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
  }
  onUpdate() {
    this.setPosition(this.mouseX, this.mouseY)
  }
}
`,
}
