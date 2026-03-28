# 高度なプラットフォーマー: Phaser サンプルコード & ブロック不足分析

## 1. Phaser プラットフォーマー（高度版）サンプルコード

スコア・HP・弾丸発射を含む、Phaser の機能をフル活用したプラットフォーマー。

```typescript
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  physics: {
    default: "arcade",
    arcade: { gravity: { x: 0, y: 1000 }, debug: false },
  },
  scene: AdvancedPlatformerScene,
}

class AdvancedPlatformerScene extends Phaser.Scene {
  // ─── ゲームオブジェクト ───
  private player!: Phaser.Physics.Arcade.Sprite
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private coins!: Phaser.Physics.Arcade.Group
  private enemies!: Phaser.Physics.Arcade.Group
  private bullets!: Phaser.Physics.Arcade.Group   // 弾丸グループ
  private movingPlatform!: Phaser.Physics.Arcade.Image  // 動く足場

  // ─── 入力 ───
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private fireKey!: Phaser.Input.Keyboard.Key

  // ─── UI ───
  private scoreText!: Phaser.GameObjects.Text
  private hpBar!: Phaser.GameObjects.Graphics
  private hpBarBg!: Phaser.GameObjects.Graphics

  // ─── 状態 ───
  private score = 0
  private hp = 100
  private maxHp = 100
  private gameOver = false
  private facingRight = true
  private lastFireTime = 0
  private fireCooldown = 300 // ms

  constructor() {
    super({ key: "AdvancedPlatformerScene" })
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  アセット読み込み
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  preload() {
    // 実際にはスプライトシートや画像を読み込む
    // ここでは矩形で代用（createRectCostume 相当）
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  シーン初期化
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  create() {
    // --- テクスチャ生成（矩形で代用） ---
    this.createRectTexture("player", 32, 48, 0x4488ff)
    this.createRectTexture("ground", 960, 40, 0x8B6914)
    this.createRectTexture("platform", 200, 24, 0x66aa44)
    this.createRectTexture("coin", 20, 20, 0xffcc00)
    this.createRectTexture("enemy", 32, 32, 0xff4444)
    this.createRectTexture("bullet", 12, 6, 0xffffff)
    this.createRectTexture("moving-plat", 160, 24, 0x4466aa)

    // --- 背景色 ---
    this.cameras.main.setBackgroundColor("#87CEEB")

    // ══════════════════════════════════════════
    //  地形
    // ══════════════════════════════════════════
    this.platforms = this.physics.add.staticGroup()
    this.platforms.create(480, 520, "ground")               // 地面
    this.platforms.create(150, 380, "platform")             // 浮島1
    this.platforms.create(500, 280, "platform")             // 浮島2
    this.platforms.create(800, 180, "platform")             // 浮島3

    // --- 動く足場 ---
    this.movingPlatform = this.physics.add.image(350, 180, "moving-plat")
    this.movingPlatform.setImmovable(true)
    this.movingPlatform.body!.allowGravity = false
    // Tween で左右に往復移動
    this.tweens.add({
      targets: this.movingPlatform,
      x: 600,
      duration: 3000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    })

    // ══════════════════════════════════════════
    //  プレイヤー
    // ══════════════════════════════════════════
    this.player = this.physics.add.sprite(100, 400, "player")
    this.player.setBounce(0.1)
    this.player.setCollideWorldBounds(true)

    // ══════════════════════════════════════════
    //  コイン（グループで一括生成）
    // ══════════════════════════════════════════
    this.coins = this.physics.add.group()
    const coinPositions = [
      { x: 100, y: 340 }, { x: 200, y: 340 },
      { x: 450, y: 240 }, { x: 550, y: 240 },
      { x: 750, y: 140 }, { x: 850, y: 140 },
    ]
    for (const pos of coinPositions) {
      const coin = this.coins.create(pos.x, pos.y, "coin") as Phaser.Physics.Arcade.Sprite
      coin.body!.allowGravity = false  // コインは浮いている
      coin.setImmovable(true)
      // コインの回転アニメーション（Tween）
      this.tweens.add({
        targets: coin,
        scaleX: 0,
        duration: 600,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      })
    }

    // ══════════════════════════════════════════
    //  敵（パトロール + ジャンプ踏みつけ）
    // ══════════════════════════════════════════
    this.enemies = this.physics.add.group()

    // 地上パトロール敵
    const enemy1 = this.createEnemy(600, 480, 80)
    // 浮島パトロール敵
    const enemy2 = this.createEnemy(500, 240, 60)

    // ══════════════════════════════════════════
    //  弾丸グループ（オブジェクトプール）
    // ══════════════════════════════════════════
    this.bullets = this.physics.add.group({
      defaultKey: "bullet",
      maxSize: 10,           // 最大10発のプール
      allowGravity: false,
      collideWorldBounds: true,
    })
    // 画面外に出たら回収
    this.bullets.children.iterate((bullet) => {
      const b = bullet as Phaser.Physics.Arcade.Sprite
      b.on("worldbounds", () => b.disableBody(true, true))
      return true
    })

    // ══════════════════════════════════════════
    //  衝突設定
    // ══════════════════════════════════════════
    // プレイヤー ↔ 地形
    this.physics.add.collider(this.player, this.platforms)
    this.physics.add.collider(this.player, this.movingPlatform)
    // 敵 ↔ 地形
    this.physics.add.collider(this.enemies, this.platforms)
    // コイン ↔ 地形（浮遊コインなので不要だが安全のため）
    this.physics.add.collider(this.coins, this.platforms)

    // プレイヤー ↔ コイン（収集）
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, undefined, this)

    // プレイヤー ↔ 敵（踏みつけ or ダメージ）
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, undefined, this)

    // 弾丸 ↔ 敵（弾丸で倒す）
    this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, undefined, this)

    // 弾丸 ↔ 地形（壁に当たったら消える）
    this.physics.add.collider(this.bullets, this.platforms, (_bullet) => {
      const b = _bullet as Phaser.Physics.Arcade.Sprite
      b.disableBody(true, true)
    })

    // ══════════════════════════════════════════
    //  入力設定
    // ══════════════════════════════════════════
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.fireKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z)

    // ══════════════════════════════════════════
    //  UI（HUD）
    // ══════════════════════════════════════════
    // スコア表示（テキスト）
    this.scoreText = this.add.text(16, 16, "SCORE: 0", {
      fontSize: "20px",
      fontFamily: "monospace",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
    }).setScrollFactor(0)  // カメラに追従しない（固定UI）

    // HPバー背景
    this.hpBarBg = this.add.graphics()
    this.hpBarBg.fillStyle(0x333333)
    this.hpBarBg.fillRect(16, 46, 200, 16)
    this.hpBarBg.setScrollFactor(0)

    // HPバー本体
    this.hpBar = this.add.graphics()
    this.hpBar.setScrollFactor(0)
    this.drawHpBar()

    // ══════════════════════════════════════════
    //  カメラ
    // ══════════════════════════════════════════
    // ワールドがステージより広い場合、プレイヤー追従
    // this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    // this.cameras.main.setDeadzone(100, 50)
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  毎フレーム更新
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  update(_time: number, _delta: number) {
    if (this.gameOver) return

    // --- 移動 ---
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-250)
      this.facingRight = false
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(250)
      this.facingRight = true
    } else {
      this.player.setVelocityX(0)
    }

    // --- ジャンプ（接地時のみ） ---
    if (this.cursors.up.isDown && this.player.body!.blocked.down) {
      this.player.setVelocityY(-550)
    }

    // --- 弾丸発射（Z キー） ---
    if (this.fireKey.isDown) {
      this.fireBullet()
    }

    // --- 画面外落下 → ダメージ ---
    if (this.player.y > 560) {
      this.takeDamage(30)
      this.player.setPosition(100, 400)
      this.player.setVelocity(0, 0)
    }

    // --- 動く足場上の移動補正 ---
    if (this.player.body!.touching.down) {
      // 動く足場の上にいるとき、プレイヤーも一緒に動く
      const movPlat = this.movingPlatform
      const platBody = movPlat.body as Phaser.Physics.Arcade.Body
      if (this.physics.overlap(this.player, movPlat)) {
        this.player.x += platBody.velocity.x * (1 / 60)
      }
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  弾丸発射
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private fireBullet() {
    const now = this.time.now
    if (now - this.lastFireTime < this.fireCooldown) return
    this.lastFireTime = now

    // プールから取得
    const bullet = this.bullets.get(
      this.player.x,
      this.player.y,
      "bullet"
    ) as Phaser.Physics.Arcade.Sprite | null

    if (!bullet) return  // プールが空

    bullet.enableBody(true, this.player.x, this.player.y, true, true)
    bullet.body!.allowGravity = false

    const speed = 500
    const vx = this.facingRight ? speed : -speed
    bullet.setVelocity(vx, 0)

    // 一定時間後に自動消滅
    this.time.delayedCall(2000, () => {
      if (bullet.active) {
        bullet.disableBody(true, true)
      }
    })
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  コイン収集
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private collectCoin(
    _player: Phaser.GameObjects.GameObject,
    coin: Phaser.GameObjects.GameObject,
  ) {
    const c = coin as Phaser.Physics.Arcade.Sprite
    c.disableBody(true, true)

    this.score += 10
    this.scoreText.setText(`SCORE: ${this.score}`)

    // コイン取得エフェクト（Tween でスケールアップして消える）
    const effect = this.add.text(c.x, c.y, "+10", {
      fontSize: "16px",
      color: "#ffcc00",
    }).setOrigin(0.5)
    this.tweens.add({
      targets: effect,
      y: c.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => effect.destroy(),
    })
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  敵との衝突（踏みつけ or ダメージ）
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private hitEnemy(
    _player: Phaser.GameObjects.GameObject,
    enemy: Phaser.GameObjects.GameObject,
  ) {
    const e = enemy as Phaser.Physics.Arcade.Sprite

    // 踏みつけ判定: プレイヤーが落下中 & 敵の上にいる
    if (this.player.body!.velocity.y > 0 && this.player.y < e.y - 16) {
      e.disableBody(true, true)
      this.player.setVelocityY(-350) // 踏みつけバウンス
      this.score += 50
      this.scoreText.setText(`SCORE: ${this.score}`)
    } else {
      // ダメージを受ける
      this.takeDamage(20)
      // ノックバック
      const knockDir = this.player.x < e.x ? -1 : 1
      this.player.setVelocity(knockDir * 200, -200)
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  弾丸が敵に当たった
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private bulletHitEnemy(
    bullet: Phaser.GameObjects.GameObject,
    enemy: Phaser.GameObjects.GameObject,
  ) {
    const b = bullet as Phaser.Physics.Arcade.Sprite
    const e = enemy as Phaser.Physics.Arcade.Sprite
    b.disableBody(true, true)
    e.disableBody(true, true)
    this.score += 30
    this.scoreText.setText(`SCORE: ${this.score}`)
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ダメージ処理
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private takeDamage(amount: number) {
    this.hp = Math.max(0, this.hp - amount)
    this.drawHpBar()

    // ダメージフラッシュ（赤く点滅）
    this.player.setTint(0xff0000)
    this.time.delayedCall(200, () => this.player.clearTint())

    // 無敵時間（点滅）
    this.player.setAlpha(0.5)
    this.time.delayedCall(1000, () => this.player.setAlpha(1))

    if (this.hp <= 0) {
      this.handleGameOver()
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  HPバー描画
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private drawHpBar() {
    this.hpBar.clear()
    const ratio = this.hp / this.maxHp
    const color = ratio > 0.5 ? 0x00ff00 : ratio > 0.25 ? 0xffaa00 : 0xff0000
    this.hpBar.fillStyle(color)
    this.hpBar.fillRect(16, 46, 200 * ratio, 16)
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ゲームオーバー
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private handleGameOver() {
    this.gameOver = true
    this.physics.pause()
    this.player.setTint(0xff0000)

    const gameOverText = this.add.text(480, 270, "GAME OVER", {
      fontSize: "48px",
      fontFamily: "monospace",
      color: "#ff0000",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0)

    const restartText = this.add.text(480, 330, "Press R to restart", {
      fontSize: "20px",
      color: "#ffffff",
    }).setOrigin(0.5).setScrollFactor(0)

    this.input.keyboard!.once("keydown-R", () => {
      this.scene.restart()
    })
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  敵生成ヘルパー
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private createEnemy(x: number, y: number, speed: number) {
    const enemy = this.enemies.create(x, y, "enemy") as Phaser.Physics.Arcade.Sprite
    enemy.setCollideWorldBounds(true)
    enemy.setBounce(1, 0)
    enemy.setVelocityX(speed)
    return enemy
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  矩形テクスチャ生成ヘルパー
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private createRectTexture(key: string, w: number, h: number, color: number) {
    const g = this.add.graphics()
    g.fillStyle(color)
    g.fillRect(0, 0, w, h)
    g.generateTexture(key, w, h)
    g.destroy()
  }
}
```

