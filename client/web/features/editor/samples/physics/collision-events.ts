// Physics Example: コリジョンイベント
// プレイヤーがコインに触れるとスコアが増加

import { sp, type SampleProject } from "../_helpers"

export const collisionEvents: SampleProject = {
  id: "physics-collision-events",
  name: "コリジョンイベント",
  description: "プレイヤーがコインに触れるとスコアが増加",
  category: "physics",
  sprites: [
    sp("s-player", "プレイヤー", "🏃", { w: 50, h: 50, color: "#4488ff", radius: 25, border: "#2255cc" }, { x: -400, y: 0 }),
    sp("s-coin1", "コイン1", "🪙", { w: 36, h: 36, color: "#ffcc00", radius: 18 }, { x: -100, y: 100 }),
    sp("s-coin2", "コイン2", "🪙", { w: 36, h: 36, color: "#ffcc00", radius: 18 }, { x: 200, y: -50 }),
    sp("s-coin3", "コイン3", "🪙", { w: 36, h: 36, color: "#ffcc00", radius: 18 }, { x: 500, y: 200 }),
    sp("s-coin4", "コイン4", "🪙", { w: 36, h: 36, color: "#ffcc00", radius: 18 }, { x: -200, y: -200 }),
    sp("s-coin5", "コイン5", "🪙", { w: 36, h: 36, color: "#ffcc00", radius: 18 }, { x: 400, y: -300 }),
  ],
  pseudocode: `
class プレイヤー {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.addTextAt("score", "スコア: 0", -900, 470, 28, "#ffcc00")
    this.addTextAt("info", "矢印キーで移動してコインを集めよう!", -300, -470, 22, "#ffffff")
  }
  onUpdate() {
    if (this.isKeyPressed("left arrow")) {
      this.setVelocityX(-350)
    } else if (this.isKeyPressed("right arrow")) {
      this.setVelocityX(350)
    } else {
      this.setVelocityX(0)
    }
    if (this.isKeyPressed("up arrow")) {
      this.setVelocityY(-350)
    } else if (this.isKeyPressed("down arrow")) {
      this.setVelocityY(350)
    } else {
      this.setVelocityY(0)
    }
  }
}
class コイン1 {
  onCreate() {
    this.setPhysics("static")
  }
  onUpdate() {
    this.setAngle(this.angle + 3)
  }
}
class コイン2 {
  onCreate() {
    this.setPhysics("static")
  }
  onUpdate() {
    this.setAngle(this.angle + 3)
  }
}
class コイン3 {
  onCreate() {
    this.setPhysics("static")
  }
  onUpdate() {
    this.setAngle(this.angle + 3)
  }
}
class コイン4 {
  onCreate() {
    this.setPhysics("static")
  }
  onUpdate() {
    this.setAngle(this.angle + 3)
  }
}
class コイン5 {
  onCreate() {
    this.setPhysics("static")
  }
  onUpdate() {
    this.setAngle(this.angle + 3)
  }
}
`,
}
