// Physics Example: 直接操作
// 矢印キーで座標を直接変更する（物理速度を使わない）

import { sp, type SampleProject } from "../_helpers"

export const directControl: SampleProject = {
  id: "physics-direct-control",
  name: "直接操作",
  description: "矢印キーで座標を直接変更する（物理速度を使わない）",
  category: "physics",
  sprites: [
    sp("s-player", "プレイヤー", "🟩", { w: 50, h: 50, color: "#44cc44", radius: 8, border: "#228822" }, { x: 0, y: 0 }),
    sp("s-wall1", "壁1", "⬛", { w: 60, h: 300, color: "#555555" }, { x: -300, y: 0 }),
    sp("s-wall2", "壁2", "⬛", { w: 60, h: 300, color: "#555555" }, { x: 300, y: 100 }),
    sp("s-wall3", "壁3", "⬛", { w: 400, h: 60, color: "#555555" }, { x: 0, y: -300 }),
  ],
  pseudocode: `
class プレイヤー {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.addTextAt("info", "矢印キーで直接移動（位置を変更）", -250, 470, 22, "#44cc44")
  }
  onUpdate() {
    if (this.isKeyPressed("left arrow")) {
      this.setPosition(this.x - 5, this.y)
    }
    if (this.isKeyPressed("right arrow")) {
      this.setPosition(this.x + 5, this.y)
    }
    if (this.isKeyPressed("up arrow")) {
      this.setPosition(this.x, this.y + 5)
    }
    if (this.isKeyPressed("down arrow")) {
      this.setPosition(this.x, this.y - 5)
    }
  }
}
class 壁1 {
  onCreate() {
    this.setPhysics("static")
  }
}
class 壁2 {
  onCreate() {
    this.setPhysics("static")
  }
}
class 壁3 {
  onCreate() {
    this.setPhysics("static")
  }
}
`,
}
