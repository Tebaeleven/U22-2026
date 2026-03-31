// Game: トップダウンRPG
// WASD移動、スペースで剣攻撃(クローン)、敵が追尾、HPシステム

import { sp, type SampleProject } from "../_helpers"

const slime = (id: string, name: string, pos: { x: number; y: number }) =>
  sp(id, name, "🟢", { w: 50, h: 50, color: "#33cc66", radius: 25, border: "#229944" }, pos)

export const topdownRpg: SampleProject = {
  id: "topdown-rpg",
  name: "トップダウンRPG",
  description: "WASD移動＆剣で敵を倒すアドベンチャー",
  category: "games",
  sprites: [
    sp("s-hero", "勇者", "🗡️",
      { w: 50, h: 50, color: "#4488ff", radius: 25, border: "#2255cc" },
      { x: 0, y: 0 }),
    sp("s-sword", "剣", "⚔️",
      { w: 70, h: 16, color: "#cccccc", radius: 4 },
      { x: 9999, y: 9999 },
      { visible: false }),
    slime("s-slime1", "スライム1", { x: 400, y: 300 }),
    slime("s-slime2", "スライム2", { x: -400, y: -200 }),
    slime("s-slime3", "スライム3", { x: 600, y: -300 }),
    sp("s-hud", "HUD", "📊",
      { w: 4, h: 4, color: "#000000" },
      { x: 0, y: 0 },
      { visible: false }),
  ],
  pseudocode: `
class 勇者 {
  var hp = 100
  var score = 0
  var gameOver = 0
  var attackCooldown = 0
  var invincible = 0
  var facingRight = 1
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.hp = 100
    this.score = 0
    this.gameOver = 0
    this.attackCooldown = 0
    this.invincible = 0
    this.facingRight = 1
    this.addTextAt("hp", "HP: 100", -900, 490, 32, "#44dd44")
    this.addTextAt("score", "SCORE: 0", -900, 440, 24, "#ffffff")
    this.addTextAt("info", "WASD: Move / SPACE: Attack", -900, 390, 18, "#888888")
  }
  onUpdate() {
    if (this.gameOver == 0) {
      this.setVelocity(0, 0)
      if (this.isKeyPressed("a")) {
        this.setVelocityX(-220)
        this.facingRight = 0
        this.setFlipX(true)
      } else if (this.isKeyPressed("d")) {
        this.setVelocityX(220)
        this.facingRight = 1
        this.setFlipX(false)
      }
      if (this.isKeyPressed("w")) {
        this.setVelocityY(220)
      } else if (this.isKeyPressed("s")) {
        this.setVelocityY(-220)
      }
      if (this.attackCooldown > 0) {
        this.attackCooldown += -1
      }
      this.graphics.clear()
      this.graphics.fillRect(-900, 355, 300, 20, "#333333")
      if (this.hp > 50) {
        this.graphics.fillRect(-900, 355, this.hp * 3, 20, "#44dd44")
      } else if (this.hp > 25) {
        this.graphics.fillRect(-900, 355, this.hp * 3, 20, "#ddaa00")
      } else {
        this.graphics.fillRect(-900, 355, this.hp * 3, 20, "#dd2222")
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
      剣.spawnX = this.x
      剣.spawnY = this.y
      剣.facingRight = this.facingRight
      this.createClone("剣")
      this.attackCooldown = 20
      this.emit("attack", "")
      this.playSound("laser")
      this.emitParticles(this.x, this.y, 5, "#cccccc", 80)
    }
  }
  onEvent("score-add") {
    this.score += 100
    this.updateTextAt("score", join("SCORE: ", this.score))
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
}
class 剣 {
  var spawnX = 0
  var spawnY = 0
  var facingRight = 1
  onCreate() {
    this.hide()
  }
  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(this.spawnX, this.spawnY)
    if (this.facingRight == 1) {
      this.setVelocityX(500)
    } else {
      this.setVelocityX(-500)
    }
    this.tweenAngle(720, 0.3)
    this.wait(0.3)
    this.deleteClone()
  }
}
class スライム1 {
  var alive = 1
  var speed = 70
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.alive = 1
    this.speed = 70
  }
  onUpdate() {
    if (this.alive == 1) {
      this.moveTo("勇者", this.speed)
    }
  }
  onEvent("attack") {
    if (this.alive == 1 && this.touching("剣")) {
      this.alive = 0
      this.emit("score-add", "")
      this.floatingText("+100")
      this.playSound("hit")
      this.emitParticles(this.x, this.y, 15, "#33cc66", 180)
      this.tweenScale(0, 0.2)
      this.disableBody()
    }
  }
}
class スライム2 {
  var alive = 1
  var speed = 90
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.alive = 1
    this.speed = 90
  }
  onUpdate() {
    if (this.alive == 1) {
      this.moveTo("勇者", this.speed)
    }
  }
  onEvent("attack") {
    if (this.alive == 1 && this.touching("剣")) {
      this.alive = 0
      this.emit("score-add", "")
      this.floatingText("+100")
      this.playSound("hit")
      this.emitParticles(this.x, this.y, 15, "#33cc66", 180)
      this.tweenScale(0, 0.2)
      this.disableBody()
    }
  }
}
class スライム3 {
  var alive = 1
  var speed = 110
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.alive = 1
    this.speed = 110
  }
  onUpdate() {
    if (this.alive == 1) {
      this.moveTo("勇者", this.speed)
    }
  }
  onEvent("attack") {
    if (this.alive == 1 && this.touching("剣")) {
      this.alive = 0
      this.emit("score-add", "")
      this.floatingText("+100")
      this.playSound("hit")
      this.emitParticles(this.x, this.y, 15, "#33cc66", 180)
      this.tweenScale(0, 0.2)
      this.disableBody()
    }
  }
}
class HUD {
}
`,
}
