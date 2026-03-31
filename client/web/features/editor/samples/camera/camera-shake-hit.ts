// Camera Example: ヒット＆シェイク
// プレイヤーが敵にぶつかるとカメラシェイク、スコア加算

import { sp, type SampleProject } from "../_helpers"

export const cameraShakeHit: SampleProject = {
  id: "camera-shake-hit",
  name: "ヒット＆シェイク",
  description: "敵を倒すとカメラが揺れる",
  category: "camera",
  sprites: [
    sp("s-player", "プレイヤー", "🗡️", { w: 50, h: 50, color: "#4488ff", radius: 25, border: "#2255cc" }, { x: -400, y: 0 }),
    sp("s-enemy1", "敵1", "👾", { w: 50, h: 50, color: "#ee3333", radius: 8 }, { x: 200, y: 200 }),
    sp("s-enemy2", "敵2", "👾", { w: 50, h: 50, color: "#ee6633", radius: 8 }, { x: 400, y: -100 }),
    sp("s-enemy3", "敵3", "👾", { w: 50, h: 50, color: "#ee3366", radius: 8 }, { x: -100, y: -300 }),
    sp("s-hud", "HUD", "📊", { w: 4, h: 4, color: "#000000" }, { x: 0, y: 0 }, { visible: false }),
  ],
  pseudocode: `
class プレイヤー {
  var score = 0
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.score = 0
    this.addTextAt("score", "SCORE: 0", -900, 490, 36, "#ffffff")
    this.addTextAt("info", "Arrow keys to move", -900, 440, 24, "#aaaaaa")
  }
  onUpdate() {
    this.setVelocity(0, 0)
    if (this.isKeyPressed("left arrow")) {
      this.setVelocityX(-300)
    } else if (this.isKeyPressed("right arrow")) {
      this.setVelocityX(300)
    }
    if (this.isKeyPressed("up arrow")) {
      this.setVelocityY(-300)
    } else if (this.isKeyPressed("down arrow")) {
      this.setVelocityY(300)
    }
  }
  onTouched("敵1") {
    this.score += 100
    this.updateTextAt("score", join("SCORE: ", this.score))
    this.cameraShake(200, 0.02)
    this.emitParticles(this.x, this.y, 15, "#ee3333", 200)
    this.floatingText("+100")
    this.emit("hit-enemy1")
  }
  onTouched("敵2") {
    this.score += 100
    this.updateTextAt("score", join("SCORE: ", this.score))
    this.cameraShake(200, 0.02)
    this.emitParticles(this.x, this.y, 15, "#ee6633", 200)
    this.floatingText("+100")
    this.emit("hit-enemy2")
  }
  onTouched("敵3") {
    this.score += 100
    this.updateTextAt("score", join("SCORE: ", this.score))
    this.cameraShake(200, 0.02)
    this.emitParticles(this.x, this.y, 15, "#ee3366", 200)
    this.floatingText("+100")
    this.emit("hit-enemy3")
  }
}
class 敵1 {
  var alive = 1
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.alive = 1
  }
  onUpdate() {
    if (this.alive == 1) {
      this.setAngle(this.angle + 2)
    }
  }
  onEvent("hit-enemy1") {
    if (this.alive == 1) {
      this.alive = 0
      this.tweenScale(0, 0.2)
      this.disableBody()
    }
  }
}
class 敵2 {
  var alive = 1
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.alive = 1
  }
  onUpdate() {
    if (this.alive == 1) {
      this.setAngle(this.angle + 3)
    }
  }
  onEvent("hit-enemy2") {
    if (this.alive == 1) {
      this.alive = 0
      this.tweenScale(0, 0.2)
      this.disableBody()
    }
  }
}
class 敵3 {
  var alive = 1
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.alive = 1
  }
  onUpdate() {
    if (this.alive == 1) {
      this.setAngle(this.angle + 1)
    }
  }
  onEvent("hit-enemy3") {
    if (this.alive == 1) {
      this.alive = 0
      this.tweenScale(0, 0.2)
      this.disableBody()
    }
  }
}
class HUD {
}
`,
}
