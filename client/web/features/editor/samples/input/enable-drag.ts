// Input Example: ドラッグ操作
// 複数スプライトをドラッグで移動

import { sp, type SampleProject } from "../_helpers"

export const enableDragDemo: SampleProject = {
  id: "input-enable-drag",
  name: "ドラッグ操作",
  description: "スプライトをドラッグして自由に配置",
  category: "input",
  sprites: [
    sp("s-red", "赤ブロック", "🟥", { w: 80, h: 80, color: "#ee3333", radius: 8 }, { x: -300, y: 100 }),
    sp("s-blue", "青ブロック", "🟦", { w: 80, h: 80, color: "#3366ee", radius: 8 }, { x: 0, y: 100 }),
    sp("s-green", "緑ブロック", "🟩", { w: 80, h: 80, color: "#33cc33", radius: 8 }, { x: 300, y: 100 }),
    sp("s-yellow", "黄ブロック", "🟨", { w: 80, h: 80, color: "#ffcc00", radius: 8 }, { x: -150, y: -100 }),
    sp("s-purple", "紫ブロック", "🟪", { w: 80, h: 80, color: "#9933ff", radius: 8 }, { x: 150, y: -100 }),
  ],
  pseudocode: `
class 赤ブロック {
  onCreate() {
    this.enableDrag()
    this.addTextAt("info", "Drag the blocks!", -400, 490, 28, "#ffffff")
  }
}
class 青ブロック {
  onCreate() {
    this.enableDrag()
  }
}
class 緑ブロック {
  onCreate() {
    this.enableDrag()
  }
}
class 黄ブロック {
  onCreate() {
    this.enableDrag()
  }
}
class 紫ブロック {
  onCreate() {
    this.enableDrag()
  }
}
`,
}
