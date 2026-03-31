// Input Example: WASD移動
// 見下ろし型のWASD移動、加速度とドラッグ

import { sp, type SampleProject } from "../_helpers"

export const wasdMovement: SampleProject = {
  id: "input-wasd-movement",
  name: "WASD移動",
  description: "トップダウンWASD移動（加速度＋ドラッグ）",
  category: "input",
  sprites: [
    sp("s-player", "プレイヤー", "🏃", { w: 50, h: 50, color: "#4488ff", radius: 25 }, { x: 0, y: 0 }),
    sp("s-wall1", "壁上", "⬛", { w: 1920, h: 40, color: "#555555" }, { x: 0, y: 500 }),
    sp("s-wall2", "壁下", "⬛", { w: 1920, h: 40, color: "#555555" }, { x: 0, y: -500 }),
    sp("s-wall3", "壁左", "⬛", { w: 40, h: 1000, color: "#555555" }, { x: -940, y: 0 }),
    sp("s-wall4", "壁右", "⬛", { w: 40, h: 1000, color: "#555555" }, { x: 940, y: 0 }),
  ],
  pseudocode: `
class プレイヤー {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setDrag(600, 600)
    this.setMaxVelocity(350, 350)
    this.setCollideWorldBounds(true)
    this.addTextAt("info", "WASD to move", -900, 490, 28, "#ffffff")
    this.addTextAt("spd", "Speed: 0", -900, 450, 22, "#aaaaaa")
  }
  onUpdate() {
    this.setAcceleration(0, 0)
    if (this.isKeyPressed("w")) {
      this.setAccelerationY(800)
    }
    if (this.isKeyPressed("s")) {
      this.setAccelerationY(-800)
    }
    if (this.isKeyPressed("a")) {
      this.setAccelerationX(-800)
    }
    if (this.isKeyPressed("d")) {
      this.setAccelerationX(800)
    }
    this.updateTextAt("spd", join("Speed: ", round(this.physicsSpeed)))
    this.emitParticles(this.x, this.y, 1, "#4488ff", 30)
  }
}
class 壁上 {
  onCreate() {
    this.setPhysics("static")
  }
}
class 壁下 {
  onCreate() {
    this.setPhysics("static")
  }
}
class 壁左 {
  onCreate() {
    this.setPhysics("static")
  }
}
class 壁右 {
  onCreate() {
    this.setPhysics("static")
  }
}
`,
}
