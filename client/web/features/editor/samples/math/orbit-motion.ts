// Math Example: 衛星軌道
// sin/cosで惑星の周りを周回する衛星

import { sp, type SampleProject } from "../_helpers"

export const orbitMotion: SampleProject = {
  id: "math-orbit-motion",
  name: "衛星軌道",
  description: "sin/cosで円軌道を描く",
  category: "math",
  sprites: [
    sp("s-planet", "惑星", "🌍", { w: 80, h: 80, color: "#3366aa", radius: 40, border: "#224488" }, { x: 0, y: 0 }),
    sp("s-satellite", "衛星", "🛰️", { w: 30, h: 30, color: "#dddddd", radius: 15 }, { x: 250, y: 0 }),
    sp("s-hud", "HUD", "📊", { w: 4, h: 4, color: "#000000" }, { x: 0, y: 0 }, { visible: false }),
  ],
  pseudocode: `
class 惑星 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.addTextAt("info", "Orbit Demo (sin/cos)", -300, 490, 28, "#ffffff")
  }
  onUpdate() {
    this.setAngle(this.angle + 0.5)
  }
}
class 衛星 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.orbitAngle = 0
    this.radius = 250
  }
  onUpdate() {
    this.orbitAngle += 2
    this.setPosition(cos(this.orbitAngle) * this.radius, sin(this.orbitAngle) * this.radius)
    this.setAngle(this.orbitAngle)
    this.emitParticles(this.x, this.y, 1, "#aaaaff", 60)
  }
}
class HUD {
}
`,
}
