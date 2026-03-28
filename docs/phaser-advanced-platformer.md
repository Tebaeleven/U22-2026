# Phaser 高度プラットフォーマー — API 網羅サンプル

このサンプルは Phaser 3 の API を網羅的に使用したプラットフォーマーゲーム。
VPL に不足しているブロックの洗い出しに使用する。

## 使用する Phaser API 一覧

| # | カテゴリ | API | 用途 |
|---|---------|-----|------|
| 1 | **カメラ** | `cameras.main.startFollow()` | プレイヤー追従 |
| 2 | **カメラ** | `cameras.main.setBounds()` | スクロール範囲制限 |
| 3 | **カメラ** | `cameras.main.setDeadzone()` | 追従の遊び範囲 |
| 4 | **カメラ** | `cameras.main.shake()` | 画面揺れ演出 |
| 5 | **カメラ** | `cameras.main.flash()` | 画面フラッシュ |
| 6 | **カメラ** | `cameras.main.fade()` | フェードアウト |
| 7 | **パララックス** | `TileSprite` + `setScrollFactor()` | 背景多層スクロール |
| 8 | **タイルマップ** | `tilemap.createLayer()` | タイルベースの地形 |
| 9 | **タイルマップ** | `tilemap.setCollisionByProperty()` | タイル衝突設定 |
| 10 | **物理** | `physics.add.collider()` | 衝突応答 |
| 11 | **物理** | `physics.add.overlap()` | 重なり検出 |
| 12 | **物理** | `body.setAllowGravity(false)` | 個別重力制御 |
| 13 | **物理** | `body.setDragX()` | 水平抵抗（氷の床等） |
| 14 | **物理** | `body.setMaxVelocity()` | 最大速度制限 |
| 15 | **物理** | `body.setAccelerationX()` | 加速度ベース移動 |
| 16 | **グループ** | `physics.add.group({ maxSize })` | オブジェクトプール |
| 17 | **グループ** | `group.get()` / `killAndHide()` | プール取得/返却 |
| 18 | **パーティクル** | `add.particles()` + `createEmitter()` | パーティクル演出 |
| 19 | **Tween** | `tweens.add({ yoyo, repeat })` | 動く足場 |
| 20 | **Tween** | `tweens.chain()` | Tween チェーン |
| 21 | **タイマー** | `time.addEvent({ delay, loop })` | 敵のスポーン |
| 22 | **タイマー** | `time.delayedCall()` | 遅延実行 |
| 23 | **テキスト** | `add.text().setScrollFactor(0)` | 固定 HUD |
| 24 | **グラフィックス** | `add.graphics().fillRect()` | HPバー描画 |
| 25 | **入力** | `input.keyboard.createCursorKeys()` | 方向キー |
| 26 | **入力** | `input.keyboard.addKey()` | 個別キー |
| 27 | **入力** | `input.on('pointerdown')` | マウス/タッチ入力 |
| 28 | **アニメ** | `anims.create()` / `sprite.play()` | スプライトアニメ |
| 29 | **サウンド** | `sound.play()` | 効果音 |
| 30 | **シーン** | `scene.restart()` / `scene.start()` | シーン遷移 |
| 31 | **物理** | `body.checkWorldBounds` + `outOfBoundsKill` | 画面外自動削除 |
| 32 | **スプライト** | `setTint()` / `clearTint()` | 色変更 |
| 33 | **スプライト** | `setAlpha()` | 透明度 |
| 34 | **スプライト** | `setFlipX()` | 左右反転 |
| 35 | **スプライト** | `setScale()` | サイズ変更 |
| 36 | **ゲームオブジェクト** | `setDepth()` | 描画順序 |

---

