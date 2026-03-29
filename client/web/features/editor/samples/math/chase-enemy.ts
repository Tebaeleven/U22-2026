// Math Example: 追尾する敵
// angleTo / distanceTo を使った追尾AI

import { sp, type SampleProject } from "../_helpers"

export const chaseEnemy: SampleProject = {
  id: "math-chase-enemy",
  name: "追尾する敵",
  description: "angleTo / distanceTo で追いかける",
  category: "math",
  sprites: [
    sp("s-player", "プレイヤー", "🏃", { w: 50, h: 50, color: "#4488ff", radius: 25 }, { x: 0, y: 0 }),
    sp("s-enemy", "追尾敵", "👾", { w: 50, h: 50, color: "#ee3333", radius: 25 }, { x: 500, y: 300 }),
    sp("s-hud", "HUD", "📊", { w: 4, h: 4, color: "#000000" }, { x: 0, y: 0 }, { visible: false }),
  ],
  pseudocode: `
class プレイヤー {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.addTextAt("dist", "DISTANCE: 0", -900, 490, 24, "#ffffff")
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
  }
}
class 追尾敵 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.speed = 120
  }
  onUpdate() {
    this.dist = this.distanceTo("プレイヤー")
    this.updateTextAt("dist", join("DISTANCE: ", round(this.dist)))

    this.ang = this.angleTo("プレイヤー")
    this.setVelocityX(cos(this.ang) * this.speed)
    this.setVelocityY(sin(this.ang) * this.speed)
    this.setAngle(this.ang)

    if (this.dist < 60) {
      this.emitParticles(this.x, this.y, 3, "#ff3333", 50)
    }
  }
}
class HUD {
}
`,
}
