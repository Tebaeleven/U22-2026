// Game: Emoji Match（絵文字マッチ）
// 4x4グリッドから唯一のマッチングペアを見つける30秒タイムアタック
// Phaser公式 Emoji Match を参考に再現

import type { SampleProject } from "../_helpers"
import { sp, emojiCostumes } from "../_helpers"
import type { SpriteDef } from "../../constants"
import { DEFAULT_COLLIDER } from "../../constants"

// 15種の絵文字コスチューム
const TILE_EMOJIS = [
  "🍎", "🍊", "🍋", "🍇", "🍓",
  "🌸", "🔥", "⭐", "💎", "🎵",
  "🌈", "❤️", "🐱", "🐶", "🦋",
]
const tileCostumes = emojiCostumes(TILE_EMOJIS)

const tileSprite: SpriteDef = {
  id: "s-tile",
  name: "タイル",
  emoji: "🎨",
  costumes: tileCostumes,
  currentCostumeIndex: 0,
  collider: { ...DEFAULT_COLLIDER },
  x: 0,
  y: 0,
  size: 100,
  direction: 90,
  visible: false,
}

export const emojiMatchGame: SampleProject = {
  id: "emoji-match",
  name: "Emoji Match",
  description: "マッチするペアを見つけろ！",
  category: "games",
  sprites: [
    tileSprite,
    sp("s-hud", "HUD", "📊",
      { w: 4, h: 4, color: "#000000" },
      { x: 0, y: 0 },
      { visible: false }),
  ],
  pseudocode: `
class タイル {
  var score = 0
  var gameState = 1
  var clickLock = 0
  var selectCount = 0
  var sel1X = -9999
  var sel1Y = -9999
  var sel1C = -1
  var mp1X = -9999
  var mp1Y = -9999
  var mp2X = -9999
  var mp2Y = -9999
  var matchC = randomInt(0, 14)
  var matchPos1 = randomInt(0, 15)
  var matchPos2 = randomInt(0, 14)
  var pool = 0
  var cellIdx = 0
  var assignC = matchC
  var remaining = 30 - timer
  var secs = floor(remaining)
  var ms = floor(remaining - secs * 100)
  var secStr = join("0", secs)
  var msStr = join("0", ms)
  var didDeselect = 0
  onCreate() {
    this.hide()
    // ゲーム状態
    this.score = 0
    this.gameState = 1
    this.clickLock = 0
    this.selectCount = 0
    // 選択中タイルの座標とコスチューム
    this.sel1X = -9999
    this.sel1Y = -9999
    this.sel1C = -1
    // マッチペアの座標（ゲームオーバー時ハイライト用）
    this.mp1X = -9999
    this.mp1Y = -9999
    this.mp2X = -9999
    this.mp2Y = -9999

    // HUDテキスト
    this.addTextAt("timer", "30:00", -150, 480, 48, "#ffffff")
    this.addTextAt("score", "FOUND: 0", 500, 480, 36, "#ffffff")
    this.addTextAt("title", "EMOJI MATCH", -250, 420, 28, "#aaddff")
    this.resetTimer()

    // コスチューム割り当て＆グリッド生成
    this.matchC = this.randomInt(0, 14)
    this.matchPos1 = this.randomInt(0, 15)
    this.matchPos2 = this.randomInt(0, 14)
    if (this.matchPos2 >= this.matchPos1) {
      this.matchPos2 += 1
    }

    this.pool = 0
    this.cellIdx = 0
    for (row in 0 .. 3) {
      for (col in 0 .. 3) {
        // コスチューム決定
        if (this.cellIdx == this.matchPos1) {
          this.assignC = this.matchC
        } else if (this.cellIdx == this.matchPos2) {
          this.assignC = this.matchC
        } else {
          if (this.pool == this.matchC) {
            this.pool += 1
          }
          this.assignC = this.pool
          this.pool += 1
        }
        // 親の位置とコスチュームを先にセット（クローンに継承される）
        this.setPosition(-210 + col * 140, 150 - row * 140)
        this.setCostume(join("emoji", this.assignC))
        this.createClone("myself")
        this.cellIdx += 1
      }
    }

    // マッチペア座標を保存
    this.mp1X = -210 + (this.matchPos1 % 4) * 140
    this.mp1Y = 150 - floor(this.matchPos1 / 4) * 140
    this.mp2X = -210 + (this.matchPos2 % 4) * 140
    this.mp2Y = 150 - floor(this.matchPos2 / 4) * 140
  }

  onClone() {
    this.clearTint()
    this.show()
    // 位置・コスチュームは親から継承済み
    this.setSize(10)
    this.tweenScaleEase(1, 0.4, "bounce")
  }

  onUpdate() {
    // タイマー更新（親のみ＝非表示スプライト）
    if (this.gameState == 1) {
      this.remaining = 30 - this.timer
      if (this.remaining <= 0) {
        this.remaining = 0
        this.gameState = 0
        this.updateTextAt("timer", "00:00")
        this.emit("gameover", "")
      } else {
        this.secs = this.floor(this.remaining)
        this.ms = this.floor((this.remaining - this.secs) * 100)
        if (this.secs < 10) {
          this.secStr = this.join("0", this.secs)
        } else {
          this.secStr = this.toText(this.secs)
        }
        if (this.ms < 10) {
          this.msStr = this.join("0", this.ms)
        } else {
          this.msStr = this.toText(this.ms)
        }
        this.updateTextAt("timer", this.join(this.secStr, this.join(":", this.msStr)))
      }
    }

    // クリック検出（クローンのみ実行可能 — 非表示の親はtouchingがfalse）
    if (this.gameState == 1) {
      if (this.clickLock == 0) {
        if (this.touching("mouse-pointer")) {
          if (this.mouseDown) {
            this.clickLock = 1
            if (this.selectCount == 0) {
              // 1つ目選択
              this.sel1X = this.x
              this.sel1Y = this.y
              this.sel1C = this.costumeNumber
              this.setTint("#FF8C00")
              this.playSound("beep")
              this.selectCount = 1
            } else if (this.selectCount == 1) {
              // 同じタイルを再クリック → 選択解除
              this.didDeselect = 0
              if (this.x == this.sel1X) {
                if (this.y == this.sel1Y) {
                  this.emit("cleartints", "")
                  this.selectCount = 0
                  this.didDeselect = 1
                }
              }
              if (this.didDeselect == 0) {
                // 2つ目選択
                this.setTint("#FF8C00")
                if (this.costumeNumber == this.sel1C) {
                  // マッチ!
                  this.selectCount = 0
                  this.score += 1
                  this.updateTextAt("score", this.join("FOUND: ", this.score))
                  this.playSound("coin")
                  this.emit("matched", "")
                } else {
                  // 不一致
                  this.playSound("hit")
                  this.selectCount = 0
                  this.wait(0.4)
                  this.emit("cleartints", "")
                }
              }
            }
            this.wait(0.3)
            this.clickLock = 0
          }
        }
      }
    }
  }

  onEvent("cleartints") {
    this.clearTint()
  }

  onEvent("matched") {
    // マッチしたペアを緑にハイライト
    if (this.costumeNumber == this.sel1C) {
      this.setTint("#00FF88")
      this.tweenScale(1.3, 0.2)
    }
    this.wait(0.8)
    this.emit("regenerate", "")
  }

  onEvent("regenerate") {
    this.clearTint()
    // クローン: フェードアウトして削除
    this.tweenAlpha(0, 0.3)
    this.wait(0.4)
    this.deleteClone()

    // 親のみ到達: 新しいグリッド生成
    this.matchC = this.randomInt(0, 14)
    this.matchPos1 = this.randomInt(0, 15)
    this.matchPos2 = this.randomInt(0, 14)
    if (this.matchPos2 >= this.matchPos1) {
      this.matchPos2 += 1
    }

    this.pool = 0
    this.cellIdx = 0
    for (row in 0 .. 3) {
      for (col in 0 .. 3) {
        if (this.cellIdx == this.matchPos1) {
          this.assignC = this.matchC
        } else if (this.cellIdx == this.matchPos2) {
          this.assignC = this.matchC
        } else {
          if (this.pool == this.matchC) {
            this.pool += 1
          }
          this.assignC = this.pool
          this.pool += 1
        }
        this.setPosition(-210 + col * 140, 150 - row * 140)
        this.setCostume(join("emoji", this.assignC))
        this.createClone("myself")
        this.cellIdx += 1
      }
    }

    this.mp1X = -210 + (this.matchPos1 % 4) * 140
    this.mp1Y = 150 - floor(this.matchPos1 / 4) * 140
    this.mp2X = -210 + (this.matchPos2 % 4) * 140
    this.mp2Y = 150 - floor(this.matchPos2 / 4) * 140
  }

  onEvent("gameover") {
    // マッチペアを点滅ハイライト
    if (this.x == this.mp1X) {
      if (this.y == this.mp1Y) {
        this.setTint("#FF1493")
        this.tweenScale(1.4, 0.5)
      }
    }
    if (this.x == this.mp2X) {
      if (this.y == this.mp2Y) {
        this.setTint("#FF1493")
        this.tweenScale(1.4, 0.5)
      }
    }
    this.addTextAt("gameover", "GAME OVER", -250, 0, 64, "#ff4444")
    this.addTextAt("restart", "Click to Restart", -200, -80, 28, "#ffffff")
  }
}

class HUD {
}
`,
}
