// Tweens Example: Tweenバウンス
// オブジェクトがTweenで移動し、到着時に物理バウンド

import { sp, type SampleProject } from "../_helpers"

export const tweenBounce: SampleProject = {
  id: "tweens-bounce",
  name: "Tweenバウンス",
  description: "Tween移動後に物理でバウンド",
  category: "tweens",
  sprites: [
    sp("s-ball1", "赤玉", "🔴", { w: 60, h: 60, color: "#ee3333", radius: 30 }, { x: -400, y: 300 }),
    sp("s-ball2", "青玉", "🔵", { w: 60, h: 60, color: "#3366ee", radius: 30 }, { x: 0, y: 300 }),
    sp("s-ball3", "緑玉", "🟢", { w: 60, h: 60, color: "#33cc33", radius: 30 }, { x: 400, y: 300 }),
    sp("s-floor", "床", "⬛", { w: 1920, h: 40, color: "#555555" }, { x: 0, y: -450 }),
  ],
  pseudocode: `
class 赤玉 {
  onCreate() {
    this.addTextAt("info", "Tween → Physics Bounce", -350, 490, 28, "#ffffff")
  }
  onUpdate() {
    this.tweenTo(-400, -100, 1)
    this.setPhysics("dynamic")
    this.setBounce(0.8)
    this.wait(3)
    this.setPhysics("none")
    this.setPosition(-400, 300)
  }
}
class 青玉 {
  onUpdate() {
    this.wait(0.5)
    this.tweenTo(0, -200, 1)
    this.setPhysics("dynamic")
    this.setBounce(0.6)
    this.wait(3)
    this.setPhysics("none")
    this.setPosition(0, 300)
  }
}
class 緑玉 {
  onUpdate() {
    this.wait(1)
    this.tweenTo(400, -150, 1)
    this.setPhysics("dynamic")
    this.setBounce(0.9)
    this.wait(3)
    this.setPhysics("none")
    this.setPosition(400, 300)
  }
}
class 床 {
  onCreate() {
    this.setPhysics("static")
  }
}
`,
}
