// Game: エンドレスランナー
// 横スクロール、障害物回避、コイン、2段ジャンプ

import { sp, type SampleProject } from "../_helpers"

export const endlessRunnerGame: SampleProject = {
  id: "endless-runner",
  name: "エンドレスランナー",
  description: "障害物を避けてコインを集める横スクロール",
  category: "games",
  sprites: [
    sp("s-player", "ランナー", "🏃",
      { w: 60, h: 100, color: "#44aaff", radius: 10, border: "#2277cc" },
      { x: -600, y: -240 }),
    sp("s-ground", "地面", "🟫",
      { w: 1920, h: 120, color: "#6B4F14" },
      { x: 0, y: -400 }),
    sp("s-obstacle", "障害物", "🪨",
      { w: 60, h: 80, color: "#888888", radius: 6, border: "#555555" },
      { x: 960, y: -300 },
      { visible: false }),
    sp("s-coin", "コイン", "⭐",
      { w: 48, h: 48, color: "#ffcc00", radius: 24, border: "#cc9900" },
      { x: 960, y: -200 },
      { visible: false }),
    sp("s-hud", "HUD", "📊",
      { w: 4, h: 4, color: "#000000" },
      { x: 0, y: 0 },
      { visible: false }),
  ],
  pseudocode: `
class ランナー {
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(1200)
    this.setPosition(-600, -240)
    this.setBounce(0)
    this.setCollideWorldBounds(true)
    this.score = 0
    this.jumps = 0
    this.gameOver = 0
    this.addTextAt("score", "SCORE: 0", -900, 490, 36, "#ffffff")
  }

  onUpdate() {
    if (this.gameOver == 0) {
      this.x = -600
      this.score += 1
      this.updateTextAt("score", join("SCORE: ", this.score))
      if (this.isOnGround()) {
        this.jumps = 0
      }
    }
  }

  onKeyPress("up arrow") {
    if (this.gameOver == 0 && this.jumps < 2) {
      this.setVelocityY(-650)
      this.jumps += 1
      this.emitParticles(this.x, this.y - 40, 8, "#88ccff", 80)
      if (this.jumps == 2) {
        this.floatingText("Double Jump!")
        this.emitParticles(this.x, this.y - 40, 15, "#ffcc00", 120)
      }
    }
  }

  onKeyPress("space") {
    if (this.gameOver == 0 && this.jumps < 2) {
      this.setVelocityY(-650)
      this.jumps += 1
      this.emitParticles(this.x, this.y - 40, 8, "#88ccff", 80)
    }
  }

  onTouched("障害物") {
    if (this.gameOver == 0) {
      this.gameOver = 1
      this.say("GAME OVER", 99)
      this.setVelocity(0, 0)
      this.setTint("#ff0000")
      this.cameraShake(300, 0.03)
      this.emitParticles(this.x, this.y, 25, "#ff3333", 200)
      this.tweenAlpha(0.4, 1)
    }
  }

  onTouched("コイン") {
    this.score += 100
    this.floatingText("+100")
    this.emitParticles(this.x, this.y, 10, "#ffcc00", 150)
    this.emit("coin-collected")
  }
}

class 地面 {
  onCreate() {
    this.setPhysics("static")
    this.setPosition(0, -400)
  }
}

class 障害物 {
  onCreate() {
    this.hide()
    this.setPosition(960, -300)
  }

  onUpdate() {
    this.setPosition(960, -300)
    this.createClone("myself")
    this.wait(2)
  }

  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setVelocityX(-450)
    this.tweenAngle(360, 2)
    this.wait(5)
    this.deleteClone()
  }
}

class コイン {
  onCreate() {
    this.hide()
    this.setPosition(960, -200)
  }

  onUpdate() {
    this.setPosition(960, -200)
    this.createClone("myself")
    this.wait(3)
  }

  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setVelocityX(-400)
    this.tweenAngle(360, 1.5)
    this.tweenScale(1.3, 0.5)
    this.wait(5)
    this.deleteClone()
  }

  onTouched("ランナー") {
    this.emitParticles(this.x, this.y, 12, "#ffcc00", 180)
    this.deleteClone()
  }
}

class HUD {
}
`,
}
