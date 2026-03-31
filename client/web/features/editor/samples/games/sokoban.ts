// Game: ソコバンパズル (inspired by PushPull)
// プレイヤーが箱を押してゴールに運ぶパズル
// physics_setpushable を活用したトップダウンパズル

import { sp, createUrlCostume, snd, type SampleProject } from "../_helpers"
import { PUSHPULL_BLUE, PUSHPULL_RED, PUSHPULL_GREEN } from "../_assets"

const A = "/assets/samples/pushpull"

export const sokobanGame: SampleProject = {
  id: "sokoban",
  name: "ソコバンパズル",
  description: "箱を押してゴールに運ぶパズルゲーム",
  category: "games",
  sprites: [
    { ...sp("s-player", "プレイヤー", "🧑",
      { w: 32, h: 32, color: "#4488ff", radius: 8, border: "#2266cc" },
      { x: -320, y: -64 }),
      costumes: [createUrlCostume("プレイヤー", PUSHPULL_BLUE, 32, 32)],
      sounds: [snd("move", `${A}/sounds/move.mp3`), snd("bump", `${A}/sounds/bump.mp3`)],
    },
    { ...sp("s-box1", "箱1", "📦",
      { w: 32, h: 32, color: "#cc8833", radius: 4, border: "#996622" },
      { x: -128, y: 64 }),
      costumes: [createUrlCostume("箱1", PUSHPULL_RED, 32, 32)],
    },
    { ...sp("s-box2", "箱2", "📦",
      { w: 32, h: 32, color: "#cc8833", radius: 4, border: "#996622" },
      { x: 64, y: 192 }),
      costumes: [createUrlCostume("箱2", PUSHPULL_RED, 32, 32)],
    },
    { ...sp("s-box3", "箱3", "📦",
      { w: 32, h: 32, color: "#cc8833", radius: 4, border: "#996622" },
      { x: 192, y: 0 }),
      costumes: [createUrlCostume("箱3", PUSHPULL_RED, 32, 32)],
    },
    { ...sp("s-goal", "ゴール", "⭐",
      { w: 32, h: 32, color: "#44cc44", radius: 28 },
      { x: 0, y: 0 },
      { visible: false }),
      costumes: [createUrlCostume("ゴール", PUSHPULL_GREEN, 32, 32)],
      sounds: [snd("win", `${A}/sounds/win.mp3`)],
    },
    sp("s-wall", "壁", "🧱",
      { w: 64, h: 64, color: "#555555" },
      { x: 0, y: 0 },
      { visible: false }),
    sp("s-hud", "HUD", "📊",
      { w: 4, h: 4, color: "#000000" },
      { x: 0, y: 0 },
      { visible: false }),
  ],
  pseudocode: `
class プレイヤー {
  var moves = 0
  var lastX = -320
  var lastY = -64
  var cleared = 0
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(-320, -64)
    this.setCollideWorldBounds(true)
    this.setDrag(2000, 2000)
    this.setMaxVelocity(250, 250)
    this.moves = 0
    this.lastX = -320
    this.lastY = -64
    this.cleared = 0
  }

  onUpdate() {
    if (this.cleared == 1) {
      this.setVelocity(0, 0)
    } else {
      this.setVelocity(0, 0)
      if (this.isKeyPressed("left arrow")) {
        this.setVelocityX(-250)
      }
      if (this.isKeyPressed("right arrow")) {
        this.setVelocityX(250)
      }
      if (this.isKeyPressed("up arrow")) {
        this.setVelocityY(250)
      }
      if (this.isKeyPressed("down arrow")) {
        this.setVelocityY(-250)
      }
    }
  }

  onEvent("box-moved") {
    this.moves += 1
    this.emit("update-hud", "")
  }

  onEvent("all-clear") {
    this.cleared = 1
  }
}

class 箱1 {
  var onGoal = 0
  var prevX = x
  var prevY = y
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPushable(true)
    this.setDrag(3000, 3000)
    this.setMaxVelocity(200, 200)
    this.setMass(5)
    this.onGoal = 0
    this.prevX = this.x
    this.prevY = this.y
  }

  onUpdate() {
    if (abs(this.x - this.prevX) > 2 || abs(this.y - this.prevY) > 2) {
      this.emit("box-moved", "")
      this.prevX = this.x
      this.prevY = this.y
    }
  }

  onTouched("ゴール") {
    if (this.onGoal == 0) {
      this.onGoal = 1
      this.setTint("#44ff44")
      this.playSound("bump")
      this.emitParticles(this.x, this.y, 10, "#44ff44", 100)
      this.emit("goal-check", "")
    }
  }
}

class 箱2 {
  var onGoal = 0
  var prevX = x
  var prevY = y
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPushable(true)
    this.setDrag(3000, 3000)
    this.setMaxVelocity(200, 200)
    this.setMass(5)
    this.onGoal = 0
    this.prevX = this.x
    this.prevY = this.y
  }

  onUpdate() {
    if (abs(this.x - this.prevX) > 2 || abs(this.y - this.prevY) > 2) {
      this.emit("box-moved", "")
      this.prevX = this.x
      this.prevY = this.y
    }
  }

  onTouched("ゴール") {
    if (this.onGoal == 0) {
      this.onGoal = 1
      this.setTint("#44ff44")
      this.playSound("bump")
      this.emitParticles(this.x, this.y, 10, "#44ff44", 100)
      this.emit("goal-check", "")
    }
  }
}

class 箱3 {
  var onGoal = 0
  var prevX = x
  var prevY = y
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPushable(true)
    this.setDrag(3000, 3000)
    this.setMaxVelocity(200, 200)
    this.setMass(5)
    this.onGoal = 0
    this.prevX = this.x
    this.prevY = this.y
  }

  onUpdate() {
    if (abs(this.x - this.prevX) > 2 || abs(this.y - this.prevY) > 2) {
      this.emit("box-moved", "")
      this.prevX = this.x
      this.prevY = this.y
    }
  }

  onTouched("ゴール") {
    if (this.onGoal == 0) {
      this.onGoal = 1
      this.setTint("#44ff44")
      this.playSound("bump")
      this.emitParticles(this.x, this.y, 10, "#44ff44", 100)
      this.emit("goal-check", "")
    }
  }
}

class ゴール {
  var goalCount = 0
  onCreate() {
    this.hide()
    this.goalCount = 0
    this.setPosition(320, 256)
    this.createClone("myself")
    this.setPosition(320, 128)
    this.createClone("myself")
    this.setPosition(320, 0)
    this.createClone("myself")
  }

  onClone() {
    this.show()
    this.setPhysics("static")
    this.tweenAlpha(0.5, 1)
  }

  onEvent("goal-check") {
    this.goalCount += 1
    if (this.goalCount > 2) {
      this.emit("all-clear", "")
    }
  }
}

class 壁 {
  onCreate() {
    this.hide()
    for (row in 0 .. 9) {
      for (col in 0 .. 12) {
        if (row == 0 || row == 9 || col == 0 || col == 12) {
          this.setPosition(-448 + col * 72, -320 + row * 72)
          this.createClone("myself")
        }
        if (row == 4 && col > 2 && col < 7) {
          this.setPosition(-448 + col * 72, -320 + row * 72)
          this.createClone("myself")
        }
      }
    }
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
    this.setBackground("#2a2a3e")
    this.addTextAt("moves", "手数: 0", -900, 490, 36, "#ffffff")
    this.addTextAt("hint", "矢印キーで移動 / 箱をゴール⭐に押し込もう", -600, 440, 24, "#aaaaaa")
  }

  onEvent("update-hud") {
    this.updateTextAt("moves", join("手数: ", プレイヤー.moves))
  }

  onEvent("all-clear") {
    this.playSound("win")
    this.addTextAt("clear", "🎉 クリア!", -200, 250, 64, "#ffcc00")
    this.emitParticles(0, 200, 30, "#ffcc00", 250)
  }
}
`,
}