### サンプルが含む Phaser 機能一覧

| # | 機能 | Phaser API | 説明 |
|---|------|-----------|------|
| 1 | **スコア表示** | `this.add.text().setScrollFactor(0)` | 固定位置の HUD テキスト |
| 2 | **HPバー** | `Graphics.fillRect()` + 毎フレーム再描画 | 色が残量で変化するゲージ |
| 3 | **弾丸発射** | `Group.get()` + `enableBody/disableBody` | オブジェクトプール + クールダウン |
| 4 | **弾丸 × 敵 衝突** | `physics.add.overlap(bullets, enemies, cb)` | 弾が敵に当たると両方消える |
| 5 | **踏みつけ判定** | velocity.y + 位置比較 | 上から踏むと敵を倒す、横からはダメージ |
| 6 | **ノックバック** | `setVelocity(knockDir * 200, -200)` | ダメージ時に吹き飛ぶ |
| 7 | **ダメージフラッシュ** | `setTint() + delayedCall` | 赤く点滅 → 元に戻る |
| 8 | **無敵時間** | `setAlpha(0.5) + delayedCall` | 一定時間ダメージ無効 |
| 9 | **動く足場** | `tweens.add({ yoyo, repeat: -1 })` | 左右に往復する足場 |
| 10 | **コインアニメ** | `tweens.add({ scaleX: 0, yoyo })` | 回転して光る演出 |
| 11 | **スコアポップアップ** | `add.text + tweens(y移動, alpha)` | "+10" が浮いて消える |
| 12 | **画面外落下** | `player.y > 560` チェック | 落下→ダメージ+リスポーン |
| 13 | **クールダウン** | `time.now - lastFireTime` | 連射制限 |
| 14 | **自動消滅** | `time.delayedCall(2000, ...)` | 弾が時間で消える |
| 15 | **ゲームオーバー** | `physics.pause() + restart()` | 全停止 + Rキーリスタート |
| 16 | **重力無効化** | `body.allowGravity = false` | 個別の重力制御 |

