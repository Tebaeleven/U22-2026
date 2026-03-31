// Game: アステロイド
// 宇宙船操作、弾クローン、小惑星3体が追尾、スコア＆ライフ

import { sp, type SampleProject } from "../_helpers"

export const asteroidGame: SampleProject = {
  id: "asteroid-game",
  name: "アステロイド",
  description: "小惑星を撃ち落とすスペースゲーム",
  category: "games",
  sprites: [
    sp("s-ship", "宇宙船", "🚀",
      { w: 50, h: 60, color: "#33ccff", radius: 8, border: "#1199cc" },
      { x: 0, y: 0 }),
    sp("s-bullet", "弾", "•",
      { w: 10, h: 24, color: "#ffcc00", radius: 4 },
      { x: 9999, y: 9999 },
      { visible: false }),
    sp("s-ast1", "小惑星1", "🪨",
      { w: 60, h: 60, color: "#886644", radius: 30, border: "#664422" },
      { x: -700, y: 350 }),
    sp("s-ast2", "小惑星2", "🪨",
      { w: 50, h: 50, color: "#776655", radius: 25, border: "#554433" },
      { x: 700, y: -300 }),
    sp("s-ast3", "小惑星3", "🪨",
      { w: 70, h: 70, color: "#998877", radius: 35, border: "#776655" },
      { x: 600, y: 400 }),
    sp("s-hud", "HUD", "📊",
      { w: 4, h: 4, color: "#000000" },
      { x: 0, y: 0 },
      { visible: false }),
  ],
  pseudocode: `
class 宇宙船 {
  var score = 0
  var lives = 3
  var gameOver = 0
  var invincible = 0
  var fireAngle = 0
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setDamping("on")
    this.setDrag(0.99, 0.99)
    this.setMaxVelocity(400, 400)
    this.score = 0
    this.lives = 3
    this.gameOver = 0
    this.invincible = 0
    this.fireAngle = 0
    this.addTextAt("score", "SCORE: 0", -900, 490, 36, "#ffffff")
    this.addTextAt("lives", "LIVES: 3", -900, 440, 24, "#33ccff")
  }
  onUpdate() {
    if (this.gameOver == 0) {
      if (this.isKeyPressed("left arrow")) {
        this.setAngle(this.angle - 4)
      }
      if (this.isKeyPressed("right arrow")) {
        this.setAngle(this.angle + 4)
      }
      if (this.isKeyPressed("up arrow")) {
        this.velocityFromAngle(this.angle, 300)
        this.emitParticles(this.x, this.y, 2, "#ff6600", 60)
      }
      this.worldWrap(40)
      this.fireAngle = this.angle
    }
  }
  onKeyPress("space") {
    if (this.gameOver == 0) {
      弾.spawnX = this.x
      弾.spawnY = this.y
      弾.fireAngle = this.fireAngle
      this.createClone("弾")
      this.playSound("laser")
    }
  }
  onEvent("score-add") {
    this.score += 100
    this.updateTextAt("score", join("SCORE: ", this.score))
  }
  onTouched("小惑星1") {
    if (this.invincible == 0 && this.gameOver == 0) {
      this.lives += -1
      this.invincible = 1
      this.updateTextAt("lives", join("LIVES: ", this.lives))
      this.cameraShake(200, 0.02)
      this.playSound("hit")
      this.emitParticles(this.x, this.y, 15, "#ff3333", 200)
      this.setTint("#ff0000")
      this.wait(0.2)
      this.clearTint()
      this.wait(0.8)
      this.invincible = 0
      if (this.lives < 1) {
        this.gameOver = 1
        this.say("GAME OVER", 99)
        this.cameraFade(2000)
      }
    }
  }
  onTouched("小惑星2") {
    if (this.invincible == 0 && this.gameOver == 0) {
      this.lives += -1
      this.invincible = 1
      this.updateTextAt("lives", join("LIVES: ", this.lives))
      this.cameraShake(200, 0.02)
      this.playSound("hit")
      this.emitParticles(this.x, this.y, 15, "#ff3333", 200)
      this.setTint("#ff0000")
      this.wait(0.2)
      this.clearTint()
      this.wait(0.8)
      this.invincible = 0
      if (this.lives < 1) {
        this.gameOver = 1
        this.say("GAME OVER", 99)
        this.cameraFade(2000)
      }
    }
  }
  onTouched("小惑星3") {
    if (this.invincible == 0 && this.gameOver == 0) {
      this.lives += -1
      this.invincible = 1
      this.updateTextAt("lives", join("LIVES: ", this.lives))
      this.cameraShake(200, 0.02)
      this.playSound("hit")
      this.emitParticles(this.x, this.y, 15, "#ff3333", 200)
      this.setTint("#ff0000")
      this.wait(0.2)
      this.clearTint()
      this.wait(0.8)
      this.invincible = 0
      if (this.lives < 1) {
        this.gameOver = 1
        this.say("GAME OVER", 99)
        this.cameraFade(2000)
      }
    }
  }
}
class 弾 {
  var spawnX = 0
  var spawnY = 0
  var fireAngle = 0
  onCreate() {
    this.hide()
  }
  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(this.spawnX, this.spawnY)
    this.velocityFromAngle(this.fireAngle, 600)
    this.setAngle(this.fireAngle)
    this.wait(1.5)
    this.deleteClone()
  }
}
class 小惑星1 {
  var alive = 1
  var speed = 80
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.setBounce(1)
    this.alive = 1
    this.speed = 80
  }
  onUpdate() {
    if (this.alive == 1) {
      this.moveTo("宇宙船", this.speed)
      this.setAngle(this.angle + 1)
    }
  }
  onTouched("弾") {
    if (this.alive == 1) {
      this.alive = 0
      this.emit("score-add", "")
      this.floatingText("+100")
      this.playSound("explosion")
      this.emitParticles(this.x, this.y, 25, "#886644", 250)
      this.tweenScale(0, 0.3)
      this.disableBody()
    }
  }
}
class 小惑星2 {
  var alive = 1
  var speed = 100
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.setBounce(1)
    this.alive = 1
    this.speed = 100
  }
  onUpdate() {
    if (this.alive == 1) {
      this.moveTo("宇宙船", this.speed)
      this.setAngle(this.angle + 2)
    }
  }
  onTouched("弾") {
    if (this.alive == 1) {
      this.alive = 0
      this.emit("score-add", "")
      this.floatingText("+100")
      this.playSound("explosion")
      this.emitParticles(this.x, this.y, 25, "#776655", 250)
      this.tweenScale(0, 0.3)
      this.disableBody()
    }
  }
}
class 小惑星3 {
  var alive = 1
  var speed = 60
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.setBounce(1)
    this.alive = 1
    this.speed = 60
  }
  onUpdate() {
    if (this.alive == 1) {
      this.moveTo("宇宙船", this.speed)
      this.setAngle(this.angle + 0.5)
    }
  }
  onTouched("弾") {
    if (this.alive == 1) {
      this.alive = 0
      this.emit("score-add", "")
      this.floatingText("+100")
      this.playSound("explosion")
      this.emitParticles(this.x, this.y, 30, "#998877", 300)
      this.tweenScale(0, 0.3)
      this.disableBody()
    }
  }
}
class HUD {
}
`,
}
