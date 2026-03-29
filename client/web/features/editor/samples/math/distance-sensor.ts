// Math Example: 距離センサー
// 最も近い敵が赤、最も遠い敵が青に変わる

import { sp, type SampleProject } from "../_helpers"

export const distanceSensor: SampleProject = {
  id: "math-distance-sensor",
  name: "距離センサー",
  description: "最寄りの敵が赤、最遠の敵が青に変化",
  category: "math",
  sprites: [
    sp("s-player", "プレイヤー", "🏃", { w: 50, h: 50, color: "#ffffff", radius: 25, border: "#cccccc" }, { x: 0, y: 0 }),
    sp("s-e1", "敵A", "👾", { w: 50, h: 50, color: "#888888", radius: 8 }, { x: 400, y: 200 }),
    sp("s-e2", "敵B", "👾", { w: 50, h: 50, color: "#888888", radius: 8 }, { x: -300, y: -250 }),
    sp("s-e3", "敵C", "👾", { w: 50, h: 50, color: "#888888", radius: 8 }, { x: -500, y: 300 }),
    sp("s-e4", "敵D", "👾", { w: 50, h: 50, color: "#888888", radius: 8 }, { x: 600, y: -100 }),
    sp("s-hud", "HUD", "📊", { w: 4, h: 4, color: "#000000" }, { x: 0, y: 0 }, { visible: false }),
  ],
  pseudocode: `
class プレイヤー {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.addTextAt("info", "Move with arrows - nearest=red, farthest=blue", -600, 490, 24, "#ffffff")
    this.addTextAt("dist", "", -900, 440, 20, "#aaaaaa")
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
    this.dA = this.distanceTo("敵A")
    this.dB = this.distanceTo("敵B")
    this.dC = this.distanceTo("敵C")
    this.dD = this.distanceTo("敵D")
    this.nearest = min(min(this.dA, this.dB), min(this.dC, this.dD))
    this.farthest = max(max(this.dA, this.dB), max(this.dC, this.dD))
    this.updateTextAt("dist", join("Nearest: ", round(this.nearest)))
    this.emit("check-dist")
  }
}
class 敵A {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
  }
  onEvent("check-dist") {
    this.clearTint()
    if (this.dA == this.nearest) {
      this.setTint("#ff3333")
    }
    if (this.dA == this.farthest) {
      this.setTint("#3333ff")
    }
  }
}
class 敵B {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
  }
  onEvent("check-dist") {
    this.clearTint()
    if (this.dB == this.nearest) {
      this.setTint("#ff3333")
    }
    if (this.dB == this.farthest) {
      this.setTint("#3333ff")
    }
  }
}
class 敵C {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
  }
  onEvent("check-dist") {
    this.clearTint()
    if (this.dC == this.nearest) {
      this.setTint("#ff3333")
    }
    if (this.dC == this.farthest) {
      this.setTint("#3333ff")
    }
  }
}
class 敵D {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
  }
  onEvent("check-dist") {
    this.clearTint()
    if (this.dD == this.nearest) {
      this.setTint("#ff3333")
    }
    if (this.dD == this.farthest) {
      this.setTint("#3333ff")
    }
  }
}
class HUD {
}
`,
}