---

## 2. 現在のブロックで実現可能 / 不可能な機能

### ✅ 既存ブロックで実現可能

| 機能 | 使用ブロック |
|------|------------|
| 左右移動 + ジャンプ | `sensing_keypressed` + `physics_setvelocityX/Y` + `physics_onground` |
| 重力 / 物理モード | `physics_setgravity` + `physics_setmode` |
| コインに触れた判定 | `sensing_touchingobject` |
| スコア変数 | `data_setvariableto` + `data_changevariableby` |
| スコアテキスト表示 | `looks_addtext` + `looks_updatetext` |
| コインを消す | `physics_disablebody` |
| イベント送信 | `observer_sendevent` + `observer_wheneventreceived` |
| 敵パトロール | `physics_setvelocityX` + `physics_setbounce` + `physics_setcollideworldbounds` |
| クローン生成 | `clone_create` + `clone_whencloned` + `clone_delete` |

### ❌ 不足している機能

---

## 3. 不足ブロック/機能の完全リスト（優先度順）

### 🔴 P0 — 弾丸発射に必須

#### 3-1. スプライトの動的生成（弾丸 = クローン + 速度 + 自動消滅）

弾丸は「クローンを生成 → 位置を設定 → 速度を設定 → 一定時間後に削除」で実現可能だが、**以下が足りない**:

