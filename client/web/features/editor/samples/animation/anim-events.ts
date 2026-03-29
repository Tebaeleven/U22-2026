// Animation Example: アニメーションイベント
// 非ループアニメ再生後にパーティクル爆発

import { sp, type SampleProject } from "../_helpers"

export const animEvents: SampleProject = {
  id: "animation-anim-events",
  name: "アニメーションイベント",
  description: "再生完了でパーティクル爆発",
  category: "animation",
  sprites: [
    sp("s-actor", "アクター", "💥", { w: 80, h: 80, color: "#ff6633", radius: 8 }, { x: 0, y: 0 }),
  ],
  pseudocode: `
class アクター {
  onCreate() {
    this.createAnim("explode", 0, 3, 6, false)
    this.addTextAt("info", "Press SPACE to play", -400, 490, 28, "#ffffff")
    this.addTextAt("st", "Ready", -400, 450, 22, "#aaaaaa")
    this.onAnimComplete("explode", "boom")
  }
  onKeyPress("space") {
    this.playAnim("explode")
    this.updateTextAt("st", "Playing...")
  }
  onEvent("boom") {
    this.emitParticles(this.x, this.y, 30, "#ff3333", 300)
    this.emitParticles(this.x, this.y, 20, "#ffcc00", 250)
    this.cameraShake(200, 0.02)
    this.updateTextAt("st", "Complete!")
    this.tweenScale(1.5, 0.3)
    this.wait(0.3)
    this.tweenScale(1, 0.3)
  }
}
`,
}
