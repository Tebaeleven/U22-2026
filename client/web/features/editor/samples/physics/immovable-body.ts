// Physics Example: 不動オブジェクト
// 他のオブジェクトに押されない不動体

import { sp, type SampleProject } from "../_helpers"

export const immovableBody: SampleProject = {
  id: "physics-immovable-body",
  name: "不動オブジェクト",
  description: "他のオブジェクトに押されない不動体",
  category: "physics",
  sprites: [
    sp("s-wall", "固定壁", "🧱", { w: 80, h: 80, color: "#886644", radius: 8 }, { x: 0, y: 0 }),
    sp("s-ball1", "赤ボール", "🔴", { w: 48, h: 48, color: "#ee3333", radius: 24 }, { x: -400, y: 0 }),
    sp("s-ball2", "青ボール", "🔵", { w: 48, h: 48, color: "#3366ee", radius: 24 }, { x: 400, y: 0 }),
    sp("s-ball3", "上ボール", "🟢", { w: 48, h: 48, color: "#33cc33", radius: 24 }, { x: 0, y: 400 }),
  ],
  pseudocode: `
class 固定壁 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setImmovable(true)
    this.setBounce(1.0)
    this.setCollideWorldBounds(true)
    this.addTextAt("info", "不動体: 押されない", -120, 100, 20, "#886644")
  }
}
class 赤ボール {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setBounce(1.0)
    this.setVelocityX(250)
    this.setCollideWorldBounds(true)
  }
}
class 青ボール {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setBounce(1.0)
    this.setVelocityX(-250)
    this.setCollideWorldBounds(true)
  }
}
class 上ボール {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setBounce(1.0)
    this.setVelocityY(-250)
    this.setCollideWorldBounds(true)
  }
}
`,
}
