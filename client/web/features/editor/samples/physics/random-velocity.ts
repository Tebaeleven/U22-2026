// Physics Example: ランダム速度
// ランダムな速度で跳ね回る複数のボール

import { sp, type SampleProject } from "../_helpers"

export const randomVelocity: SampleProject = {
  id: "physics-random-velocity",
  name: "ランダム速度",
  description: "ランダムな速度で跳ね回る複数のボール",
  category: "physics",
  sprites: [
    sp("s-b1", "赤", "🔴", { w: 40, h: 40, color: "#ee3333", radius: 20 }, { x: -200, y: 100 }),
    sp("s-b2", "青", "🔵", { w: 40, h: 40, color: "#3366ee", radius: 20 }, { x: 200, y: 100 }),
    sp("s-b3", "緑", "🟢", { w: 40, h: 40, color: "#33cc33", radius: 20 }, { x: 0, y: -100 }),
    sp("s-b4", "黄", "🟡", { w: 40, h: 40, color: "#eecc33", radius: 20 }, { x: -300, y: -200 }),
    sp("s-b5", "紫", "🟣", { w: 40, h: 40, color: "#aa44ee", radius: 20 }, { x: 300, y: 200 }),
    sp("s-b6", "橙", "🟠", { w: 40, h: 40, color: "#ee8833", radius: 20 }, { x: -100, y: 300 }),
  ],
  pseudocode: `
class 赤 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setBounce(1.0)
    this.setCollideWorldBounds(true)
    this.setVelocityX(this.randomInt(-400, 400))
    this.setVelocityY(this.randomInt(-400, 400))
  }
  onUpdate() {
    this.emitParticles(this.x, this.y, 1, "#ee3333", 10)
  }
}
class 青 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setBounce(1.0)
    this.setCollideWorldBounds(true)
    this.setVelocityX(this.randomInt(-400, 400))
    this.setVelocityY(this.randomInt(-400, 400))
  }
  onUpdate() {
    this.emitParticles(this.x, this.y, 1, "#3366ee", 10)
  }
}
class 緑 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setBounce(1.0)
    this.setCollideWorldBounds(true)
    this.setVelocityX(this.randomInt(-400, 400))
    this.setVelocityY(this.randomInt(-400, 400))
  }
  onUpdate() {
    this.emitParticles(this.x, this.y, 1, "#33cc33", 10)
  }
}
class 黄 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setBounce(1.0)
    this.setCollideWorldBounds(true)
    this.setVelocityX(this.randomInt(-400, 400))
    this.setVelocityY(this.randomInt(-400, 400))
  }
  onUpdate() {
    this.emitParticles(this.x, this.y, 1, "#eecc33", 10)
  }
}
class 紫 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setBounce(1.0)
    this.setCollideWorldBounds(true)
    this.setVelocityX(this.randomInt(-400, 400))
    this.setVelocityY(this.randomInt(-400, 400))
  }
  onUpdate() {
    this.emitParticles(this.x, this.y, 1, "#aa44ee", 10)
  }
}
class 橙 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setBounce(1.0)
    this.setCollideWorldBounds(true)
    this.setVelocityX(this.randomInt(-400, 400))
    this.setVelocityY(this.randomInt(-400, 400))
  }
  onUpdate() {
    this.emitParticles(this.x, this.y, 1, "#ee8833", 10)
  }
}
`,
}
