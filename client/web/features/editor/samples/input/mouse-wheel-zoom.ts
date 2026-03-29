// Input Example: マウスホイールズーム
// スクロールでカメラをズームイン・アウト

import { sp, type SampleProject } from "../_helpers"

export const mouseWheelZoom: SampleProject = {
  id: "input-mouse-wheel-zoom",
  name: "マウスホイールズーム",
  description: "ホイールでカメラズームイン・アウト",
  category: "input",
  sprites: [
    sp("s-center", "中心", "⭐", { w: 60, h: 60, color: "#ffcc00", radius: 30 }, { x: 0, y: 0 }),
    sp("s-obj1", "赤丸", "🔴", { w: 40, h: 40, color: "#ee3333", radius: 20 }, { x: -400, y: 200 }),
    sp("s-obj2", "青丸", "🔵", { w: 50, h: 50, color: "#3366ee", radius: 25 }, { x: 300, y: -200 }),
    sp("s-obj3", "緑丸", "🟢", { w: 35, h: 35, color: "#33cc33", radius: 17 }, { x: -200, y: -300 }),
    sp("s-obj4", "紫丸", "🟣", { w: 45, h: 45, color: "#9933ff", radius: 22 }, { x: 500, y: 100 }),
  ],
  pseudocode: `
class 中心 {
  onCreate() {
    this.zoom = 1
    this.addTextAt("info", "Scroll to zoom", -900, 490, 28, "#ffffff")
    this.addTextAt("zl", "Zoom: 1.0", -900, 450, 22, "#aaaaaa")
  }
  onUpdate() {
    this.setAngle(this.angle + 1)
    if (this.mouseWheel > 0) {
      this.zoom += 0.1
      if (this.zoom > 3) {
        this.zoom = 3
      }
      this.cameraZoom(this.zoom)
      this.updateTextAt("zl", join("Zoom: ", round(this.zoom * 10) / 10))
    }
    if (this.mouseWheel < 0) {
      this.zoom += -0.1
      if (this.zoom < 0.3) {
        this.zoom = 0.3
      }
      this.cameraZoom(this.zoom)
      this.updateTextAt("zl", join("Zoom: ", round(this.zoom * 10) / 10))
    }
  }
}
class 赤丸 {
  onUpdate() {
    this.setAngle(this.angle + 2)
  }
}
class 青丸 {
  onUpdate() {
    this.setAngle(this.angle - 3)
  }
}
class 緑丸 {
  onUpdate() {
    this.setAngle(this.angle + 4)
  }
}
class 紫丸 {
  onUpdate() {
    this.setAngle(this.angle - 2)
  }
}
`,
}
