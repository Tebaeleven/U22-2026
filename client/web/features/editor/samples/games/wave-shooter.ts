// Game: ウェーブシューター (inspired by StarShake)
// ウェーブ制の縦シューティング。パワーアップ、敵弾、ボスウェーブ
// 既存Space Shooterとの差別化: ウェーブ進行、パワーアップ、敵が撃ち返す

import { sp, createUrlCostume, snd, type SampleProject } from "../_helpers"
import { STARSHAKE_PLAYER, STARSHAKE_FOE0 } from "../_assets"

const A = "/assets/samples/starshake"

export const waveShooterGame: SampleProject = {
  id: "wave-shooter",
  name: "ウェーブシューター",
  description: "ウェーブ制の縦シューティング。パワーアップで強化",
  category: "games",
  sprites: [
    { ...sp("s-player", "プレイヤー", "🚀",
      { w: 64, h: 64, color: "#44aaff", radius: 8, border: "#2277cc" },
      { x: 0, y: -380 }),
      costumes: [createUrlCostume("プレイヤー", STARSHAKE_PLAYER, 64, 64)],
      sounds: [snd("shot", `${A}/sounds/shot.mp3`), snd("explosion", `${A}/sounds/explosion.mp3`)],
    },
    sp("s-pbullet", "自弾", "💠",
      { w: 16, h: 24, color: "#00ffcc", radius: 4 },
      { x: 0, y: 0 },
      { visible: false }),
    { ...sp("s-enemy", "敵", "👾",
      { w: 64, h: 64, color: "#ff4444", radius: 6, border: "#cc2222" },
      { x: 0, y: 0 },
      { visible: false }),
      costumes: [createUrlCostume("敵", STARSHAKE_FOE0, 64, 64)],
      sounds: [snd("destroy", `${A}/sounds/foedestroy.mp3`)],
    },
    sp("s-ebullet", "敵弾", "🔴",
      { w: 14, h: 14, color: "#ff6644", radius: 7 },
      { x: 0, y: 0 },
      { visible: false }),
    sp("s-powerup", "パワーアップ", "⚡",
      { w: 36, h: 36, color: "#ffcc00", radius: 18, border: "#cc9900" },
      { x: 0, y: 0 },
      { visible: false }),
    { ...sp("s-hud", "HUD", "📊",
      { w: 4, h: 4, color: "#000000" },
      { x: 0, y: 0 },
      { visible: false }),
      sounds: [snd("wave-clear", `${A}/sounds/stageclear1.mp3`)],
    },
  ],
  pseudocode: `
class プレイヤー {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.setPosition(0, -380)
    this.hp = 3
    this.score = 0
    this.wave = 1
    this.fireRate = 12
    this.fireTick = 0
    this.invincible = 0
    this.powerLevel = 0
    this.gameOver = 0
    this.setBackground("#0a0a1a")
    this.addTextAt("score", "SCORE: 0", -900, 490, 36, "#ffffff")
    this.addTextAt("wave", "WAVE 1", -100, 490, 36, "#ffcc00")
    this.addTextAt("hp", "HP: ❤️❤️❤️", 500, 490, 36, "#ff4444")
    this.emit("start-wave", 1)
  }

  onUpdate() {
    if (this.gameOver == 1) {
      this.setVelocity(0, 0)
    } else {
      this.setVelocity(0, 0)
      if (this.isKeyPressed("left arrow")) {
        this.setVelocityX(-400)
      }
      if (this.isKeyPressed("right arrow")) {
        this.setVelocityX(400)
      }
      if (this.isKeyPressed("up arrow")) {
        this.setVelocityY(300)
      }
      if (this.isKeyPressed("down arrow")) {
        this.setVelocityY(-300)
      }
      this.fireTick += 1
      if (this.fireTick > this.fireRate) {
        this.fireTick = 0
        this.playSound("shot")
        this.emit("fire-bullet", this.powerLevel)
      }
      if (this.invincible > 0) {
        this.invincible += -1
        this.setAlpha(50)
      } else {
        this.setAlpha(100)
      }
    }
  }

  onTouched("敵弾") {
    if (this.invincible == 0 && this.gameOver == 0) {
      this.hp += -1
      this.invincible = 60
      this.cameraShake(200, 0.03)
      this.emitParticles(this.x, this.y, 12, "#ff3333", 150)
      if (this.hp == 2) {
        this.updateTextAt("hp", "HP: ❤️❤️")
      }
      if (this.hp == 1) {
        this.updateTextAt("hp", "HP: ❤️")
      }
      if (this.hp < 1) {
        this.gameOver = 1
        this.updateTextAt("hp", "HP: ")
        this.say("GAME OVER", 99)
        this.playSound("explosion")
        this.cameraShake(500, 0.05)
        this.emitParticles(this.x, this.y, 30, "#ff0000", 300)
        this.emit("game-ended", "")
      }
    }
  }

  onTouched("敵") {
    if (this.invincible == 0 && this.gameOver == 0) {
      this.hp += -1
      this.invincible = 60
      this.cameraShake(200, 0.03)
      this.emitParticles(this.x, this.y, 12, "#ff3333", 150)
      if (this.hp < 1) {
        this.gameOver = 1
        this.say("GAME OVER", 99)
        this.emit("game-ended", "")
      }
    }
  }

  onEvent("enemy-killed") {
    this.score += 10 * this.wave
    this.updateTextAt("score", join("SCORE: ", this.score))
  }

  onEvent("wave-clear") {
    this.wave += 1
    this.updateTextAt("wave", join("WAVE ", this.wave))
    this.floatingText(join("WAVE ", this.wave))
    this.emitParticles(0, 0, 20, "#ffcc00", 200)
    this.wait(2)
    this.emit("start-wave", this.wave)
  }

  onEvent("got-powerup") {
    this.powerLevel += 1
    this.fireRate = max(4, 12 - this.powerLevel * 2)
    this.floatingText("POWER UP!")
    this.emitParticles(this.x, this.y, 15, "#ffcc00", 180)
  }
}

class 自弾 {
  onCreate() {
    this.hide()
  }

  onEvent("fire-bullet") {
    this.createClone("myself")
  }

  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setVelocityY(600)
    this.wait(2)
    this.deleteClone()
  }

  onTouched("敵") {
    this.emitParticles(this.x, this.y, 6, "#00ffcc", 100)
    this.deleteClone()
  }
}

class 敵 {
  onCreate() {
    this.hide()
    this.killed = 0
    this.spawnTotal = 0
    this.waveNum = 1
    this.active = 1
  }

  onEvent("start-wave") {
    this.killed = 0
    this.waveNum = eventData
    this.spawnTotal = 3 + this.waveNum * 2
    for (i in 0 .. this.spawnTotal) {
      this.wait(0.8)
      if (this.active == 1) {
        this.setPosition(randomInt(-400, 400), 500)
        this.createClone("myself")
      }
    }
  }

  onEvent("game-ended") {
    this.active = 0
  }

  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setVelocityY(-80 - this.waveNum * 15)
    this.setVelocityX(randomInt(-60, 60))
    this.setCollideWorldBounds(true)
    this.setBounce(1)
  }

  onUpdate() {
    if (this.y < -480) {
      this.deleteClone()
    }
    if (randomInt(0, 200) < 2) {
      this.emit("enemy-fire", "")
    }
  }

  onTouched("自弾") {
    this.playSound("destroy")
    this.emitParticles(this.x, this.y, 12, "#ff8844", 150)
    this.emit("enemy-killed", "")
    this.killed += 1
    if (this.killed >= this.spawnTotal) {
      this.emit("wave-clear", "")
    }
    if (randomInt(0, 3) == 0) {
      this.emit("spawn-powerup", "")
    }
    this.deleteClone()
  }
}

class 敵弾 {
  onCreate() {
    this.hide()
  }

  onEvent("enemy-fire") {
    this.createClone("myself")
  }

  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setVelocityY(-200)
    this.wait(3)
    this.deleteClone()
  }

  onTouched("プレイヤー") {
    this.deleteClone()
  }
}

class パワーアップ {
  onCreate() {
    this.hide()
  }

  onEvent("spawn-powerup") {
    this.createClone("myself")
  }

  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setVelocityY(-100)
    this.tweenScale(1.3, 0.5)
    this.tweenAngle(360, 2)
    this.wait(5)
    this.deleteClone()
  }

  onTouched("プレイヤー") {
    this.emit("got-powerup", "")
    this.emitParticles(this.x, this.y, 15, "#ffcc00", 180)
    this.deleteClone()
  }
}

class HUD {
}
`,
}
