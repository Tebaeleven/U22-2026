// Animation Example: コスチュームアニメーション
// コスチューム0-3をループ再生してフレーム数を表示

import { sp, type SampleProject } from "../_helpers"

export const costumeAnim: SampleProject = {
  id: "animation-costume-anim",
  name: "コスチュームアニメーション",
  description: "コスチュームをループ再生",
  category: "animation",
  sprites: [
    sp("s-char", "キャラ", "🏃", { w: 64, h: 64, color: "#4488ff", radius: 8 }, { x: 0, y: 0 }),
  ],
  pseudocode: `
class キャラ {
  onCreate() {
    this.frame = 0
    this.createAnim("walk", 0, 3, 8, true)
    this.playAnim("walk")
    this.addTextAt("info", "Costume animation (loop)", -400, 490, 28, "#ffffff")
    this.addTextAt("frm", "Frame: 0", -400, 450, 22, "#aaaaaa")
  }
  onUpdate() {
    this.frame += 1
    this.updateTextAt("frm", join("Frame: ", this.frame))
  }
}
`,
}
