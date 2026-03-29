// Input Example: マウス追従
// スプライトがマウスカーソルに滑らかに追従する

import { sp, type SampleProject } from "../_helpers"

export const mouseFollow: SampleProject = {
  id: "input-mouse-follow",
  name: "マウス追従",
  description: "マウスカーソルに滑らかに追従する",
  category: "input",
  sprites: [
    sp("s-follower", "追従体", "🎯", { w: 50, h: 50, color: "#ff6633", radius: 25 }, { x: 0, y: 0 }),
    sp("s-trail", "軌跡", "✨", { w: 20, h: 20, color: "#ffcc00", radius: 10 }, { x: 0, y: 0 }, { visible: false }),
  ],
  pseudocode: `
class 追従体 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setDrag(100, 100)
    this.setDamping(true)
    this.addTextAt("pos", "X: 0  Y: 0", -900, 490, 24, "#ffffff")
  }
  onUpdate() {
    this.moveTo(this.mouseX, this.mouseY, 400)
    this.updateTextAt("pos", join("X: ", join(round(this.x), join("  Y: ", round(this.y)))))
    this.emitParticles(this.x, this.y, 1, "#ff6633", 40)
    this.createClone("軌跡")
  }
}
class 軌跡 {
  onCreate() {
    this.hide()
  }
  onClone() {
    this.show()
    this.tweenAlpha(0, 0.5)
    this.wait(0.5)
    this.deleteClone()
  }
}
`,
}
