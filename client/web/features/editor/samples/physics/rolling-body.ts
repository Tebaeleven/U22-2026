// Physics Example: 転がるボール
// 角速度と線速度を連動させて転がる動き

import { sp, type SampleProject } from "../_helpers"

export const rollingBody: SampleProject = {
  id: "physics-rolling-body",
  name: "転がるボール",
  description: "角速度と線速度を連動させて転がる動き",
  category: "physics",
  sprites: [
    sp("s-ball", "ボール", "🟠", { w: 60, h: 60, color: "#ee8833", radius: 30, border: "#cc6611" }, { x: -500, y: 0 }),
    sp("s-slope", "坂", "⬛", { w: 600, h: 30, color: "#666666" }, { x: 0, y: -200 }),
    sp("s-ground", "地面", "⬛", { w: 1920, h: 60, color: "#555555" }, { x: 0, y: -480 }),
  ],
  pseudocode: `
class ボール {
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(600)
    this.setBounce(0.3)
    this.setCollideWorldBounds(true)
    this.setVelocityX(200)
    this.addTextAt("info", "転がるボール: 角速度が線速度に連動", -300, 470, 22, "#ee8833")
  }
  onUpdate() {
    this.setAngularVelocity(this.velocityX * 2)
    this.emitParticles(this.x, this.y - 30, 1, "#ee8833", 10)
  }
}
class 坂 {
  onCreate() {
    this.setPhysics("static")
    this.setAngle(-15)
  }
}
class 地面 {
  onCreate() {
    this.setPhysics("static")
  }
}
`,
}
