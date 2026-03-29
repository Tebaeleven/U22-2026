// Game: フラッピーバード
// パイプを避けて飛ぶ、クローンベースの障害物生成

import { sp, type SampleProject } from "../_helpers"

export const flappyBird: SampleProject = {
  id: "flappy-bird",
  name: "フラッピーバード",
  description: "パイプの隙間を通り抜けるフライトゲーム",
  category: "games",
  sprites: [
    sp("s-bird", "鳥", "🐤",
      { w: 40, h: 40, color: "#ffdd00", radius: 20, border: "#ccaa00" },
      { x: -400, y: 0 }),
    sp("s-pipe-top", "上パイプ", "🟩",
      { w: 120, h: 600, color: "#33aa33", border: "#228822" },
      { x: 9999, y: 9999 },
      { visible: false }),
    sp("s-pipe-bottom", "下パイプ", "🟩",
      { w: 120, h: 600, color: "#33aa33", border: "#228822" },
      { x: 9999, y: 9999 },
      { visible: false }),
    sp("s-hud", "HUD", "📊",
      { w: 4, h: 4, color: "#000000" },
      { x: 0, y: 0 },
      { visible: false }),
  ],
  pseudocode: `
class 鳥 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(800)
    this.setCollideWorldBounds(true)
    this.setPosition(-400, 0)
    this.score = 0
    this.gameOver = 0
    this.gap = 350
    this.addTextAt("score", "0", 0, 490, 64, "#ffffff")
    this.setInterval("spawn-pipe", 2000)
  }

  onUpdate() {
    if (this.gameOver == 0) {
      if (this.velocityY < -100) {
        this.setAngle(-30)
      } else if (this.velocityY > 200) {
        this.setAngle(30)
      } else {
        this.setAngle(0)
      }
    }
  }

  onKeyPress("space") {
    if (this.gameOver == 0) {
      this.setVelocityY(-400)
      this.emitParticles(this.x - 15, this.y, 4, "#ffdd00", 60)
    }
  }

  onTouched("上パイプ") {
    if (this.gameOver == 0) {
      this.gameOver = 1
      this.setVelocity(0, 0)
      this.setTint("#ff0000")
      this.cameraShake(300, 0.03)
      this.emitParticles(this.x, this.y, 15, "#ff3333", 150)
      this.say("GAME OVER", 99)
      this.cameraFade(2000)
    }
  }

  onTouched("下パイプ") {
    if (this.gameOver == 0) {
      this.gameOver = 1
      this.setVelocity(0, 0)
      this.setTint("#ff0000")
      this.cameraShake(300, 0.03)
      this.emitParticles(this.x, this.y, 15, "#ff3333", 150)
      this.say("GAME OVER", 99)
      this.cameraFade(2000)
    }
  }

  onEvent("spawn-pipe") {
    if (this.gameOver == 0) {
      this.createClone("上パイプ")
      this.createClone("下パイプ")
    }
  }

  onEvent("score-up") {
    if (this.gameOver == 0) {
      this.score += 1
      this.updateTextAt("score", this.score)
      this.emitParticles(this.x, this.y - 20, 4, "#44ff44", 80)
    }
  }
}

class 上パイプ {
  onCreate() {
    this.hide()
  }

  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.pipeY = randomInt(100, 400)
    this.setPosition(1000, this.pipeY + 475)
    this.setVelocityX(-200)
    this.wait(8)
    this.deleteClone()
  }
}

class 下パイプ {
  onCreate() {
    this.hide()
    this.scored = 0
  }

  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.pipeY = randomInt(100, 400)
    this.setPosition(1000, this.pipeY - 475 - 350)
    this.setVelocityX(-200)
    this.scored = 0
  }

  onUpdate() {
    if (this.scored == 0 && this.x < -400) {
      this.scored = 1
      this.emit("score-up", "")
    }
    if (this.x < -1100) {
      this.deleteClone()
    }
  }
}

class HUD {
}
`,
}
