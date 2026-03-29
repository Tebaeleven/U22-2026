// Physics Example: バウンドするボール
// 重力・バウンス・ワールド境界衝突のデモ

import { sp, type SampleProject } from "../_helpers"

export const bounceBalls: SampleProject = {
  id: "physics-bounce-balls",
  name: "バウンドするボール",
  description: "重力でバウンドする3つのボール",
  category: "physics",
  sprites: [
    sp("s-ball1", "赤ボール", "🔴", { w: 48, h: 48, color: "#ee3333", radius: 24 }, { x: -300, y: 300 }),
    sp("s-ball2", "青ボール", "🔵", { w: 64, h: 64, color: "#3366ee", radius: 32 }, { x: 0, y: 200 }),
    sp("s-ball3", "緑ボール", "🟢", { w: 40, h: 40, color: "#33cc33", radius: 20 }, { x: 300, y: 400 }),
    sp("s-ground", "地面", "⬛", { w: 1920, h: 60, color: "#555555" }, { x: 0, y: -480 }),
  ],
  pseudocode: `
class 赤ボール {
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(600)
    this.setBounce(0.8)
    this.setCollideWorldBounds(true)
    this.setVelocityX(200)
  }
  onUpdate() {
    this.setAngle(this.angle + 3)
    this.emitParticles(this.x, this.y, 1, "#ff6666", 30)
  }
}
class 青ボール {
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(600)
    this.setBounce(0.9)
    this.setCollideWorldBounds(true)
    this.setVelocityX(-150)
  }
  onUpdate() {
    this.setAngle(this.angle - 2)
  }
}
class 緑ボール {
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(600)
    this.setBounce(0.95)
    this.setCollideWorldBounds(true)
  }
  onUpdate() {
    this.setAngle(this.angle + 5)
  }
}
class 地面 {
  onCreate() {
    this.setPhysics("static")
  }
}
`,
}
