// Particles Example: パーティクルバースト
// クリック位置にパーティクルを発射

import { sp, type SampleProject } from "../_helpers"

export const particleBurst: SampleProject = {
  id: "particles-burst",
  name: "パーティクルバースト",
  description: "スペースキーで色とりどりのパーティクル",
  category: "particles",
  sprites: [
    sp("s-emitter", "発射台", "💥", { w: 40, h: 40, color: "#ffcc00", radius: 20 }, { x: 0, y: 0 }),
  ],
  pseudocode: `
class 発射台 {
  var colorIdx = 0
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.colorIdx = 0
    this.addTextAt("info", "Move & Press SPACE", -300, 490, 28, "#ffffff")
  }
  onUpdate() {
    this.setVelocity(0, 0)
    if (this.isKeyPressed("left arrow")) {
      this.setVelocityX(-400)
    } else if (this.isKeyPressed("right arrow")) {
      this.setVelocityX(400)
    }
    if (this.isKeyPressed("up arrow")) {
      this.setVelocityY(-400)
    } else if (this.isKeyPressed("down arrow")) {
      this.setVelocityY(400)
    }
    this.setAngle(this.angle + 3)
  }
  onKeyPress("space") {
    this.colorIdx += 1
    if (this.colorIdx == 1) {
      this.emitParticles(this.x, this.y, 30, "#ff3333", 300)
    }
    if (this.colorIdx == 2) {
      this.emitParticles(this.x, this.y, 30, "#33ff33", 300)
    }
    if (this.colorIdx == 3) {
      this.emitParticles(this.x, this.y, 30, "#3333ff", 300)
    }
    if (this.colorIdx == 4) {
      this.emitParticles(this.x, this.y, 30, "#ffcc00", 300)
    }
    if (this.colorIdx > 4) {
      this.colorIdx = 0
      this.emitParticles(this.x, this.y, 50, "#ffffff", 400)
    }
    this.cameraShake(100, 0.01)
  }
}
`,
}
