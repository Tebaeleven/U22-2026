// Physics Example: 追跡する敵
// moveToでプレイヤーを追いかける敵

import { sp, type SampleProject } from "../_helpers"

export const moveToTarget: SampleProject = {
  id: "physics-move-to-target",
  name: "追跡する敵",
  description: "moveToでプレイヤーを追いかける敵",
  category: "physics",
  sprites: [
    sp("s-player", "プレイヤー", "🟦", { w: 50, h: 50, color: "#4488ff", radius: 25, border: "#2255cc" }, { x: 0, y: 0 }),
    sp("s-enemy", "敵", "🟥", { w: 50, h: 50, color: "#ee3333", radius: 25 }, { x: -500, y: 300 }),
    sp("s-enemy2", "敵2", "🟧", { w: 45, h: 45, color: "#ee8833", radius: 22 }, { x: 500, y: -300 }),
  ],
  pseudocode: `
class プレイヤー {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.addTextAt("info", "矢印キーで移動!", -100, 470, 22, "#4488ff")
  }
  onUpdate() {
    if (this.isKeyPressed("left arrow")) {
      this.setVelocityX(-400)
    } else if (this.isKeyPressed("right arrow")) {
      this.setVelocityX(400)
    } else {
      this.setVelocityX(0)
    }
    if (this.isKeyPressed("up arrow")) {
      this.setVelocityY(-400)
    } else if (this.isKeyPressed("down arrow")) {
      this.setVelocityY(400)
    } else {
      this.setVelocityY(0)
    }
  }
}
class 敵 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
  }
  onUpdate() {
    this.moveTo("プレイヤー", 150)
    this.emitParticles(this.x, this.y, 1, "#ee3333", 15)
  }
}
class 敵2 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
  }
  onUpdate() {
    this.moveTo("プレイヤー", 100)
    this.emitParticles(this.x, this.y, 1, "#ee8833", 15)
  }
}
`,
}
