// サンプルプロジェクト定義

import type { SpriteDef } from "./constants"
import { DEFAULT_COLLIDER, DEFAULT_SPRITES, createRectCostume } from "./constants"
import type { BlockProjectData } from "./block-editor/types"
import { codeToBlockData } from "./codegen"

// ── 型定義 ──

export type SampleProject = {
  id: string
  name: string
  description: string
  sprites: SpriteDef[]
  pseudocode: string
}

// ── サンプル解決 ──

function buildBlockDataMap(
  sprites: SpriteDef[],
  pseudocode: string,
): Record<string, BlockProjectData> {
  const generated = codeToBlockData(pseudocode)
  const map: Record<string, BlockProjectData> = {}
  for (const sprite of sprites) {
    map[sprite.id] = generated[sprite.name] ?? {
      customProcedures: [],
      workspace: { blocks: [] },
    }
  }
  return map
}

/** サンプルプロジェクトを読み込み可能な形式に変換 */
export function resolveSample(sample: SampleProject): {
  sprites: SpriteDef[]
  blockDataMap: Record<string, BlockProjectData>
} {
  return {
    sprites: sample.sprites,
    blockDataMap: buildBlockDataMap(sample.sprites, sample.pseudocode),
  }
}

// ═══════════════════════════════════════════
//  サンプル 1: はじめてのゲーム（入門）
// ═══════════════════════════════════════════

