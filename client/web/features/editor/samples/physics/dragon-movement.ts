// Physics Example: ドラゴン風移動
// 加速度・ドラッグ・最大速度・重力のデモ
// Phaser公式: Dragon Movement を再現

import { sp, type SampleProject } from "../_helpers"

export const dragonMovement: SampleProject = {
  id: "physics-dragon",
  name: "ドラゴン移動",
  description: "加速度とドラッグで慣性のある移動",
  category: "physics",
  sprites: [
    sp("s-dragon", "ドラゴン", "🐉", { w: 96, h: 64, color: "#44bb44", radius: 12, border: "#228822" }, { x: 0, y: 0 }),
    sp("s-ground", "地面", "⬛", { w: 1920, h: 60, color: "#555555" }, { x: 0, y: -480 }),
  ],
  pseudocode: `
class ドラゴン {
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(450)
    this.setBounce(0.2)
    this.setCollideWorldBounds(true)
    this.setDrag(300, 300)
    this.setMaxVelocity(600, 600)
  }

  onUpdate() {
    this.setAcceleration(0, 0)

    if (this.isKeyPressed("left arrow")) {
      this.setAccelerationX(-600)
      this.setFlipX(false)
    } else if (this.isKeyPressed("right arrow")) {
      this.setAccelerationX(600)
      this.setFlipX(true)
    }

    if (this.isKeyPressed("up arrow")) {
      this.setAccelerationY(-600)
    } else if (this.isKeyPressed("down arrow")) {
      this.setAccelerationY(600)
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
