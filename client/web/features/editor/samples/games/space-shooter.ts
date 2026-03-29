// Game: スペースシューター
// 縦STG、クローン敵、パーティクル、カメラエフェクト

import { sp, type SampleProject } from "../_helpers"

export const spaceShooterGame: SampleProject = {
  id: "space-shooter",
  name: "スペースシューター",
  description: "敵を撃ち落とす縦シューティング",
  category: "games",
  sprites: [
    sp("s-player", "自機", "🚀",
      { w: 60, h: 80, color: "#3399ff", radius: 8, border: "#1a66cc" },
      { x: 0, y: -350 }),
    sp("s-bullet", "弾", "•",
      { w: 12, h: 32, color: "#ffcc00", radius: 4 },
      { x: 0, y: -350 },
      { visible: false }),
    sp("s-enemy", "敵", "👾",
      { w: 64, h: 64, color: "#ee3333", radius: 8, border: "#aa0000" },
      { x: 0, y: 450 },
      { visible: false }),
    sp("s-hud", "HUD", "📊",
      { w: 4, h: 4, color: "#000000" },
      { x: 0, y: 0 },
      { visible: false }),
  ],
  pseudocode: `
class 自機 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(0, -350)
    this.setCollideWorldBounds(true)
    this.score = 0
    this.hp = 100
    this.gameOver = 0
    this.addTextAt("score", "SCORE: 0", -900, 490, 36, "#ffffff")
    this.addTextAt("hp", "HP: 100", -900, 440, 28, "#44dd44")
  }

  onUpdate() {
    if (this.gameOver == 0) {
      this.setVelocity(0, 0)
      if (this.isKeyPressed("left arrow")) {
        this.setVelocityX(-350)
      } else if (this.isKeyPressed("right arrow")) {
        this.setVelocityX(350)
      }
      if (this.isKeyPressed("up arrow")) {
        this.setVelocityY(-350)
      } else if (this.isKeyPressed("down arrow")) {
        this.setVelocityY(350)
      }

      this.graphics.clear()
      this.graphics.fillRect(-900, 400, 300, 24, "#333333")
      if (this.hp > 50) {
        this.graphics.fillRect(-900, 400, this.hp * 3, 24, "#44dd44")
      } else if (this.hp > 25) {
        this.graphics.fillRect(-900, 400, this.hp * 3, 24, "#ddaa00")
      } else {
        this.graphics.fillRect(-900, 400, this.hp * 3, 24, "#dd2222")
      }

      if (this.hp < 1) {
        this.gameOver = 1
        this.say("GAME OVER", 99)
        this.setVelocity(0, 0)
        this.cameraShake(500, 0.03)
        this.tweenAlpha(0.3, 1)
        this.cameraFade(2000)
      }
    }
  }

  onKeyPress("space") {
    if (this.gameOver == 0) {
      this.createClone("弾")
      this.emitParticles(this.x, this.y + 30, 5, "#ffcc00", 100)
    }
  }

  onTouched("敵") {
    if (this.gameOver == 0) {
      this.hp += -20
      this.updateTextAt("hp", join("HP: ", this.hp))
      this.cameraShake(150, 0.015)
      this.emitParticles(this.x, this.y, 10, "#ff3333", 150)
      this.setTint("#ff0000")
      this.setAlpha(50)
      this.wait(0.15)
      this.clearTint()
      this.wait(0.3)
      this.setAlpha(100)
    }
  }

  onEvent("enemy-killed") {
    if (this.gameOver == 0) {
      this.score += 50
      this.updateTextAt("score", join("SCORE: ", this.score))
    }
  }
}

class 弾 {
  onCreate() {
    this.hide()
  }
  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setVelocityY(-600)
    this.wait(1.5)
    this.deleteClone()
  }
}

class 敵 {
  onCreate() {
    this.hide()
    this.spawnX = -700
  }

  onUpdate() {
    this.spawnX += 200
    if (this.spawnX > 700) {
      this.spawnX = -700
    }
    this.setPosition(this.spawnX, 450)
    this.createClone("myself")
    this.wait(1.2)
  }

  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setVelocityY(180)
    this.tweenAngle(360, 3)
    this.wait(6)
    this.deleteClone()
  }

  onTouched("弾") {
    this.emitParticles(this.x, this.y, 20, "#ff6600", 250)
    this.floatingText("+50")
    this.emit("enemy-killed", "")
    this.deleteClone()
  }
}

class HUD {
}
`,
}
