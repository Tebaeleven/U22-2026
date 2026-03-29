// Control Example: 並行実行 (spawn)
// spawn でスクリプトを並行に走らせるデモ

import { sp, type SampleProject } from "../_helpers"

export const spawnDemo: SampleProject = {
  id: "control-spawn",
  name: "並行実行 (Spawn)",
  description: "spawn で複数処理を同時実行",
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
    this.addTextAt("info", "Press SPACE to spawn parallel tasks", -900, 490, 24, "#ffffff")
  }

  onKeyPress("space") {
    // 2つの並行タスクを起動
    spawn {
      // タスク1: 回転
      repeat (8) {
        this.tweenAngle(360, 0.5)
      }
    }
    spawn {
      // タスク2: パーティクルを繰り返し発射
      repeat (16) {
        this.emitParticles(this.x, this.y, 5, "#ff6600", 100)
        wait(0.25)
      }
    }
    // メインスレッド: 移動
    this.tweenTo(400, 0, 2)
    this.tweenTo(-400, 0, 2)
    this.tweenTo(0, 0, 1)
  }
}
class HUD {
}
`,
}
