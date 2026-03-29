// Input Example: クリック移動
// クリック位置にキャラクターが移動する

import { sp, type SampleProject } from "../_helpers"

export const clickToMove: SampleProject = {
  id: "input-click-to-move",
  name: "クリック移動",
  description: "クリック位置へキャラクターが移動",
  category: "input",
  sprites: [
    sp("s-player", "キャラ", "🏃", { w: 50, h: 50, color: "#4488ff", radius: 25 }, { x: 0, y: 0 }),
    sp("s-target", "目標", "📍", { w: 20, h: 20, color: "#ff3333", radius: 10 }, { x: 0, y: 0 }, { visible: false }),
  ],
  pseudocode: `
class キャラ {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.moving = 0
    this.addTextAt("info", "クリックで移動先を指定", -350, 470, 28, "#ffffff")
  }
  onUpdate() {
    if (this.mouseDown) {
      this.emit("set-target", "")
      this.moving = 1
    }
    if (this.moving == 1) {
      this.moveTo("目標", 300)
      if (this.distanceTo("目標") < 20) {
        this.setVelocity(0, 0)
        this.moving = 0
        this.emitParticles(this.x, this.y, 10, "#4488ff", 100)
      }
    }
    this.emitParticles(this.x, this.y, 1, "#4488ff", 20)
  }
}
class 目標 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.hide()
  }
  onEvent("set-target") {
    this.setPosition(this.mouseX, this.mouseY)
    this.show()
    this.setAlpha(80)
    this.tweenAlpha(0, 3)
  }
}
`,
}
