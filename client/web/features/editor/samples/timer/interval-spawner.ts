// Timer Example: インターバルスポナー
// setInterval でオブジェクトを定期生成

import { sp, type SampleProject } from "../_helpers"

export const intervalSpawner: SampleProject = {
  id: "timer-interval-spawner",
  name: "インターバルスポナー",
  description: "一定間隔でオブジェクトを生成",
  category: "timer",
  sprites: [
    sp("s-spawner", "スポナー", "📡", { w: 40, h: 40, color: "#ffcc00", radius: 20, border: "#cc9900" }, { x: 0, y: 400 }),
    sp("s-ball", "ボール", "⚪", { w: 30, h: 30, color: "#ff6633", radius: 15 }, { x: 0, y: 400 }, { visible: false }),
    sp("s-ground", "地面", "⬛", { w: 1920, h: 60, color: "#555555" }, { x: 0, y: -480 }),
  ],
  pseudocode: `
class スポナー {
  var count = 0
  onCreate() {
    this.count = 0
    this.setInterval("spawn", 500)
    this.addTextAt("count", "COUNT: 0", -900, 490, 28, "#ffffff")
  }
  onEvent("spawn") {
    this.count += 1
    this.updateTextAt("count", join("COUNT: ", this.count))
    this.createClone("ボール")
  }
}
class ボール {
  var spawnX = 0
  var spawnY = 400
  onCreate() {
    this.hide()
  }
  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setGravity(600)
    this.setPosition(randomInt(-800, 800), 400)
    this.setBounce(0.7)
    this.setCollideWorldBounds(true)
    this.setTint(join("#", join("ff", join(randomInt(0, 9), randomInt(0, 9)))))
    this.tweenAngle(360, 2)
    this.wait(8)
    this.tweenAlpha(0, 0.5)
    this.deleteClone()
  }
}
class 地面 {
  onCreate() {
    this.setPhysics("static")
  }
}
`,
}
