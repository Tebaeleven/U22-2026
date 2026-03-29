// Game: はじめてのゲーム（入門）
// 移動・ジャンプ・コイン収集

import { sp, type SampleProject } from "../_helpers"

export const beginnerGame: SampleProject = {
  id: "beginner",
  name: "はじめてのゲーム",
  description: "移動・ジャンプ・コイン収集だけ",
  category: "games",
  sprites: [
    sp("s-player", "プレイヤー", "🏃",
      { w: 80, h: 120, color: "#4488ff", radius: 12, border: "#2255cc" },
      { x: 0, y: -240 }),
    sp("s-ground", "地面", "🟫",
      { w: 1920, h: 160, color: "#6B4F14" },
      { x: 0, y: -380 }),
    sp("s-coin", "コイン", "⭐",
      { w: 64, h: 64, color: "#ffcc00", radius: 32, border: "#cc9900" },
      { x: 400, y: -200 }),
  ],
  pseudocode: `
class プレイヤー {
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(800)
    this.setPosition(0, -240)
    this.setBounce(0.1)
    this.setCollideWorldBounds(true)
    this.score = 0
    this.addTextAt("score", "SCORE: 0", -900, 490, 32, "#ffffff")
  }

  onUpdate() {
    if (this.isKeyPressed("left arrow")) {
      this.setVelocityX(-250)
      this.setFlipX(true)
    } else if (this.isKeyPressed("right arrow")) {
      this.setVelocityX(250)
      this.setFlipX(false)
    } else {
      this.setVelocityX(0)
    }
    if (this.isKeyPressed("up arrow") && this.isOnGround()) {
      this.setVelocityY(-500)
      this.emitParticles(this.x, this.y - 40, 5, "#aaaaaa", 60)
    }
  }

  onTouched("コイン") {
    this.score += 1
    this.updateTextAt("score", join("SCORE: ", this.score))
    this.floatingText("+1")
    this.emitParticles(this.x, this.y, 10, "#ffcc00", 120)
    this.emit("coin-get")
  }
}

class 地面 {
  onCreate() {
    this.setPhysics("static")
    this.setPosition(0, -380)
  }
}

class コイン {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(400, -200)
  }
  onUpdate() {
    this.setAngle(this.angle + 2)
  }
  onEvent("coin-get") {
    this.emitParticles(this.x, this.y, 8, "#ffcc00", 100)
    this.tweenScale(0, 0.2)
    this.disableBody()
    this.hide()
  }
}
`,
}
