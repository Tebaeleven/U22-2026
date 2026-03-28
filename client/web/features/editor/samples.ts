// サンプルプロジェクト定義

import type { SpriteDef } from "./constants"
import { DEFAULT_COLLIDER, DEFAULT_SPRITES, createRectCostume } from "./constants"
import type { BlockProjectData } from "./block-editor/types"
import { pseudocodeToBlockData } from "./codegen"

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
  const generated = pseudocodeToBlockData(pseudocode)
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
]
