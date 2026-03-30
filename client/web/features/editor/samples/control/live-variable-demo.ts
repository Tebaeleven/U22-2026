import { sp, type SampleProject } from "../_helpers"

export const liveVariableDemo: SampleProject = {
  id: "live-variable-demo",
  name: "Live Variables",
  description: "var live / when / upon / batch — リアクティブ変数デモ",
  category: "control-advanced",
  sprites: [
    sp("s-panel", "パネル", "📋",
      { w: 10, h: 10, color: "#00000000" },
      { x: 0, y: 0 },
      { visible: false },
    ),
  ],
  pseudocode: `
// ══════════════════════════════════════
// Live Variables テスト
// ══════════════════════════════════════
// キーを押して各機能を確認:
//   [A] hp += 10
//   [S] hp -= 10
//   [D] baseAtk += 5
//   [F] buffMul x2 (var live finalAtk が自動更新)
//   [G] batch で hp と score を同時変更
//   [H] score += 1 (when が発火)
// ══════════════════════════════════════

class パネル {
  var hp = 50
  var maxHp = 100
  var baseAtk = 10
  var buffMul = 1.0
  var score = 0
  var whenCount = 0
  var uponFired = 0

  // ── var live: 依存先が変わると自動再計算 ──
  var live hpPct = this.hp * 100 / this.maxHp
  var live finalAtk = this.baseAtk * this.buffMul

  onCreate() {
    this.addTextAt("t0", "=== Live Variables Test ===", -400, 400, 32, "#ffffff")
    this.addTextAt("t1", "hp: 50", -400, 340, 28, "#66ccff")
    this.addTextAt("t2", "hpPct (live): 50", -400, 300, 28, "#66ccff")
    this.addTextAt("t3", "baseAtk: 10", -400, 240, 28, "#ffcc66")
    this.addTextAt("t4", "buffMul: 1", -400, 200, 28, "#ffcc66")
    this.addTextAt("t5", "finalAtk (live): 10", -400, 160, 28, "#ffcc66")
    this.addTextAt("t6", "score: 0", -400, 100, 28, "#66ff88")
    this.addTextAt("t7", "when fired: 0 times", -400, 60, 28, "#66ff88")
    this.addTextAt("t8", "upon (hp<=0): not yet", -400, 0, 28, "#ff6666")
    this.addTextAt("keys", "[A]+hp [S]-hp [D]+atk [F]x2buff [G]batch [H]+score", -400, -80, 22, "#aaaaaa")
  }

  onUpdate() {
    this.updateTextAt("t1", join("hp: ", this.hp))
    this.updateTextAt("t2", join("hpPct (live): ", this.hpPct))
    this.updateTextAt("t3", join("baseAtk: ", this.baseAtk))
    this.updateTextAt("t4", join("buffMul: ", this.buffMul))
    this.updateTextAt("t5", join("finalAtk (live): ", this.finalAtk))
    this.updateTextAt("t6", join("score: ", this.score))
    this.updateTextAt("t7", join("when fired: ", join(this.whenCount, " times")))
  }

  // ── when: score が変わるたびにカウントアップ ──
  when (this.score) {
    this.whenCount += 1
  }

  // ── upon: hp <= 0 で一度だけ発火 ──
  upon (this.hp <= 0) {
    this.uponFired = 1
    this.updateTextAt("t8", "upon (hp<=0): FIRED!")
  }

  // ── A: hp += 10 ──
  onKeyPress("a") {
    this.hp += 10
  }

  // ── S: hp -= 10 ──
  onKeyPress("s") {
    this.hp -= 10
  }

  // ── D: baseAtk += 5 → finalAtk が live で自動更新 ──
  onKeyPress("d") {
    this.baseAtk += 5
  }

  // ── F: buffMul x2 → finalAtk が live で自動更新 ──
  onKeyPress("f") {
    this.buffMul *= 2
  }

  // ── G: batch で hp と score を同時変更（通知1回） ──
  onKeyPress("g") {
    batch {
      this.hp -= 5
      this.score += 10
    }
  }

  // ── H: score += 1 → when が発火 ──
  onKeyPress("h") {
    this.score += 1
  }
}
`,
}
