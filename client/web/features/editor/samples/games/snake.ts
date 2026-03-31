// Game: スネークゲーム
// クローンによる体の追従、グリッド移動

import { sp, type SampleProject } from "../_helpers"

export const snakeGame: SampleProject = {
  id: "snake",
  name: "スネークゲーム",
  description: "エサを食べて加速するクラシックゲーム",
  category: "games",
  sprites: [
    sp("s-head", "アタマ", "🐍",
      { w: 48, h: 48, color: "#22aa22", radius: 8, border: "#116611" },
      { x: 0, y: 0 }),
    sp("s-body", "カラダ", "🟩",
      { w: 44, h: 44, color: "#33cc33", radius: 6, border: "#228822" },
      { x: 0, y: 0 },
      { visible: false }),
    sp("s-food", "エサ", "🍎",
      { w: 48, h: 48, color: "#ff3333", radius: 24 },
      { x: 288, y: 144 }),
    sp("s-hud", "HUD", "📊",
      { w: 4, h: 4, color: "#000000" },
      { x: 0, y: 0 },
      { visible: false }),
  ],
  pseudocode: `
class アタマ {
  var dir = 3
  var moveTimer = 0
  var speed = 8
  var score = 0
  var alive = 1
  var bodyLen = 0
  var foodX = 288
  var foodY = 144
  var relayX = 0
  var relayY = 0
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(0, 0)
    this.dir = 3
    this.moveTimer = 0
    this.speed = 8
    this.score = 0
    this.alive = 1
    this.bodyLen = 0
    this.foodX = 288
    this.foodY = 144
    this.relayX = 0
    this.relayY = 0
    this.addTextAt("score", "SCORE: 0", -900, 490, 36, "#ffffff")
    this.addTextAt("len", "LENGTH: 1", -900, 440, 24, "#88ff88")
  }

  onUpdate() {
    if (this.alive == 1) {
      this.moveTimer += 1
      if (this.moveTimer > this.speed) {
        this.relayX = this.x
        this.relayY = this.y
        if (this.dir == 3) {
          this.x += 48
        } else if (this.dir == 2) {
          this.x += -48
        } else if (this.dir == 0) {
          this.y += 48
        } else if (this.dir == 1) {
          this.y += -48
        }
        this.moveTimer = 0
        this.emit("snake-step", "")
        if (this.touching("カラダ")) {
          this.alive = 0
          this.say("GAME OVER", 99)
          this.cameraShake(300, 0.02)
          this.setTint("#ff0000")
          this.addTextAt("gameover", "GAME OVER", -200, 0, 64, "#ff3333")
        }
      }
      if (this.x > 912) {
        this.x = -912
      }
      if (this.x < -912) {
        this.x = 912
      }
      if (this.y > 492) {
        this.y = -492
      }
      if (this.y < -492) {
        this.y = 492
      }
    }
  }

  onKeyPress("left arrow") {
    if (this.dir == 0 || this.dir == 1) {
      this.dir = 2
    }
  }
  onKeyPress("right arrow") {
    if (this.dir == 0 || this.dir == 1) {
      this.dir = 3
    }
  }
  onKeyPress("up arrow") {
    if (this.dir == 2 || this.dir == 3) {
      this.dir = 0
    }
  }
  onKeyPress("down arrow") {
    if (this.dir == 2 || this.dir == 3) {
      this.dir = 1
    }
  }

  onTouched("エサ") {
    this.score += 10
    this.bodyLen += 1
    this.updateTextAt("score", join("SCORE: ", this.score))
    this.updateTextAt("len", join("LENGTH: ", this.bodyLen + 1))
    this.floatingText("+10")
    this.emitParticles(this.x, this.y, 10, "#ff3333", 120)
    if (this.speed > 3) {
      this.speed += -1
    }
    カラダ.relayX = this.relayX
    カラダ.relayY = this.relayY
    this.createClone("カラダ")
    this.foodX += 336
    if (this.foodX > 700) {
      this.foodX = -700
      this.foodY += 240
    }
    if (this.foodY > 400) {
      this.foodY = -400
    }
    this.emit("food-eaten", "")
  }
}

class カラダ {
  var oldX = relayX
  var oldY = relayY
  var relayX = oldX
  var relayY = oldY
  onCreate() {
    this.hide()
  }

  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(this.relayX, this.relayY)
    this.oldX = this.relayX
    this.oldY = this.relayY
    this.tweenScale(1.3, 0.15)
  }

  onEvent("snake-step") {
    this.oldX = this.x
    this.oldY = this.y
    this.setPosition(this.relayX, this.relayY)
    this.relayX = this.oldX
    this.relayY = this.oldY
  }
}

class エサ {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(288, 144)
  }
  onUpdate() {
    this.setAngle(this.angle + 2)
  }
  onEvent("food-eaten") {
    this.setPosition(アタマ.foodX, アタマ.foodY)
    this.emitParticles(this.x, this.y, 15, "#33ff33", 150)
    this.tweenScale(1.5, 0.2)
  }
}

class HUD {
}
`,
}
