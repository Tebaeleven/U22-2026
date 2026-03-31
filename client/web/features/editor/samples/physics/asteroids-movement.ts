// Physics Example: アステロイド風移動
// 加速度・角速度・ドラッグ・最大速度・ワールドラップのデモ
// Phaser公式: Asteroids Movement を再現

import { sp, type SampleProject } from "../_helpers"

export const asteroidsMovement: SampleProject = {
  id: "physics-asteroids",
  name: "アステロイド移動",
  description: "加速度・角速度・ダンピング・ワールドラップ",
  category: "physics",
  sprites: [
    sp("s-ship", "宇宙船", "🚀", { w: 48, h: 64, color: "#cccccc", radius: 8, border: "#888888" }, { x: 0, y: 0 }),
  ],
  pseudocode: `
class 宇宙船 {
  var speed = 0
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity(false)
    this.setDamping(true)
    this.setDrag(0.99, 0.99)
    this.setMaxVelocity(300, 300)
    this.speed = 0
    this.addTextAt("speed", "Speed: 0", -900, 490, 32, "#00ff00")
  }

  onUpdate() {
    if (this.isKeyPressed("up arrow")) {
      this.velocityFromAngle(this.angle, 200)
    } else {
      this.setAcceleration(0, 0)
    }
    if (this.isKeyPressed("left arrow")) {
      this.setAngularVelocity(-300)
    } else if (this.isKeyPressed("right arrow")) {
      this.setAngularVelocity(300)
    } else {
      this.setAngularVelocity(0)
    }
    this.worldWrap(32)
    this.updateTextAt("speed", this.join("Speed: ", this.round(this.physicsSpeed())))
  }
}
`,
}
