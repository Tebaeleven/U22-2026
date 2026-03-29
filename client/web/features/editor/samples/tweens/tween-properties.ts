// Tweens Example: プロパティアニメーション
// スケール・透明度・角度のTweenデモ

import { sp, type SampleProject } from "../_helpers"

export const tweenProperties: SampleProject = {
  id: "tweens-properties",
  name: "Tweenアニメーション",
  description: "スケール・透明度・角度のアニメーション",
  category: "tweens",
  sprites: [
    sp("s-box1", "スケール", "🟧", { w: 80, h: 80, color: "#ff8833", radius: 8 }, { x: -400, y: 0 }),
    sp("s-box2", "透明度", "🟦", { w: 80, h: 80, color: "#3388ff", radius: 8 }, { x: 0, y: 0 }),
    sp("s-box3", "回転", "🟩", { w: 80, h: 80, color: "#33cc33", radius: 8 }, { x: 400, y: 0 }),
  ],
  pseudocode: `
class スケール {
  onCreate() {
    this.addTextAt("l1", "Scale", -450, 120, 20, "#ff8833")
  }
  onUpdate() {
    this.tweenScale(2, 1)
    this.wait(0.2)
    this.tweenScale(1, 1)
    this.wait(0.2)
  }
}
class 透明度 {
  onCreate() {
    this.addTextAt("l2", "Alpha", -50, 120, 20, "#3388ff")
  }
  onUpdate() {
    this.tweenAlpha(0.1, 1)
    this.wait(0.2)
    this.tweenAlpha(1, 1)
    this.wait(0.2)
  }
}
class 回転 {
  onCreate() {
    this.addTextAt("l3", "Angle", 350, 120, 20, "#33cc33")
  }
  onUpdate() {
    this.tweenAngle(360, 2)
    this.setAngle(0)
  }
}
`,
}
