# プラットフォーマー実装に必要なブロックのギャップ分���

## 1. Phaser プラットフォーマー サンプルコード

シンプルだが網羅的なプラットフォーマーの構成要素を含むサンプル。

```typescript
// ─── ゲーム設定 ───
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: { gravity: { x: 0, y: 800 }, debug: false },
  },
  scene: PlatformerScene,
}

class PlatformerScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private coins!: Phaser.Physics.Arcade.Group
  private enemies!: Phaser.Physics.Arcade.Group
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private scoreText!: Phaser.GameObjects.Text
  private score = 0
  private gameOver = false

  // ─── アセット読��込み ───
  preload() {
    this.load.image("sky", "assets/sky.png")
    this.load.image("ground", "assets/ground.png")
    this.load.image("coin", "assets/coin.png")
    this.load.image("enemy", "assets/enemy.png")
    this.load.spritesheet("player", "assets/player.png", {
      frameWidth: 32,
      frameHeight: 48,
    })
  }

  // ─── シーン初期化 ───
  create() {
    // --- 背景 ---
    this.add.image(400, 300, "sky")

    // --- 地形（静的物理ボディ） ---
    this.platforms = this.physics.add.staticGroup()
    this.platforms.create(400, 580, "ground").setScale(2).refreshBody() // 地面
    this.platforms.create(600, 400, "ground")  // 浮島1
    this.platforms.create(50, 250, "ground")   // 浮島2
    this.platforms.create(750, 220, "ground")  // 浮島3

    // --- プレイヤー（動的物理ボディ） ---
    this.player = this.physics.add.sprite(100, 450, "player")
    this.player.setBounce(0.1)
    this.player.setCollideWorldBounds(true)

    // --- プレイヤーアニメ���ション ---
    this.anims.create({
      key: "walk-left",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    })
    this.anims.create({
      key: "walk-right",
      frames: this.anims.generateFrameNumbers("player", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    })
    this.anims.create({
      key: "idle",
      frames: [{ key: "player", frame: 4 }],
      frameRate: 20,
    })

    // --- コイン（収集アイテム） ---
    this.coins = this.physics.add.group({
      key: "coin",
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 },
    })
    this.coins.children.iterate((child) => {
      const coin = child as Phaser.Physics.Arcade.Sprite
      coin.setBounceY(Phaser.Math.FloatBetween(0.2, 0.4))
      return true
    })

    // --- 敵キャラ（パトロール移動） ---
    this.enemies = this.physics.add.group()
    const enemy1 = this.enemies.create(300, 360, "enemy")
    enemy1.setVelocityX(100)
    enemy1.setBounce(1, 0)
    enemy1.setCollideWorldBounds(true)
    const enemy2 = this.enemies.create(700, 180, "enemy")
    enemy2.setVelocityX(-80)
    enemy2.setBounce(1, 0)
    enemy2.setCollideWorldBounds(true)

    // --- スコア表示（UI テキス���） ---
    this.scoreText = this.add.text(16, 16, "スコア: 0", {
      fontSize: "24px",
      color: "#000",
    })

    // --- 衝突設定 ---
    // プレイヤー ↔ 地形: 乗れる
    this.physics.add.collider(this.player, this.platforms)
    // コイン ↔ 地形: コインが地面に落ちる
    this.physics.add.collider(this.coins, this.platforms)
    // 敵 ↔ 地形: 敵が地面を歩く
    this.physics.add.collider(this.enemies, this.platforms)
    // プレイヤー ↔ コイン: 拾う → コールバック
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, undefined, this)
    // プレイヤー ↔ 敵: 当たる → コールバック
    this.physics.add.collider(this.player, this.enemies, this.hitEnemy, undefined, this)

    // --- キーボード入力 ---
    this.cursors = this.input.keyboard!.createCursorKeys()
  }

  // ─── 毎フレーム更新 ─��─
  update() {
    if (this.gameOver) return

    // --- 左右移動 ---
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-200)
      this.player.anims.play("walk-left", true)
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(200)
      this.player.anims.play("walk-right", true)
    } else {
      this.player.setVelocityX(0)
      this.player.anims.play("idle", true)
    }

    // --- ジャンプ（接地時の���） ---
    if (this.cursors.up.isDown && this.player.body!.touching.down) {
      this.player.setVelocityY(-500)
    }

    // --- 画面外に落ちたらゲ��ムオーバー ---
    if (this.player.y > 600) {
      this.handleGameOver()
    }
  }

  // ─── コイン収集コールバック ───
  private collectCoin(
    _player: Phaser.GameObjects.GameObject,
    coin: Phaser.GameObjects.GameObject,
  ) {
    const c = coin as Phaser.Physics.Arcade.Sprite
    c.disableBody(true, true) // 非表示 + 物理無効化

    this.score += 10
    this.scoreText.setText(`スコア: ${this.score}`)

    // 全コイン回収 → 再配置
    if (this.coins.countActive(true) === 0) {
      this.coins.children.iterate((child) => {
        const coin = child as Phaser.Physics.Arcade.Sprite
        coin.enableBody(true, coin.x, 0, true, true)
        return true
      })
    }
  }

  // ─── 敵衝突コールバック ───
  private hitEnemy(
    _player: Phaser.GameObjects.GameObject,
    _enemy: Phaser.GameObjects.GameObject,
  ) {
    // 踏みつけ判定（プレイヤーが上から落下中）
    if (this.player.body!.velocity.y > 0 && this.player.y < (_enemy as Phaser.Physics.Arcade.Sprite).y) {
      // 敵を倒す
      const enemy = _enemy as Phaser.Physics.Arcade.Sprite
      enemy.disableBody(true, true)
      this.player.setVelocityY(-300) // 踏みつけバウンス
      this.score += 50
      this.scoreText.setText(`スコア: ${this.score}`)
    } else {
      // ダメージ
      this.handleGameOver()
    }
  }

  // ─── ゲー��オーバー処理 ───
  private handleGameOver() {
    this.gameOver = true
    this.physics.pause()
    this.player.setTint(0xff0000)
    this.add.text(400, 300, "GAME OVER", {
      fontSize: "64px",
      color: "#ff0000",
    }).setOrigin(0.5)
  }
}
```

