// Game: ブロック崩し
// クローンによるブリック配置、パーティクル、カメラエフェクト
// OOP: ブリックは行番号と列番号からグリッド座標を計算（if分岐を排除）

import { sp, type SampleProject } from "../_helpers"

export const breakoutGame: SampleProject = {
  id: "breakout",
  name: "ブロック崩し",
  description: "ボールでブリックを壊す",
  category: "games",
  sprites: [
    sp("s-paddle", "パドル", "🟦",
      { w: 200, h: 24, color: "#4488ff", radius: 6, border: "#2255cc" },
      { x: 0, y: -350 }),
    sp("s-ball", "ボール", "⚪",
      { w: 32, h: 32, color: "#dddddd", radius: 16, border: "#999999" },
      { x: 0, y: -280 }),
    sp("s-brick", "ブリック", "🟧",
      { w: 120, h: 40, color: "#ee8833", radius: 4 },
      { x: 0, y: 0 },
      { visible: false }),
    sp("s-hud", "HUD", "📊",
      { w: 4, h: 4, color: "#000000" },
      { x: 0, y: 0 },
      { visible: false }),
  ],
  pseudocode: `
class パドル {
  onCreate() {
    this.setPhysics("dynamic")
    this.setImmovable(true)
    this.setAllowGravity("off")
    this.setPosition(0, -350)
    this.setCollideWorldBounds(true)
    this.score = 0
    this.lives = 3
    this.addTextAt("score", "SCORE: 0", -900, 490, 36, "#ffffff")
    this.addTextAt("lives", "LIVES: 3", -900, 440, 28, "#66ccff")
  }

  onUpdate() {
    this.setVelocity(0, 0)
    if (this.isKeyPressed("left arrow")) {
      this.setVelocityX(-500)
    } else if (this.isKeyPressed("right arrow")) {
      this.setVelocityX(500)
    }
  }

  onEvent("brick-destroyed") {
    this.score += 10
    this.updateTextAt("score", join("SCORE: ", this.score))
  }

  onEvent("ball-lost") {
    this.lives += -1
    this.updateTextAt("lives", join("LIVES: ", this.lives))
    if (this.lives < 1) {
      this.say("GAME OVER", 99)
      this.cameraFade(1000)
    }
  }
}

class ボール {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(0, -280)
    this.setBounce(1)
    this.setCollideWorldBounds(true)
    this.launched = 0
  }

  onUpdate() {
    if (this.launched == 0) {
      this.setVelocity(0, 0)
      this.setPosition(0, -280)
    }
    if (this.y < -480) {
      this.launched = 0
      this.cameraShake(200, 0.02)
      this.emitParticles(this.x, this.y, 15, "#ff3333", 150)
      this.emit("ball-lost", "")
    }
    this.setAngle(this.angle + 3)
  }

  onKeyPress("space") {
    if (this.launched == 0) {
      this.setVelocity(200, 350)
      this.launched = 1
    }
  }

  onTouched("ブリック") {
    this.emitParticles(this.x, this.y, 8, "#ffcc00", 100)
    this.emit("brick-hit", "")
  }
}

class ブリック {
  onCreate() {
    this.hide()
    this.spawnCol = 0
    this.spawnRow = 0
    for (row in 0..3) {
      for (col in 0..5) {
        this.spawnCol = col
        this.spawnRow = row
        this.createClone("myself")
      }
    }
  }

  onClone() {
    this.show()
    this.setPhysics("static")
    this.setPosition(-400 + this.spawnCol * 160, 350 - this.spawnRow * 60)
    this.tweenScale(1.2, 0.2)
  }

  onEvent("brick-hit") {
    if (this.touching("ボール")) {
      this.emitParticles(this.x, this.y, 12, "#ffffff", 180)
      this.tweenScale(0, 0.15)
      this.disableBody()
      this.emit("brick-destroyed", "")
    }
  }
}

class HUD {
}
`,
}
