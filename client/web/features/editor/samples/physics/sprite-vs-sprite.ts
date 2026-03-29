// Physics Example: スプライト対スプライト
// 2つのスプライトが互いに跳ね返る

import { sp, type SampleProject } from "../_helpers"

export const spriteVsSprite: SampleProject = {
  id: "physics-sprite-vs-sprite",
  name: "スプライト対スプライト",
  description: "2つのスプライトが互いに跳ね返る",
  category: "physics",
  sprites: [
    sp("s-red", "赤ブロック", "🟥", { w: 70, h: 70, color: "#ee3333", radius: 8 }, { x: -400, y: 0 }),
    sp("s-blue", "青ブロック", "🟦", { w: 70, h: 70, color: "#3333ee", radius: 8 }, { x: 400, y: 0 }),
  ],
  pseudocode: `
class 赤ブロック {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setBounce(1.0)
    this.setCollideWorldBounds(true)
    this.setVelocityX(300)
    this.setVelocityY(150)
    this.setMass(2)
  }
  onUpdate() {
    this.setAngle(this.angle + 2)
    this.emitParticles(this.x, this.y, 1, "#ee3333", 15)
  }
}
class 青ブロック {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setBounce(1.0)
    this.setCollideWorldBounds(true)
    this.setVelocityX(-300)
    this.setVelocityY(-150)
    this.setMass(5)
  }
  onUpdate() {
    this.setAngle(this.angle - 2)
    this.emitParticles(this.x, this.y, 1, "#3333ee", 15)
  }
}
`,
}
