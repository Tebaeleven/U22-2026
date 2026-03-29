// Control Example: forEach / break / continue
// リスト走査と制御構文のデモ

import { sp, type SampleProject } from "../_helpers"

export const forEachDemo: SampleProject = {
  id: "control-for-each",
  name: "For Each / Break / Continue",
  description: "リスト走査・ループ脱出・スキップ",
  category: "control",
  sprites: [
    sp("s-player", "プレイヤー", "🏃", { w: 50, h: 50, color: "#4488ff", radius: 25 }, { x: 0, y: 0 }),
    sp("s-hud", "HUD", "📊", { w: 4, h: 4, color: "#000000" }, { x: 0, y: 0 }, { visible: false }),
  ],
  pseudocode: `
class プレイヤー {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.addTextAt("info", "forEach demo", -900, 490, 24, "#ffffff")

    // リストにアイテムを追加
    this.items = 0
    this.inventory = ""
    this.score = 0
  }

  onKeyPress("space") {
    // for-each でリスト内の数値を合計
    this.score = 0
    for (i in 1 .. 5) {
      this.score += i
    }
    this.updateTextAt("info", join("Sum 1-5 = ", this.score))
  }

  onKeyPress("up arrow") {
    // break: 3で止まる
    this.score = 0
    for (i in 1 .. 10) {
      if (i > 3) {
        break
      }
      this.score += i
    }
    this.updateTextAt("info", join("Sum with break = ", this.score))
  }

  onKeyPress("down arrow") {
    // continue: 偶数だけスキップ
    this.score = 0
    for (i in 1 .. 10) {
      if (i % 2 == 0) {
        continue
      }
      this.score += i
    }
    this.updateTextAt("info", join("Odd sum = ", this.score))
  }

  onUpdate() {
    this.setVelocity(0, 0)
    if (this.isKeyPressed("left arrow")) {
      this.setVelocityX(-300)
    } else if (this.isKeyPressed("right arrow")) {
      this.setVelocityX(300)
    }
  }
}
class HUD {
}
`,
}
