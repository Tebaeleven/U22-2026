// Physics Example: 基本プラットフォーマー
// 重力・ジャンプ・プラットフォーム衝突のデモ

import { sp, type SampleProject } from "../_helpers"

export const platformerBasic: SampleProject = {
  id: "physics-platformer-basic",
  name: "基本プラットフォーマー",
  description: "左右移動とジャンプ",
  category: "physics",
  sprites: [
    sp("s-player", "プレイヤー", "🏃", { w: 60, h: 100, color: "#4488ff", radius: 10, border: "#2255cc" }, { x: 0, y: -200 }),
    sp("s-ground", "地面", "⬛", { w: 1920, h: 80, color: "#6B4F14" }, { x: 0, y: -440 }),
    sp("s-plat1", "浮島1", "📦", { w: 300, h: 30, color: "#448833", radius: 4 }, { x: -400, y: -100 }),
    sp("s-plat2", "浮島2", "📦", { w: 300, h: 30, color: "#448833", radius: 4 }, { x: 400, y: 100 }),
  ],
  pseudocode: `
class プレイヤー {
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(1000)
    this.setBounce(0)
    this.setCollideWorldBounds(true)
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
      this.setVelocityY(-550)
      this.emitParticles(this.x, this.y - 40, 6, "#aaaaaa", 60)
    }
  }
}
class 地面 {
  onCreate() {
    this.setPhysics("static")
  }
}
class 浮島1 {
  onCreate() {
    this.setPhysics("static")
  }
}
class 浮島2 {
  onCreate() {
    this.setPhysics("static")
  }
}
`,
}
