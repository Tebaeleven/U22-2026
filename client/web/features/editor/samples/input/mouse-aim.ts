// Input Example: マウスエイム
// 船がマウスに向き、クリックで弾発射

import { sp, type SampleProject } from "../_helpers"

export const mouseAim: SampleProject = {
  id: "input-mouse-aim",
  name: "マウスエイム",
  description: "マウス方向に回転して弾を発射",
  category: "input",
  sprites: [
    sp("s-ship", "戦艦", "🚀", { w: 50, h: 70, color: "#4488ff", radius: 8, border: "#2266cc" }, { x: 0, y: 0 }),
    sp("s-cursor", "照準", "🎯", { w: 16, h: 16, color: "#ff4444", radius: 8 }, { x: 200, y: 0 }),
    sp("s-bullet", "弾丸", "•", { w: 10, h: 10, color: "#ffcc00", radius: 5 }, { x: 0, y: 0 }, { visible: false }),
  ],
  pseudocode: `
class 戦艦 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.setDrag(200, 200)
    this.addTextAt("info", "WASDで移動 / クリックで発射", -400, 470, 28, "#ffffff")
  }
  onUpdate() {
    this.setAngle(this.angleTo("照準"))
    if (this.isKeyPressed("right arrow")) {
      this.setVelocityX(250)
    } else if (this.isKeyPressed("left arrow")) {
      this.setVelocityX(-250)
    }
    if (this.isKeyPressed("up arrow")) {
      this.setVelocityY(250)
    } else if (this.isKeyPressed("down arrow")) {
      this.setVelocityY(-250)
    }
  }
}
class 照準 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setAlpha(50)
  }
  onUpdate() {
    this.setPosition(this.mouseX, this.mouseY)
  }
}
class 弾丸 {
  onCreate() {
    this.hide()
  }
  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.velocityFromAngle(this.angleTo("照準"), 600)
    this.setAngle(this.angleTo("照準"))
    this.playSound("laser")
    this.wait(1.5)
    this.deleteClone()
  }
}
`,
}
