// Input Example: 単発入力
// isKeyJustDown と isKeyPressed の違いを示すデモ

import { sp, type SampleProject } from "../_helpers"

export const justDown: SampleProject = {
  id: "input-just-down",
  name: "単発入力",
  description: "スペースで1回だけ弾を発射（isKeyJustDown）",
  category: "input",
  sprites: [
    sp("s-player", "砲台", "🔫", { w: 60, h: 60, color: "#4488ff", radius: 8 }, { x: 0, y: -400 }),
    sp("s-bullet", "弾", "•", { w: 12, h: 24, color: "#ffcc00", radius: 4 }, { x: 0, y: -400 }, { visible: false }),
  ],
  pseudocode: `
class 砲台 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.count = 0
    this.addTextAt("cnt", "SHOTS: 0", -900, 490, 28, "#ffffff")
    this.addTextAt("info", "SPACE = fire (1 per press)", -900, 450, 20, "#aaaaaa")
  }
  onUpdate() {
    this.setVelocityX(0)
    if (this.isKeyPressed("left arrow")) {
      this.setVelocityX(-400)
    } else if (this.isKeyPressed("right arrow")) {
      this.setVelocityX(400)
    }
    if (this.isKeyJustDown("space")) {
      this.count += 1
      this.updateTextAt("cnt", join("SHOTS: ", this.count))
      this.createClone("弾")
      this.emitParticles(this.x, this.y + 20, 5, "#ffcc00", 80)
    }
  }
}
class 弾 {
  onCreate() {
    this.hide()
  }
  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setVelocityY(-600)
    this.wait(2)
    this.deleteClone()
  }
}
`,
}
