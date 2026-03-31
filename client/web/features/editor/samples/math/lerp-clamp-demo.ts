// Math Example: lerp / clamp / remap
// ゲーム数学の基本関数デモ

import { sp, type SampleProject } from "../_helpers"

export const lerpClampDemo: SampleProject = {
  id: "math-lerp-clamp",
  name: "Lerp / Clamp / Remap",
  description: "補間・制限・再マッピング",
  category: "math",
  sprites: [
    sp("s-player", "プレイヤー", "🏃", { w: 50, h: 50, color: "#4488ff", radius: 25 }, { x: 0, y: 0 }),
    sp("s-target", "ターゲット", "🎯", { w: 40, h: 40, color: "#ff4444", radius: 20 }, { x: 400, y: 200 }),
    sp("s-hud", "HUD", "📊", { w: 4, h: 4, color: "#000000" }, { x: 0, y: 0 }, { visible: false }),
  ],
  pseudocode: `
class プレイヤー {
  var hp = 100
  var tx = propertyOf("ターゲット", "x")
  var ty = propertyOf("ターゲット", "y")
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.addTextAt("info", "lerp でターゲットに追従", -900, 490, 24, "#ffffff")
    this.addTextAt("hp", "HP: 100", -900, 450, 24, "#44ff44")
    this.hp = 100
  }

  onUpdate() {
    // lerp でターゲット位置にスムーズに追従
    this.tx = propertyOf("ターゲット", "x")
    this.ty = propertyOf("ターゲット", "y")
    this.setPosition(lerp(this.x, this.tx, 5), lerp(this.y, this.ty, 5))

    // HP を clamp で 0〜100 に制限
    this.hp = clamp(this.hp, 0, 100)

    // HP に応じて色を remap (100→緑, 0→赤)
    this.updateTextAt("hp", join("HP: ", round(this.hp)))
  }

  onKeyPress("down arrow") {
    this.hp += -10
    this.emitParticles(this.x, this.y, 5, "#ff3333", 80)
    this.cameraShake(100, 0.01)
  }

  onKeyPress("up arrow") {
    this.hp += 10
    this.emitParticles(this.x, this.y, 5, "#44ff44", 80)
  }
}

class ターゲット {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
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
}

class HUD {
}
`,
}
