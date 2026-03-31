// Math Example: 新しい数学関数
// floor / ceil / sqrt / pow / sign / pi / atan2 / tan デモ

import { sp, type SampleProject } from "../_helpers"

export const mathFunctionsDemo: SampleProject = {
  id: "math-functions",
  name: "数学関数",
  description: "floor / ceil / sqrt / pow / sign",
  category: "math",
  sprites: [
    sp("s-player", "プレイヤー", "🏃", { w: 50, h: 50, color: "#4488ff", radius: 25 }, { x: 0, y: 0 }),
    sp("s-hud", "HUD", "📊", { w: 4, h: 4, color: "#000000" }, { x: 0, y: 0 }, { visible: false }),
  ],
  pseudocode: `
class プレイヤー {
  var val = 3.7
  var dx = mouseX - x
  var dy = mouseY - y
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.addTextAt("t1", "", -900, 490, 22, "#ffffff")
    this.addTextAt("t2", "", -900, 450, 22, "#ffffff")
    this.addTextAt("t3", "", -900, 410, 22, "#ffffff")
    this.addTextAt("t4", "", -900, 370, 22, "#ffffff")
    this.addTextAt("t5", "", -900, 330, 22, "#ffffff")
    this.addTextAt("t6", "", -900, 290, 22, "#ffffff")

    this.val = 3.7
    this.updateTextAt("t1", join("floor(3.7) = ", floor(this.val)))
    this.updateTextAt("t2", join("ceil(3.7) = ", ceil(this.val)))
    this.updateTextAt("t3", join("sqrt(16) = ", sqrt(16)))
    this.updateTextAt("t4", join("pow(2,8) = ", pow(2, 8)))
    this.updateTextAt("t5", join("sign(-42) = ", sign(-42)))
    this.updateTextAt("t6", join("pi = ", round(pi * 1000) / 1000))
  }

  onUpdate() {
    // atan2 でマウス方向を向く
    this.dx = this.mouseX - this.x
    this.dy = this.mouseY - this.y
    this.setAngle(atan2(this.dy, this.dx))

    // マウスに向かってゆっくり移動 (lerp)
    this.setPosition(lerp(this.x, this.mouseX, 3), lerp(this.y, this.mouseY, 3))
  }
}
class HUD {
}
`,
}
