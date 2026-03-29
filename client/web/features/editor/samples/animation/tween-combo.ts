// Animation Example: Tweenコンボ
// 複数Tweenを組み合わせたパワーアップ演出

import { sp, type SampleProject } from "../_helpers"

export const tweenCombo: SampleProject = {
  id: "animation-tween-combo",
  name: "Tweenコンボ",
  description: "スケール＋回転＋フェードのコンボ演出",
  category: "animation",
  sprites: [
    sp("s-gem", "ジェム", "💎", { w: 60, h: 60, color: "#ffcc00", radius: 8 }, { x: 0, y: 0 }),
  ],
  pseudocode: `
class ジェム {
  onCreate() {
    this.addTextAt("info", "Press SPACE for power-up!", -450, 490, 28, "#ffffff")
    this.addTextAt("st", "Ready", -450, 450, 22, "#aaaaaa")
  }
  onKeyPress("space") {
    this.updateTextAt("st", "Power up!")
    this.setTint("#ff3333")
    this.emitParticles(this.x, this.y, 10, "#ffcc00", 150)

    this.tweenScale(2, 0.5)
    this.wait(0.5)

    this.tweenAngle(360, 0.5)
    this.emitParticles(this.x, this.y, 15, "#ff6633", 200)
    this.wait(0.5)

    this.tweenAlpha(0, 0.5)
    this.wait(0.5)

    this.setAngle(0)
    this.setAlpha(100)
    this.tweenScale(1, 0.3)
    this.clearTint()
    this.updateTextAt("st", "Ready")
    this.wait(0.3)
  }
}
`,
}
