// Sound Example: サウンドエフェクト
// 7色のブロックに触れるとそれぞれ異なるサウンドを再生

import { sp, type SampleProject } from "../_helpers"

export const soundEffects: SampleProject = {
  id: "sound-effects",
  name: "サウンドエフェクト",
  description: "ブロックに触れてサウンドを鳴らす",
  category: "sound",
  sprites: [
    sp("s-player", "プレイヤー", "🏃", { w: 40, h: 40, color: "#ffffff", radius: 20, border: "#cccccc" }, { x: -600, y: 0 }),
    sp("s-b1", "音1", "🔴", { w: 80, h: 80, color: "#ee3333", radius: 8 }, { x: -450, y: 0 }),
    sp("s-b2", "音2", "🟠", { w: 80, h: 80, color: "#ee7733", radius: 8 }, { x: -300, y: 0 }),
    sp("s-b3", "音3", "🟡", { w: 80, h: 80, color: "#ddcc00", radius: 8 }, { x: -150, y: 0 }),
    sp("s-b4", "音4", "🟢", { w: 80, h: 80, color: "#33cc33", radius: 8 }, { x: 0, y: 0 }),
    sp("s-b5", "音5", "🔵", { w: 80, h: 80, color: "#3366ee", radius: 8 }, { x: 150, y: 0 }),
    sp("s-b6", "音6", "🟣", { w: 80, h: 80, color: "#9933cc", radius: 8 }, { x: 300, y: 0 }),
    sp("s-b7", "音7", "⚪", { w: 80, h: 80, color: "#cccccc", radius: 8 }, { x: 450, y: 0 }),
    sp("s-hud", "HUD", "📊", { w: 4, h: 4, color: "#000000" }, { x: 0, y: 0 }, { visible: false }),
  ],
  pseudocode: `
class プレイヤー {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.addTextAt("info", "Arrow keys to move & touch blocks", -500, 490, 24, "#ffffff")
    this.addTextAt("sound", "", -200, -200, 32, "#ffffff")
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
  onTouched("音1") {
    this.playSound("jump")
    this.updateTextAt("sound", "jump")
    this.emitParticles(this.x, this.y, 8, "#ee3333", 100)
  }
  onTouched("音2") {
    this.playSound("coin")
    this.updateTextAt("sound", "coin")
    this.emitParticles(this.x, this.y, 8, "#ee7733", 100)
  }
  onTouched("音3") {
    this.playSound("explosion")
    this.updateTextAt("sound", "explosion")
    this.emitParticles(this.x, this.y, 8, "#ddcc00", 100)
  }
  onTouched("音4") {
    this.playSound("hit")
    this.updateTextAt("sound", "hit")
    this.emitParticles(this.x, this.y, 8, "#33cc33", 100)
  }
  onTouched("音5") {
    this.playSound("powerup")
    this.updateTextAt("sound", "powerup")
    this.emitParticles(this.x, this.y, 8, "#3366ee", 100)
  }
  onTouched("音6") {
    this.playSound("laser")
    this.updateTextAt("sound", "laser")
    this.emitParticles(this.x, this.y, 8, "#9933cc", 100)
  }
  onTouched("音7") {
    this.playSound("select")
    this.updateTextAt("sound", "select")
    this.emitParticles(this.x, this.y, 8, "#cccccc", 100)
  }
}
class 音1 {
  onCreate() {
    this.setPhysics("static")
    this.addTextAt("l", "jump", -480, 60, 16, "#ee3333")
  }
}
class 音2 {
  onCreate() {
    this.setPhysics("static")
    this.addTextAt("l", "coin", -330, 60, 16, "#ee7733")
  }
}
class 音3 {
  onCreate() {
    this.setPhysics("static")
    this.addTextAt("l", "explosion", -200, 60, 16, "#ddcc00")
  }
}
class 音4 {
  onCreate() {
    this.setPhysics("static")
    this.addTextAt("l", "hit", -20, 60, 16, "#33cc33")
  }
}
class 音5 {
  onCreate() {
    this.setPhysics("static")
    this.addTextAt("l", "powerup", 110, 60, 16, "#3366ee")
  }
}
class 音6 {
  onCreate() {
    this.setPhysics("static")
    this.addTextAt("l", "laser", 270, 60, 16, "#9933cc")
  }
}
class 音7 {
  onCreate() {
    this.setPhysics("static")
    this.addTextAt("l", "select", 420, 60, 16, "#cccccc")
  }
}
class HUD {
}
`,
}
