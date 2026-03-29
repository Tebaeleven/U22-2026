// Game: ウォールブレイカー (inspired by WallHammer)
// 破壊可能なブロック壁、ハンマー攻撃、敵AI、コイン収集
// 縦プラットフォーマーのカメラ追従

import { sp, createUrlCostume, snd, type SampleProject } from "../_helpers"
import { WALLHAMMER_WALT, WALLHAMMER_BAT, WALLHAMMER_HAMMER, WALLHAMMER_COIN, WALLHAMMER_BRICK } from "../_assets"

const A = "/assets/samples/wallhammer"

export const wallBreakerGame: SampleProject = {
  id: "wall-breaker",
  name: "ウォールブレイカー",
  description: "壁を壊して敵を倒しコインを集めるプラットフォーマー",
  category: "games",
  sprites: [
    { ...sp("s-player", "プレイヤー", "🧑",
      { w: 64, h: 64, color: "#44aaff", radius: 8, border: "#2277cc" },
      { x: -400, y: -200 }),
      costumes: [createUrlCostume("プレイヤー", WALLHAMMER_WALT, 64, 64)],
      sounds: [snd("jump", `${A}/sounds/jump.mp3`), snd("death", `${A}/sounds/death.mp3`)],
    },
    { ...sp("s-hammer", "ハンマー", "🔨",
      { w: 64, h: 64, color: "#ffaa00", radius: 6 },
      { x: 0, y: 0 },
      { visible: false }),
      costumes: [createUrlCostume("ハンマー", WALLHAMMER_HAMMER, 64, 64)],
    },
    { ...sp("s-brick", "ブリック", "🟫",
      { w: 64, h: 64, color: "#8B5E3C", radius: 2 },
      { x: 0, y: 0 },
      { visible: false }),
      costumes: [createUrlCostume("ブリック", WALLHAMMER_BRICK, 64, 64)],
      sounds: [snd("stone", `${A}/sounds/stone.mp3`)],
    },
    { ...sp("s-bat", "コウモリ", "🦇",
      { w: 32, h: 32, color: "#aa44cc", radius: 6, border: "#8822aa" },
      { x: 0, y: 0 },
      { visible: false }),
      costumes: [createUrlCostume("コウモリ", WALLHAMMER_BAT, 32, 32)],
      sounds: [snd("kill", `${A}/sounds/kill.mp3`)],
    },
    { ...sp("s-coin", "コイン", "⭐",
      { w: 64, h: 64, color: "#ffcc00", radius: 16, border: "#cc9900" },
      { x: 0, y: 0 },
      { visible: false }),
      costumes: [createUrlCostume("コイン", WALLHAMMER_COIN, 64, 64)],
      sounds: [snd("coin", `${A}/sounds/coin.mp3`)],
    },
    sp("s-ground", "地面", "🟫",
      { w: 1920, h: 80, color: "#4a3728" },
      { x: 0, y: -440 }),
    sp("s-platform", "足場", "🟩",
      { w: 256, h: 32, color: "#556B2F" },
      { x: 0, y: 0 },
      { visible: false }),
    sp("s-hud", "HUD", "📊",
      { w: 4, h: 4, color: "#000000" },
      { x: 0, y: 0 },
      { visible: false }),
  ],
  pseudocode: `
class プレイヤー {
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(900)
    this.setPosition(-400, -200)
    this.setCollideWorldBounds(true)
    this.setBounce(0)
    this.setDrag(400, 0)
    this.hp = 3
    this.coins = 0
    this.facing = 1
    this.attackCool = 0
    this.invincible = 0
    this.gameOver = 0
    this.cameraFollow()
    this.addTextAt("coins", "🪙 0", -900, 490, 36, "#ffcc00")
    this.addTextAt("hp", "❤️❤️❤️", -900, 440, 32, "#ff4444")
  }

  onUpdate() {
    if (this.gameOver == 1) {
      this.setVelocityX(0)
    } else {
      this.setVelocityX(0)
      if (this.isKeyPressed("left arrow")) {
        this.setVelocityX(-280)
        this.facing = -1
        this.setFlipX(true)
      }
      if (this.isKeyPressed("right arrow")) {
        this.setVelocityX(280)
        this.facing = 1
        this.setFlipX(false)
      }
      if (this.attackCool > 0) {
        this.attackCool += -1
      }
      if (this.invincible > 0) {
        this.invincible += -1
        this.setAlpha(50)
      } else {
        this.setAlpha(100)
      }
    }
  }

  onKeyPress("up arrow") {
    if (this.gameOver == 0 && this.isOnGround()) {
      this.setVelocityY(-550)
      this.playSound("jump")
      this.emitParticles(this.x, this.y - 30, 6, "#aaaaaa", 60)
    }
  }

  onKeyPress("space") {
    if (this.gameOver == 0 && this.attackCool == 0) {
      this.attackCool = 20
      this.emit("attack", "")
    }
  }

  onTouched("コウモリ") {
    if (this.invincible == 0 && this.gameOver == 0) {
      this.hp += -1
      this.invincible = 60
      this.cameraShake(200, 0.02)
      this.emitParticles(this.x, this.y, 10, "#ff3333", 120)
      if (this.hp == 2) {
        this.updateTextAt("hp", "❤️❤️")
      }
      if (this.hp == 1) {
        this.updateTextAt("hp", "❤️")
      }
      if (this.hp < 1) {
        this.gameOver = 1
        this.updateTextAt("hp", "")
        this.say("GAME OVER", 99)
        this.cameraShake(400, 0.04)
      }
    }
  }

  onEvent("coin-picked") {
    this.coins += 1
    this.updateTextAt("coins", join("🪙 ", this.coins))
  }

  onEvent("enemy-killed-score") {
    this.coins += 5
    this.updateTextAt("coins", join("🪙 ", this.coins))
  }
}

class ハンマー {
  onCreate() {
    this.hide()
  }

  onEvent("attack") {
    this.setPosition(this.x + this.facing * 50, this.y)
    this.createClone("myself")
  }

  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.tweenScale(1.5, 0.15)
    this.emitParticles(this.x, this.y, 4, "#ffaa00", 80)
    this.wait(0.2)
    this.deleteClone()
  }

  onTouched("ブリック") {
    this.emit("brick-hit", "")
  }

  onTouched("コウモリ") {
    this.emit("bat-hit", "")
  }
}

class ブリック {
  onCreate() {
    this.hide()
    for (row in 0 .. 4) {
      for (col in 0 .. 2) {
        this.setPosition(-200 + col * 70, -100 + row * 70)
        this.createClone("myself")
      }
    }
    for (row in 0 .. 3) {
      for (col in 0 .. 2) {
        this.setPosition(-200 + (col + 6) * 70, -100 + row * 70)
        this.createClone("myself")
      }
    }
  }

  onClone() {
    this.show()
    this.setPhysics("static")
    this.setImmovable(true)
  }

  onEvent("brick-hit") {
    if (this.touching("ハンマー")) {
      this.playSound("stone")
      this.emitParticles(this.x, this.y, 10, "#8B5E3C", 120)
      this.cameraShake(100, 0.01)
      if (randomInt(0, 2) == 0) {
        this.emit("spawn-coin", "")
      }
      this.disableBody()
      this.hide()
    }
  }
}

class コウモリ {
  onCreate() {
    this.hide()
    this.batSpeed = 120
    this.setPosition(200, 200)
    this.createClone("myself")
    this.batSpeed = -100
    this.setPosition(-100, 350)
    this.createClone("myself")
    this.batSpeed = 80
    this.setPosition(400, 100)
    this.createClone("myself")
  }

  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.setBounce(1)
    this.setVelocityX(this.batSpeed)
  }

  onUpdate() {
    this.setAngle(sin(this.timer * 200) * 15)
  }

  onEvent("bat-hit") {
    if (this.touching("ハンマー")) {
      this.playSound("kill")
      this.emitParticles(this.x, this.y, 15, "#aa44cc", 150)
      this.floatingText("+50")
      this.emit("enemy-killed-score", "")
      this.deleteClone()
    }
  }
}

class コイン {
  onCreate() {
    this.hide()
  }

  onEvent("spawn-coin") {
    this.createClone("myself")
  }

  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setGravity(400)
    this.setBounce(0.5)
    this.tweenAngle(360, 1)
  }

  onTouched("プレイヤー") {
    this.playSound("coin")
    this.emitParticles(this.x, this.y, 8, "#ffcc00", 100)
    this.floatingText("+1")
    this.emit("coin-picked", "")
    this.deleteClone()
  }
}

class 地面 {
  onCreate() {
    this.setPhysics("static")
    this.setPosition(0, -440)
  }
}

class 足場 {
  onCreate() {
    this.hide()
    this.platIdx = 0
    this.setPosition(-350, -50)
    this.createClone("myself")
    this.setPosition(100, 100)
    this.createClone("myself")
    this.setPosition(400, 250)
    this.createClone("myself")
    this.setPosition(-150, 350)
    this.createClone("myself")
  }

  onClone() {
    this.show()
    this.setPhysics("static")
    this.setImmovable(true)
  }
}

class HUD {
  onCreate() {
    this.hide()
    this.setBackground("#2a1a0a")
    this.addTextAt("hint", "矢印: 移動/ジャンプ  スペース: ハンマー攻撃", -700, -480, 22, "#888888")
  }

}
`,
}
