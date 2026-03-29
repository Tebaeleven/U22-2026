// Physics Example: プッシュ不可
// pushable設定の違いによる衝突挙動の比較

import { sp, type SampleProject } from "../_helpers"

export const nonPushable: SampleProject = {
  id: "physics-non-pushable",
  name: "プッシュ不可",
  description: "pushable設定の違いによる衝突挙動の比較",
  category: "physics",
  sprites: [
    sp("s-pusher", "押す側", "🟥", { w: 60, h: 60, color: "#ee4444", radius: 8 }, { x: -400, y: 100 }),
    sp("s-pushable", "押される", "🟩", { w: 60, h: 60, color: "#44ee44", radius: 8 }, { x: 0, y: 100 }),
    sp("s-nopush", "押されない", "🟦", { w: 60, h: 60, color: "#4444ee", radius: 8 }, { x: 0, y: -100 }),
    sp("s-pusher2", "押す側2", "🟧", { w: 60, h: 60, color: "#ee8833", radius: 8 }, { x: -400, y: -100 }),
  ],
  pseudocode: `
class 押す側 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setVelocityX(200)
    this.setCollideWorldBounds(true)
    this.setBounce(0.5)
    this.addTextAt("t1", "← 押す側", -500, 160, 18, "#ee4444")
  }
}
class 押される {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPushable(true)
    this.setCollideWorldBounds(true)
    this.setBounce(0.5)
    this.addTextAt("t2", "pushable: true", -80, 160, 18, "#44ee44")
  }
}
class 押されない {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPushable(false)
    this.setCollideWorldBounds(true)
    this.setBounce(0.5)
    this.addTextAt("t3", "pushable: false", -80, -40, 18, "#4444ee")
  }
}
class 押す側2 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setVelocityX(200)
    this.setCollideWorldBounds(true)
    this.setBounce(0.5)
    this.addTextAt("t4", "← 押す側", -500, -40, 18, "#ee8833")
  }
}
`,
}