function sp(
  id: string, name: string, emoji: string,
  costume: { w: number; h: number; color: string; radius?: number; border?: string },
  pos: { x: number; y: number },
  extra?: Partial<SpriteDef>,
): SpriteDef {
  return {
    id, name, emoji,
    costumes: [createRectCostume(name, costume.w, costume.h, costume.color, {
      borderRadius: costume.radius ?? 0,
      borderColor: costume.border,
      borderWidth: costume.border ? 2 : undefined,
    })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: pos.x, y: pos.y,
    size: 100, direction: 90, visible: true,
    ...extra,
  }
}

const BEGINNER_SPRITES: SpriteDef[] = [
  sp("s-player", "プレイヤー", "🏃",
    { w: 80, h: 120, color: "#4488ff", radius: 12, border: "#2255cc" },
    { x: 0, y: -240 }),
  sp("s-ground", "地面", "🟫",
    { w: 1920, h: 160, color: "#6B4F14" },
    { x: 0, y: -380 }),
  sp("s-coin", "コイン", "⭐",
    { w: 64, h: 64, color: "#ffcc00", radius: 32, border: "#cc9900" },
    { x: 400, y: -200 }),
]

const BEGINNER_PSEUDOCODE = `
sprite "プレイヤー" {
  on flagClicked {
    setPhysics("dynamic")
    setGravity(800)
    goto(0, -240)
    setBounce(0.1)
    setCollideWorldBounds("on")
    score = 0
    addText("SCORE: 0", -900, 490)
  }

  on flagClicked {
    while (true) {
      if (isKeyPressed("left arrow")) {
        setVelocityX(-250)
      } else {
        if (isKeyPressed("right arrow")) {
          setVelocityX(250)
        } else {
          setVelocityX(0)
        }
      }
      if (isKeyPressed("up arrow") && isOnGround()) {
        setVelocityY(-500)
      }
    }
  }

  on flagClicked {
    while (true) {
      if (touching("コイン")) {
        score += 1
        setText(join("SCORE: ", score))
        floatingText("+1")
        emit("coin-get", "")
        wait(0.5)
      }
    }
  }
}

sprite "地面" {
  on flagClicked {
    setPhysics("static")
    goto(0, -380)
  }
}

sprite "コイン" {
  on flagClicked {
    setPhysics("dynamic")
    setAllowGravity("off")
    goto(400, -200)
  }
  on event("coin-get") {
    disableBody()
    hide()
  }
}
`

// ═══════════════════════════════════════════
//  サンプル 2: シューティング（中級）
// ═══════════════════════════════════════════

const SHOOTING_SPRITES: SpriteDef[] = [
  sp("s-player", "プレイヤー", "🏃",
    { w: 80, h: 120, color: "#3377ff", radius: 12, border: "#1a4fcc" },
    { x: -600, y: -240 }),
  sp("s-ground", "地面", "🟫",
    { w: 1920, h: 160, color: "#5a4012", border: "#3d2b0a" },
    { x: 0, y: -380 }),
  sp("s-bullet", "弾", "•",
    { w: 36, h: 12, color: "#ff8800", radius: 6 },
    { x: 9999, y: 9999 },
    { visible: false }),
  sp("s-enemy1", "敵", "👾",
    { w: 100, h: 100, color: "#ee3333", radius: 10, border: "#aa0000" },
    { x: 200, y: -250 }),
  sp("s-enemy2", "敵2", "👾",
    { w: 80, h: 80, color: "#dd6600", radius: 8, border: "#993300" },
    { x: 600, y: -260 }),
  sp("s-platform", "浮島", "📦",
    { w: 360, h: 40, color: "#448833", radius: 6, border: "#2d5c22" },
    { x: 400, y: -100 }),
  sp("s-hud", "HUD", "📊",
    { w: 4, h: 4, color: "#000000" },
    { x: 0, y: 0 },
    { visible: false }),
]

const SHOOTING_PSEUDOCODE = `
sprite "プレイヤー" {
  on flagClicked {
    setPhysics("dynamic")
    setGravity(1000)
    goto(-600, -240)
    setBounce(0)
    setCollideWorldBounds("on")
    score = 0
    hp = 100
    addText("SCORE: 0", -900, 490)
  }

  // 左右移動 + ジャンプ
  on flagClicked {
    while (true) {
      if (isKeyPressed("left arrow")) {
        setVelocityX(-300)
        setFlipX("on")
      } else {
        if (isKeyPressed("right arrow")) {
          setVelocityX(300)
          setFlipX("off")
        } else {
          setVelocityX(0)
        }
      }
      if (isKeyPressed("up arrow") && isOnGround()) {
        setVelocityY(-550)
      }
    }
  }

  // 弾発射
  on keyPress("space") {
    createClone("弾")
  }

  // 敵との接触 → ダメージ
  on flagClicked {
    while (true) {
      if (touching("敵") || touching("敵2")) {
        hp += -20
        setTint("#ff0000")
        setAlpha(50)
        setVelocityY(-400)
        wait(0.2)
        clearTint()
        wait(0.6)
        setAlpha(100)
      }
    }
  }

  // HPバー描画
  on flagClicked {
    while (true) {
      graphics.clear()
      graphics.fillRect(-900, 440, 300, 24, "#333333")
      graphics.fillRect(-900, 440, hp * 3, 24, "#44dd44")
      if (hp < 1) {
        say("GAME OVER", 99)
        setVelocityX(0)
      }
    }
  }
}

sprite "地面" {
  on flagClicked {
    setPhysics("static")
    goto(0, -380)
  }
}

sprite "浮島" {
  on flagClicked {
    setPhysics("static")
    goto(400, -100)
  }
}

sprite "弾" {
  on flagClicked {
    hide()
  }
  on clone {
    show()
    setPhysics("dynamic")
    setAllowGravity("off")
    setVelocityX(600)
    wait(1.5)
    deleteClone()
  }
}

sprite "敵" {
  on flagClicked {
    setPhysics("dynamic")
    setGravity(1000)
    goto(200, -250)
    setVelocityX(120)
    setBounce(1)
    setCollideWorldBounds("on")
  }
  on touched("弾") {
    score += 50
    floatingText("+50")
    setText(join("SCORE: ", score))
    disableBody()
    hide()
  }
}

sprite "敵2" {
  on flagClicked {
    setPhysics("dynamic")
    setGravity(1000)
    goto(600, -260)
    setVelocityX(-80)
    setBounce(1)
    setCollideWorldBounds("on")
  }
  on touched("弾") {
    score += 80
    floatingText("+80")
    setText(join("SCORE: ", score))
    disableBody()
    hide()
  }
}

sprite "HUD" {
}
`

// ═══════════════════════════════════════════
//  サンプル 3: ダンジョンラン（上級）
//  → sprites.ts の DEMO_PSEUDOCODE と同一
// ═══════════════════════════════════════════

// sprites.ts から移動せず DEFAULT_SPRITES を参照
// DEMO_PSEUDOCODE の内容をここに定義

const DUNGEON_PSEUDOCODE = `
sprite "プレイヤー" {
  on flagClicked {
    setPhysics("dynamic")
    setGravity(1200)
    goto(-750, -228)
    setBounce(0)
    setCollideWorldBounds("on")
    score = 0
    hp = 100
    jumps = 0
    invincible = 0
    bossDown = 0
    gameOver = 0
    addText("SCORE: 0", -900, 490)
  }

  on flagClicked {
    while (true) {
      if (gameOver == 0) {
        if (isKeyPressed("left arrow")) {
          setVelocityX(-300)
          setFlipX("on")
        } else {
          if (isKeyPressed("right arrow")) {
            setVelocityX(300)
            setFlipX("off")
          } else {
            setVelocityX(0)
          }
        }
        if (isOnGround()) {
          jumps = 0
        }
        if (isKeyPressed("up arrow") && jumps < 2) {
          setVelocityY(-600)
          jumps += 1
          if (jumps == 2) {
            floatingText("Double Jump!")
          }
        }
      }
    }
  }

  on flagClicked {
    while (true) {
      if (gameOver == 0) {
        if (touching("コイン")) {
          score += 100
          emit("coin1-get", "")
          floatingText("+100")
          setText(join("SCORE: ", score))
          wait(0.3)
        }
        if (touching("コイン2")) {
          score += 100
          emit("coin2-get", "")
          floatingText("+100")
          setText(join("SCORE: ", score))
          wait(0.3)
        }
        if (touching("コイン3")) {
          score += 300
          emit("coin3-get", "")
          floatingText("+300")
          setText(join("SCORE: ", score))
          wait(0.3)
        }
        if (touching("回復")) {
          hp += 30
          if (hp > 100) {
            hp = 100
          }
          emit("heal-get", "")
          floatingText("+30 HP")
          wait(0.3)
        }
      }
    }
  }

  on flagClicked {
    while (true) {
      if (gameOver == 0 && invincible == 0) {
        if (touching("敵")) {
          hp += -20
          invincible = 1
          setTint("#ff0000")
          setAlpha(50)
          setVelocityY(-400)
          wait(0.15)
          clearTint()
          wait(0.6)
          setAlpha(100)
          invincible = 0
        }
        if (touching("敵2")) {
          hp += -15
          invincible = 1
          setTint("#ff8800")
          setAlpha(50)
          setVelocityY(-350)
          wait(0.15)
          clearTint()
          wait(0.6)
          setAlpha(100)
          invincible = 0
        }
        if (touching("ボス")) {
          hp += -30
          invincible = 1
          setTint("#880000")
          setAlpha(40)
          setVelocityX(-400)
          setVelocityY(-500)
          wait(0.15)
          clearTint()
          wait(0.8)
          setAlpha(100)
          invincible = 0
        }
        if (touching("ボス弾")) {
          hp += -15
          invincible = 1
          setTint("#cc00cc")
          setAlpha(50)
          setVelocityY(-300)
          wait(0.15)
          clearTint()
          wait(0.5)
          setAlpha(100)
          invincible = 0
        }
        if (touching("トラップ")) {
          hp += -25
          invincible = 1
          setTint("#ff0000")
          setVelocityY(-500)
          wait(0.15)
          clearTint()
          wait(0.7)
          setAlpha(100)
          invincible = 0
        }
      }
    }
  }

  on keyPress("space") {
    if (gameOver == 0) {
      createClone("弾")
    }
  }

  on flagClicked {
    while (true) {
      graphics.clear()
      graphics.fillRect(-900, 440, 300, 28, "#333333")
      if (hp > 50) {
        graphics.fillRect(-900, 440, hp * 3, 28, "#44dd44")
      } else {
        if (hp > 25) {
          graphics.fillRect(-900, 440, hp * 3, 28, "#ddaa00")
        } else {
          graphics.fillRect(-900, 440, hp * 3, 28, "#dd2222")
        }
      }
      if (hp < 1 && gameOver == 0) {
        gameOver = 1
        say("GAME OVER...", 99)
        setVelocityX(0)
        setVelocityY(-300)
      }
      if (touching("ゴール") && bossDown == 1 && gameOver == 0) {
        gameOver = 2
        score += 1000
        setText(join("SCORE: ", score))
        say("CLEAR!!", 99)
        setVelocityX(0)
      }
    }
  }
}

sprite "地面" {
  on flagClicked {
    setPhysics("static")
    goto(0, -380)
  }
}

sprite "浮島1" {
  on flagClicked {
    setPhysics("static")
    goto(-550, -100)
  }
}

sprite "浮島2" {
  on flagClicked {
    setPhysics("static")
    goto(250, 100)
  }
}

sprite "浮島3" {
  on flagClicked {
    setPhysics("static")
    goto(-200, 280)
  }
}

sprite "移動床" {
  on flagClicked {
    setPhysics("static")
    goto(-100, -200)
    platformDir = 1
  }
  on flagClicked {
    while (true) {
      x += platformDir * 2
      if (x > 200) {
        platformDir = -1
      }
      if (x < -300) {
        platformDir = 1
      }
    }
  }
}

sprite "コイン" {
  on flagClicked {
    setPhysics("dynamic")
    setAllowGravity("off")
    goto(-550, -30)
  }
  on event("coin1-get") {
    disableBody()
    hide()
  }
}

sprite "コイン2" {
  on flagClicked {
    setPhysics("dynamic")
    setAllowGravity("off")
    goto(250, 170)
  }
  on event("coin2-get") {
    disableBody()
    hide()
  }
}

sprite "コイン3" {
  on flagClicked {
    setPhysics("dynamic")
    setAllowGravity("off")
    goto(-200, 350)
  }
  on event("coin3-get") {
    disableBody()
    hide()
  }
}

sprite "回復" {
  on flagClicked {
    setPhysics("dynamic")
    setAllowGravity("off")
    goto(-100, -140)
    setTint("#33ff99")
  }
  on event("heal-get") {
    disableBody()
    hide()
  }
}

sprite "トラップ" {
  on flagClicked {
    setPhysics("static")
    goto(100, -280)
  }
}

sprite "敵" {
  on flagClicked {
    setPhysics("dynamic")
    setGravity(1200)
    goto(-100, -250)
    setVelocityX(100)
    setBounce(1)
    setCollideWorldBounds("on")
  }
  on touched("弾") {
    score += 50
    emit("score-update", "")
    floatingText("+50")
    disableBody()
    hide()
  }
}

sprite "敵2" {
  on flagClicked {
    setPhysics("dynamic")
    setGravity(1200)
    goto(250, 140)
    setCollideWorldBounds("on")
    enemyDir = 1
  }
  on flagClicked {
    while (true) {
      setVelocityX(enemyDir * 80)
      if (x > 400) {
        enemyDir = -1
        setFlipX("on")
      }
      if (x < 100) {
        enemyDir = 1
        setFlipX("off")
      }
    }
  }
  on touched("弾") {
    score += 80
    emit("score-update", "")
    floatingText("+80")
    disableBody()
    hide()
  }
}

sprite "ボス" {
  on flagClicked {
    setPhysics("dynamic")
    setGravity(1200)
    goto(700, -200)
    setBounce(0.2)
    setCollideWorldBounds("on")
    bossHp = 8
    bossDir = 1
  }
  on flagClicked {
    while (true) {
      setVelocityX(bossDir * 50)
      if (x > 850) {
        bossDir = -1
        setFlipX("on")
      }
      if (x < 550) {
        bossDir = 1
        setFlipX("off")
      }
      emit("boss-fire", "")
      wait(2)
    }
  }
  on touched("弾") {
    bossHp += -1
    floatingText(join("-1 HP:", bossHp))
    setTint("#ffffff")
    wait(0.1)
    clearTint()
    if (bossHp < 1) {
      score += 500
      emit("score-update", "")
      bossDown = 1
      floatingText("BOSS DEFEATED!")
      say("ゴールへ急げ!", 5)
      disableBody()
      hide()
    }
  }
}

sprite "ボス弾" {
  on flagClicked {
    hide()
  }
  on event("boss-fire") {
    goto(650, -220)
    createClone("myself")
  }
  on clone {
    show()
    setPhysics("dynamic")
    setAllowGravity("off")
    setVelocityX(-350)
    setTint("#ff00ff")
    wait(4)
    deleteClone()
  }
}

sprite "弾" {
  on flagClicked {
    hide()
  }
  on clone {
    show()
    setPhysics("dynamic")
    setAllowGravity("off")
    setVelocityX(600)
    wait(1.5)
    deleteClone()
  }
}

sprite "ゴール" {
  on flagClicked {
    setPhysics("static")
    goto(880, -200)
  }
  on flagClicked {
    setAlpha(30)
    while (true) {
      if (bossDown == 1) {
        setAlpha(100)
        setTint("#ffd700")
      }
    }
  }
}

sprite "HUD" {
}
`

// ═══════════════════════════════════════════
//  サンプル 4: ブロック崩し（新疑似コード）
// ═══════════════════════════════════════════

const BREAKOUT_SPRITES: SpriteDef[] = [
  sp("s-ball", "ボール", "⚪",
    { w: 32, h: 32, color: "#dddddd", radius: 16, border: "#999999" },
    { x: 0, y: -220 }),
  sp("s-paddle", "パドル", "🟦",
    { w: 200, h: 24, color: "#4488ff", radius: 6, border: "#2255cc" },
    { x: 0, y: -300 }),
  sp("s-brick", "ブリック", "🟧",
    { w: 120, h: 40, color: "#ee8833", radius: 4 },
    { x: 0, y: 0 },
    { visible: false }),
  sp("s-hud", "HUD", "📊",
    { w: 4, h: 4, color: "#000000" },
    { x: 0, y: 0 },
    { visible: false }),
]

const BREAKOUT_PSEUDOCODE = `
class ボール {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(0, -220)
    this.setBounce(1)
    this.setCollideWorldBounds(true)
    this.launched = 0
    this.score = 0
    this.lives = 3
    this.addTextAt("score", "SCORE: 0", -900, 490, 36, "#ffffff")
    this.addTextAt("lives", "LIVES: 3", -900, 440, 28, "#66ccff")
  }

  onUpdate() {
    if (this.launched == 0) {
      this.setVelocity(0, 0)
      this.setPosition(0, -220)
    }
    if (this.y < -450) {
      this.lives += -1
      this.updateTextAt("lives", join("LIVES: ", this.lives))
      this.launched = 0
      this.setPosition(0, -220)
      this.cameraShake(200, 0.02)
      this.emitParticles(this.x, this.y, 15, "#ff3333", 150)
      if (this.lives < 1) {
        this.say("GAME OVER", 99)
        this.cameraFade(1000)
      }
    }
    this.setAngle(this.angle + 3)
  }

  onKeyPress("space") {
    if (this.launched == 0 && this.lives > 0) {
      this.setVelocity(200, 350)
      this.launched = 1
    }
  }

  onTouched("ブリック") {
    this.score += 10
    this.updateTextAt("score", join("SCORE: ", this.score))
    this.emitParticles(this.x, this.y, 8, "#ffcc00", 100)
    this.emit("brick-hit")
  }
}

class パドル {
  onCreate() {
    this.setPhysics("static")
    this.setPosition(0, -300)
  }

  onUpdate() {
    if (this.isKeyPressed("left arrow")) {
      this.x += -8
    } else if (this.isKeyPressed("right arrow")) {
      this.x += 8
    }
  }
}

class ブリック {
  onCreate() {
    this.hide()
    this.brickIdx = 0
  }

  onUpdate() {
    if (this.brickIdx < 8) {
      this.brickIdx += 1
      this.createClone("myself")
    }
  }

  onClone() {
    this.show()
    this.setPhysics("static")
    if (this.brickIdx == 1) {
      this.setPosition(-360, 300)
      this.setTint("#ee3333")
    }
    if (this.brickIdx == 2) {
      this.setPosition(-120, 300)
      this.setTint("#ee8833")
    }
    if (this.brickIdx == 3) {
      this.setPosition(120, 300)
      this.setTint("#eedd33")
    }
    if (this.brickIdx == 4) {
      this.setPosition(360, 300)
      this.setTint("#33cc66")
    }
    if (this.brickIdx == 5) {
      this.setPosition(-360, 200)
      this.setTint("#ee3333")
    }
    if (this.brickIdx == 6) {
      this.setPosition(-120, 200)
      this.setTint("#ee8833")
    }
    if (this.brickIdx == 7) {
      this.setPosition(120, 200)
      this.setTint("#eedd33")
    }
    if (this.brickIdx == 8) {
      this.setPosition(360, 200)
      this.setTint("#33cc66")
    }
    this.tweenScale(1.2, 0.2)
  }

  onEvent("brick-hit") {
    if (this.touching("ボール")) {
      this.emitParticles(this.x, this.y, 12, "#ffffff", 180)
      this.tweenScale(0, 0.15)
      this.disableBody()
      this.hide()
    }
  }
}

class HUD {
}
`

// ═══════════════════════════════════════════
//  サンプル 5: スペースシューター（新疑似コード）
// ═══════════════════════════════════════════

const SPACE_SHOOTER_SPRITES: SpriteDef[] = [
  sp("s-player", "自機", "🚀",
    { w: 60, h: 80, color: "#3399ff", radius: 8, border: "#1a66cc" },
    { x: 0, y: -350 }),
  sp("s-bullet", "弾", "•",
    { w: 12, h: 32, color: "#ffcc00", radius: 4 },
    { x: 0, y: -350 },
    { visible: false }),
  sp("s-enemy", "敵", "👾",
    { w: 64, h: 64, color: "#ee3333", radius: 8, border: "#aa0000" },
    { x: 0, y: 450 },
    { visible: false }),
  sp("s-hud", "HUD", "📊",
    { w: 4, h: 4, color: "#000000" },
    { x: 0, y: 0 },
    { visible: false }),
]

const SPACE_SHOOTER_PSEUDOCODE = `
class 自機 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(0, -350)
    this.setCollideWorldBounds(true)
    this.score = 0
    this.hp = 100
    this.gameOver = 0
    this.addTextAt("score", "SCORE: 0", -900, 490, 36, "#ffffff")
    this.addTextAt("hp", "HP: 100", -900, 440, 28, "#44dd44")
  }

  onUpdate() {
    if (this.gameOver == 0) {
      this.setVelocity(0, 0)
      if (this.isKeyPressed("left arrow")) {
        this.setVelocityX(-350)
      } else if (this.isKeyPressed("right arrow")) {
        this.setVelocityX(350)
      }
      if (this.isKeyPressed("up arrow")) {
        this.setVelocityY(-350)
      } else if (this.isKeyPressed("down arrow")) {
        this.setVelocityY(350)
      }

      this.graphics.clear()
      this.graphics.fillRect(-900, 400, 300, 24, "#333333")
      if (this.hp > 50) {
        this.graphics.fillRect(-900, 400, this.hp * 3, 24, "#44dd44")
      } else if (this.hp > 25) {
        this.graphics.fillRect(-900, 400, this.hp * 3, 24, "#ddaa00")
      } else {
        this.graphics.fillRect(-900, 400, this.hp * 3, 24, "#dd2222")
      }

      if (this.hp < 1) {
        this.gameOver = 1
        this.say("GAME OVER", 99)
        this.setVelocity(0, 0)
        this.cameraShake(500, 0.03)
        this.tweenAlpha(0.3, 1)
        this.cameraFade(2000)
      }
    }
  }

  onKeyPress("space") {
    if (this.gameOver == 0) {
      this.createClone("弾")
      this.emitParticles(this.x, this.y + 30, 5, "#ffcc00", 100)
    }
  }

  onTouched("敵") {
    if (this.gameOver == 0) {
      this.hp += -20
      this.updateTextAt("hp", join("HP: ", this.hp))
      this.cameraShake(150, 0.015)
      this.emitParticles(this.x, this.y, 10, "#ff3333", 150)
      this.setTint("#ff0000")
      this.setAlpha(50)
      this.wait(0.15)
      this.clearTint()
      this.wait(0.3)
      this.setAlpha(100)
    }
  }
}

class 弾 {
  onCreate() {
    this.hide()
  }
  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setVelocityY(-600)
    this.setAngle(0)
    this.wait(1.5)
    this.deleteClone()
  }
}

class 敵 {
  onCreate() {
    this.hide()
    this.spawnX = -700
  }

  onUpdate() {
    this.spawnX += 200
    if (this.spawnX > 700) {
      this.spawnX = -700
    }
    this.setPosition(this.spawnX, 450)
    this.createClone("myself")
    this.wait(1.2)
  }

  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setVelocityY(180)
    this.tweenAngle(360, 3)
    this.wait(6)
    this.deleteClone()
  }

  onTouched("弾") {
    this.score += 50
    this.updateTextAt("score", join("SCORE: ", this.score))
    this.emitParticles(this.x, this.y, 20, "#ff6600", 250)
    this.floatingText("+50")
    this.deleteClone()
  }
}

class HUD {
}
`

// ═══════════════════════════════════════════
//  サンプル 6: エンドレスランナー（新疑似コード）
// ═══════════════════════════════════════════

const RUNNER_SPRITES: SpriteDef[] = [
  sp("s-player", "ランナー", "🏃",
    { w: 60, h: 100, color: "#44aaff", radius: 10, border: "#2277cc" },
    { x: -600, y: -240 }),
  sp("s-ground", "地面", "🟫",
    { w: 1920, h: 120, color: "#6B4F14" },
    { x: 0, y: -400 }),
  sp("s-obstacle", "障害物", "🪨",
    { w: 60, h: 80, color: "#888888", radius: 6, border: "#555555" },
    { x: 960, y: -300 },
    { visible: false }),
  sp("s-coin", "コイン", "⭐",
    { w: 48, h: 48, color: "#ffcc00", radius: 24, border: "#cc9900" },
    { x: 960, y: -200 },
    { visible: false }),
  sp("s-hud", "HUD", "📊",
    { w: 4, h: 4, color: "#000000" },
    { x: 0, y: 0 },
    { visible: false }),
]

const RUNNER_PSEUDOCODE = `
class ランナー {
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(1200)
    this.setPosition(-600, -240)
    this.setBounce(0)
    this.setCollideWorldBounds(true)
    this.score = 0
    this.jumps = 0
    this.gameOver = 0
    this.addTextAt("score", "SCORE: 0", -900, 490, 36, "#ffffff")
    this.addTextAt("best", "BEST: 0", -500, 490, 24, "#aaaaaa")
  }

  onUpdate() {
    if (this.gameOver == 0) {
      this.x = -600
      this.score += 1
      this.updateTextAt("score", join("SCORE: ", this.score))

      if (this.isOnGround()) {
        this.jumps = 0
      }
    }
  }

  onKeyPress("up arrow") {
    if (this.gameOver == 0 && this.jumps < 2) {
      this.setVelocityY(-650)
      this.jumps += 1
      this.emitParticles(this.x, this.y - 40, 8, "#88ccff", 80)
      if (this.jumps == 2) {
        this.floatingText("Double Jump!")
        this.emitParticles(this.x, this.y - 40, 15, "#ffcc00", 120)
      }
    }
  }

  onKeyPress("space") {
    if (this.gameOver == 0 && this.jumps < 2) {
      this.setVelocityY(-650)
      this.jumps += 1
      this.emitParticles(this.x, this.y - 40, 8, "#88ccff", 80)
    }
  }

  onTouched("障害物") {
    if (this.gameOver == 0) {
      this.gameOver = 1
      this.say("GAME OVER", 99)
      this.setVelocity(0, 0)
      this.setTint("#ff0000")
      this.cameraShake(300, 0.03)
      this.emitParticles(this.x, this.y, 25, "#ff3333", 200)
      this.tweenAlpha(0.4, 1)
    }
  }

  onTouched("コイン") {
    this.score += 100
    this.floatingText("+100")
    this.emitParticles(this.x, this.y, 10, "#ffcc00", 150)
    this.emit("coin-collected")
  }
}

class 地面 {
  onCreate() {
    this.setPhysics("static")
    this.setPosition(0, -400)
  }
}

class 障害物 {
  onCreate() {
    this.hide()
    this.setPosition(960, -300)
  }

  onUpdate() {
    this.setPosition(960, -300)
    this.createClone("myself")
    this.wait(2)
  }

  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setVelocityX(-450)
    this.setAngle(0)
    this.tweenAngle(360, 2)
    this.wait(5)
    this.deleteClone()
  }
}

class コイン {
  onCreate() {
    this.hide()
    this.setPosition(960, -200)
  }

  onUpdate() {
    this.setPosition(960, -200)
    this.createClone("myself")
    this.wait(3)
  }

  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setVelocityX(-400)
    this.setAngle(0)
    this.tweenAngle(360, 1.5)
    this.tweenScale(1.3, 0.5)
    this.wait(5)
    this.deleteClone()
  }

  onTouched("ランナー") {
    this.score += 100
    this.floatingText("+100")
    this.emitParticles(this.x, this.y, 12, "#ffcc00", 180)
    this.deleteClone()
  }
}

class HUD {
}
`

// ═══════════════════════════════════════════
//  サンプル 7: スネークゲーム（新疑似コード）
// ═══════════════════════════════════════════

const SNAKE_SPRITES: SpriteDef[] = [
  sp("s-head", "アタマ", "🐍",
    { w: 48, h: 48, color: "#22aa22", radius: 8, border: "#116611" },
    { x: 0, y: 0 }),
  sp("s-body", "カラダ", "🟩",
    { w: 44, h: 44, color: "#33cc33", radius: 6, border: "#228822" },
    { x: 0, y: 0 },
    { visible: false }),
  sp("s-food", "エサ", "🍎",
    { w: 48, h: 48, color: "#ff3333", radius: 24 },
    { x: 288, y: 144 }),
  sp("s-hud", "HUD", "📊",
    { w: 4, h: 4, color: "#000000" },
    { x: 0, y: 0 },
    { visible: false }),
]

const SNAKE_PSEUDOCODE = `
class アタマ {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(0, 0)
    this.dir = 3
    this.moveTimer = 0
    this.speed = 8
    this.score = 0
    this.alive = 1
    this.bodyLen = 0
    this.foodX = 288
    this.foodY = 144
    this.relayX = 0
    this.relayY = 0
    this.addTextAt("score", "SCORE: 0", -900, 490, 36, "#ffffff")
    this.addTextAt("len", "LENGTH: 1", -900, 440, 24, "#88ff88")
  }

  onUpdate() {
    if (this.alive == 1) {
      this.moveTimer += 1
      if (this.moveTimer > this.speed) {
        this.relayX = this.x
        this.relayY = this.y

        if (this.dir == 3) {
          this.x += 48
        } else if (this.dir == 2) {
          this.x += -48
        } else if (this.dir == 0) {
          this.y += 48
        } else if (this.dir == 1) {
          this.y += -48
        }
        this.moveTimer = 0
        this.emit("snake-step")
      }

      if (this.x > 912) {
        this.x = -912
      }
      if (this.x < -912) {
        this.x = 912
      }
      if (this.y > 492) {
        this.y = -492
      }
      if (this.y < -492) {
        this.y = 492
      }
    }
  }

  onKeyPress("left arrow") {
    if (this.dir == 0 || this.dir == 1) {
      this.dir = 2
    }
  }
  onKeyPress("right arrow") {
    if (this.dir == 0 || this.dir == 1) {
      this.dir = 3
    }
  }
  onKeyPress("up arrow") {
    if (this.dir == 2 || this.dir == 3) {
      this.dir = 0
    }
  }
  onKeyPress("down arrow") {
    if (this.dir == 2 || this.dir == 3) {
      this.dir = 1
    }
  }

  onTouched("エサ") {
    this.score += 10
    this.bodyLen += 1
    this.updateTextAt("score", join("SCORE: ", this.score))
    this.updateTextAt("len", join("LENGTH: ", this.bodyLen + 1))
    this.floatingText("+10")
    this.emitParticles(this.x, this.y, 10, "#ff3333", 120)
    if (this.speed > 3) {
      this.speed += -1
    }
    this.createClone("カラダ")
    this.foodX += 336
    if (this.foodX > 700) {
      this.foodX = -700
      this.foodY += 240
    }
    if (this.foodY > 400) {
      this.foodY = -400
    }
    this.emit("food-eaten")
  }
}

class カラダ {
  onCreate() {
    this.hide()
  }

  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(this.relayX, this.relayY)
    this.myIdx = this.bodyLen
    this.tweenScale(1.3, 0.15)
  }

  onEvent("snake-step") {
    this.oldX = this.x
    this.oldY = this.y
    this.setPosition(this.relayX, this.relayY)
    this.relayX = this.oldX
    this.relayY = this.oldY
  }
}

class エサ {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(288, 144)
    this.setAngle(0)
  }

  onUpdate() {
    this.setAngle(this.angle + 2)
  }

  onEvent("food-eaten") {
    this.setPosition(this.foodX, this.foodY)
    this.emitParticles(this.x, this.y, 15, "#33ff33", 150)
    this.tweenScale(1.5, 0.2)
  }
}

class HUD {
}
`

// ═══════════════════════════════════════════
//  サンプル 8: トップダウンアクション（新疑似コード）
// ═══════════════════════════════════════════

const TOPDOWN_SPRITES: SpriteDef[] = [
  sp("s-hero", "勇者", "🗡️",
    { w: 60, h: 60, color: "#4488ff", radius: 30, border: "#2255cc" },
    { x: -600, y: -300 }),
  sp("s-slime1", "スライム1", "🟢",
    { w: 50, h: 50, color: "#33cc66", radius: 25, border: "#229944" },
    { x: 200, y: 100 }),
  sp("s-slime2", "スライム2", "🟢",
    { w: 50, h: 50, color: "#33cc66", radius: 25, border: "#229944" },
    { x: -300, y: 200 }),
  sp("s-slime3", "スライム3", "🟢",
    { w: 50, h: 50, color: "#66dd88", radius: 25, border: "#44aa66" },
    { x: 500, y: -100 }),
  sp("s-sword", "剣", "⚔️",
    { w: 80, h: 20, color: "#cccccc", radius: 4 },
    { x: 9999, y: 9999 },
    { visible: false }),
  sp("s-heart", "回復", "💚",
    { w: 40, h: 40, color: "#33ff99", radius: 20 },
    { x: 0, y: -100 }),
  sp("s-key", "カギ", "🔑",
    { w: 40, h: 40, color: "#ffcc00", radius: 8 },
    { x: 600, y: 300 }),
  sp("s-door", "ゴール", "🚪",
    { w: 80, h: 100, color: "#885522", radius: 4, border: "#663311" },
    { x: 800, y: -350 }),
  sp("s-wall-top", "壁上", "⬛",
    { w: 1920, h: 40, color: "#444444" },
    { x: 0, y: 500 }),
  sp("s-wall-bottom", "壁下", "⬛",
    { w: 1920, h: 40, color: "#444444" },
    { x: 0, y: -500 }),
  sp("s-wall-left", "壁左", "⬛",
    { w: 40, h: 1080, color: "#444444" },
    { x: -940, y: 0 }),
  sp("s-wall-right", "壁右", "⬛",
    { w: 40, h: 1080, color: "#444444" },
    { x: 940, y: 0 }),
  sp("s-hud", "HUD", "📊",
    { w: 4, h: 4, color: "#000000" },
    { x: 0, y: 0 },
    { visible: false }),
]

const TOPDOWN_PSEUDOCODE = `
class 勇者 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(-600, -300)
    this.setCollideWorldBounds(true)
    this.hp = 100
    this.score = 0
    this.hasKey = 0
    this.gameOver = 0
    this.attackCooldown = 0
    this.invincible = 0
    this.addTextAt("hp", "HP: 100", -900, 490, 32, "#44dd44")
    this.addTextAt("score", "SCORE: 0", -900, 440, 24, "#ffffff")
    this.addTextAt("key", "", -500, 490, 28, "#ffcc00")
  }

  onUpdate() {
    if (this.gameOver == 0) {
      this.setVelocity(0, 0)

      if (this.isKeyPressed("left arrow")) {
        this.setVelocityX(-200)
        this.setFlipX(true)
      } else if (this.isKeyPressed("right arrow")) {
        this.setVelocityX(200)
        this.setFlipX(false)
      }

      if (this.isKeyPressed("up arrow")) {
        this.setVelocityY(-200)
      } else if (this.isKeyPressed("down arrow")) {
        this.setVelocityY(200)
      }

      if (this.attackCooldown > 0) {
        this.attackCooldown += -1
      }

      this.graphics.clear()
      this.graphics.fillRect(-900, 400, 300, 24, "#333333")
      if (this.hp > 50) {
        this.graphics.fillRect(-900, 400, this.hp * 3, 24, "#44dd44")
      } else if (this.hp > 25) {
        this.graphics.fillRect(-900, 400, this.hp * 3, 24, "#ddaa00")
      } else {
        this.graphics.fillRect(-900, 400, this.hp * 3, 24, "#dd2222")
      }

      if (this.hp < 1) {
        this.gameOver = 1
        this.say("GAME OVER", 99)
        this.setVelocity(0, 0)
        this.cameraShake(500, 0.03)
        this.tweenAlpha(0.3, 1)
      }
    }
  }

  onKeyPress("space") {
    if (this.gameOver == 0 && this.attackCooldown == 0) {
      this.createClone("剣")
      this.attackCooldown = 15
      this.emit("attack")
      this.emitParticles(this.x + 40, this.y, 5, "#cccccc", 100)
    }
  }

  onTouched("スライム1") {
    if (this.invincible == 0 && this.gameOver == 0) {
      this.hp += -15
      this.invincible = 1
      this.updateTextAt("hp", join("HP: ", this.hp))
      this.cameraShake(150, 0.015)
      this.emitParticles(this.x, this.y, 8, "#ff3333", 120)
      this.setTint("#ff0000")
      this.wait(0.15)
      this.clearTint()
      this.wait(0.5)
      this.invincible = 0
    }
  }

  onTouched("スライム2") {
    if (this.invincible == 0 && this.gameOver == 0) {
      this.hp += -15
      this.invincible = 1
      this.updateTextAt("hp", join("HP: ", this.hp))
      this.cameraShake(150, 0.015)
      this.emitParticles(this.x, this.y, 8, "#ff3333", 120)
      this.setTint("#ff0000")
      this.wait(0.15)
      this.clearTint()
      this.wait(0.5)
      this.invincible = 0
    }
  }

  onTouched("スライム3") {
    if (this.invincible == 0 && this.gameOver == 0) {
      this.hp += -15
      this.invincible = 1
      this.updateTextAt("hp", join("HP: ", this.hp))
      this.cameraShake(150, 0.015)
      this.emitParticles(this.x, this.y, 8, "#ff3333", 120)
      this.setTint("#ff0000")
      this.wait(0.15)
      this.clearTint()
      this.wait(0.5)
      this.invincible = 0
    }
  }

  onTouched("回復") {
    this.hp += 30
    if (this.hp > 100) {
      this.hp = 100
    }
    this.updateTextAt("hp", join("HP: ", this.hp))
    this.floatingText("+30 HP")
    this.emitParticles(this.x, this.y, 12, "#33ff99", 100)
    this.emit("heal-get")
  }

  onTouched("カギ") {
    this.hasKey = 1
    this.floatingText("Got Key!")
    this.updateTextAt("key", "KEY GET!")
    this.emitParticles(this.x, this.y, 20, "#ffcc00", 200)
    this.emit("key-get")
  }

  onTouched("ゴール") {
    if (this.hasKey == 1 && this.gameOver == 0) {
      this.gameOver = 2
      this.score += 1000
      this.updateTextAt("score", join("SCORE: ", this.score))
      this.say("STAGE CLEAR!", 99)
      this.setVelocity(0, 0)
      this.emitParticles(this.x, this.y, 30, "#ffd700", 300)
      this.tweenScale(1.5, 0.5)
    }
  }
}

class スライム1 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(200, 100)
    this.setCollideWorldBounds(true)
    this.moveTimer = 0
    this.alive = 1
  }

  onUpdate() {
    if (this.alive == 1) {
      this.moveTimer += 1
      if (this.moveTimer > 60) {
        this.setVelocity(0, 0)
        this.setVelocityX(80)
        this.moveTimer = 0
      }
      if (this.moveTimer == 30) {
        this.setVelocity(0, 0)
        this.setVelocityX(-80)
      }
    }
  }

  onEvent("attack") {
    if (this.alive == 1 && this.touching("剣")) {
      this.alive = 0
      this.score += 100
      this.updateTextAt("score", join("SCORE: ", this.score))
      this.floatingText("+100")
      this.emitParticles(this.x, this.y, 15, "#33cc66", 180)
      this.tweenScale(0, 0.2)
      this.disableBody()
    }
  }
}

class スライム2 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(-300, 200)
    this.setCollideWorldBounds(true)
    this.moveTimer = 0
    this.alive = 1
  }

  onUpdate() {
    if (this.alive == 1) {
      this.moveTimer += 1
      if (this.moveTimer > 80) {
        this.setVelocity(0, 0)
        this.setVelocityY(60)
        this.moveTimer = 0
      }
      if (this.moveTimer == 40) {
        this.setVelocity(0, 0)
        this.setVelocityY(-60)
      }
    }
  }

  onEvent("attack") {
    if (this.alive == 1 && this.touching("剣")) {
      this.alive = 0
      this.score += 100
      this.updateTextAt("score", join("SCORE: ", this.score))
      this.floatingText("+100")
      this.emitParticles(this.x, this.y, 15, "#33cc66", 180)
      this.tweenScale(0, 0.2)
      this.disableBody()
    }
  }
}

class スライム3 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(500, -100)
    this.setCollideWorldBounds(true)
    this.moveTimer = 0
    this.alive = 1
  }

  onUpdate() {
    if (this.alive == 1) {
      this.moveTimer += 1
      if (this.moveTimer > 50) {
        this.setVelocity(0, 0)
        this.setVelocityX(-100)
        this.setVelocityY(60)
        this.moveTimer = 0
      }
      if (this.moveTimer == 25) {
        this.setVelocity(0, 0)
        this.setVelocityX(100)
        this.setVelocityY(-60)
      }
    }
  }

  onEvent("attack") {
    if (this.alive == 1 && this.touching("剣")) {
      this.alive = 0
      this.score += 100
      this.updateTextAt("score", join("SCORE: ", this.score))
      this.floatingText("+100")
      this.emitParticles(this.x, this.y, 15, "#33cc66", 180)
      this.tweenScale(0, 0.2)
      this.disableBody()
    }
  }
}

class 剣 {
  onCreate() {
    this.hide()
  }
  onClone() {
    this.show()
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setVelocityX(500)
    this.tweenAngle(720, 0.3)
    this.wait(0.3)
    this.deleteClone()
  }
}

class 回復 {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(0, -100)
    this.setTint("#33ff99")
  }
  onUpdate() {
    this.setAngle(this.angle + 1)
  }
  onEvent("heal-get") {
    this.emitParticles(this.x, this.y, 10, "#33ff99", 120)
    this.tweenScale(0, 0.2)
    this.disableBody()
  }
}

class カギ {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity("off")
    this.setPosition(600, 300)
  }
  onUpdate() {
    this.setAngle(this.angle + 2)
  }
  onEvent("key-get") {
    this.emitParticles(this.x, this.y, 15, "#ffcc00", 150)
    this.tweenScale(0, 0.3)
    this.disableBody()
  }
}

class ゴール {
  onCreate() {
    this.setPhysics("static")
    this.setPosition(800, -350)
    this.setAlpha(30)
  }

  onEvent("key-get") {
    this.tweenAlpha(1, 0.5)
    this.setTint("#ffd700")
    this.emitParticles(this.x, this.y, 20, "#ffd700", 100)
  }
}

class 壁上 {
  onCreate() {
    this.setPhysics("static")
    this.setPosition(0, 500)
  }
}
class 壁下 {
  onCreate() {
    this.setPhysics("static")
    this.setPosition(0, -500)
  }
}
class 壁左 {
  onCreate() {
    this.setPhysics("static")
    this.setPosition(-940, 0)
  }
}
class 壁右 {
  onCreate() {
    this.setPhysics("static")
    this.setPosition(940, 0)
  }
}

class HUD {
}
`

// ── サンプルプロジェクト一覧 ──

// 簡単 → 難しい順に並べる（最初がデフォルト）
export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: "beginner",
    name: "はじめてのゲーム",
    description: "移動・ジャンプ・コイン収集だけ",
    sprites: BEGINNER_SPRITES,
    pseudocode: BEGINNER_PSEUDOCODE,
  },
  {
    id: "shooting",
    name: "シューティング",
    description: "弾で敵を倒す横スクロール風",
    sprites: SHOOTING_SPRITES,
    pseudocode: SHOOTING_PSEUDOCODE,
  },
  {
    id: "dungeon-run",
    name: "ダンジョンラン",
    description: "ボス戦・HP・2段ジャンプ・移動床・トラップ",
    sprites: DEFAULT_SPRITES,
    pseudocode: DUNGEON_PSEUDOCODE,
  },
  {
    id: "breakout",
    name: "ブロック崩し",
    description: "ボールでブリックを壊す",
    sprites: BREAKOUT_SPRITES,
    pseudocode: BREAKOUT_PSEUDOCODE,
  },
  {
    id: "space-shooter",
    name: "スペースシューター",
    description: "敵を撃ち落とす縦シューティング",
    sprites: SPACE_SHOOTER_SPRITES,
    pseudocode: SPACE_SHOOTER_PSEUDOCODE,
  },
  {
    id: "endless-runner",
    name: "エンドレスランナー",
    description: "障害物を避けてコインを集める横スクロール",
    sprites: RUNNER_SPRITES,
    pseudocode: RUNNER_PSEUDOCODE,
  },
  {
    id: "snake",
    name: "スネークゲーム",
    description: "エサを食べて加速するクラシックゲーム",
    sprites: SNAKE_SPRITES,
    pseudocode: SNAKE_PSEUDOCODE,
  },
  {
    id: "topdown-action",
    name: "トップダウンアクション",
    description: "敵を倒してカギを集めてゴールを目指す",
    sprites: TOPDOWN_SPRITES,
    pseudocode: TOPDOWN_PSEUDOCODE,
  },
]
