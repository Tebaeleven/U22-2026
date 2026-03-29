// Sound Example: サウンド付きミニゲーム
// ジャンプ音・コイン音・ヒット音・BGMループ

import { sp, type SampleProject } from "../_helpers"

export const soundGame: SampleProject = {
  id: "sound-game",
  name: "サウンド付きミニゲーム",
  description: "効果音とBGMのあるプラットフォーマー",
  category: "sound",
  sprites: [
    sp("s-player", "走者", "🏃", { w: 50, h: 60, color: "#4488ff", radius: 8, border: "#2255cc" }, { x: -500, y: -200 }),
    sp("s-floor", "床", "⬛", { w: 1920, h: 40, color: "#555555" }, { x: 0, y: -400 }),
    sp("s-platform1", "足場1", "⬛", { w: 200, h: 24, color: "#666666" }, { x: -200, y: -150 }),
    sp("s-platform2", "足場2", "⬛", { w: 200, h: 24, color: "#666666" }, { x: 200, y: 50 }),
    sp("s-coin1", "コイン1", "🪙", { w: 30, h: 30, color: "#ffcc00", radius: 15 }, { x: -200, y: -100 }),
    sp("s-coin2", "コイン2", "🪙", { w: 30, h: 30, color: "#ffcc00", radius: 15 }, { x: 200, y: 100 }),
    sp("s-coin3", "コイン3", "🪙", { w: 30, h: 30, color: "#ffcc00", radius: 15 }, { x: 500, y: -300 }),
    sp("s-spike", "トゲ", "🔺", { w: 40, h: 40, color: "#ee3333", radius: 4 }, { x: 0, y: -370 }),
    sp("s-hud", "HUD", "📊", { w: 4, h: 4, color: "#000000" }, { x: 0, y: 0 }, { visible: false }),
  ],
  pseudocode: `
class 走者 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setCollideWorldBounds(true)
    this.setBounce(0.1)
    this.score = 0
    this.hp = 3
    this.addTextAt("score", "COINS: 0", -900, 490, 32, "#ffcc00")
    this.addTextAt("hp", "HP: 3", -900, 440, 24, "#44dd44")
    this.playSoundLoop("bgm")
    this.setSoundVolume("bgm", 0.3)
  }
  onUpdate() {
    this.setVelocityX(0)
    if (this.isKeyPressed("left arrow")) {
      this.setVelocityX(-250)
      this.setFlipX(true)
    } else if (this.isKeyPressed("right arrow")) {
      this.setVelocityX(250)
      this.setFlipX(false)
    }
  }
  onKeyPress("space") {
    if (this.touching("床") || this.touching("足場1") || this.touching("足場2")) {
      this.setVelocityY(450)
      this.playSound("jump")
    }
  }
  onTouched("コイン1") {
    this.score += 1
    this.updateTextAt("score", join("COINS: ", this.score))
    this.playSound("coin")
    this.floatingText("+1")
    this.emit("coin1-get")
  }
  onTouched("コイン2") {
    this.score += 1
    this.updateTextAt("score", join("COINS: ", this.score))
    this.playSound("coin")
    this.floatingText("+1")
    this.emit("coin2-get")
  }
  onTouched("コイン3") {
    this.score += 1
    this.updateTextAt("score", join("COINS: ", this.score))
    this.playSound("coin")
    this.floatingText("+1")
    this.emit("coin3-get")
  }
  onTouched("トゲ") {
    this.hp += -1
    this.updateTextAt("hp", join("HP: ", this.hp))
    this.playSound("hit")
    this.cameraShake(150, 0.015)
    this.setTint("#ff0000")
    this.setVelocityY(300)
    this.wait(0.2)
    this.clearTint()
    if (this.hp < 1) {
      this.stopSound("bgm")
      this.playSound("explosion")
      this.say("GAME OVER", 99)
    }
  }
}
class 床 {
  onCreate() {
    this.setPhysics("static")
  }
}
class 足場1 {
  onCreate() {
    this.setPhysics("static")
  }
}
class 足場2 {
  onCreate() {
    this.setPhysics("static")
  }
}
class コイン1 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
  }
  onUpdate() {
    this.setAngle(this.angle + 3)
  }
  onEvent("coin1-get") {
    this.emitParticles(this.x, this.y, 10, "#ffcc00", 100)
    this.tweenScale(0, 0.2)
    this.disableBody()
  }
}
class コイン2 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
  }
  onUpdate() {
    this.setAngle(this.angle + 3)
  }
  onEvent("coin2-get") {
    this.emitParticles(this.x, this.y, 10, "#ffcc00", 100)
    this.tweenScale(0, 0.2)
    this.disableBody()
  }
}
class コイン3 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
  }
  onUpdate() {
    this.setAngle(this.angle + 3)
  }
  onEvent("coin3-get") {
    this.emitParticles(this.x, this.y, 10, "#ffcc00", 100)
    this.tweenScale(0, 0.2)
    this.disableBody()
  }
}
class トゲ {
  onCreate() {
    this.setPhysics("static")
  }
}
class HUD {
}
`,
}
