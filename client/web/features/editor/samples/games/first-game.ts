// Game: はじめてのゲーム
// Phaser "Making Your First Game" の再現
// プラットフォーマー、スター収集、ボム回避

import { sp, type SampleProject } from "../_helpers"

export const firstGame: SampleProject = {
  id: "first-game",
  name: "はじめてのゲーム",
  description: "スターを集めてボムを避けるプラットフォーマー",
  category: "games",
  sprites: [
    sp("s-player", "プレイヤー", "🧑",
      { w: 60, h: 80, color: "#4466ff", radius: 8, border: "#2233cc" },
      { x: 0, y: -200 }),
    sp("s-ground", "地面", "🟫",
      { w: 1920, h: 80, color: "#8B5E3C" },
      { x: 0, y: -440 }),
    sp("s-platform1", "浮島1", "🟩",
      { w: 300, h: 30, color: "#44aa44", border: "#227722" },
      { x: 200, y: -100 }),
    sp("s-platform2", "浮島2", "🟩",
      { w: 300, h: 30, color: "#44aa44", border: "#227722" },
      { x: -600, y: 100 }),
    sp("s-platform3", "浮島3", "🟩",
      { w: 300, h: 30, color: "#44aa44", border: "#227722" },
      { x: 500, y: 200 }),
    sp("s-star", "スター", "⭐",
      { w: 40, h: 40, color: "#ffdd00", radius: 20, border: "#ccaa00" },
      { x: 9999, y: 9999 },
      { visible: false }),
    sp("s-bomb", "ボム", "💣",
      { w: 30, h: 30, color: "#dd2222", radius: 15, border: "#991111" },
      { x: 9999, y: 9999 },
      { visible: false }),
    sp("s-hud", "HUD", "📊",
      { w: 4, h: 4, color: "#000000" },
      { x: 0, y: 0 },
      { visible: false }),
  ],
  pseudocode: `
class プレイヤー {
  var score = 0
  var starCount = 0
  var gameOver = 0
  var spawnI = 0
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(800)
    this.setBounce(0.2)
    this.setCollideWorldBounds(true)
    this.setPosition(0, -200)
    this.score = 0
    this.starCount = 0
    this.gameOver = 0
    this.addTextAt("score", "SCORE: 0", -900, 490, 36, "#ffffff")

    this.spawnI = 0
  }

  onUpdate() {
    if (this.gameOver == 0) {
      if (this.spawnI < 12) {
        スター.spawnX = -660 + this.spawnI * 120
        スター.spawnY = 300
        this.createClone("スター")
        this.spawnI += 1
        if (this.spawnI == 12) {
          this.setPosition(0, -200)
        }
      }

      if (this.isKeyPressed("left arrow")) {
        this.setVelocityX(-300)
      } else if (this.isKeyPressed("right arrow")) {
        this.setVelocityX(300)
      } else {
        this.setVelocityX(0)
      }
    }
  }

  onKeyPress("up arrow") {
    if (this.gameOver == 0 && this.isOnGround()) {
      this.setVelocityY(500)
      this.emitParticles(this.x, this.y - 30, 6, "#aaaaff", 80)
    }
  }

  onTouched("スター") {
    this.score += 10
    this.starCount += 1
    this.updateTextAt("score", join("SCORE: ", this.score))
    this.floatingText("+10")
    this.emitParticles(this.x, this.y, 8, "#ffdd00", 120)
    if (this.starCount == 12) {
      this.emit("all-collected", "")
      this.starCount = 0
    }
  }

  onTouched("ボム") {
    if (this.gameOver == 0) {
      this.gameOver = 1
      this.setTint("#ff0000")
      this.setVelocity(0, 0)
      this.cameraShake(300, 0.03)
      this.emitParticles(this.x, this.y, 20, "#ff3333", 200)
      this.say("GAME OVER", 99)
      this.cameraFade(2000)
    }
  }

  onEvent("all-collected") {
    this.createClone("ボム")
    this.spawnI = 0
  }
}

class 地面 {
  onCreate() {
    this.setPhysics("static")
    this.setPosition(0, -440)
  }
}

class 浮島1 {
  onCreate() {
    this.setPhysics("static")
    this.setPosition(200, -100)
  }
}

class 浮島2 {
  onCreate() {
    this.setPhysics("static")
    this.setPosition(-600, 100)
  }
}

class 浮島3 {
  onCreate() {
    this.setPhysics("static")
    this.setPosition(500, 200)
  }
}

class スター {
  var spawnX = 0
  var spawnY = 300
  onCreate() {
    this.hide()
  }

  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("on")
    this.setBounce(0.5)
    this.setCollideWorldBounds(true)
    this.setPosition(this.spawnX, this.spawnY)
    this.tweenAngle(360, 2)
  }

  onTouched("プレイヤー") {
    this.emitParticles(this.x, this.y, 6, "#ffdd00", 100)
    this.deleteClone()
  }
}

class ボム {
  onCreate() {
    this.hide()
  }

  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setBounce(1)
    this.setCollideWorldBounds(true)
    this.setPosition(randomInt(-600, 600), 300)
    this.setVelocity(randomInt(-200, 200), randomInt(-150, 150))
    this.tweenAngle(360, 1)
  }
}

class HUD {
}
`,
}