### サンプルが含む要素一覧

| カテゴリ | 要素 | 説明 |
|---------|------|------|
| **シーン管理** | preload / create / update | ライフサイクル |
| **アセット** | 画像読み込み、スプライトシート | テクスチャ管理 |
| **地形** | StaticGroup で複数配置 | 静的物理ボディ |
| **プレイヤー** | 動的スプライト + バウンス + ワールド境界 | 動的物理ボディ |
| **アニメーション** | スプライトシートからフレームアニメ | コスチューム切替の上位互換 |
| **アイテム** | コインをグループで配置・収集・再配置 | オブジェクトプール |
| **敵** | パトロール移動 + 踏みつけ判定 | AI + 衝突コールバック |
| **入力** | カーソルキーで移動・ジャンプ | ��ー入力 |
| **物理** | 重力・速度・バウンス・衝突・オーバーラップ | Arcade Physics |
| **UI** | スコア表示（テキスト） | HUD |
| **ゲーム状態** | ゲームオーバー + 一時停止 | 状態管理 |
| **座標** | ワールド境界、画面外判定 | 空間管理 |

---

## 2. 現在のブロックで表現した疑似コード

### 現在のブロックで可能な部分

```
═══════════════════════════════════════
 スプライト「プレイヤー」
���═════════════���════════════════════════

🟡 [🚩 がクリックされたとき]
  🟠 [物理モードを「dynamic」にする]
  🟠 [重力を 800 にする]
  🟦 [x座標を 100 にする]
  🟦 [y座標�� 450 にする]

🟡 [🚩 が���リックされたとき]              ← ゲームループ
  🟠 [ずっと]
    🟢 [もし <「左矢印」キーが押された> なら]
      🟠 [x方向の速度を -200 にする]
    [でなければ]
      🟢 [もし <���右矢印」キーが押された> なら]
        🟠 [x方向の速度を 200 にする]
      [でなければ]
        🟠 [x方向の速度を 0 にする]
      [終わり]
    [終わり]
    🟢 [もし <<「上矢印」キーが押された> かつ <地面に触れている>> なら]
      🟠 [y方向の速度を -500 ���する]     ← ジャンプ
    [終わり]

🟡 [🚩 がクリックさ��たとき]              ← コイン収集判定
  🟠 [ずっと]
    🟢 [もし <「コイン」に触れた> なら]
      ??? コインを非表示にする（他スプライトの制御）
      ??? スコアを加算���る
    [終わり]

═══════════════════════════════════════
 スプライト「地面」
═══════════════════════════════════════

🟡 [🚩 がクリックされたと��]
  🟠 [物理モードを「static」にする]
  🟦 [x座標を 400 にする]
  🟦 [y座標を 580 にする]

══════════════════���══════════════════���═
 スプライト「敵1」
══════���═════════════════��══════════════

🟡 [🚩 がクリックされたとき]
  🟠 [物理モードを「dynamic」にする]
  🟦 [x座標を 300 にする]
  🟦 [y���標を 360 にする]
  🟠 [x方向の速度を 100 にする]

🟡 [🚩 がクリックされたとき]              ← パトロール
  🟠 [ずっと]
    🟢 [もし <端に触れた> なら]
      ??? 速度を反転する
    [終わり]

═══════════════════════════════════════
 スプライト「コイン1」〜「コイン12」
═══════��═══════════════════════════════
  → 12個のスプライトを手動配置...? ← クローンがないため不可能に近い
```

