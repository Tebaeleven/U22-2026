// Game: マーズエクスプローラー (inspired by Mars)
// 酸素が減り続ける中、迷路を探索してゴールを目指す
// ドローン敵の追跡を避け、酸素タンクを拾って生き延びる

import { sp, createUrlCostume, snd, type SampleProject } from "../_helpers"
import { MARS_PLAYER, MARS_DRONE, MARS_HOLE } from "../_assets"

const A = "/assets/samples/mars"

export const marsExplorerGame: SampleProject = {
  id: "mars-explorer",
  name: "マーズエクスプローラー",
  description: "酸素が減る中で迷路を探索しゴールを目指す",
  category: "games",
  sprites: [
    { ...sp("s-explorer", "探検家", "🧑‍🚀",
      { w: 64, h: 64, color: "#44aaff", radius: 8, border: "#2277cc" },
      { x: -400, y: -320 }),
      costumes: [createUrlCostume("探検家", MARS_PLAYER, 64, 64)],
      sounds: [snd("step", `${A}/sounds/step.mp3`), snd("oxygen", `${A}/sounds/oxygen.mp3`), snd("heartbeat", `${A}/sounds/heartbeat.mp3`)],
    },
    sp("s-wall", "壁", "🧱",
      { w: 64, h: 64, color: "#8B4513" },
      { x: 0, y: 0 },
      { visible: false }),
    sp("s-oxygen", "酸素タンク", "🫧",
      { w: 36, h: 36, color: "#00ccff", radius: 18, border: "#0088aa" },
      { x: 0, y: 0 },
      { visible: false }),
    { ...sp("s-drone", "ドローン", "👾",
      { w: 64, h: 64, color: "#ff4444", radius: 6, border: "#cc2222" },
      { x: 0, y: 0 },
      { visible: false }),
      costumes: [createUrlCostume("ドローン", MARS_DRONE, 64, 64)],
      sounds: [snd("kill", `${A}/sounds/kill.mp3`)],
    },
    { ...sp("s-hole", "穴", "⚫",
      { w: 64, h: 64, color: "#111111", radius: 24 },
      { x: 0, y: 0 },
      { visible: false }),
      costumes: [createUrlCostume("穴", MARS_HOLE, 64, 64)],
    },
    sp("s-exit", "出口", "🚪",
      { w: 56, h: 56, color: "#44ff44", radius: 8, border: "#22cc22" },
      { x: 400, y: 320 }),
    sp("s-hud", "HUD", "📊",
      { w: 4, h: 4, color: "#000000" },
      { x: 0, y: 0 },
      { visible: false }),
  ],
  pseudocode: `
class 探検家 {
  var oxygen = 100
  var alive = 1
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(-400, -320)
    this.setCollideWorldBounds(true)
    this.setDrag(1500, 1500)
    this.setMaxVelocity(220, 220)
    this.oxygen = 100
    this.alive = 1
    this.cameraFollow()
  }

  onUpdate() {
    if (this.alive == 1) {
      this.oxygen += -0.04
      this.graphics.clear()
      if (this.oxygen > 30) {
        this.graphics.fillRect(-820, 500, this.oxygen * 6, 24, "#00ff88")
      } else {
        this.graphics.fillRect(-820, 500, this.oxygen * 6, 24, "#ff4444")
      }
      if (this.oxygen < 1) {
        this.alive = 0
        this.emit("death", "")
      }
      this.setVelocity(0, 0)
      if (this.isKeyPressed("left arrow")) {
        this.setVelocityX(-220)
      }
      if (this.isKeyPressed("right arrow")) {
        this.setVelocityX(220)
      }
      if (this.isKeyPressed("up arrow")) {
        this.setVelocityY(220)
      }
      if (this.isKeyPressed("down arrow")) {
        this.setVelocityY(-220)
      }
    } else {
      this.setVelocity(0, 0)
    }
  }

  onTouched("酸素タンク") {
    this.oxygen += 30
    if (this.oxygen > 100) {
      this.oxygen = 100
    }
    this.playSound("oxygen")
    this.floatingText("+O2")
    this.emitParticles(this.x, this.y, 10, "#00ccff", 120)
  }

  onTouched("ドローン") {
    if (this.alive == 1) {
      this.alive = 0
      this.playSound("kill")
      this.cameraShake(300, 0.04)
      this.emitParticles(this.x, this.y, 20, "#ff3333", 200)
      this.emit("death", "")
    }
  }

  onTouched("穴") {
    if (this.alive == 1) {
      this.alive = 0
      this.cameraShake(200, 0.03)
      this.tweenScale(0, 0.5)
      this.emit("death", "")
    }
  }

  onTouched("出口") {
    if (this.alive == 1) {
      this.alive = 0
      this.emitParticles(this.x, this.y, 30, "#44ff44", 250)
      this.emit("level-clear", "")
    }
  }
}

class 壁 {
  onCreate() {
    this.hide()
    for (row in 0 .. 10) {
      for (col in 0 .. 13) {
        if (row == 0 || row == 10 || col == 0 || col == 13) {
          this.setPosition(-480 + col * 72, -400 + row * 72)
          this.createClone("myself")
        }
        if (row == 2 && col > 0 && col < 5) {
          this.setPosition(-480 + col * 72, -400 + row * 72)
          this.createClone("myself")
        }
        if (row == 4 && col > 3 && col < 9) {
          this.setPosition(-480 + col * 72, -400 + row * 72)
          this.createClone("myself")
        }
        if (row == 6 && col > 1 && col < 6) {
          this.setPosition(-480 + col * 72, -400 + row * 72)
          this.createClone("myself")
        }
        if (row == 8 && col > 5 && col < 11) {
          this.setPosition(-480 + col * 72, -400 + row * 72)
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

class 酸素タンク {
  onCreate() {
    this.hide()
    this.setPosition(-200, -100)
    this.createClone("myself")
    this.setPosition(100, 50)
    this.createClone("myself")
    this.setPosition(-100, 200)
    this.createClone("myself")
    this.setPosition(300, -200)
    this.createClone("myself")
    this.setPosition(200, 300)
    this.createClone("myself")
  }

  onClone() {
    this.show()
    this.setPhysics("static")
    this.tweenScale(1.2, 1)
  }

  onTouched("探検家") {
    this.emitParticles(this.x, this.y, 8, "#00ccff", 100)
    this.disableBody()
    this.hide()
  }
}

class ドローン {
  onCreate() {
    this.hide()
    this.setPosition(200, -100)
    this.createClone("myself")
    this.setPosition(-200, 200)
    this.createClone("myself")
    this.setPosition(100, 300)
    this.createClone("myself")
  }

  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
  }

  onUpdate() {
    this.moveTo("探検家", 80)
    this.setAngle(this.angle + 3)
  }
}

class 穴 {
  onCreate() {
    this.hide()
    this.setPosition(0, -200)
    this.createClone("myself")
    this.setPosition(-300, 100)
    this.createClone("myself")
    this.setPosition(350, 150)
    this.createClone("myself")
  }

  onClone() {
    this.show()
    this.setPhysics("static")
    this.tweenAlpha(0.6, 1.5)
  }
}

class 出口 {
  onCreate() {
    this.setPhysics("static")
    this.setPosition(400, 320)
    this.tweenScale(1.3, 0.8)
  }
}

class HUD {
  onCreate() {
    this.hide()
    this.setBackground("#1a0a0a")
    this.addTextAt("oxygen-label", "O2", -900, 490, 36, "#00ccff")
    this.addTextAt("status", "", -200, 200, 48, "#ffffff")
  }

  onEvent("death") {
    this.updateTextAt("status", "💀 GAME OVER")
    this.cameraFade(2000)
  }

  onEvent("level-clear") {
    this.updateTextAt("status", "🎉 脱出成功!")
    this.emitParticles(0, 300, 40, "#44ff44", 300)
  }
}
`,
}