| 不足ブロック | opcode | 説明 |
|-------------|--------|------|
| **クローンの位置を親に合わせる** | *(ロジック改善)* | `clone_create` 時にクローンの初期位置が親と同じになるが、**方向を反映した速度設定**が必要 |
| **個別重力制御** | `physics_setallowgravity` | スプライト単位で重力を無効化（弾丸は重力なし） |
| **一定時間後に実行** | `control_after` | `control_wait` + 後続ブロックで代用可だが、並列実行が必要 |

#### 3-2. 個別重力制御（allowGravity）

| 不足ブロック | opcode | 説明 |
|-------------|--------|------|
| **Set allow gravity [on/off]** | `physics_setallowgravity` | 個別スプライトの重力有効/無効。コインを浮かせる、弾丸を水平に飛ばす等 |

**Phaser:** `body.allowGravity = false`
**現状:** `physics_setmode "dynamic"` にすると重力が自動適用され、個別に無効化できない。

---

### 🟡 P1 — HP・ダメージシステムに必要

#### 3-3. HPバー（グラフィックス描画）

| 不足ブロック | opcode | 説明 |
|-------------|--------|------|
| **Draw rect x: y: w: h: color:** | `graphics_drawrect` | 矩形を描画（HPバーのゲージ） |
| **Clear graphics** | `graphics_clear` | 描画をクリア（再描画前に） |

**代替案:** `looks_addtext` で「████████」のようなテキスト文字列でバーを表現可能。ただし見た目が悪い。

**現実的な対応:** HUD 用の専用ブロックとして「HPバーを表示」を作る方が良い。

