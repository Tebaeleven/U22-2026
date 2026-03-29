// Physics Example: 速度制御
// 重力なし・全方向移動・速度による操作

import { sp, type SampleProject } from "../_helpers"

export const velocityControl: SampleProject = {
  id: "physics-velocity-control",
  name: "速度制御",
  description: "矢印キーで全方向に移動",
  category: "physics",
  sprites: [
    sp("s-ship", "宇宙船", "🚀", { w: 50, h: 50, color: "#3399ff", radius: 25, border: "#1a66cc" }, { x: 0, y: 0 }),
    sp("s-hud", "HUD", "📊", { w: 4, h: 4, color: "#000000" }, { x: 0, y: 0 }, { visible: false }),
  ],
  pseudocode: `
class 宇宙船 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.setBounce(0.5)
    this.addTextAt("vel", "VX:0 VY:0", -900, 490, 24, "#88ccff")
  }
  onUpdate() {
    if (this.isKeyPressed("left arrow")) {
      this.setVelocityX(-300)
    } else if (this.isKeyPressed("right arrow")) {
      this.setVelocityX(300)
    }
    if (this.isKeyPressed("up arrow")) {
      this.setVelocityY(-300)
    } else if (this.isKeyPressed("down arrow")) {
      this.setVelocityY(300)
    }
    this.setAngle(this.angle + 2)
    this.emitParticles(this.x, this.y, 1, "#3399ff", 20)
  }
}
class HUD {
}
`,
}