---

## 3. ギャップ分析: 不足しているブロック/機能

### 重要度: 🔴 必須 / 🟡 ���要 / 🟢 あると良い

---

### 🔴 必須（これがないとプ��ットフォーマーが作れない）

#### 3-1. クローン機能
**Scratch の `create clone of` 相当**

| 不足ブロック | 説明 |
|-------------|------|
| `[自分自身のクローンを作る]` | スプライトの複製を動的に生成 |
| `[◯のクローンを作る]` | 指定スプライトのクローンを生成 |
| `[クローンされたとき]` (hat) | クローン生成時に実行されるイベント |
| `[このクローンを削除する]` (cap) | クローンを破棄 |

**なぜ必須:** コイン12個、敵複数体をスプライトとして個別に配置するのは非現実的。クローンがあれば1つのスプライト定義から動的に複数インスタンスを生成できる。

**Phaser との対応:**
- `clone` → `this.physics.add.sprite()` で新しい��プライトを追加
- GameScene 側にクローン管理の仕組みが必要

---

#### 3-2. 衝突コールバック / イベント
**「〇〇に触れたとき」のハットブロック**

| 不足ブロック | 説明 |
|-------------|------|
| `[◯に触れたとき]` (hat) | 衝突イベントで自動実行 |
| `[衝突した相手の名前]` (reporter) | 衝突相手を識別 |

**なぜ必須:** 現在の `sensing_touchingobject` はポーリング（毎フレーム `もし<触れた>なら` で判定）。これでも動くが、衝突の「瞬間」を捉えるのが難しい（例: コインを1回だけ拾う処理で、複数フレームにわたって true になる問題）。

**Phaser との対応:**
- `this.physics.add.overlap()` / `this.physics.add.collider()` のコールバック

---

#### 3-3. スプライトの表示/非表示 + 物理ボディの有効/無効
**コイン収集や敵撃破で必要**

| 不足��ロック | 説明 |
|-------------|------|
| `[物理ボディを無効にする]` | 衝突判定をオフにする |
| `[物理ボディを有効にする]` | 衝突判定をオンに戻す |

**現状:** `looks_hide` でスプライトを非表示にしても、物理ボディは残ったまま。コインを「拾った」後も衝突し続���る。

**Phaser との対応:**
- `sprite.disableBody(true, true)` → 非表示 + 物理無効
- `sprite.enableBody(true, x, y, true, true)` → 復活

---

#### 3-4. 他スプライトへのメッセージ / 制御

| ���足ブロック | 説明 |
|-------------|------|
| *(既存の `observer_sendevent` で部分的に可能)* | |
| `[◯のクローンを全て削除する]` | 特定スプライトの全クローン破棄 |

**現状:** `observer_sendevent` / `observer_wheneventreceived` で他スプライトにイベントを送れるが、「特定のスプライトを名指しで操作する」仕組みがない。プラットフォーマーでは「プレイヤーがコインに触れたら → そのコインを消す」が必要。

---

### 🟡 重��（ゲームの品質に大きく影響）

#### 3-5. バウンス（反発係数）

| 不足ブロック | 説明 |
|-------------|------|
| `[バウンスを ◯ にする]` | 反発係数の設定 (0〜1) |

**Phaser:** `sprite.setBounce(0.1)`
**用途:** プレイヤーの着地感、コインの跳��返り、敵の壁反射

---

#### 3-6. ワールド境界の衝突設定

| 不足ブロック | 説明 |
|-------------|------|
| `[ワールド境界と衝突する]` | ステージ端での跳ね返り/停止 |
| `[ワールド境界と衝突しない]` | ステージ外に出られる |

**現状:** `motion_ifonedgebounce` は VM レベルの座標クランプ。物理エンジンの `setCollideWorldBounds(true)` とは別物。

**Phaser:** `sprite.setCollideWorldBounds(true)`

---

#### 3-7. スプライトアニメーション（フレーム切替）

| 不足ブロッ�� | 説明 |
|-------------|------|
| `[コスチュームを次にする]` | 次のコスチュームに切替 |
| `[コスチューム番号]` (reporter) | 現在のコスチューム番号 |
| `[アニ���ーションを再生する ◯ から ◯ フレーム毎秒 ◯]` | フレーム範囲指定アニメ |
| `[アニメーションを停止する]` | アニメ停止 |

