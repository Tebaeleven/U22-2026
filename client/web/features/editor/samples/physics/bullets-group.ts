// Physics Example: 弾の発射
// スペースキーで弾をクローン発射する宇宙船

import { sp, type SampleProject } from "../_helpers"

export const bulletsGroup: SampleProject = {
  id: "physics-bullets-group",
  name: "弾の発射",
  description: "スペースキーで弾をクローン発射する宇宙船",
  category: "physics",
  sprites: [
    sp("s-ship", "戦闘機", "🚀", { w: 60, h: 40, color: "#44aaff", radius: 8, border: "#2277cc" }, { x: 0, y: -350 }),
    sp("s-bullet", "弾", "💥", { w: 10, h: 20, color: "#ffcc00", radius: 4 }, { x: -9999, y: -9999 }, { visible: false }),
  ],
  pseudocode: `
class 戦闘機 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.addTextAt("info", "← → で移動 / スペースで発射", -200, 470, 22, "#44aaff")
  }
  onUpdate() {
    if (this.isKeyPressed("left arrow")) {
      this.setVelocityX(-400)
    } else if (this.isKeyPressed("right arrow")) {
      this.setVelocityX(400)
    } else {
      this.setVelocityX(0)
    }
    if (this.isKeyJustDown("space")) {
      弾.spawnX = this.x
      弾.spawnY = this.y + 24
      this.createClone("弾")
    }
    this.emitParticles(this.x, this.y - 20, 1, "#3388ff", 15)
  }
}
class 弾 {
  var spawnX = 0
  var spawnY = 0
  onCreate() {
    this.hide()
  }
  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(this.spawnX, this.spawnY)
    this.setVelocityY(600)
    this.playSound("laser")
  }
  onUpdate() {
    this.emitParticles(this.x, this.y, 1, "#ffcc00", 10)
    if (this.y > 520) {
      this.deleteClone()
    }
  }
}
`,
}