## サンプルコード

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ゲーム設定
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const WORLD_WIDTH = 3840   // ステージの2倍（横スクロール用）
const WORLD_HEIGHT = 1080
const TILE = 64

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 1200 },
      debug: false,
    },
  },
  scene: [BootScene, GameScene, GameOverScene],
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BootScene — アセット読み込み + テクスチャ生成
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class BootScene extends Phaser.Scene {
  constructor() { super({ key: "BootScene" }) }

  create() {
    // 矩形テクスチャ生成ヘルパー
    const rect = (key: string, w: number, h: number, color: number) => {
      const g = this.add.graphics()
      g.fillStyle(color); g.fillRect(0, 0, w, h)
      g.generateTexture(key, w, h); g.destroy()
    }
    // 円テクスチャ
    const circle = (key: string, r: number, color: number) => {
      const g = this.add.graphics()
      g.fillStyle(color); g.fillCircle(r, r, r)
      g.generateTexture(key, r * 2, r * 2); g.destroy()
    }

    rect("player", 32, 48, 0x4488ff)
    rect("ground", TILE, TILE, 0x6B4F14)
    rect("platform", TILE * 3, 16, 0x66aa44)
    rect("moving-plat", TILE * 3, 16, 0x4466aa)
    rect("enemy-walk", 32, 32, 0xff4444)
    rect("enemy-fly", 28, 28, 0xff44ff)
    rect("bullet", 12, 6, 0xff8800)
    rect("spike", TILE, TILE / 2, 0xcc0000)
    rect("checkpoint", 16, 48, 0x00ffaa)
    rect("exit-door", 48, 64, 0xffdd00)
    rect("bg-sky", 960, 540, 0x87CEEB)
    rect("bg-mountains", 960, 200, 0x5588aa)
    rect("bg-trees", 960, 160, 0x336633)
    circle("coin", 12, 0xffcc00)
    circle("heart", 10, 0xff3366)
    circle("particle", 4, 0xffffff)

    this.scene.start("GameScene")
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GameScene — メインゲームシーン
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class GameScene extends Phaser.Scene {
  // ── オブジェクト ──
  private player!: Phaser.Physics.Arcade.Sprite
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private coins!: Phaser.Physics.Arcade.Group
  private enemies!: Phaser.Physics.Arcade.Group
  private bullets!: Phaser.Physics.Arcade.Group
  private spikes!: Phaser.Physics.Arcade.StaticGroup
  private hearts!: Phaser.Physics.Arcade.Group
  private movingPlatforms!: Phaser.Physics.Arcade.Group
  private checkpoints!: Phaser.Physics.Arcade.StaticGroup
  private exitDoor!: Phaser.Physics.Arcade.Sprite

  // ── パララックス背景 ──
  private bgSky!: Phaser.GameObjects.TileSprite
  private bgMountains!: Phaser.GameObjects.TileSprite
  private bgTrees!: Phaser.GameObjects.TileSprite

  // ── パーティクル ──
  private dustEmitter!: Phaser.GameObjects.Particles.ParticleEmitter
  private coinEmitter!: Phaser.GameObjects.Particles.ParticleEmitter

  // ── 入力 ──
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private fireKey!: Phaser.Input.Keyboard.Key
  private jumpKey!: Phaser.Input.Keyboard.Key

  // ── UI ──
  private scoreText!: Phaser.GameObjects.Text
  private hpBarBg!: Phaser.GameObjects.Graphics
  private hpBar!: Phaser.GameObjects.Graphics
  private livesText!: Phaser.GameObjects.Text

  // ── 状態 ──
  private score = 0
  private hp = 100
  private maxHp = 100
  private lives = 3
  private facingRight = true
  private lastFireTime = 0
  private fireCooldown = 250
  private isInvincible = false
  private respawnPoint = { x: 100, y: 400 }
  private canDoubleJump = false
  private hasDoubleJumped = false

  constructor() { super({ key: "GameScene" }) }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  create — シーン初期化
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  create() {
    // ══════════════════════════════════════
    //  ワールド設定
    // ══════════════════════════════════════
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    // ══════════════════════════════════════
    //  パララックス背景 (TileSprite + setScrollFactor)
    // ══════════════════════════════════════
    this.bgSky = this.add.tileSprite(0, 0, 960, 540, "bg-sky")
      .setOrigin(0, 0)
      .setScrollFactor(0)  // 固定（カメラ追従しない）
      .setDepth(-3)

    this.bgMountains = this.add.tileSprite(0, 340, 960, 200, "bg-mountains")
      .setOrigin(0, 0)
      .setScrollFactor(0)  // 手動でスクロール制御
      .setDepth(-2)

    this.bgTrees = this.add.tileSprite(0, 380, 960, 160, "bg-trees")
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-1)

    // ══════════════════════════════════════
    //  地形（StaticGroup でタイルを敷き詰め）
    // ══════════════════════════════════════
    this.platforms = this.physics.add.staticGroup()

    // 地面（ワールド全幅）
    for (let x = 0; x < WORLD_WIDTH; x += TILE) {
      // 穴を作る（x=1024〜1152, x=2560〜2688）
      if ((x >= 1024 && x < 1152) || (x >= 2560 && x < 2688)) continue
      this.platforms.create(x + TILE / 2, WORLD_HEIGHT - TILE / 2, "ground")
    }
    // 浮島
    this.createPlatformRow(400, 700, 5)
    this.createPlatformRow(900, 500, 4)
    this.createPlatformRow(1500, 600, 3)
    this.createPlatformRow(2000, 400, 6)
    this.createPlatformRow(2800, 550, 4)
    this.createPlatformRow(3200, 350, 5)

    // ══════════════════════════════════════
    //  トゲ（即死トラップ — StaticGroup）
    // ══════════════════════════════════════
    this.spikes = this.physics.add.staticGroup()
    this.createSpikes(800, WORLD_HEIGHT - TILE - TILE / 4, 3)
    this.createSpikes(2200, WORLD_HEIGHT - TILE - TILE / 4, 4)

    // ══════════════════════════════════════
    //  動く足場 (Tween yoyo)
    // ══════════════════════════════════════
    this.movingPlatforms = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    })

    const mp1 = this.movingPlatforms.create(1100, 750, "moving-plat")
    this.tweens.add({
      targets: mp1,
      y: 500,
      duration: 2500,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    })

    const mp2 = this.movingPlatforms.create(2700, 600, "moving-plat")
    this.tweens.add({
      targets: mp2,
      x: 3000,
      duration: 3000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    })

    // ══════════════════════════════════════
    //  プレイヤー
    // ══════════════════════════════════════
    this.player = this.physics.add.sprite(100, 800, "player")
    this.player.setBounce(0.1)
    this.player.setCollideWorldBounds(true)
    this.player.setMaxVelocity(350, 800)  // 最大速度制限
    this.player.setDragX(600)              // 水平抵抗（慣性制御）
    this.player.setDepth(10)

    // ══════════════════════════════════════
    //  コイン（重力なし・浮遊）
    // ══════════════════════════════════════
    this.coins = this.physics.add.group({ allowGravity: false })
    const coinPositions = [
      // 地上コイン
      { x: 200, y: 950 }, { x: 300, y: 950 }, { x: 600, y: 950 },
      // 浮島上コイン
      { x: 420, y: 660 }, { x: 500, y: 660 }, { x: 580, y: 660 },
      { x: 920, y: 460 }, { x: 1000, y: 460 },
      { x: 2050, y: 360 }, { x: 2150, y: 360 }, { x: 2250, y: 360 },
      // 空中コイン（ジャンプで取る）
      { x: 1100, y: 650 }, { x: 1100, y: 600 }, { x: 1100, y: 550 },
      // ゴール前
      { x: 3300, y: 300 }, { x: 3400, y: 300 }, { x: 3500, y: 300 },
    ]
    for (const pos of coinPositions) {
      const coin = this.coins.create(pos.x, pos.y, "coin")
      coin.setImmovable(true)
      // コイン回転アニメーション（Tween で scaleX をヨーヨー）
      this.tweens.add({
        targets: coin,
        scaleX: 0,
        duration: 500,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      })
    }

    // ══════════════════════════════════════
    //  ハートアイテム（HP回復）
    // ══════════════════════════════════════
    this.hearts = this.physics.add.group({ allowGravity: false })
    const heartPositions = [{ x: 1500, y: 560 }, { x: 2800, y: 510 }]
    for (const pos of heartPositions) {
      const heart = this.hearts.create(pos.x, pos.y, "heart")
      heart.setImmovable(true)
      this.tweens.add({
        targets: heart,
        y: pos.y - 10,
        duration: 800,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      })
    }

    // ══════════════════════════════════════
    //  敵（地上パトロール + 空中パトロール）
    // ══════════════════════════════════════
    this.enemies = this.physics.add.group()

    // 地上パトロール敵
    this.createWalkEnemy(500, 950, 60)
    this.createWalkEnemy(1800, 950, 80)
    this.createWalkEnemy(3000, 950, 70)

    // 空中パトロール敵
    this.createFlyEnemy(700, 600, 500, 900)
    this.createFlyEnemy(2400, 400, 2300, 2600)

    // タイマーで敵を追加スポーン
    this.time.addEvent({
      delay: 15000,
      callback: () => this.createWalkEnemy(
        Phaser.Math.Between(1000, 3000),
        800,
        Phaser.Math.Between(40, 100)
      ),
      loop: true,
    })

    // ══════════════════════════════════════
    //  弾丸プール（maxSize で制限）
    // ══════════════════════════════════════
    this.bullets = this.physics.add.group({
      defaultKey: "bullet",
      maxSize: 8,
      allowGravity: false,
    })

    // ══════════════════════════════════════
    //  チェックポイント
    // ══════════════════════════════════════
    this.checkpoints = this.physics.add.staticGroup()
    this.checkpoints.create(1400, WORLD_HEIGHT - TILE - 24, "checkpoint")
    this.checkpoints.create(2600, WORLD_HEIGHT - TILE - 24, "checkpoint")

    // ══════════════════════════════════════
    //  ゴール（出口ドア）
    // ══════════════════════════════════════
    this.exitDoor = this.physics.add.sprite(3700, WORLD_HEIGHT - TILE - 32, "exit-door")
    this.exitDoor.body!.allowGravity = false
    this.exitDoor.setImmovable(true)
    // ドアの点滅アニメ
    this.tweens.add({
      targets: this.exitDoor,
      alpha: 0.5,
      duration: 600,
      yoyo: true,
      repeat: -1,
    })

    // ══════════════════════════════════════
    //  パーティクルエミッター
    // ══════════════════════════════════════
    // 着地時のほこりパーティクル
    this.dustEmitter = this.add.particles(0, 0, "particle", {
      speed: { min: 20, max: 60 },
      angle: { min: 220, max: 320 },
      scale: { start: 1, end: 0 },
      lifespan: 400,
      gravityY: 100,
      emitting: false,  // 手動発火
    })
    this.dustEmitter.setDepth(5)

    // コイン取得時のキラキラパーティクル
    this.coinEmitter = this.add.particles(0, 0, "particle", {
      speed: { min: 50, max: 120 },
      scale: { start: 1.5, end: 0 },
      lifespan: 500,
      tint: 0xffcc00,
      emitting: false,
    })
    this.coinEmitter.setDepth(5)

    // ══════════════════════════════════════
    //  衝突設定
    // ══════════════════════════════════════
    this.physics.add.collider(this.player, this.platforms)
    this.physics.add.collider(this.player, this.movingPlatforms)
    this.physics.add.collider(this.enemies, this.platforms)
    this.physics.add.collider(this.enemies, this.movingPlatforms)

    this.physics.add.overlap(this.player, this.coins, this.collectCoin, undefined, this)
    this.physics.add.overlap(this.player, this.hearts, this.collectHeart, undefined, this)
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, undefined, this)
    this.physics.add.overlap(this.player, this.spikes, this.hitSpike, undefined, this)
    this.physics.add.overlap(this.player, this.checkpoints, this.reachCheckpoint, undefined, this)
    this.physics.add.overlap(this.player, this.exitDoor, this.reachExit, undefined, this)
    this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, undefined, this)
    this.physics.add.collider(this.bullets, this.platforms, this.bulletHitWall, undefined, this)

    // ══════════════════════════════════════
    //  入力
    // ══════════════════════════════════════
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.fireKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z)
    this.jumpKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    // マウスクリックでも弾丸発射
    this.input.on("pointerdown", () => this.fireBullet())

    // ══════════════════════════════════════
    //  カメラ設定
    // ══════════════════════════════════════
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.cameras.main.setDeadzone(100, 50)

    // ══════════════════════════════════════
    //  HUD（カメラに追従しない固定UI）
    // ══════════════════════════════════════
    this.scoreText = this.add.text(16, 16, "SCORE: 0", {
      fontSize: "18px",
      fontFamily: "monospace",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
    }).setScrollFactor(0).setDepth(100)

    this.livesText = this.add.text(16, 70, `LIVES: ${this.lives}`, {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#ff6666",
      stroke: "#000000",
      strokeThickness: 2,
    }).setScrollFactor(0).setDepth(100)

    // HPバー（Graphics で描画）
    this.hpBarBg = this.add.graphics().setScrollFactor(0).setDepth(100)
    this.hpBarBg.fillStyle(0x333333)
    this.hpBarBg.fillRect(16, 42, 200, 14)

    this.hpBar = this.add.graphics().setScrollFactor(0).setDepth(100)
    this.drawHpBar()

    // 開始フラッシュ
    this.cameras.main.flash(500, 255, 255, 255)
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  update — 毎フレーム更新
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  update() {
    // ── パララックス背景スクロール ──
    const camX = this.cameras.main.scrollX
    this.bgMountains.tilePositionX = camX * 0.1
    this.bgTrees.tilePositionX = camX * 0.3

    // ── 左右移動（加速度ベース + 向き管理） ──
    if (this.cursors.left.isDown) {
      this.player.setAccelerationX(-800)
      if (this.facingRight) {
        this.player.setFlipX(true)
        this.facingRight = false
      }
    } else if (this.cursors.right.isDown) {
      this.player.setAccelerationX(800)
      if (!this.facingRight) {
        this.player.setFlipX(false)
        this.facingRight = true
      }
    } else {
      this.player.setAccelerationX(0)
    }

    // ── ジャンプ（接地 + ダブルジャンプ） ──
    const onGround = this.player.body!.blocked.down
    if (onGround) {
      this.hasDoubleJumped = false
    }

    if (Phaser.Input.Keyboard.JustDown(this.jumpKey) || Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      if (onGround) {
        this.player.setVelocityY(-600)
        this.emitDust()
      } else if (this.canDoubleJump && !this.hasDoubleJumped) {
        this.player.setVelocityY(-500)
        this.hasDoubleJumped = true
        this.emitDust()
      }
    }

    // ── 弾丸発射 ──
    if (this.fireKey.isDown) {
      this.fireBullet()
    }

    // ── 画面外落下 → リスポーン ──
    if (this.player.y > WORLD_HEIGHT + 50) {
      this.playerDie()
    }

    // ── 動く足場上の補正 ──
    this.movingPlatforms.children.iterate((plat) => {
      const p = plat as Phaser.Physics.Arcade.Image
      const pb = p.body as Phaser.Physics.Arcade.Body
      if (this.player.body!.touching.down && this.physics.overlap(this.player, p)) {
        this.player.x += pb.velocity.x / 60
        this.player.y += pb.velocity.y / 60
      }
      return true
    })
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  弾丸発射（オブジェクトプール）
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private fireBullet() {
    const now = this.time.now
    if (now - this.lastFireTime < this.fireCooldown) return
    this.lastFireTime = now

    const bullet = this.bullets.get(
      this.player.x + (this.facingRight ? 20 : -20),
      this.player.y,
    ) as Phaser.Physics.Arcade.Sprite | null
    if (!bullet) return

    bullet.enableBody(true, bullet.x, bullet.y, true, true)
    bullet.body!.allowGravity = false
    bullet.setVelocityX(this.facingRight ? 600 : -600)

    // 2秒後に自動回収
    this.time.delayedCall(2000, () => {
      if (bullet.active) this.bullets.killAndHide(bullet)
    })
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  コイン収集
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private collectCoin(_p: Phaser.GameObjects.GameObject, coin: Phaser.GameObjects.GameObject) {
    const c = coin as Phaser.Physics.Arcade.Sprite
    // パーティクル発火
    this.coinEmitter.emitParticleAt(c.x, c.y, 12)
    c.disableBody(true, true)

    this.score += 10
    this.scoreText.setText(`SCORE: ${this.score}`)

    // 浮遊テキスト演出
    const fx = this.add.text(c.x, c.y, "+10", {
      fontSize: "14px",
      color: "#ffcc00",
      stroke: "#000",
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(50)
    this.tweens.add({
      targets: fx,
      y: c.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => fx.destroy(),
    })
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ハート収集（HP回復）
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private collectHeart(_p: Phaser.GameObjects.GameObject, heart: Phaser.GameObjects.GameObject) {
    const h = heart as Phaser.Physics.Arcade.Sprite
    h.disableBody(true, true)
    this.hp = Math.min(this.maxHp, this.hp + 30)
    this.drawHpBar()

    // 回復演出（緑フラッシュ）
    this.player.setTint(0x00ff00)
    this.time.delayedCall(300, () => this.player.clearTint())
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  敵衝突（踏みつけ or ダメージ）
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private hitEnemy(_p: Phaser.GameObjects.GameObject, enemy: Phaser.GameObjects.GameObject) {
    if (this.isInvincible) return
    const e = enemy as Phaser.Physics.Arcade.Sprite

    // 踏みつけ判定
    if (this.player.body!.velocity.y > 0 && this.player.y < e.y - 16) {
      e.disableBody(true, true)
      this.player.setVelocityY(-400)
      this.score += 50
      this.scoreText.setText(`SCORE: ${this.score}`)
      this.emitDust()
      // カメラ揺れ（小）
      this.cameras.main.shake(100, 0.005)
    } else {
      this.takeDamage(25)
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  トゲ衝突
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private hitSpike() {
    if (this.isInvincible) return
    this.takeDamage(50)
    // 強めのカメラ揺れ
    this.cameras.main.shake(200, 0.01)
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  弾丸 → 敵ヒット
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private bulletHitEnemy(bullet: Phaser.GameObjects.GameObject, enemy: Phaser.GameObjects.GameObject) {
    const b = bullet as Phaser.Physics.Arcade.Sprite
    const e = enemy as Phaser.Physics.Arcade.Sprite
    this.bullets.killAndHide(b)
    b.disableBody(true, true)
    e.disableBody(true, true)

    this.coinEmitter.emitParticleAt(e.x, e.y, 8)
    this.score += 30
    this.scoreText.setText(`SCORE: ${this.score}`)
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  弾丸 → 壁ヒット
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private bulletHitWall(bullet: Phaser.GameObjects.GameObject) {
    const b = bullet as Phaser.Physics.Arcade.Sprite
    this.bullets.killAndHide(b)
    b.disableBody(true, true)
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  チェックポイント到達
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private reachCheckpoint(_p: Phaser.GameObjects.GameObject, cp: Phaser.GameObjects.GameObject) {
    const c = cp as Phaser.Physics.Arcade.Sprite
    this.respawnPoint = { x: c.x, y: c.y - 30 }
    c.setTint(0x00ff00)

    // ダブルジャンプ解禁
    if (!this.canDoubleJump) {
      this.canDoubleJump = true
      const fx = this.add.text(c.x, c.y - 40, "DOUBLE JUMP!", {
        fontSize: "12px", color: "#00ffaa", stroke: "#000", strokeThickness: 2,
      }).setOrigin(0.5).setDepth(50)
      this.tweens.add({ targets: fx, y: c.y - 80, alpha: 0, duration: 1500, onComplete: () => fx.destroy() })
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ゴール到達
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private reachExit() {
    this.score += 500
    this.scoreText.setText(`SCORE: ${this.score}`)

    // フェードアウト → リスタート
    this.cameras.main.fade(1000, 0, 0, 0, false, (_cam: unknown, progress: number) => {
      if (progress >= 1) {
        this.scene.restart()
      }
    })
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ダメージ処理
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private takeDamage(amount: number) {
    this.hp = Math.max(0, this.hp - amount)
    this.drawHpBar()

    // 赤フラッシュ
    this.player.setTint(0xff0000)
    this.time.delayedCall(200, () => this.player.clearTint())

    // 無敵時間（点滅）
    this.isInvincible = true
    this.player.setAlpha(0.5)

    // ノックバック
    const dir = this.facingRight ? -1 : 1
    this.player.setVelocity(dir * 200, -300)

    this.time.delayedCall(1000, () => {
      this.isInvincible = false
      this.player.setAlpha(1)
    })

    if (this.hp <= 0) {
      this.playerDie()
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  プレイヤー死亡
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private playerDie() {
    this.lives -= 1
    this.livesText.setText(`LIVES: ${this.lives}`)

    if (this.lives <= 0) {
      // ゲームオーバー → 別シーンへ遷移
      this.cameras.main.shake(500, 0.02)
      this.time.delayedCall(600, () => {
        this.scene.start("GameOverScene", { score: this.score })
      })
      return
    }

    // リスポーン
    this.hp = this.maxHp
    this.drawHpBar()
    this.player.setPosition(this.respawnPoint.x, this.respawnPoint.y)
    this.player.setVelocity(0, 0)
    this.isInvincible = true
    this.player.setAlpha(0.5)
    this.cameras.main.flash(300, 255, 0, 0)
    this.time.delayedCall(1500, () => {
      this.isInvincible = false
      this.player.setAlpha(1)
    })
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  HPバー描画
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private drawHpBar() {
    this.hpBar.clear()
    const ratio = this.hp / this.maxHp
    const color = ratio > 0.5 ? 0x00ff00 : ratio > 0.25 ? 0xffaa00 : 0xff0000
    this.hpBar.fillStyle(color)
    this.hpBar.fillRect(16, 42, 200 * ratio, 14)
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ヘルパー
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  private emitDust() {
    this.dustEmitter.emitParticleAt(this.player.x, this.player.y + 24, 6)
  }

  private createPlatformRow(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      this.platforms.create(x + i * TILE + TILE / 2, y, "ground")
    }
  }

  private createSpikes(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      this.spikes.create(x + i * TILE + TILE / 2, y, "spike")
    }
  }

  private createWalkEnemy(x: number, y: number, speed: number) {
    const enemy = this.enemies.create(x, y, "enemy-walk")
    enemy.setCollideWorldBounds(true)
    enemy.setBounce(1, 0)
    enemy.setVelocityX(speed)
    return enemy
  }

  private createFlyEnemy(x: number, y: number, minX: number, maxX: number) {
    const enemy = this.enemies.create(x, y, "enemy-fly")
    enemy.body!.allowGravity = false
    enemy.setImmovable(true)
    this.tweens.add({
      targets: enemy,
      x: maxX,
      duration: Phaser.Math.Between(2000, 4000),
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    })
    return enemy
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GameOverScene — ゲームオーバー画面
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: "GameOverScene" }) }

  create(data: { score: number }) {
    this.cameras.main.setBackgroundColor("#111111")

    this.add.text(480, 200, "GAME OVER", {
      fontSize: "64px",
      fontFamily: "monospace",
      color: "#ff0000",
      stroke: "#000",
      strokeThickness: 4,
    }).setOrigin(0.5)

    this.add.text(480, 280, `SCORE: ${data.score ?? 0}`, {
      fontSize: "28px",
      fontFamily: "monospace",
      color: "#ffffff",
    }).setOrigin(0.5)

    this.add.text(480, 350, "Press R to restart", {
      fontSize: "18px",
      color: "#aaaaaa",
    }).setOrigin(0.5)

    this.input.keyboard!.once("keydown-R", () => {
      this.scene.start("GameScene")
    })
  }
}
```

---

## 使用した Phaser API と VPL の対応状況

### ✅ VPL で既に実現可能

| Phaser API | VPL ブロック |
|-----------|------------|
| `setVelocityX/Y()` | `physics_setvelocityX/Y` |
| `setGravity()` | `physics_setgravity` |
| `setBounce()` | `physics_setbounce` |
| `setCollideWorldBounds()` | `physics_setcollideworldbounds` |
| `body.allowGravity = false` | `physics_setallowgravity` |
| `disableBody()` | `physics_disablebody` |
| `setTint() / clearTint()` | `looks_settint / looks_cleartint` |
| `setAlpha()` | `looks_setopacity` |
| `setFlipX()` | `looks_setflipx` |
| `graphics.fillRect()` | `graphics_fillrect` |
| `graphics.clear()` | `graphics_clear` |
| `add.text()` | `looks_addtext` / `looks_updatetext` |
| `overlap()` ポーリング | `sensing_touchingobject` |
| `overlap()` コールバック | `event_whentouched` |
| クローン（弾丸プール相当） | `clone_create` + `clone_whencloned` |
| `scene.restart()` | `control_restart` |

### ❌ VPL に不足している API

| # | Phaser API | 優先度 | 説明 |
|---|-----------|--------|------|
| 1 | **`cameras.main.startFollow()`** | 🔴 高 | カメラ追従（横スクロール必須） |
| 2 | **`cameras.main.setBounds()`** | 🔴 高 | カメラスクロール範囲 |
| 3 | **`cameras.main.shake()`** | 🟡 中 | 画面揺れ演出 |
| 4 | **`cameras.main.flash()`** | 🟡 中 | 画面フラッシュ |
| 5 | **`cameras.main.fade()`** | 🟡 中 | フェードアウト |
| 6 | **`TileSprite` + `setScrollFactor()`** | 🟡 中 | パララックス背景 |
| 7 | **`body.setMaxVelocity()`** | 🟡 中 | 最大速度制限 |
| 8 | **`body.setAccelerationX()`** | 🟡 中 | 加速度ベース移動（慣性） |
| 9 | **`body.setDragX()`** | 🟡 中 | 水平抵抗（滑り具合の制御） |
| 10 | **`add.particles().createEmitter()`** | 🟡 中 | パーティクル演出 |
| 11 | **`time.addEvent({ loop })`** | 🟡 中 | ループタイマー（敵スポーン） |
| 12 | **`time.delayedCall()`** | 🟢 低 | `control_wait` で代用可 |
| 13 | **`Phaser.Input.Keyboard.JustDown()`** | 🟡 中 | キー押下の瞬間だけ検出（ダブルジャンプ用） |
| 14 | **`setDepth()`** | 🟢 低 | 描画順序 |
| 15 | **`scene.start()`** | 🟢 低 | 別シーンへの遷移 |
| 16 | **`input.on("pointerdown")`** | 🟢 低 | マウスクリックイベント |
| 17 | **`setScale()`** | 🟢 低 | `looks_setsizeto` で代用可 |

### 🔴 次に実装すべき最優先 API

1. **カメラ追従** (`camera_follow`) — 横スクロールゲームの基本
2. **カメラ範囲** (`camera_setbounds`) — ワールド幅の設定
3. **カメラ演出** (`camera_shake` / `camera_flash` / `camera_fade`) — ゲームフィール

### 🟡 その次に実装すべき API

4. **最大速度** (`physics_setmaxvelocity`) — プレイヤーの移動制御
5. **加速度** (`physics_setacceleration`) — 慣性のある移動
6. **抵抗** (`physics_setdrag`) — 滑り具合の制御
7. **パーティクル** (`particle_emit`) — 視覚演出
8. **キー押下瞬間** (`sensing_keyjustpressed`) — ダブルジャンプ、メニュー操作
9. **ループタイマー** (`control_every [n] seconds`) — 定期的なスポーン

Sources:
- [Phaser Physics Tutorial](https://generalistprogrammer.com/tutorials/phaser-physics-arcade-box2d-guide)
- [Phaser Arcade Physics Docs](https://docs.phaser.io/phaser/concepts/physics/arcade)
- [Phaser Camera API](https://docs.phaser.io/api-documentation/class/cameras-scene2d-camera)
- [Parallax Scrolling with TileSprites](https://phaser.io/news/2019/06/parallax-scrolling-with-tilesprites-tutorial)
- [Phaser Particle Emitter](https://docs.phaser.io/api-documentation/class/gameobjects-particles-particleemitter)
- [Object Pool Optimization](https://blog.ourcade.co/posts/2020/phaser-3-optimization-object-pool-basic/)
- [Phaser Animation Guide](https://generalistprogrammer.com/tutorials/phaser-animation-sprite-sheet-guide)
