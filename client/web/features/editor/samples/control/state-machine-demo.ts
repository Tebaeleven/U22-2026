// Control Example: 状態マシン
// setState / stateIs でキャラクターのアニメーション状態を管理

import { sp, type SampleProject } from "../_helpers"

export const stateMachineDemo: SampleProject = {
  id: "control-state-machine",
  name: "状態マシン",
  description: "setState / stateIs でキャラ制御",
  category: "control",
  sprites: [
    sp("s-player", "プレイヤー", "🏃", { w: 60, h: 80, color: "#4488ff", radius: 8 }, { x: 0, y: -200 }),
    sp("s-ground", "地面", "⬛", { w: 1920, h: 80, color: "#6B4F14" }, { x: 0, y: -440 }),
    sp("s-hud", "HUD", "📊", { w: 4, h: 4, color: "#000000" }, { x: 0, y: 0 }, { visible: false }),
  ],
  pseudocode: `
class プレイヤー {
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(800)
    this.setBounce(0)
    this.setCollideWorldBounds(true)
    this.setState("idle")
    this.addTextAt("state", "STATE: idle", -900, 490, 28, "#ffffff")
  }

  onUpdate() {
    // 状態ごとに色を変える
    if (this.stateIs("idle")) {
      this.setTint("#4488ff")
    } else if (this.stateIs("run")) {
      this.setTint("#44ff88")
    } else if (this.stateIs("jump")) {
      this.setTint("#ff8844")
    } else if (this.stateIs("hurt")) {
      this.setTint("#ff4444")
    }

    this.updateTextAt("state", join("STATE: ", this.state))

    // 移動
    if (this.isKeyPressed("left arrow")) {
      this.setVelocityX(-300)
      this.setFlipX(true)
      if (this.isOnGround()) {
        this.setState("run")
      }
    } else if (this.isKeyPressed("right arrow")) {
      this.setVelocityX(300)
      this.setFlipX(false)
      if (this.isOnGround()) {
        this.setState("run")
      }
    } else {
      this.setVelocityX(0)
      if (this.isOnGround() && !this.stateIs("hurt")) {
        this.setState("idle")
      }
    }

    // ジャンプ
    if (this.isKeyPressed("up arrow") && this.isOnGround()) {
      this.setVelocityY(-500)
      this.setState("jump")
      this.emitParticles(this.x, this.y - 30, 6, "#aaaaff", 80)
    }

    // 着地判定
    if (this.stateIs("jump") && this.isOnGround()) {
      this.setState("idle")
    }
  }

  onKeyPress("space") {
    // ダメージシミュレーション
    this.setState("hurt")
    this.cameraShake(200, 0.02)
    this.emitParticles(this.x, this.y, 10, "#ff3333", 100)
    wait(0.5)
    this.setState("idle")
  }
}
class 地面 {
  onCreate() {
    this.setPhysics("static")
  }
}
class HUD {
}
`,
}
