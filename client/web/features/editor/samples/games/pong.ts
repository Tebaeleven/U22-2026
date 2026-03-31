// Game: ポン
// 2人対戦Pong。Player1=W/S、Player2=Up/Down

import { sp, type SampleProject } from "../_helpers"

export const pongGame: SampleProject = {
  id: "pong",
  name: "ポン",
  description: "2人対戦のクラシックPong",
  category: "games",
  sprites: [
    sp("s-lpaddle", "左パドル", "🟦", { w: 24, h: 140, color: "#4488ff", radius: 6 }, { x: -860, y: 0 }),
    sp("s-rpaddle", "右パドル", "🟥", { w: 24, h: 140, color: "#ff4444", radius: 6 }, { x: 860, y: 0 }),
    sp("s-ball", "ボール", "⚪", { w: 28, h: 28, color: "#ffffff", radius: 14 }, { x: 0, y: 0 }),
    sp("s-wall-top", "上壁", "⬛", { w: 1920, h: 20, color: "#444444" }, { x: 0, y: 500 }),
    sp("s-wall-bottom", "下壁", "⬛", { w: 1920, h: 20, color: "#444444" }, { x: 0, y: -500 }),
    sp("s-hud", "HUD", "📊", { w: 4, h: 4, color: "#000000" }, { x: 0, y: 0 }, { visible: false }),
  ],
  pseudocode: `
class 左パドル {
  onCreate() {
    this.setPhysics("dynamic")
    this.setImmovable("on")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.setPosition(-860, 0)
  }
  onUpdate() {
    this.setVelocityY(0)
    if (this.isKeyPressed("w")) {
      this.setVelocityY(400)
    }
    if (this.isKeyPressed("s")) {
      this.setVelocityY(-400)
    }
  }
}
class 右パドル {
  onCreate() {
    this.setPhysics("dynamic")
    this.setImmovable("on")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.setPosition(860, 0)
  }
  onUpdate() {
    this.setVelocityY(0)
    if (this.isKeyPressed("up arrow")) {
      this.setVelocityY(400)
    }
    if (this.isKeyPressed("down arrow")) {
      this.setVelocityY(-400)
    }
  }
}
class ボール {
  var p1Score = 0
  var p2Score = 0
  var launched = 0
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setBounce(1)
    this.setCollideWorldBounds(true)
    this.setMaxVelocity(700, 700)
    this.p1Score = 0
    this.p2Score = 0
    this.launched = 0
    this.addTextAt("p1", "0", -200, 490, 48, "#4488ff")
    this.addTextAt("p2", "0", 150, 490, 48, "#ff4444")
    this.addTextAt("info", "SPACE でスタート / W-S & ↑↓", -400, 440, 20, "#888888")
  }
  onUpdate() {
    if (this.launched == 0) {
      this.setVelocity(0, 0)
      this.setPosition(0, 0)
    }
    if (this.x < -900 && this.launched == 1) {
      this.p2Score += 1
      this.updateTextAt("p2", this.p2Score)
      this.launched = 0
      this.cameraShake(200, 0.02)
      this.playSound("hit")
      this.emitParticles(this.x, this.y, 15, "#ff4444", 200)
    }
    if (this.x > 900 && this.launched == 1) {
      this.p1Score += 1
      this.updateTextAt("p1", this.p1Score)
      this.launched = 0
      this.cameraShake(200, 0.02)
      this.playSound("hit")
      this.emitParticles(this.x, this.y, 15, "#4488ff", 200)
    }
  }
  onKeyPress("space") {
    if (this.launched == 0) {
      this.launched = 1
      this.setVelocity(350, 250)
      this.playSound("beep")
    }
  }
  onTouched("左パドル") {
    this.emitParticles(this.x, this.y, 5, "#4488ff", 80)
    this.playSound("beep")
  }
  onTouched("右パドル") {
    this.emitParticles(this.x, this.y, 5, "#ff4444", 80)
    this.playSound("beep")
  }
}
class 上壁 {
  onCreate() {
    this.setPhysics("static")
  }
}
class 下壁 {
  onCreate() {
    this.setPhysics("static")
  }
}
class HUD {
}
`,
}
