// Tweens Example: フェードイン・アウト
// 複数オブジェクトが時間差でフェードをループ

import { sp, type SampleProject } from "../_helpers"

export const tweenFadeInOut: SampleProject = {
  id: "tweens-fade-in-out",
  name: "フェードイン・アウト",
  description: "時間差でフェードするループアニメーション",
  category: "tweens",
  sprites: [
    sp("s-c1", "丸1", "🔴", { w: 80, h: 80, color: "#ff3366", radius: 40 }, { x: -400, y: 0 }),
    sp("s-c2", "丸2", "🟠", { w: 80, h: 80, color: "#ff9933", radius: 40 }, { x: -200, y: 0 }),
    sp("s-c3", "丸3", "🟡", { w: 80, h: 80, color: "#ffcc00", radius: 40 }, { x: 0, y: 0 }),
    sp("s-c4", "丸4", "🟢", { w: 80, h: 80, color: "#33cc66", radius: 40 }, { x: 200, y: 0 }),
    sp("s-c5", "丸5", "🔵", { w: 80, h: 80, color: "#3366ff", radius: 40 }, { x: 400, y: 0 }),
  ],
  pseudocode: `
class 丸1 {
  onCreate() {
    this.setAlpha(0)
    this.addTextAt("info", "Staggered Fade", -200, 490, 28, "#ffffff")
  }
  onUpdate() {
    this.tweenAlpha(1, 0.6)
    this.wait(1)
    this.tweenAlpha(0, 0.6)
    this.wait(1)
  }
}
class 丸2 {
  onCreate() {
    this.setAlpha(0)
  }
  onUpdate() {
    this.wait(0.3)
    this.tweenAlpha(1, 0.6)
    this.wait(1)
    this.tweenAlpha(0, 0.6)
    this.wait(0.7)
  }
}
class 丸3 {
  onCreate() {
    this.setAlpha(0)
  }
  onUpdate() {
    this.wait(0.6)
    this.tweenAlpha(1, 0.6)
    this.wait(1)
    this.tweenAlpha(0, 0.6)
    this.wait(0.4)
  }
}
class 丸4 {
  onCreate() {
    this.setAlpha(0)
  }
  onUpdate() {
    this.wait(0.9)
    this.tweenAlpha(1, 0.6)
    this.wait(1)
    this.tweenAlpha(0, 0.6)
    this.wait(0.1)
  }
}
class 丸5 {
  onCreate() {
    this.setAlpha(0)
  }
  onUpdate() {
    this.wait(1.2)
    this.tweenAlpha(1, 0.6)
    this.wait(0.8)
    this.tweenAlpha(0, 0.6)
  }
}
`,
}
