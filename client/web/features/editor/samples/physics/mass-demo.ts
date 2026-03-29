// Physics Example: 質量デモ
// 異なる質量のボールが壁に衝突する

import { sp, type SampleProject } from "../_helpers"

export const massDemo: SampleProject = {
  id: "physics-mass-demo",
  name: "質量デモ",
  description: "異なる質量のボールが壁に衝突する",
  category: "physics",
  sprites: [
    sp("s-m1", "軽量ボール", "🟡", { w: 30, h: 30, color: "#eecc33", radius: 15 }, { x: -400, y: 300 }),
    sp("s-m2", "普通ボール", "🟠", { w: 45, h: 45, color: "#ee8833", radius: 22 }, { x: -400, y: 150 }),
    sp("s-m3", "やや重い", "🔴", { w: 55, h: 55, color: "#ee4444", radius: 27 }, { x: -400, y: 0 }),
    sp("s-m4", "重いボール", "🟣", { w: 65, h: 65, color: "#8844ee", radius: 32 }, { x: -400, y: -150 }),
    sp("s-m5", "超重いボール", "⚫", { w: 80, h: 80, color: "#333333", radius: 40 }, { x: -400, y: -300 }),
    sp("s-wall", "壁", "🧱", { w: 60, h: 800, color: "#886644" }, { x: 400, y: 0 }),
    sp("s-ground", "地面", "⬛", { w: 1920, h: 60, color: "#555555" }, { x: 0, y: -480 }),
  ],
  pseudocode: `
class 軽量ボール {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setMass(1)
    this.setBounce(1.0)
    this.setVelocityX(300)
    this.setCollideWorldBounds(true)
    this.addTextAt("t1", "質量: 1", -700, 340, 18, "#eecc33")
  }
}
class 普通ボール {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setMass(3)
    this.setBounce(1.0)
    this.setVelocityX(300)
    this.setCollideWorldBounds(true)
    this.addTextAt("t2", "質量: 3", -700, 190, 18, "#ee8833")
  }
}
class やや重い {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setMass(5)
    this.setBounce(1.0)
    this.setVelocityX(300)
    this.setCollideWorldBounds(true)
    this.addTextAt("t3", "質量: 5", -700, 40, 18, "#ee4444")
  }
}
class 重いボール {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setMass(10)
    this.setBounce(1.0)
    this.setVelocityX(300)
    this.setCollideWorldBounds(true)
    this.addTextAt("t4", "質量: 10", -700, -110, 18, "#8844ee")
  }
}
class 超重いボール {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setMass(20)
    this.setBounce(1.0)
    this.setVelocityX(300)
    this.setCollideWorldBounds(true)
    this.addTextAt("t5", "質量: 20", -700, -260, 18, "#333333")
  }
}
class 壁 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setImmovable(true)
    this.setCollideWorldBounds(true)
  }
}
class 地面 {
  onCreate() {
    this.setPhysics("static")
  }
}
`,
}
