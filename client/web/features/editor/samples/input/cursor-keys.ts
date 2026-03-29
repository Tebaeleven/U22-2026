// Input Example: 矢印キー移動
// 矢印キーで物理ベースの移動と速度テキスト表示

import { sp, type SampleProject } from "../_helpers"

export const cursorKeys: SampleProject = {
  id: "input-cursor-keys",
  name: "矢印キー移動",
  description: "矢印キーで物理ベースの8方向移動",
  category: "input",
  sprites: [
    sp("s-player", "プレイヤー", "🏃", { w: 50, h: 50, color: "#4488ff", radius: 25 }, { x: 0, y: 0 }),
    sp("s-ground", "地面", "⬛", { w: 1920, h: 40, color: "#555555" }, { x: 0, y: -480 }),
  ],
  pseudocode: `
class プレイヤー {
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(800)
    this.setBounce(0.2)
    this.setCollideWorldBounds(true)
    this.setDrag(200, 200)
    this.addTextAt("vel", "VX: 0  VY: 0", -900, 490, 24, "#ffffff")
    this.addTextAt("info", "Arrow keys to move", -900, 450, 20, "#aaaaaa")
  }
  onUpdate() {
    if (this.isKeyPressed("left arrow")) {
      this.setVelocityX(-300)
    } else if (this.isKeyPressed("right arrow")) {
      this.setVelocityX(300)
    } else {
      this.setVelocityX(0)
    }
    if (this.isKeyPressed("up arrow")) {
      this.setVelocityY(-500)
    }
    this.updateTextAt("vel", join("VX: ", join(round(this.velocityX), join("  VY: ", round(this.velocityY)))))
    this.emitParticles(this.x, this.y - 20, 1, "#4488ff", 30)
  }
}
class 地面 {
  onCreate() {
    this.setPhysics("static")
  }
}
`,
}
