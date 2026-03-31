// Physics Example: レースカー
// 角速度・角度ベースの速度・ダンピングのデモ
// Phaser公式: Racecar を再現

import { sp, type SampleProject } from "../_helpers"

export const racecar: SampleProject = {
  id: "physics-racecar",
  name: "レースカー",
  description: "角速度と回転ベースの移動",
  category: "physics",
  sprites: [
    sp("s-car", "車", "🏎️", { w: 48, h: 80, color: "#ffcc00", radius: 8, border: "#cc9900" }, { x: 0, y: 0 }),
  ],
  pseudocode: `
class 車 {
  var throttle = 0
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity(false)
    this.setAngle(-90)
    this.throttle = 0
  }

  onUpdate() {
    if (this.isKeyPressed("up arrow")) {
      this.throttle = this.min(this.throttle + 5, 400)
    } else if (this.isKeyPressed("down arrow")) {
      this.throttle = this.max(this.throttle - 5, -100)
    } else {
      this.throttle = this.throttle * 0.98
    }

    if (this.isKeyPressed("left arrow")) {
      this.setAngularVelocity(-180)
    } else if (this.isKeyPressed("right arrow")) {
      this.setAngularVelocity(180)
    } else {
      this.setAngularVelocity(0)
    }

    this.velocityFromAngle(this.angle, this.throttle)
    this.worldWrap(48)
  }
}
`,
}
