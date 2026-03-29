// Tweens Example: Tweenチェーン
// スケール→回転→フェードアウトを順番に実行しループ

import { sp, type SampleProject } from "../_helpers"

export const tweenChain: SampleProject = {
  id: "tweens-chain",
  name: "Tweenチェーン",
  description: "スケール→回転→フェードを順番に実行",
  category: "tweens",
  sprites: [
    sp("s-box", "ボックス", "🟧", { w: 100, h: 100, color: "#ff6633", radius: 12 }, { x: 0, y: 0 }),
  ],
  pseudocode: `
class ボックス {
  onCreate() {
    this.addTextAt("info", "Tween Chain Demo", -250, 490, 28, "#ffffff")
  }
  onUpdate() {
    this.tweenScale(2, 0.8)
    this.tweenAngle(360, 0.8)
    this.tweenAlpha(0, 0.6)
    this.wait(0.3)
    this.setAngle(0)
    this.setAlpha(100)
    this.setPosition(0, 0)
    this.tweenScale(1, 0.3)
    this.wait(0.5)
  }
}
`,
}
