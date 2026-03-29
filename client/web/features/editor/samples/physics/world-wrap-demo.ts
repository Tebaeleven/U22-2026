// Physics Example: ワールドラップ
// 画面端を通り抜けて反対側に出現する（パックマン風）

import { sp, type SampleProject } from "../_helpers"

export const worldWrapDemo: SampleProject = {
  id: "physics-world-wrap-demo",
  name: "ワールドラップ",
  description: "画面端を通り抜けて反対側に出現する",
  category: "physics",
  sprites: [
    sp("s-ball", "ボール", "🟡", { w: 48, h: 48, color: "#eecc33", radius: 24 }, { x: 0, y: 0 }),
    sp("s-ball2", "ボール2", "🔵", { w: 40, h: 40, color: "#3366ee", radius: 20 }, { x: -200, y: 200 }),
  ],
  pseudocode: `
class ボール {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setVelocityX(350)
    this.setVelocityY(-200)
    this.addTextAt("info", "画面端でワープ!", -120, 400, 24, "#eecc33")
  }
  onUpdate() {
    this.worldWrap(0)
    this.setAngle(this.angle + 3)
    this.emitParticles(this.x, this.y, 1, "#eecc33", 20)
  }
}
class ボール2 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setVelocityX(-250)
    this.setVelocityY(150)
  }
  onUpdate() {
    this.worldWrap(0)
    this.setAngle(this.angle - 2)
    this.emitParticles(this.x, this.y, 1, "#3366ee", 15)
  }
}
`,
}
