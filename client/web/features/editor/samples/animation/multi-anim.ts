// Animation Example: 複数アニメーション
// idle と walk を移動状態に応じて切り替え

import { sp, type SampleProject } from "../_helpers"

export const multiAnim: SampleProject = {
  id: "animation-multi-anim",
  name: "複数アニメーション",
  description: "移動でidle/walkアニメを切替",
  category: "animation",
  sprites: [
    sp("s-char", "キャラ", "🏃", { w: 64, h: 64, color: "#4488ff", radius: 8 }, { x: 0, y: 0 }),
    sp("s-ground", "地面", "⬛", { w: 1920, h: 40, color: "#555555" }, { x: 0, y: -480 }),
  ],
  pseudocode: `
class キャラ {
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(600)
    this.setCollideWorldBounds(true)
    this.createAnim("idle", 0, 1, 4, true)
    this.createAnim("walk", 2, 5, 10, true)
    this.playAnim("idle")
    this.currentAnim = "idle"
    this.addTextAt("info", "Arrow keys to move", -400, 490, 28, "#ffffff")
    this.addTextAt("anim", "Anim: idle", -400, 450, 22, "#aaaaaa")
  }
  onUpdate() {
    this.setVelocityX(0)
    if (this.isKeyPressed("left arrow")) {
      this.setVelocityX(-250)
      this.setFlipX(true)
      if (this.currentAnim != "walk") {
        this.playAnim("walk")
        this.currentAnim = "walk"
      }
    } else if (this.isKeyPressed("right arrow")) {
      this.setVelocityX(250)
      this.setFlipX(false)
      if (this.currentAnim != "walk") {
        this.playAnim("walk")
        this.currentAnim = "walk"
      }
    } else {
      if (this.currentAnim != "idle") {
        this.playAnim("idle")
        this.currentAnim = "idle"
      }
    }
    if (this.isKeyPressed("up arrow")) {
      this.setVelocityY(-450)
    }
    this.updateTextAt("anim", join("Anim: ", this.currentAnim))
  }
}
class 地面 {
  onCreate() {
    this.setPhysics("static")
  }
}
`,
}
