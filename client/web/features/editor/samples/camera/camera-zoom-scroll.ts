// Camera Example: ズーム＆スクロール
// マウスホイールでズーム、矢印キーでプレイヤー移動、カメラ追従

import { sp, type SampleProject } from "../_helpers"

export const cameraZoomScroll: SampleProject = {
  id: "camera-zoom-scroll",
  name: "ズーム＆スクロール",
  description: "ホイールでズーム、矢印キーで移動",
  category: "camera",
  sprites: [
    sp("s-player", "プレイヤー", "🏃", { w: 50, h: 50, color: "#4488ff", radius: 25, border: "#2255cc" }, { x: 0, y: 0 }),
    sp("s-star1", "星1", "⭐", { w: 30, h: 30, color: "#ffcc00", radius: 15 }, { x: -600, y: 300 }),
    sp("s-star2", "星2", "⭐", { w: 30, h: 30, color: "#ffcc00", radius: 15 }, { x: 400, y: -200 }),
    sp("s-star3", "星3", "⭐", { w: 30, h: 30, color: "#ffcc00", radius: 15 }, { x: -300, y: -400 }),
    sp("s-star4", "星4", "⭐", { w: 30, h: 30, color: "#ffcc00", radius: 15 }, { x: 700, y: 100 }),
    sp("s-star5", "星5", "⭐", { w: 30, h: 30, color: "#ffcc00", radius: 15 }, { x: -500, y: -100 }),
    sp("s-tree1", "木1", "🌲", { w: 60, h: 80, color: "#228833", radius: 8 }, { x: -200, y: 200 }),
    sp("s-tree2", "木2", "🌲", { w: 60, h: 80, color: "#228833", radius: 8 }, { x: 500, y: -300 }),
    sp("s-hud", "HUD", "📊", { w: 4, h: 4, color: "#000000" }, { x: 0, y: 0 }, { visible: false }),
  ],
  pseudocode: `
class プレイヤー {
  var zoomLevel = 1
  var wheel = mouseWheel
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.cameraFollow()
    this.addTextAt("info", "Arrows: Move / Wheel: Zoom", -400, 490, 24, "#ffffff")
    this.zoomLevel = 1
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
    this.wheel = this.mouseWheel
    if (this.wheel > 0) {
      this.zoomLevel += -0.1
      if (this.zoomLevel < 0.3) {
        this.zoomLevel = 0.3
      }
      this.cameraZoom(this.zoomLevel)
    }
    if (this.wheel < 0) {
      this.zoomLevel += 0.1
      if (this.zoomLevel > 3) {
        this.zoomLevel = 3
      }
      this.cameraZoom(this.zoomLevel)
    }
  }
}
class 星1 {
  onUpdate() {
    this.setAngle(this.angle + 2)
  }
}
class 星2 {
  onUpdate() {
    this.setAngle(this.angle + 2)
  }
}
class 星3 {
  onUpdate() {
    this.setAngle(this.angle + 2)
  }
}
class 星4 {
  onUpdate() {
    this.setAngle(this.angle + 2)
  }
}
class 星5 {
  onUpdate() {
    this.setAngle(this.angle + 2)
  }
}
class 木1 {
}
class 木2 {
}
class HUD {
}
`,
}
