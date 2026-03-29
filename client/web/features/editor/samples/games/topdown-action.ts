// Game: トップダウンアクション
// 剣攻撃、スライム敵、カギ、ゴール

import { sp, type SampleProject } from "../_helpers"

// スライムのスプライト定義を共通化
const slime = (id: string, name: string, pos: { x: number; y: number }) =>
  sp(id, name, "🟢", { w: 50, h: 50, color: "#33cc66", radius: 25, border: "#229944" }, pos)

export const topdownActionGame: SampleProject = {
  id: "topdown-action",
  name: "トップダウンアクション",
  description: "敵を倒してカギを集めてゴールを目指す",
  category: "games",
  sprites: [
    sp("s-hero", "勇者", "🗡️",
      { w: 60, h: 60, color: "#4488ff", radius: 30, border: "#2255cc" },
      { x: -600, y: -300 }),
    slime("s-slime1", "スライム1", { x: 200, y: 100 }),
    slime("s-slime2", "スライム2", { x: -300, y: 200 }),
    slime("s-slime3", "スライム3", { x: 500, y: -100 }),
    sp("s-sword", "剣", "⚔️",
      { w: 80, h: 20, color: "#cccccc", radius: 4 },
      { x: 9999, y: 9999 },
      { visible: false }),
    sp("s-heart", "回復", "💚",
      { w: 40, h: 40, color: "#33ff99", radius: 20 },
      { x: 0, y: -100 }),
    sp("s-key", "カギ", "🔑",
      { w: 40, h: 40, color: "#ffcc00", radius: 8 },
      { x: 600, y: 300 }),
    sp("s-door", "ゴール", "🚪",
      { w: 80, h: 100, color: "#885522", radius: 4, border: "#663311" },
      { x: 800, y: -350 }),
    sp("s-wall-top", "壁上", "⬛", { w: 1920, h: 40, color: "#444444" }, { x: 0, y: 500 }),
    sp("s-wall-bottom", "壁下", "⬛", { w: 1920, h: 40, color: "#444444" }, { x: 0, y: -500 }),
    sp("s-wall-left", "壁左", "⬛", { w: 40, h: 1080, color: "#444444" }, { x: -940, y: 0 }),
    sp("s-wall-right", "壁右", "⬛", { w: 40, h: 1080, color: "#444444" }, { x: 940, y: 0 }),
    sp("s-hud", "HUD", "📊", { w: 4, h: 4, color: "#000000" }, { x: 0, y: 0 }, { visible: false }),
  ],
  pseudocode: `
class 勇者 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(-600, -300)
    this.setCollideWorldBounds(true)
    this.hp = 100
    this.score = 0
    this.hasKey = 0
    this.gameOver = 0
    this.attackCooldown = 0
    this.invincible = 0
    this.addTextAt("hp", "HP: 100", -900, 490, 32, "#44dd44")
    this.addTextAt("score", "SCORE: 0", -900, 440, 24, "#ffffff")
    this.addTextAt("key", "", -500, 490, 28, "#ffcc00")
  }

  onUpdate() {
    if (this.gameOver == 0) {
      this.setVelocity(0, 0)
      if (this.isKeyPressed("left arrow")) {
        this.setVelocityX(-200)
        this.setFlipX(true)
      } else if (this.isKeyPressed("right arrow")) {
        this.setVelocityX(200)
        this.setFlipX(false)
      }
      if (this.isKeyPressed("up arrow")) {
        this.setVelocityY(-200)
      } else if (this.isKeyPressed("down arrow")) {
        this.setVelocityY(200)
      }
      if (this.attackCooldown > 0) {
        this.attackCooldown += -1
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
      }
    }
  }

  onKeyPress("space") {
    if (this.gameOver == 0 && this.attackCooldown == 0) {
      this.createClone("剣")
      this.attackCooldown = 15
      this.emit("attack", "")
      this.emitParticles(this.x + 40, this.y, 5, "#cccccc", 100)
    }
  }

  onTouched("スライム1") {
    if (this.invincible == 0 && this.gameOver == 0) {
      this.hp += -15
      this.invincible = 1
      this.updateTextAt("hp", join("HP: ", this.hp))
      this.cameraShake(150, 0.015)
      this.emitParticles(this.x, this.y, 8, "#ff3333", 120)
      this.setTint("#ff0000")
      this.wait(0.15)
      this.clearTint()
      this.wait(0.5)
      this.invincible = 0
    }
  }

  onTouched("スライム2") {
    if (this.invincible == 0 && this.gameOver == 0) {
      this.hp += -15
      this.invincible = 1
      this.updateTextAt("hp", join("HP: ", this.hp))
      this.cameraShake(150, 0.015)
      this.emitParticles(this.x, this.y, 8, "#ff3333", 120)
      this.setTint("#ff0000")
      this.wait(0.15)
      this.clearTint()
      this.wait(0.5)
      this.invincible = 0
    }
  }

  onTouched("スライム3") {
    if (this.invincible == 0 && this.gameOver == 0) {
      this.hp += -15
      this.invincible = 1
      this.updateTextAt("hp", join("HP: ", this.hp))
      this.cameraShake(150, 0.015)
      this.emitParticles(this.x, this.y, 8, "#ff3333", 120)
      this.setTint("#ff0000")
      this.wait(0.15)
      this.clearTint()
      this.wait(0.5)
      this.invincible = 0
    }
  }

  onTouched("回復") {
    this.hp += 30
    if (this.hp > 100) {
      this.hp = 100
    }
    this.updateTextAt("hp", join("HP: ", this.hp))
    this.floatingText("+30 HP")
    this.emitParticles(this.x, this.y, 12, "#33ff99", 100)
    this.emit("heal-get", "")
  }

  onTouched("カギ") {
    this.hasKey = 1
    this.floatingText("Got Key!")
    this.updateTextAt("key", "KEY GET!")
    this.emitParticles(this.x, this.y, 20, "#ffcc00", 200)
    this.emit("key-get", "")
  }

  onTouched("ゴール") {
    if (this.hasKey == 1 && this.gameOver == 0) {
      this.gameOver = 2
      this.score += 1000
      this.updateTextAt("score", join("SCORE: ", this.score))
      this.say("STAGE CLEAR!", 99)
      this.setVelocity(0, 0)
      this.emitParticles(this.x, this.y, 30, "#ffd700", 300)
      this.tweenScale(1.5, 0.5)
    }
  }

  onEvent("score-add") {
    if (this.gameOver == 0) {
      this.score += 100
      this.updateTextAt("score", join("SCORE: ", this.score))
    }
  }
}

class スライム1 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(200, 100)
    this.setCollideWorldBounds(true)
    this.moveTimer = 0
    this.alive = 1
  }
  onUpdate() {
    if (this.alive == 1) {
      this.moveTimer += 1
      if (this.moveTimer > 60) {
        this.setVelocityX(80)
        this.moveTimer = 0
      }
      if (this.moveTimer == 30) {
        this.setVelocityX(-80)
      }
    }
  }
  onEvent("attack") {
    if (this.alive == 1 && this.touching("剣")) {
      this.alive = 0
      this.floatingText("+100")
      this.emitParticles(this.x, this.y, 15, "#33cc66", 180)
      this.tweenScale(0, 0.2)
      this.disableBody()
      this.emit("score-add", "")
    }
  }
}

class スライム2 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(-300, 200)
    this.setCollideWorldBounds(true)
    this.moveTimer = 0
    this.alive = 1
  }
  onUpdate() {
    if (this.alive == 1) {
      this.moveTimer += 1
      if (this.moveTimer > 80) {
        this.setVelocityY(60)
        this.moveTimer = 0
      }
      if (this.moveTimer == 40) {
        this.setVelocityY(-60)
      }
    }
  }
  onEvent("attack") {
    if (this.alive == 1 && this.touching("剣")) {
      this.alive = 0
      this.floatingText("+100")
      this.emitParticles(this.x, this.y, 15, "#33cc66", 180)
      this.tweenScale(0, 0.2)
      this.disableBody()
      this.emit("score-add", "")
    }
  }
}

class スライム3 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(500, -100)
    this.setCollideWorldBounds(true)
    this.moveTimer = 0
    this.alive = 1
  }
  onUpdate() {
    if (this.alive == 1) {
      this.moveTimer += 1
      if (this.moveTimer > 50) {
        this.setVelocityX(-100)
        this.setVelocityY(60)
        this.moveTimer = 0
      }
      if (this.moveTimer == 25) {
        this.setVelocityX(100)
        this.setVelocityY(-60)
      }
    }
  }
  onEvent("attack") {
    if (this.alive == 1 && this.touching("剣")) {
      this.alive = 0
      this.floatingText("+100")
      this.emitParticles(this.x, this.y, 15, "#33cc66", 180)
      this.tweenScale(0, 0.2)
      this.disableBody()
      this.emit("score-add", "")
    }
  }
}

class 剣 {
  onCreate() {
    this.hide()
  }
  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setVelocityX(500)
    this.tweenAngle(720, 0.3)
    this.wait(0.3)
    this.deleteClone()
  }
}

class 回復 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(0, -100)
    this.setTint("#33ff99")
  }
  onUpdate() {
    this.setAngle(this.angle + 1)
  }
  onEvent("heal-get") {
    this.emitParticles(this.x, this.y, 10, "#33ff99", 120)
    this.tweenScale(0, 0.2)
    this.disableBody()
  }
}

class カギ {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(600, 300)
  }
  onUpdate() {
    this.setAngle(this.angle + 2)
  }
  onEvent("key-get") {
    this.emitParticles(this.x, this.y, 15, "#ffcc00", 150)
    this.tweenScale(0, 0.3)
    this.disableBody()
  }
}

class ゴール {
  onCreate() {
    this.setPhysics("static")
    this.setPosition(800, -350)
    this.setAlpha(30)
  }
  onEvent("key-get") {
    this.tweenAlpha(1, 0.5)
    this.setTint("#ffd700")
    this.emitParticles(this.x, this.y, 20, "#ffd700", 100)
  }
}

class 壁上 {
  onCreate() {
    this.setPhysics("static")
    this.setPosition(0, 500)
  }
}
class 壁下 {
  onCreate() {
    this.setPhysics("static")
    this.setPosition(0, -500)
  }
}
class 壁左 {
  onCreate() {
    this.setPhysics("static")
    this.setPosition(-940, 0)
  }
}
class 壁右 {
  onCreate() {
    this.setPhysics("static")
    this.setPosition(940, 0)
  }
}

class HUD {
}
`,
}
