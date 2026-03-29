// Physics Example: 動く足場
// 左右に動く足場の上でプレイヤーが乗れるプラットフォーマー

import { sp, type SampleProject } from "../_helpers"

export const stickyPlatform: SampleProject = {
  id: "physics-sticky-platform",
  name: "動く足場",
  description: "左右に動く足場の上でプレイヤーがジャンプ",
  category: "physics",
  sprites: [
    sp("s-player", "プレイヤー", "🏃", { w: 50, h: 80, color: "#4488ff", radius: 8, border: "#2255cc" }, { x: -400, y: 0 }),
    sp("s-plat1", "足場1", "📦", { w: 250, h: 30, color: "#66aa44", radius: 4 }, { x: -300, y: -200 }),
    sp("s-plat2", "足場2", "📦", { w: 250, h: 30, color: "#aa6644", radius: 4 }, { x: 300, y: 0 }),
    sp("s-ground", "地面", "⬛", { w: 1920, h: 60, color: "#555555" }, { x: 0, y: -480 }),
  ],
  pseudocode: `
class プレイヤー {
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(800)
    this.setBounce(0)
    this.setCollideWorldBounds(true)
    this.addTextAt("info", "← → で移動 / ↑ でジャンプ", -350, 470, 22, "#4488ff")
  }
  onUpdate() {
    if (this.isKeyPressed("left arrow")) {
      this.setVelocityX(-300)
      this.setFlipX(true)
    } else if (this.isKeyPressed("right arrow")) {
      this.setVelocityX(300)
      this.setFlipX(false)
    } else {
      this.setVelocityX(0)
    }
    if (this.isKeyPressed("up arrow") && this.isOnGround()) {
      this.setVelocityY(-500)
    }
  }
}
class 足場1 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setImmovable("on")
    this.setAllowGravity("off")
    this.setVelocityX(100)
    this.dir = 1
  }
  onUpdate() {
    if (this.x > -100) {
      this.dir = -1
      this.setVelocityX(-100)
    }
    if (this.x < -500) {
      this.dir = 1
      this.setVelocityX(100)
    }
  }
}
class 足場2 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setImmovable("on")
    this.setAllowGravity("off")
    this.setVelocityY(80)
    this.dir = 1
  }
  onUpdate() {
    if (this.y < -100) {
      this.setVelocityY(-80)
    }
    if (this.y > 200) {
      this.setVelocityY(80)
    }
  }
}
class 地面 {
  onCreate() {
    this.setPhysics("static")
  }
}
`,
}