**現状:** `looks_switchcostumeto` でコスチューム切替は可能だが、自動アニメーション再生がない。歩行アニメなどはブロックで毎フレーム切り替える必要があり、非常に面倒。

---

#### 3-8. スコアなどのテキスト表示 (HUD)

| ��足ブロッ�� | 説明 |
|-------------|------|
| `[テキスト「◯」を x:◯ y:◯ に表示する]` | ステージ上にテキスト配置 |
| `[テキ��ト「◯」を更新する]` | 表示テキストの内容を更新 |

**現状:** `looks_say` で吹き出しは出せるが、固定位置のHUD（スコア表示など）は不可能。

**代替案:** 変数モニター（`data_showvariable`）で代用可能だが、現在は未実装（TODO 状態）。

---

#### 3-9. ゲーム状態管理

| 不足ブロック | ��明 |
|-------------|------|
| `[物理を一時停止する]` | `this.physics.pause()` 相当 |
| `[物理を再開する]` | `this.physics.resume()` 相当 |
| `[シーンをリスタートする]` | ゲームの最初からやり直し |

**現状:** `control_stop` で全スクリプト停止はできるが、物理エンジンの一時停止やゲームリスタートができない。

---

### 🟢 あると良い（ゲーム体験の向上）

#### 3-10. サウンド

| 不足ブロック | 説明 |
|-------------|------|
| `[◯の音を鳴らす]` | 効果音再生 |
| `[◯��音を鳴らして待つ]` | 再生完了まで待機 |
| `[全ての音を止める]` | 音声停止 |

**現状:** 音声機能は完全に未実装（Phaser の audio も `disableWebAudio: true`）

---

#### 3-11. カメラ制御

| 不足ブロック | 説明 |
|-------------|------|
| `[カメラを ◯ に追従させる]` | プレイヤー追従カメラ |
| `[カメラをスクロールする x:◯ y:◯]` | カメラ位置設定 |
| `[カメラのズームを ◯ にする]` | ズーム制御 |

**用途:** ステージが画面より広いゲーム。横スクロールプラットフォーマーの基本。

---

#### 3-12. タイマー / 時間制限

| 不足��ロック | 説明 |
|-------------|------|
| *(既存の `sensing_timer` で基本的には可能)* | |
| `[◯秒後に実行する]` | 遅延実行（`control_wait` で代用可能） |

---

## 4. 優先度まとめ

```
作るべき順序（推奨）:

Phase 1: 最小限のプラットフォーマーを作れるようにする
  ├── クローン機能（clone / when cloned / delete clone）
  ├── 物理ボディの有効/無効（disable/enable body）
  └── バウンス設定

Phase 2: ゲームとして成立させる
  ├���─ ワールド境界衝突（collideWorldBounds���
  ├── 衝突イベントハット（when touching）
  ├── コスチュームアニメーション（next costume / costume # reporter）
  └── 変数モニター or HUD テキスト（スコア表示）

Phase 3: ゲーム体験の向上
  ├── サウンド
  ├── カメラ制御（追従・スクロール）
  ├── ゲーム状態管理（リスタート・物理の一時停止）
  └── シーン遷移（タイトル画面 → ゲーム → リザ���ト）
```

---

## 5. 現在のブロックの充足状況

| カテゴリ | 現状 | プラットフォーマーでの評価 |
|---------|------|------------------------|
| Events | 🚩クリック、キー押下、変数監視、カスタムイベント | ✅ 基本OK。衝突イベントが欲しい |
| Motion | 移動、回転、座標設定、グライド | ✅ 十分 |
| Looks | 表示/非表示、サイズ、吹き出し、コスチューム切替 | ⚠️ アニメーション自動再生が欲しい |
| Control | 繰り返し、条件分岐、待機、永久ループ | �� 十分 |
| Sensing | 衝突判定、キー判定、マウス座標、タイマー | ⚠️ 基��OK。衝突イベントが欲しい |
| Operators | 四則演算、比較、論理演算、文字列 | ✅ 十�� |
| Variables | 変数の取得/設定/変更 | ✅ 十分。モニター表示は未実装 |
| Lists | 追加/削除/取得/長さ | ✅ 十分 |
| My Blocks | カスタムプロシージ�� | ✅ 十分 |
| Physics | 重力、速度、物理モード、接地判定 | ⚠️ バウンス/ワールド境界/ボディ制御が不足 |
| **クローン** | **❌ 未実装** | **🔴 必須** |