| 不足ブロック | opcode | 説明 |
|-------------|--------|------|
| **Show HP bar max: current:** | `hud_showhpbar` | HPバーを画面上部に表示 |
| **Update HP bar to** | `hud_updatehpbar` | HPバーの値を更新 |
| **Hide HP bar** | `hud_hidehpbar` | HPバーを非表示 |

#### 3-4. ダメージ演出

| 不足ブロック | opcode | 説明 |
|-------------|--------|------|
| **Set tint to [color]** | `looks_settint` | スプライトに色を重ねる（ダメージフラッシュ） |
| **Clear tint** | `looks_cleartint` | 色効果を解除 |
| **Set opacity to [0-100]** | `looks_setopacity` | 透明度の設定（無敵時間の点滅） |

#### 3-5. ノックバック

既存ブロックで `physics_setvelocity` を使えば実現可能。ただし「ダメージを受けた瞬間」を検知するイベントが必要。

| 不足ブロック | opcode | 説明 |
|-------------|--------|------|
| **When this sprite touched by [name]** | `event_whentouched` | 衝突した瞬間のイベント（ハット） |

---

### 🟢 P2 — ゲーム体験の向上

#### 3-6. 動く足場 / Tween アニメーション

| 不足ブロック | opcode | 説明 |
|-------------|--------|------|
| **Tween to x: y: over [secs] ease: [type]** | `motion_tweento` | 滑らかな移動アニメーション |
| **Tween loop [yoyo/repeat]** | `motion_tweenloop` | ヨーヨー / リピート設定 |

**代替案:** `motion_glidesecstoxy` + `control_forever` で擬似実現可。ただし ease 関数やヨーヨーがない。

#### 3-7. クールダウン / タイムスタンプ

| 不足ブロック | opcode | 説明 |
|-------------|--------|------|
| **Current time (ms)** | `sensing_currenttime` | 現在のタイムスタンプ（ms） |

**代替案:** `sensing_timer` で秒単位なら可能。

#### 3-8. ゲームリスタート

| 不足ブロック | opcode | 説明 |
|-------------|--------|------|
| **Restart game** | `control_restart` | 全スプライトを初期状態に戻す |

#### 3-9. 向き（左右反転）

| 不足ブロック | opcode | 説明 |
|-------------|--------|------|
| **Set flip x [on/off]** | `looks_setflipx` | スプライトの左右反転 |
| **Facing right?** | `looks_facingright` | 向き判定（boolean） |

#### 3-10. スコアポップアップエフェクト

既存の `looks_sayforsecs` で代用可能だが、位置指定や透明度アニメがない。

| 不足ブロック | opcode | 説明 |
|-------------|--------|------|
| **Show floating text [text] at x: y:** | `looks_floatingtext` | 浮いて消えるテキスト演出 |

---

## 4. 優先度まとめ

```
P0（これがないとシューティング要素が作れない）
  ├── physics_setallowgravity（個別重力制御）    ← 弾丸・浮遊コインに必須
  └── ※ クローン + velocity で弾丸は実現可

P1（HPシステム・ダメージ演出）
  ├── hud_showhpbar / hud_updatehpbar          ← HPバー表示
  ├── looks_settint / looks_cleartint           ← ダメージフラッシュ
  ├── looks_setopacity                          ← 無敵時間の点滅
  └── event_whentouched                         ← 衝突イベントハット

P2（ゲーム体験の向上）
  ├── motion_tweento + motion_tweenloop         ← 動く足場
  ├── control_restart                           ← ゲームリスタート
  ├── looks_setflipx                            ← 左右反転
  └── looks_floatingtext                        ← スコアポップアップ
```

## 5. 実装推奨順序

| 順番 | ブロック | 工数 | 理由 |
|------|---------|------|------|
| 1 | `physics_setallowgravity` | 小 | GameSceneProxy に1メソッド追加するだけ。弾丸+浮遊コインが実現可能に |
| 2 | `looks_settint` / `looks_cleartint` | 小 | Phaser の `setTint`/`clearTint` を呼ぶだけ |
| 3 | `looks_setopacity` | 小 | Phaser の `setAlpha` を呼ぶだけ |
| 4 | `hud_showhpbar` / `hud_updatehpbar` / `hud_hidehpbar` | 中 | GameScene に Graphics 管理を追加 |
| 5 | `event_whentouched` | 中 | 衝突時にスレッド生成する仕組みを Runtime に追加 |
| 6 | `control_restart` | 中 | Runtime.stop + start の再実行ロジック |
| 7 | `looks_setflipx` | 小 | Phaser の `setFlipX` を呼ぶだけ |
| 8 | `motion_tweento` | 中 | Phaser Tween の統合 |
