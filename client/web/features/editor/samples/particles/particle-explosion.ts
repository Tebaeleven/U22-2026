// Particles Example: パーティクル爆発
// クリックで爆発エフェクト + カメラシェイク + サウンド

import { sp, type SampleProject } from "../_helpers"

export const particleExplosion: SampleProject = {
  id: "particles-explosion",
  name: "パーティクル爆発",
  description: "クリックで爆発エフェクト",
  category: "particles",
  sprites: [
    sp("s-trigger", "トリガー", "💥", { w: 40, h: 40, color: "#ff6600", radius: 20 }, { x: 0, y: 0 }),
  ],
  pseudocode: `
class トリガー {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.addTextAt("info", "Click anywhere to explode!", -350, 490, 28, "#ffffff")
  }
  onUpdate() {
    this.setPosition(this.mouseX, this.mouseY)
    if (this.mouseDown) {
      this.emitParticles(this.mouseX, this.mouseY, 40, "#ff3300", 400)
      this.emitParticles(this.mouseX, this.mouseY, 20, "#ffcc00", 300)
      this.emitParticles(this.mouseX, this.mouseY, 10, "#ffffff", 200)
      this.cameraShake(200, 0.025)
      this.playSound("explosion")
      this.wait(0.3)
    }
  }
}
`,
}
