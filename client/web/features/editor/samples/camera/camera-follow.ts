// Camera Example: カメラ追従
// プレイヤーにカメラが追従する

import { sp, type SampleProject } from "../_helpers"

export const cameraFollow: SampleProject = {
  id: "camera-follow",
  name: "カメラ追従",
  description: "プレイヤーを追従するカメラ",
  category: "camera",
  sprites: [
    sp("s-player", "プレイヤー", "🏃", { w: 60, h: 60, color: "#4488ff", radius: 30 }, { x: 0, y: 0 }),
    sp("s-mark1", "目印1", "🔴", { w: 40, h: 40, color: "#ee3333", radius: 20 }, { x: 600, y: 300 }),
    sp("s-mark2", "目印2", "🔵", { w: 40, h: 40, color: "#3366ee", radius: 20 }, { x: -600, y: -300 }),
    sp("s-mark3", "目印3", "🟢", { w: 40, h: 40, color: "#33cc33", radius: 20 }, { x: 600, y: -300 }),
  ],
  pseudocode: `
class プレイヤー {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.cameraFollow()
    this.cameraZoom(2)
    this.addTextAt("info", "WASD or Arrow keys", -200, 200, 20, "#ffffff")
  }
  onUpdate() {
    this.setVelocity(0, 0)
    if (this.isKeyPressed("left arrow")) {
      this.setVelocityX(-250)
    } else if (this.isKeyPressed("right arrow")) {
      this.setVelocityX(250)
    }
    if (this.isKeyPressed("up arrow")) {
      this.setVelocityY(-250)
    } else if (this.isKeyPressed("down arrow")) {
      this.setVelocityY(250)
    }
  }
}
class 目印1 {
  onCreate() {
    this.setPhysics("static")
  }
  onUpdate() {
    this.setAngle(this.angle + 1)
  }
}
class 目印2 {
  onCreate() {
    this.setPhysics("static")
  }
  onUpdate() {
    this.setAngle(this.angle - 1)
  }
}
class 目印3 {
  onCreate() {
    this.setPhysics("static")
  }
  onUpdate() {
    this.setAngle(this.angle + 2)
  }
}
`,
}
