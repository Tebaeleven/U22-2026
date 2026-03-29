// Sprite Example: タグ / グループ
// addTag / hasTag でスプライトを分類

import { sp, type SampleProject } from "../_helpers"

export const tagGroupDemo: SampleProject = {
  id: "control-tag-group",
  name: "タグ / グループ",
  description: "addTag / hasTag でグループ管理",
  category: "control",
  sprites: [
    sp("s-player", "プレイヤー", "🏃", { w: 50, h: 50, color: "#4488ff", radius: 25 }, { x: 0, y: 0 }),
    sp("s-enemy1", "敵1", "👾", { w: 40, h: 40, color: "#ff4444", radius: 20 }, { x: 300, y: 200 }),
    sp("s-enemy2", "敵2", "👾", { w: 40, h: 40, color: "#ff6644", radius: 20 }, { x: -300, y: -200 }),
    sp("s-enemy3", "敵3", "👾", { w: 40, h: 40, color: "#ff8844", radius: 20 }, { x: 400, y: -100 }),
    sp("s-hud", "HUD", "📊", { w: 4, h: 4, color: "#000000" }, { x: 0, y: 0 }, { visible: false }),
  ],
  pseudocode: `
class プレイヤー {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.addTag("player")
    this.addTextAt("info", "← → ↑ ↓: move / SPACE: flash enemies", -900, 490, 20, "#ffffff")
  }

  onUpdate() {
    this.setVelocity(0, 0)
    if (this.isKeyPressed("left arrow")) {
      this.setVelocityX(-400)
    } else if (this.isKeyPressed("right arrow")) {
      this.setVelocityX(400)
    }
    if (this.isKeyPressed("up arrow")) {
      this.setVelocityY(-400)
    } else if (this.isKeyPressed("down arrow")) {
      this.setVelocityY(400)
    }
  }

  onKeyPress("space") {
    // 全敵にエフェクトを送信
    this.emit("flash-enemies", "")
  }
}

class 敵1 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.addTag("enemy")
    this.speed = 80
  }

  onUpdate() {
    this.ang = this.angleTo("プレイヤー")
    this.setVelocityX(cos(this.ang) * this.speed)
    this.setVelocityY(sin(this.ang) * this.speed)
  }

  onEvent("flash-enemies") {
    if (this.hasTag("enemy")) {
      this.setTint("#ffffff")
      this.emitParticles(this.x, this.y, 8, "#ff4444", 120)
      wait(0.2)
      this.clearTint()
    }
  }
}

class 敵2 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.addTag("enemy")
    this.speed = 100
  }

  onUpdate() {
    this.ang = this.angleTo("プレイヤー")
    this.setVelocityX(cos(this.ang) * this.speed)
    this.setVelocityY(sin(this.ang) * this.speed)
  }

  onEvent("flash-enemies") {
    if (this.hasTag("enemy")) {
      this.setTint("#ffffff")
      this.emitParticles(this.x, this.y, 8, "#ff6644", 120)
      wait(0.2)
      this.clearTint()
    }
  }
}

class 敵3 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.addTag("enemy")
    this.speed = 60
  }

  onUpdate() {
    this.ang = this.angleTo("プレイヤー")
    this.setVelocityX(cos(this.ang) * this.speed)
    this.setVelocityY(sin(this.ang) * this.speed)
  }

  onEvent("flash-enemies") {
    if (this.hasTag("enemy")) {
      this.setTint("#ffffff")
      this.emitParticles(this.x, this.y, 8, "#ff8844", 120)
      wait(0.2)
      this.clearTint()
    }
  }
}

class HUD {
}
`,
}
