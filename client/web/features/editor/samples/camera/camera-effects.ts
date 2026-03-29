// Camera Example: カメラエフェクト
// シェイク・ズーム・フェードのデモ

import { sp, type SampleProject } from "../_helpers"

export const cameraEffects: SampleProject = {
  id: "camera-effects",
  name: "カメラエフェクト",
  description: "シェイク・ズーム・フェード",
  category: "camera",
  sprites: [
    sp("s-box", "ボックス", "📦", { w: 80, h: 80, color: "#ff6633", radius: 8 }, { x: 0, y: 0 }),
    sp("s-hud", "HUD", "📊", { w: 4, h: 4, color: "#000000" }, { x: 0, y: 0 }, { visible: false }),
  ],
  pseudocode: `
class ボックス {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.addTextAt("info", "1:Shake 2:Zoom 3:Fade", -350, 490, 28, "#ffffff")
  }
  onUpdate() {
    this.setAngle(this.angle + 1)
  }
  onKeyPress("1") {
    this.cameraShake(300, 0.03)
    this.emitParticles(this.x, this.y, 20, "#ff6633", 200)
  }
  onKeyPress("2") {
    this.cameraZoom(2)
    this.wait(1)
    this.cameraZoom(1)
  }
  onKeyPress("3") {
    this.cameraFade(1000)
  }
}
class HUD {
}
`,
}
