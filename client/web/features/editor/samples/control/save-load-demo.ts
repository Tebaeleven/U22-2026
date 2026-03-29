// Scene Example: セーブ / ロード
// localStorage でハイスコアを永続化

import { sp, type SampleProject } from "../_helpers"

export const saveLoadDemo: SampleProject = {
  id: "control-save-load",
  name: "セーブ / ロード",
  description: "ハイスコアの永続化",
  category: "control",
  sprites: [
    sp("s-player", "プレイヤー", "🏃", { w: 50, h: 50, color: "#4488ff", radius: 25 }, { x: 0, y: -200 }),
    sp("s-coin", "コイン", "⭐", { w: 40, h: 40, color: "#ffdd00", radius: 20 }, { x: 9999, y: 9999 }, { visible: false }),
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
    this.score = 0
    this.highscore = toNumber(load("highscore"))
    this.addTextAt("sc", join("SCORE: ", this.score), -900, 490, 28, "#ffffff")
    this.addTextAt("hi", join("HIGH: ", this.highscore), -900, 450, 24, "#ffdd00")

    // コインを配置
    for (i in 1 .. 8) {
      this.setPosition(randomInt(-700, 700), 300)
      this.createClone("コイン")
    }
    this.setPosition(0, -200)
  }

  onUpdate() {
    if (this.isKeyPressed("left arrow")) {
      this.setVelocityX(-300)
    } else if (this.isKeyPressed("right arrow")) {
      this.setVelocityX(300)
    } else {
      this.setVelocityX(0)
    }
    if (this.isKeyPressed("up arrow") && this.isOnGround()) {
      this.setVelocityY(-500)
    }
  }

  onTouched("コイン") {
    this.score += 10
    this.updateTextAt("sc", join("SCORE: ", this.score))
    this.floatingText("+10")
    this.emitParticles(this.x, this.y, 6, "#ffdd00", 100)

    // ハイスコア更新
    if (this.score > this.highscore) {
      this.highscore = this.score
      this.updateTextAt("hi", join("HIGH: ", this.highscore))
      save("highscore", toText(this.highscore))
    }
  }
}

class コイン {
  onCreate() {
    this.hide()
  }
  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setBounce(0.5)
    this.setCollideWorldBounds(true)
    this.tweenAngle(360, 2)
  }
  onTouched("プレイヤー") {
    this.deleteClone()
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
