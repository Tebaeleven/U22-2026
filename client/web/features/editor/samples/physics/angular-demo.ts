// Physics Example: 角速度デモ
// 異なる角速度で回転するオブジェクト

import { sp, type SampleProject } from "../_helpers"

export const angularDemo: SampleProject = {
  id: "physics-angular-demo",
  name: "角速度デモ",
  description: "異なる角速度で回転するオブジェクト",
  category: "physics",
  sprites: [
    sp("s-slow", "ゆっくり", "🟩", { w: 80, h: 40, color: "#44cc44", radius: 6 }, { x: -400, y: 200 }),
    sp("s-medium", "普通", "🟨", { w: 80, h: 40, color: "#eecc33", radius: 6 }, { x: -100, y: 200 }),
    sp("s-fast", "高速", "🟧", { w: 80, h: 40, color: "#ee8833", radius: 6 }, { x: 200, y: 200 }),
    sp("s-vfast", "超高速", "🟥", { w: 80, h: 40, color: "#ee3333", radius: 6 }, { x: 500, y: 200 }),
  ],
  pseudocode: `
class ゆっくり {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setAngularVelocity(30)
    this.addTextAt("t1", "30 deg/s", -440, 300, 18, "#44cc44")
  }
}
class 普通 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setAngularVelocity(90)
    this.addTextAt("t2", "90 deg/s", -140, 300, 18, "#eecc33")
  }
}
class 高速 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setAngularVelocity(180)
    this.addTextAt("t3", "180 deg/s", 160, 300, 18, "#ee8833")
  }
}
class 超高速 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setAngularVelocity(360)
    this.addTextAt("t4", "360 deg/s", 460, 300, 18, "#ee3333")
  }
}
`,
}
