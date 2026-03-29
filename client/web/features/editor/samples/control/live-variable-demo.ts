import { sp, type SampleProject } from "../_helpers"

/**
 * Live Variables デモ
 *
 * 体験できる機能:
 * 1. var / let — 変数宣言と定数
 * 2. var live — 依存変数の自動再計算（HP%, 攻撃力）
 * 3. when — 変数が変わるたびに発火するリアクティブ構文
 * 4. upon — 条件成立時に一度だけ発火する構文
 * 5. batch — 複数変数の一括更新（中間通知なし）
 * 6. -= *= 等の複合代入演算子
 */
export const liveVariableDemo: SampleProject = {
  id: "live-variable-demo",
  name: "Live Variables",
  description: "var live / when / upon / batch — リアクティブ変数デモ",
  category: "control-advanced",
  sprites: [
    sp("s-player", "プレイヤー", "🧙",
      { w: 80, h: 100, color: "#4488ff", radius: 12, border: "#2255cc" },
      { x: 0, y: 100 },
    ),
    sp("s-enemy", "敵", "👾",
      { w: 60, h: 60, color: "#ff4444", radius: 8, border: "#cc2222" },
      { x: 300, y: 100 },
    ),
    sp("s-buff", "バフ", "⭐",
      { w: 50, h: 50, color: "#ffcc00", radius: 25, border: "#cc9900" },
      { x: -300, y: 100 },
    ),
    sp("s-hud", "HUD", "📊",
      { w: 10, h: 10, color: "#00000000" },
      { x: 0, y: 0 },
      { visible: false },
    ),
  ],
  pseudocode: `
// ═══════════════════════════════════════════
// Live Variables デモ
// ═══════════════════════════════════════════
//
// [←→] 移動  [D] ダメージ  [R] 回復
// [B] バフ(攻撃力UP)  [Space] 攻撃
//
// ★ var live で宣言した変数は、依存先が
//   変わると自動で再計算される。
//   subscribe / when 不要で UI も更新。
// ═══════════════════════════════════════════

class プレイヤー {
  // ── 通常変数 ──
  var hp = 100
  var maxHp = 100
  var baseAttack = 20
  var buffMultiplier = 1.0
  var score = 0
  var gameOver = 0

  // ── var live: 依存先が変わると自動再計算 ──
  // hp か maxHp が変わると → hpPercent が自動更新
  var live hpPercent = this.hp / this.maxHp
  // baseAttack か buffMultiplier が変わると → finalAttack が自動更新
  var live finalAttack = floor(this.baseAttack * this.buffMultiplier)

  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setCollideWorldBounds(true)
    this.addTextAt("hp", "HP: 100 / 100 (100%)", -900, 480, 28, "#ffffff")
    this.addTextAt("atk", "ATK: 20", -900, 440, 28, "#ffcc00")
    this.addTextAt("score", "SCORE: 0", -900, 400, 28, "#00ff88")
    this.addTextAt("info", "[D] ダメージ [R] 回復 [B] バフ [Space] 攻撃", -900, -480, 22, "#aaaaaa")
  }

  onUpdate() {
    if (this.gameOver == 1) {
      return
    }
    if (this.isKeyPressed("left arrow")) {
      this.setVelocityX(-250)
    } else if (this.isKeyPressed("right arrow")) {
      this.setVelocityX(250)
    } else {
      this.setVelocityX(0)
    }
    // hpPercent は var live なので常に最新値
    this.updateTextAt("hp", join("HP: ", join(this.hp, join(" / ", join(this.maxHp, join(" (", join(floor(this.hpPercent * 100), "%)") ))))))
    this.updateTextAt("atk", join("ATK: ", this.finalAttack))
    this.updateTextAt("score", join("SCORE: ", this.score))
  }

  // ── upon: HP<=0 で一度だけゲームオーバー ──
  upon (this.hp <= 0) {
    this.gameOver = 1
    this.hp = 0
    this.addTextAt("gameover", "GAME OVER", -200, 0, 64, "#ff0000")
    this.tweenAlpha(0.3, 1)
    this.cameraShake(500, 0.03)
  }

  // ── when: score が変わるたびにパーティクル発射 ──
  when (this.score) {
    this.emitParticles(this.x, this.y, 3, "#00ff88", 60)
  }

  // ── D: ダメージ（batch で一括更新） ──
  onKeyPress("d") {
    if (this.gameOver == 0) {
      batch {
        this.hp -= 25
        this.score += 1
      }
      this.cameraShake(100, 0.01)
    }
  }

  // ── R: 回復 ──
  onKeyPress("r") {
    if (this.gameOver == 0) {
      this.hp += 30
      if (this.hp > this.maxHp) {
        this.hp = this.maxHp
      }
    }
  }

  // ── B: バフ（buffMultiplier を変えるだけで finalAttack が自動更新） ──
  onKeyPress("b") {
    if (this.gameOver == 0) {
      this.buffMultiplier *= 1.5
      this.emitParticles(this.x, this.y, 10, "#ffcc00", 120)
    }
  }

  // ── Space: 攻撃（finalAttack は live なので常に最新） ──
  onKeyPress("space") {
    if (this.gameOver == 0) {
      if (this.touching("敵")) {
        this.emit("attack", this.finalAttack)
        this.score += 10
      }
    }
  }
}

class 敵 {
  var enemyHp = 200
  var maxEnemyHp = 200
  // ── var live: HP割合を自動計算 ──
  var live enemyHpPercent = this.enemyHp / this.maxEnemyHp

  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setImmovable(true)
    this.addTextAt("ehp", "ENEMY HP: 200", 200, 480, 28, "#ff6666")
  }

  onUpdate() {
    // enemyHpPercent は live なので enemyHp が変われば自動更新
    this.updateTextAt("ehp", join("ENEMY HP: ", this.enemyHp))
    this.setAlpha(0.3 + this.enemyHpPercent * 0.7)
  }

  // ── upon: 敵 HP<=0 で一度だけ撃破演出 ──
  upon (this.enemyHp <= 0) {
    this.enemyHp = 0
    this.emitParticles(this.x, this.y, 20, "#ff8800", 150)
    this.tweenScale(0, 0.5)
    this.hide()
    this.addTextAt("win", "ENEMY DEFEATED!", 100, 0, 48, "#ffcc00")
  }

  onEvent("attack") {
    this.enemyHp -= this.eventData
    this.tweenScale(1.3, 0.1)
    wait(0.1)
    this.tweenScale(1.0, 0.1)
  }
}

class バフ {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    spawn {
      while (true) {
        this.tweenScale(1.2, 0.8)
        this.tweenScale(0.9, 0.8)
      }
    }
  }
}

class HUD {
  onCreate() {
    this.addTextAt("title", "== Live Variables Demo ==", -250, 520, 32, "#ffffff")
  }
}
`,
}
