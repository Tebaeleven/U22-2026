// Physics Example: 最大速度デモ
// 加速し続けるが最大速度で制限される宇宙船

import { sp, type SampleProject } from "../_helpers"

export const maxSpeedDemo: SampleProject = {
  id: "physics-max-speed-demo",
  name: "最大速度デモ",
  description: "加速し続けるが最大速度で制限される宇宙船",
  category: "physics",
  sprites: [
    sp("s-ship", "宇宙船", "🚀", { w: 50, h: 50, color: "#44aaff", radius: 25, border: "#2277cc" }, { x: -500, y: 0 }),
    sp("s-hud", "HUD", "📊", { w: 4, h: 4, color: "#000000" }, { x: 0, y: 0 }, { visible: false }),
  ],
  pseudocode: `
class 宇宙船 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.setBounce(1.0)
    this.setMaxVelocity(400, 400)
    this.addTextAt("info", "矢印キーで加速（最大速度: 400）", -250, 470, 22, "#44aaff")
    this.addTextAt("speed", "速度: 0", -900, 430, 20, "#88ccff")
  }
  onUpdate() {
    if (this.isKeyPressed("left arrow")) {
      this.setAccelerationX(-500)
    } else if (this.isKeyPressed("right arrow")) {
      this.setAccelerationX(500)
    } else {
      this.setAccelerationX(0)
    }
    if (this.isKeyPressed("up arrow")) {
      this.setAccelerationY(-500)
    } else if (this.isKeyPressed("down arrow")) {
      this.setAccelerationY(500)
    } else {
      this.setAccelerationY(0)
    }
    this.updateTextAt("speed", this.join("速度: ", this.round(this.physicsSpeed)))
    this.emitParticles(this.x, this.y, 1, "#44aaff", 15)
  }
}
class HUD {
}
`,
}
