// Particles Example: パーティクルトレイル
// 移動するスプライトがカラフルなパーティクルの軌跡を残す

import { sp, type SampleProject } from "../_helpers"

export const particleTrail: SampleProject = {
  id: "particles-trail",
  name: "パーティクルトレイル",
  description: "移動しながらパーティクルの軌跡を残す",
  category: "particles",
  sprites: [
    sp("s-runner", "ランナー", "✨", { w: 40, h: 40, color: "#ffcc00", radius: 20 }, { x: 0, y: 0 }),
  ],
  pseudocode: `
class ランナー {
  var colorIdx = 0
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.colorIdx = 0
    this.addTextAt("info", "Arrow keys to move", -300, 490, 28, "#ffffff")
  }
  onUpdate() {
    this.setVelocity(0, 0)
    if (this.isKeyPressed("left arrow")) {
      this.setVelocityX(-350)
    } else if (this.isKeyPressed("right arrow")) {
      this.setVelocityX(350)
    }
    if (this.isKeyPressed("up arrow")) {
      this.setVelocityY(-350)
    } else if (this.isKeyPressed("down arrow")) {
      this.setVelocityY(350)
    }
    this.colorIdx += 1
    if (this.colorIdx > 4) {
      this.colorIdx = 0
    }
    if (this.colorIdx == 0) {
      this.emitParticles(this.x, this.y, 3, "#ff3366", 80)
    }
    if (this.colorIdx == 1) {
      this.emitParticles(this.x, this.y, 3, "#ff9933", 80)
    }
    if (this.colorIdx == 2) {
      this.emitParticles(this.x, this.y, 3, "#ffcc00", 80)
    }
    if (this.colorIdx == 3) {
      this.emitParticles(this.x, this.y, 3, "#33cc66", 80)
    }
    if (this.colorIdx == 4) {
      this.emitParticles(this.x, this.y, 3, "#3366ff", 80)
    }
    this.setAngle(this.angle + 5)
  }
}
`,
}
