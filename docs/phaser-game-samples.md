# Phaser 3 ゲームサンプル集 & 新疑似コード対応表

各ジャンルのPhaserフルソースコードと、それに対応する新疑似コード（クラスベース記法）をまとめたドキュメント。
将来的にブロックエディタからこれらのゲームパターンを生成する際のリファレンスとして使用する。

## 動作するサンプル

以下のサンプルは `samples.ts` に組み込まれており、エディタから実際にプレイ可能:

| サンプル名 | ID | 記法 | 内容 |
|-----------|-----|------|------|
| はじめてのゲーム | `beginner` | 旧形式 | プラットフォーマー基礎 |
| シューティング | `shooting` | 旧形式 | 横STG + HP |
| ダンジョンラン | `dungeon-run` | 旧形式 | ボス戦・2段ジャンプ・移動床・トラップ |
| **ブロック崩し** | `breakout` | **新クラス記法** | パドル・ボール・ブリック |
| **スペースシューター** | `space-shooter` | **新クラス記法** | 縦STG・クローン敵・スポナー |
| **エンドレスランナー** | `endless-runner` | **新クラス記法** | 障害物回避・コイン・2段ジャンプ |
| **スネークゲーム** | `snake` | **新クラス記法** | グリッド移動・エサ・加速 |
| **トップダウンアクション** | `topdown-action` | **新クラス記法** | 剣攻撃・スライム敵・カギ・ゴール |

---

## 目次

1. [プラットフォーマー（公式チュートリアル）](#1-プラットフォーマー)
2. [シューティング（スペースシューター）](#2-シューティング)
3. [エンドレスランナー（横スクロール）](#3-エンドレスランナー)
4. [ブレイクアウト（ブロック崩し）](#4-ブレイクアウト)
5. [スネークゲーム](#5-スネークゲーム)
6. [トップダウン・ダンジョンクローラー](#6-トップダウンダンジョンクローラー)

---

## 1. プラットフォーマー

**出典**: [Phaser 公式チュートリアル「Making Your First Phaser 3 Game」](https://phaser.io/tutorials/making-your-first-phaser-3-game/part1)
**GitHub**: https://github.com/phaserjs/examples/tree/master/public/src/games/firstgame

**Phaserの活用ポイント**: Arcade Physics（重力・衝突）、スプライトシートアニメーション、グループ管理、テキストUI

### Phaser ソースコード

```javascript
class Example extends Phaser.Scene {
    scoreText;
    gameOver = false;
    score = 0;
    cursors;
    platforms;
    bombs;
    stars;
    player;

    preload() {
        this.load.image('sky', 'assets/sky.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.image('star', 'assets/star.png');
        this.load.image('bomb', 'assets/bomb.png');
        this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    }

    create() {
        this.add.image(400, 300, 'sky');

        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();
        this.platforms.create(600, 400, 'ground');
        this.platforms.create(50, 250, 'ground');
        this.platforms.create(750, 220, 'ground');

        this.player = this.physics.add.sprite(100, 450, 'dude');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'turn',
            frames: [{ key: 'dude', frame: 4 }],
            frameRate: 20
        });
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });

        this.cursors = this.input.keyboard.createCursorKeys();

        this.stars = this.physics.add.group({
            key: 'star',
            repeat: 11,
            setXY: { x: 12, y: 0, stepX: 70 }
        });
        this.stars.children.forEach(child => {
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });

        this.bombs = this.physics.add.group();

        this.scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.stars, this.platforms);
        this.physics.add.collider(this.bombs, this.platforms);
        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
        this.physics.add.collider(this.player, this.bombs, this.hitBomb, null, this);
    }

    update() {
        if (this.gameOver) { return; }

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.anims.play('left', true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            this.player.anims.play('right', true);
        } else {
            this.player.setVelocityX(0);
            this.player.anims.play('turn');
        }

        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
        }
    }

    collectStar(player, star) {
        star.disableBody(true, true);
        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);

        if (this.stars.countActive(true) === 0) {
            this.stars.children.forEach(child => {
                child.enableBody(true, child.x, 0, true, true);
            });
            const x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
            const bomb = this.bombs.create(x, 16, 'bomb');
            bomb.setBounce(1);
            bomb.setCollideWorldBounds(true);
            bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        }
    }

    hitBomb(player, bomb) {
        this.physics.pause();
        player.setTint(0xff0000);
        player.anims.play('turn');
        this.gameOver = true;
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 300 }, debug: false }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### 新疑似コード

```
class Player {
  onCreate() {
    this.setPhysics("dynamic")
    this.setPosition(100, 450)
    this.setBounce(0.2)
    this.setCollideWorldBounds(true)
    this.score = 0
    this.addText("score: 0", -224, -264)
  }

  onUpdate() {
    if (this.isKeyPressed("left")) {
      this.setVelocityX(-160)
      this.setCostume("left")
    } else if (this.isKeyPressed("right")) {
      this.setVelocityX(160)
      this.setCostume("right")
    } else {
      this.setVelocityX(0)
      this.setCostume("turn")
    }

    if (this.isKeyPressed("up") && this.isOnGround()) {
      this.setVelocityY(-330)
    }
  }

  onTouched("Star") {
    this.score += 10
    this.setText("score: " + this.score)
    this.emit("star-collected")
  }

  onTouched("Bomb") {
    this.setTint(0xff0000)
    this.stop()
  }
}

class Star {
  onCreate() {
    this.setPhysics("dynamic")
    this.setBounce(0.6)
    this.setAllowGravity(true)
  }

  onEvent("star-collected") {
    this.hide()
  }
}

class Bomb {
  onCreate() {
    this.setPhysics("dynamic")
    this.setBounce(1)
    this.setCollideWorldBounds(true)
    this.setVelocity(100, 20)
  }
}
```

**Phaser → 疑似コード対応メモ**:
- `this.player.body.touching.down` → `this.isOnGround()`
- `this.physics.add.overlap(player, stars, callback)` → `onTouched("Star")` ハット
- `this.physics.add.collider` → 暗黙的に物理衝突（`setPhysics` で自動）
- `this.player.anims.play('left')` → `this.setCostume("left")`（簡易化）

---

## 2. シューティング

**出典**: [jaredyork/CoursePhaser3SpaceShooter](https://github.com/jaredyork/CoursePhaser3SpaceShooter)

**Phaserの活用ポイント**: Arcade Physics（重力なし・自由移動）、スプライトグループ、タイマーイベント、アニメーション、衝突判定、スクロール背景

### Phaser ソースコード

```javascript
// === Entities.js ===
class Entity extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, key, type) {
    super(scene, x, y, key);
    this.scene = scene;
    this.scene.add.existing(this);
    this.scene.physics.world.enableBody(this, 0);
    this.setData("type", type);
    this.setData("isDead", false);
  }

  explode(canDestroy) {
    if (!this.getData("isDead")) {
      this.setTexture("sprExplosion");
      this.play("sprExplosion");
      if (this.shootTimer) { this.shootTimer.remove(false); }
      this.setAngle(0);
      this.body.setVelocity(0, 0);
      this.on('animationcomplete', function() {
        if (canDestroy) { this.destroy(); }
        else { this.setVisible(false); }
      }, this);
      this.setData("isDead", true);
    }
  }
}

class Player extends Entity {
  constructor(scene, x, y, key) {
    super(scene, x, y, key, "Player");
    this.setData("speed", 200);
    this.setData("isShooting", false);
    this.setData("timerShootDelay", 10);
    this.setData("timerShootTick", 9);
  }

  moveUp()    { this.body.velocity.y = -this.getData("speed"); }
  moveDown()  { this.body.velocity.y = this.getData("speed");  }
  moveLeft()  { this.body.velocity.x = -this.getData("speed"); }
  moveRight() { this.body.velocity.x = this.getData("speed");  }

  update() {
    this.body.setVelocity(0, 0);
    this.x = Phaser.Math.Clamp(this.x, 0, this.scene.game.config.width);
    this.y = Phaser.Math.Clamp(this.y, 0, this.scene.game.config.height);

    if (this.getData("isShooting")) {
      if (this.getData("timerShootTick") < this.getData("timerShootDelay")) {
        this.setData("timerShootTick", this.getData("timerShootTick") + 1);
      } else {
        var laser = new PlayerLaser(this.scene, this.x, this.y);
        this.scene.playerLasers.add(laser);
        this.setData("timerShootTick", 0);
      }
    }
  }
}

class PlayerLaser extends Entity {
  constructor(scene, x, y) {
    super(scene, x, y, "sprLaserPlayer");
    this.body.velocity.y = -200;
  }
}

class EnemyLaser extends Entity {
  constructor(scene, x, y) {
    super(scene, x, y, "sprLaserEnemy0");
    this.body.velocity.y = 200;
  }
}

class GunShip extends Entity {
  constructor(scene, x, y) {
    super(scene, x, y, "sprEnemy0", "GunShip");
    this.play("sprEnemy0");
    this.body.velocity.y = Phaser.Math.Between(50, 100);
    this.shootTimer = this.scene.time.addEvent({
      delay: 1000,
      callback: function() {
        var laser = new EnemyLaser(this.scene, this.x, this.y);
        laser.setScale(this.scaleX);
        this.scene.enemyLasers.add(laser);
      },
      callbackScope: this,
      loop: true
    });
  }
}

class ChaserShip extends Entity {
  constructor(scene, x, y) {
    super(scene, x, y, "sprEnemy1", "ChaserShip");
    this.body.velocity.y = Phaser.Math.Between(50, 100);
    this.state = "MOVE_DOWN";
  }

  update() {
    if (!this.getData("isDead") && this.scene.player) {
      if (Phaser.Math.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y) < 320) {
        this.state = "CHASE";
      }
      if (this.state === "CHASE") {
        var dx = this.scene.player.x - this.x;
        var dy = this.scene.player.y - this.y;
        var angle = Math.atan2(dy, dx);
        this.body.setVelocity(Math.cos(angle) * 100, Math.sin(angle) * 100);
      }
    }
  }
}

// === SceneMain.js ===
class SceneMain extends Phaser.Scene {
  constructor() { super({ key: "SceneMain" }); }

  create() {
    this.player = new Player(this, this.game.config.width * 0.5, this.game.config.height * 0.5, "sprPlayer");

    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.enemies = this.add.group();
    this.enemyLasers = this.add.group();
    this.playerLasers = this.add.group();

    // 1秒ごとに敵をスポーン
    this.time.addEvent({
      delay: 1000,
      callback: function() {
        var enemy;
        if (Phaser.Math.Between(0, 10) >= 3) {
          enemy = new GunShip(this, Phaser.Math.Between(0, this.game.config.width), 0);
        } else {
          enemy = new ChaserShip(this, Phaser.Math.Between(0, this.game.config.width), 0);
        }
        enemy.setScale(Phaser.Math.Between(10, 20) * 0.1);
        this.enemies.add(enemy);
      },
      callbackScope: this,
      loop: true
    });

    // 弾と敵の衝突
    this.physics.add.collider(this.playerLasers, this.enemies, function(laser, enemy) {
      if (enemy) {
        enemy.explode(true);
        laser.destroy();
      }
    });

    // プレイヤーと敵の衝突
    this.physics.add.overlap(this.player, this.enemies, function(player, enemy) {
      if (!player.getData("isDead") && !enemy.getData("isDead")) {
        player.explode(false);
        enemy.explode(true);
      }
    });
  }

  update() {
    if (!this.player.getData("isDead")) {
      this.player.update();
      if (this.keyW.isDown) { this.player.moveUp(); }
      else if (this.keyS.isDown) { this.player.moveDown(); }
      if (this.keyA.isDown) { this.player.moveLeft(); }
      else if (this.keyD.isDown) { this.player.moveRight(); }

      if (this.keySpace.isDown) {
        this.player.setData("isShooting", true);
      } else {
        this.player.setData("isShooting", false);
      }
    }

    // 画面外の敵・弾を破棄
    for (var i = 0; i < this.enemies.getChildren().length; i++) {
      var enemy = this.enemies.getChildren()[i];
      enemy.update();
      if (enemy.y > this.game.config.height + enemy.displayHeight) {
        enemy.destroy();
      }
    }
  }
}

const config = {
  type: Phaser.WEBGL,
  width: 480, height: 640,
  backgroundColor: "black",
  physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 } } },
  scene: [SceneMain]
};

const game = new Phaser.Game(config);
```

### 新疑似コード

```
// プレイヤー（WASD移動 + スペースで射撃）
class Player {
  onCreate() {
    this.setPosition(240, 320)
    this.isDead = false
    this.shootCooldown = 0
  }

  onUpdate() {
    this.setVelocity(0, 0)

    if (this.isKeyPressed("w")) {
      this.setVelocityY(-200)
    } else if (this.isKeyPressed("s")) {
      this.setVelocityY(200)
    }
    if (this.isKeyPressed("a")) {
      this.setVelocityX(-200)
    } else if (this.isKeyPressed("d")) {
      this.setVelocityX(200)
    }

    // 射撃（クールダウン付き）
    if (this.isKeyPressed("space")) {
      this.shootCooldown += 1
      if (this.shootCooldown > 10) {
        this.createClone("PlayerBullet")
        this.shootCooldown = 0
      }
    }
  }

  onTouched("Enemy") {
    this.hide()
    this.isDead = true
  }
}

// プレイヤーの弾
class PlayerBullet {
  onCreate() {
    this.setVelocityY(-300)
  }

  onClone() {
    this.show()
    this.setVelocityY(-300)
  }

  onTouched("Enemy") {
    this.deleteClone()
  }
}

// 敵（下方向に移動 + 定期的に弾を発射）
class Enemy {
  onCreate() {
    this.setVelocityY(80)
    this.shootTimer = 0
  }

  onUpdate() {
    this.shootTimer += 1
    if (this.shootTimer > 60) {
      this.createClone("EnemyBullet")
      this.shootTimer = 0
    }
  }

  onTouched("PlayerBullet") {
    this.deleteClone()
    this.emit("enemy-destroyed")
  }
}

// 敵の弾
class EnemyBullet {
  onClone() {
    this.show()
    this.setVelocityY(200)
  }
}
```

---

## 3. エンドレスランナー

**出典**: [Emanuele Feronato - Endless Runner with Object Pooling](https://emanueleferonato.com/2018/11/13/build-a-html5-endless-runner-with-phaser-in-a-few-lines-of-code-using-arcade-physics-and-featuring-object-pooling/)

**Phaserの活用ポイント**: オブジェクトプーリング、Arcade Physics（重力 + 衝突）、ダブルジャンプ、動的プラットフォーム生成

### Phaser ソースコード

```javascript
let gameOptions = {
    platformStartSpeed: 350,
    spawnRange: [100, 350],
    platformSizeRange: [50, 250],
    playerGravity: 900,
    jumpForce: 400,
    playerStartPosition: 200,
    jumps: 2
}

class playGame extends Phaser.Scene {
    constructor() { super("PlayGame"); }

    create() {
        // オブジェクトプーリング
        this.platformGroup = this.add.group({
            removeCallback: function(platform) {
                platform.scene.platformPool.add(platform)
            }
        });
        this.platformPool = this.add.group({
            removeCallback: function(platform) {
                platform.scene.platformGroup.add(platform)
            }
        });

        this.playerJumps = 0;
        this.addPlatform(game.config.width, game.config.width / 2);

        this.player = this.physics.add.sprite(
            gameOptions.playerStartPosition,
            game.config.height / 2,
            "player"
        );
        this.player.setGravityY(gameOptions.playerGravity);

        this.physics.add.collider(this.player, this.platformGroup);
        this.input.on("pointerdown", this.jump, this);
    }

    addPlatform(platformWidth, posX) {
        let platform;
        if (this.platformPool.getLength()) {
            platform = this.platformPool.getFirst();
            platform.x = posX;
            platform.active = true;
            platform.visible = true;
            this.platformPool.remove(platform);
        } else {
            platform = this.physics.add.sprite(posX, game.config.height * 0.8, "platform");
            platform.setImmovable(true);
            platform.setVelocityX(gameOptions.platformStartSpeed * -1);
            this.platformGroup.add(platform);
        }
        platform.displayWidth = platformWidth;
        this.nextPlatformDistance = Phaser.Math.Between(
            gameOptions.spawnRange[0], gameOptions.spawnRange[1]
        );
    }

    jump() {
        if (this.player.body.touching.down ||
            (this.playerJumps > 0 && this.playerJumps < gameOptions.jumps)) {
            if (this.player.body.touching.down) {
                this.playerJumps = 0;
            }
            this.player.setVelocityY(gameOptions.jumpForce * -1);
            this.playerJumps++;
        }
    }

    update() {
        if (this.player.y > game.config.height) {
            this.scene.start("PlayGame");  // ゲームオーバー → リスタート
        }
        this.player.x = gameOptions.playerStartPosition;

        // プラットフォームのリサイクル
        let minDistance = game.config.width;
        this.platformGroup.getChildren().forEach(function(platform) {
            let platformDistance = game.config.width - platform.x - platform.displayWidth / 2;
            minDistance = Math.min(minDistance, platformDistance);
            if (platform.x < -platform.displayWidth / 2) {
                this.platformGroup.killAndHide(platform);
                this.platformGroup.remove(platform);
            }
        }, this);

        if (minDistance > this.nextPlatformDistance) {
            var nextPlatformWidth = Phaser.Math.Between(
                gameOptions.platformSizeRange[0], gameOptions.platformSizeRange[1]
            );
            this.addPlatform(nextPlatformWidth, game.config.width + nextPlatformWidth / 2);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 1334, height: 750,
    scene: playGame,
    backgroundColor: 0x444444,
    physics: { default: "arcade" }
};

const game = new Phaser.Game(config);
```

### 新疑似コード

```
class Runner {
  onCreate() {
    this.setPhysics("dynamic")
    this.setGravity(900)
    this.setPosition(200, 375)
    this.jumpCount = 0
    this.maxJumps = 2
    this.score = 0
    this.addText("SCORE: 0", -200, -340)
  }

  onUpdate() {
    // X座標を固定（スクロール感を出す）
    this.x = 200

    // 画面外に落ちたらリスタート
    if (this.y > 375) {
      this.restart()
    }

    this.score += 1
    this.setText("SCORE: " + this.score)
  }

  onKeyPress("up") {
    // ダブルジャンプ対応
    if (this.isOnGround()) {
      this.jumpCount = 0
    }
    if (this.jumpCount < this.maxJumps) {
      this.setVelocityY(-400)
      this.jumpCount += 1
    }
  }
}

class Platform {
  onCreate() {
    this.setPhysics("static")
    this.setPosition(0, 300)
    this.setVelocityX(-350)
  }

  onUpdate() {
    // 画面外に出たら再配置
    if (this.x < -125) {
      this.x = 667
    }
  }
}
```

---

## 4. ブレイクアウト

**出典**: [Phaser 公式 Examples - Breakout](https://github.com/phaserjs/examples/blob/master/public/src/games/breakout/breakout.js)

**Phaserの活用ポイント**: 完全反射の物理ボール、staticGroupによるブリック管理、マウス入力によるパドル操作、ワールド境界の部分衝突設定

### Phaser ソースコード

```javascript
class Breakout extends Phaser.Scene {
    constructor() {
        super({ key: 'breakout' });
    }

    preload() {
        this.load.atlas('assets', 'assets/games/breakout/breakout.png', 'assets/games/breakout/breakout.json');
    }

    create() {
        // 下辺のみ衝突なし（ボールが落ちる）
        this.physics.world.setBoundsCollision(true, true, true, false);

        // ブリック（6行 x 10列）
        this.bricks = this.physics.add.staticGroup({
            key: 'assets',
            frame: ['blue1', 'red1', 'green1', 'yellow1', 'silver1', 'purple1'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 6, cellWidth: 64, cellHeight: 32, x: 112, y: 100 }
        });

        // ボール
        this.ball = this.physics.add.image(400, 500, 'assets', 'ball1')
            .setCollideWorldBounds(true)
            .setBounce(1);
        this.ball.setData('onPaddle', true);

        // パドル
        this.paddle = this.physics.add.image(400, 550, 'assets', 'paddle1')
            .setImmovable();

        // 衝突設定
        this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);
        this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, null, this);

        // マウスでパドル操作
        this.input.on('pointermove', function(pointer) {
            this.paddle.x = Phaser.Math.Clamp(pointer.x, 52, 748);
            if (this.ball.getData('onPaddle')) {
                this.ball.x = this.paddle.x;
            }
        }, this);

        // クリックでボール発射
        this.input.on('pointerup', function(pointer) {
            if (this.ball.getData('onPaddle')) {
                this.ball.setVelocity(-75, -300);
                this.ball.setData('onPaddle', false);
            }
        }, this);
    }

    hitBrick(ball, brick) {
        brick.disableBody(true, true);
        if (this.bricks.countActive() === 0) {
            this.resetLevel();
        }
    }

    hitPaddle(ball, paddle) {
        let diff = 0;
        if (ball.x < paddle.x) {
            diff = paddle.x - ball.x;
            ball.setVelocityX(-10 * diff);
        } else if (ball.x > paddle.x) {
            diff = ball.x - paddle.x;
            ball.setVelocityX(10 * diff);
        } else {
            ball.setVelocityX(2 + Math.random() * 8);
        }
    }

    resetBall() {
        this.ball.setVelocity(0);
        this.ball.setPosition(this.paddle.x, 500);
        this.ball.setData('onPaddle', true);
    }

    resetLevel() {
        this.resetBall();
        this.bricks.children.each(brick => {
            brick.enableBody(false, 0, 0, true, true);
        });
    }

    update() {
        if (this.ball.y > 600) {
            this.resetBall();
        }
    }
}

const config = {
    type: Phaser.WEBGL,
    width: 800, height: 600,
    scene: [Breakout],
    physics: { default: 'arcade' }
};

const game = new Phaser.Game(config);
```

### 新疑似コード

```
class Ball {
  onCreate() {
    this.setPhysics("dynamic")
    this.setPosition(400, 500)
    this.setBounce(1)
    this.setCollideWorldBounds(true)
    this.setAllowGravity(false)
    this.launched = false
  }

  onUpdate() {
    // 下に落ちたらリセット
    if (this.y > 300) {
      this.setVelocity(0, 0)
      this.setPosition(0, 250)
      this.launched = false
    }
  }

  onKeyPress("space") {
    if (!this.launched) {
      this.setVelocity(-75, -300)
      this.launched = true
    }
  }

  onTouched("Paddle") {
    // パドルの当たり位置で角度を変える
    this.emit("paddle-hit")
  }

  onTouched("Brick") {
    this.emit("brick-hit")
  }
}

class Paddle {
  onCreate() {
    this.setPhysics("static")
    this.setPosition(0, 275)
  }

  onUpdate() {
    if (this.isKeyPressed("left")) {
      this.x += -5
    } else if (this.isKeyPressed("right")) {
      this.x += 5
    }
  }
}

class Brick {
  onCreate() {
    this.setPhysics("static")
  }

  onEvent("brick-hit") {
    this.hide()
    this.disableBody()
  }
}
```

---

## 5. スネークゲーム

**出典**: [Phaser 公式 Examples - Snake](https://github.com/phaserjs/examples/blob/master/public/src/games/snake/_part8.js)

**Phaserの活用ポイント**: グリッドベース移動、`Phaser.Actions.ShiftPosition`（スネーク胴体の追従）、`Phaser.Math.Wrap`（画面端のワープ）、動的グループ管理

### Phaser ソースコード

```javascript
var snake;
var food;
var cursors;
var UP = 0, DOWN = 1, LEFT = 2, RIGHT = 3;

class SnakeGame extends Phaser.Scene {
    preload() {
        this.load.image('food', 'assets/games/snake/food.png');
        this.load.image('body', 'assets/games/snake/body.png');
    }

    create() {
        // Snakeクラス（Phaser.Classで定義）
        var Snake = new Phaser.Class({
            initialize: function Snake(scene, x, y) {
                this.headPosition = new Phaser.Math.Vector2(x, y);
                this.body = scene.add.group();
                this.head = this.body.create(x * 16, y * 16, 'body');
                this.head.setOrigin(0);
                this.alive = true;
                this.speed = 100;
                this.moveTime = 0;
                this.tail = new Phaser.Math.Vector2(x, y);
                this.heading = RIGHT;
                this.direction = RIGHT;
            },
            update: function(time) {
                if (time >= this.moveTime) { return this.move(time); }
            },
            faceLeft:  function() { if (this.direction === UP || this.direction === DOWN) this.heading = LEFT; },
            faceRight: function() { if (this.direction === UP || this.direction === DOWN) this.heading = RIGHT; },
            faceUp:    function() { if (this.direction === LEFT || this.direction === RIGHT) this.heading = UP; },
            faceDown:  function() { if (this.direction === LEFT || this.direction === RIGHT) this.heading = DOWN; },
            move: function(time) {
                switch (this.heading) {
                    case LEFT:  this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x - 1, 0, 40); break;
                    case RIGHT: this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x + 1, 0, 40); break;
                    case UP:    this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y - 1, 0, 30); break;
                    case DOWN:  this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y + 1, 0, 30); break;
                }
                this.direction = this.heading;
                Phaser.Actions.ShiftPosition(
                    this.body.getChildren(),
                    this.headPosition.x * 16, this.headPosition.y * 16,
                    1, this.tail
                );
                var hitBody = Phaser.Actions.GetFirst(
                    this.body.getChildren(), { x: this.head.x, y: this.head.y }, 1
                );
                if (hitBody) {
                    this.alive = false;
                    return false;
                }
                this.moveTime = time + this.speed;
                return true;
            },
            grow: function() {
                var newPart = this.body.create(this.tail.x, this.tail.y, 'body');
                newPart.setOrigin(0);
            },
            collideWithFood: function(food) {
                if (this.head.x === food.x && this.head.y === food.y) {
                    this.grow();
                    food.eat();
                    if (this.speed > 20 && food.total % 5 === 0) { this.speed -= 5; }
                    return true;
                }
                return false;
            }
        });

        food = this.add.image(3 * 16, 4 * 16, 'food').setOrigin(0);
        food.total = 0;
        food.eat = function() { this.total++; };

        snake = new Snake(this, 8, 8);
        cursors = this.input.keyboard.createCursorKeys();
    }

    update(time, delta) {
        if (!snake.alive) { return; }
        if (cursors.left.isDown)  { snake.faceLeft(); }
        else if (cursors.right.isDown) { snake.faceRight(); }
        else if (cursors.up.isDown)    { snake.faceUp(); }
        else if (cursors.down.isDown)  { snake.faceDown(); }

        if (snake.update(time)) {
            if (snake.collideWithFood(food)) { repositionFood(); }
        }
    }
}

function repositionFood() {
    var testGrid = [];
    for (var y = 0; y < 30; y++) {
        testGrid[y] = [];
        for (var x = 0; x < 40; x++) { testGrid[y][x] = true; }
    }
    // スネークの位置をグリッドから除外
    snake.body.children.each(function(segment) {
        testGrid[segment.y / 16][segment.x / 16] = false;
    });
    var validLocations = [];
    for (var y = 0; y < 30; y++) {
        for (var x = 0; x < 40; x++) {
            if (testGrid[y][x]) { validLocations.push({ x, y }); }
        }
    }
    if (validLocations.length > 0) {
        var pos = Phaser.Math.RND.pick(validLocations);
        food.setPosition(pos.x * 16, pos.y * 16);
    }
}

const config = {
    type: Phaser.WEBGL,
    width: 640, height: 480,
    backgroundColor: '#bfcc00',
    scene: SnakeGame
};

const game = new Phaser.Game(config);
```

### 新疑似コード

```
// スネークゲームはグリッドベースのため、疑似コードでは
// タイマー制御 + 方向管理で表現する

class SnakeHead {
  onCreate() {
    this.setPosition(128, 128)
    this.direction = 3   // 0=UP, 1=DOWN, 2=LEFT, 3=RIGHT
    this.moveTimer = 0
    this.speed = 100
    this.alive = true
    this.score = 0
    this.addText("SCORE: 0", -200, -220)
  }

  onUpdate() {
    if (!this.alive) {
      this.stop()
    }

    this.moveTimer += 16
    if (this.moveTimer > this.speed) {
      // 方向に応じて16pxずつ移動
      if (this.direction == 3) {
        this.x += 16
      } else if (this.direction == 2) {
        this.x += -16
      } else if (this.direction == 0) {
        this.y += 16
      } else if (this.direction == 1) {
        this.y += -16
      }
      this.moveTimer = 0
    }
  }

  onKeyPress("left") {
    if (this.direction == 0 || this.direction == 1) {
      this.direction = 2
    }
  }

  onKeyPress("right") {
    if (this.direction == 0 || this.direction == 1) {
      this.direction = 3
    }
  }

  onKeyPress("up") {
    if (this.direction == 2 || this.direction == 3) {
      this.direction = 0
    }
  }

  onKeyPress("down") {
    if (this.direction == 2 || this.direction == 3) {
      this.direction = 1
    }
  }

  onTouched("Food") {
    this.score += 10
    this.setText("SCORE: " + this.score)
    this.emit("eat")
    // 加速
    if (this.speed > 20) {
      this.speed += -5
    }
  }
}

class Food {
  onCreate() {
    this.setPosition(48, 64)
  }

  onEvent("eat") {
    // ランダムな位置に再配置
    this.x = 160
    this.y = 120
  }
}
```

---

## 6. トップダウン・ダンジョンクローラー

**出典**: [mipearson/dungeondash](https://github.com/mipearson/dungeondash) / [ライブデモ](https://dungeon-dash.surge.sh)

**Phaserの活用ポイント**: タイルマップ、カメラズーム＆追従、パーティクルエフェクト、スプライトシートアニメーション、物理ボディのサイズ調整、FOV（視野）システム

### Phaser ソースコード（主要部分）

```typescript
// === DungeonScene.ts ===
export default class DungeonScene extends Phaser.Scene {
  player: Player | null;
  slimes: Slime[];

  create(): void {
    const map = new Map(81, 81, this);
    this.tilemap = map.tilemap;

    this.player = new Player(
      this.tilemap.tileToWorldX(map.startingX),
      this.tilemap.tileToWorldY(map.startingY),
      this
    );

    this.slimes = map.slimes;
    this.slimeGroup = this.physics.add.group(this.slimes.map(s => s.sprite));

    // カメラ: ピクセルアート用丸め、3倍ズーム、プレイヤー追従
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setZoom(3);
    this.cameras.main.startFollow(this.player.sprite);

    // 物理衝突
    this.physics.add.collider(this.player.sprite, map.wallLayer);
    this.physics.add.collider(this.slimeGroup, map.wallLayer);
    this.physics.add.collider(
      this.player.sprite, this.slimeGroup,
      undefined, this.slimePlayerCollide, this
    );
  }

  slimePlayerCollide(_, slimeSprite) {
    const slime = this.slimes.find(s => s.sprite === slimeSprite);
    if (this.player.isAttacking()) {
      slime.kill();
      return false;
    } else {
      this.player.stagger();
      return true;
    }
  }

  update(time) {
    this.player.update(time);
    for (let slime of this.slimes) { slime.update(time); }
  }
}

// === Player.ts ===
export default class Player {
  sprite: Phaser.Physics.Arcade.Sprite;
  private attackUntil = 0;
  private attacking = false;
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(x, y, scene) {
    this.sprite = scene.physics.add.sprite(x, y, 'player', 0);
    this.sprite.setSize(8, 8);
    this.sprite.setOffset(20, 28);

    this.keys = scene.input.keyboard.addKeys({
      up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT',
      space: 'SPACE', w: 'w', a: 'a', s: 's', d: 'd'
    });

    // 攻撃時のパーティクル残像
    const particles = scene.add.particles('player');
    this.emitter = particles.createEmitter({
      alpha: { start: 0.7, end: 0 },
      follow: this.sprite,
      lifespan: 200,
      blendMode: Phaser.BlendModes.ADD,
    });
    this.emitter.stop();
  }

  update(time) {
    this.body.setVelocity(0);
    const speed = 125;

    const left = this.keys.left.isDown || this.keys.a.isDown;
    const right = this.keys.right.isDown || this.keys.d.isDown;
    const up = this.keys.up.isDown || this.keys.w.isDown;
    const down = this.keys.down.isDown || this.keys.s.isDown;

    if (left)  { this.body.setVelocityX(-speed); this.sprite.setFlipX(true); }
    if (right) { this.body.setVelocityX(speed);  this.sprite.setFlipX(false); }
    if (up)    { this.body.setVelocityY(-speed); }
    if (down)  { this.body.setVelocityY(speed);  }

    // 移動中にスペースキーで攻撃
    if (this.keys.space.isDown && time > this.attackLockedUntil && this.body.velocity.length() > 0) {
      this.attackUntil = time + 165;
      this.body.velocity.normalize().scale(500);  // 突進
      this.emitter.start();
      this.attacking = true;
    }
  }

  stagger() {
    this.scene.cameras.main.shake(150, 0.001);
    this.scene.cameras.main.flash(50, 100, 0, 0);
  }
}

// === Slime.ts ===
export default class Slime {
  sprite: Phaser.Physics.Arcade.Sprite;
  private nextAction = 0;

  constructor(x, y, scene) {
    this.sprite = scene.physics.add.sprite(x, y, 'slime', 0);
    this.sprite.setSize(12, 10);
    this.sprite.setImmovable(true);
  }

  update(time) {
    if (time < this.nextAction) { return; }
    const speed = 20;
    if (Phaser.Math.Between(0, 1) === 0) {
      this.sprite.body.setVelocity(0);  // 待機
    } else {
      const dir = Phaser.Math.Between(0, 3);
      this.sprite.body.setVelocity(0);
      if (dir === 0) this.sprite.body.setVelocityX(-speed);
      else if (dir === 1) this.sprite.body.setVelocityX(speed);
      else if (dir === 2) this.sprite.body.setVelocityY(-speed);
      else this.sprite.body.setVelocityY(speed);
    }
    this.nextAction = time + Phaser.Math.Between(1000, 3000);
  }

  kill() {
    this.sprite.disableBody();
  }
}
```

### 新疑似コード

```
class Hero {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity(false)
    this.setPosition(0, 0)
    this.attackCooldown = 0
    this.hp = 100
    this.addText("HP: 100", -200, -170)
  }

  onUpdate() {
    this.setVelocity(0, 0)

    if (this.isKeyPressed("left") || this.isKeyPressed("a")) {
      this.setVelocityX(-125)
      this.setFlipX(true)
    } else if (this.isKeyPressed("right") || this.isKeyPressed("d")) {
      this.setVelocityX(125)
      this.setFlipX(false)
    }

    if (this.isKeyPressed("up") || this.isKeyPressed("w")) {
      this.setVelocityY(-125)
    } else if (this.isKeyPressed("down") || this.isKeyPressed("s")) {
      this.setVelocityY(125)
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown += -1
    }
  }

  onKeyPress("space") {
    // 移動中のみ攻撃可能（突進攻撃）
    if (this.attackCooldown == 0) {
      if (this.velocityX > 0 || this.velocityX < 0 || this.velocityY > 0 || this.velocityY < 0) {
        this.emit("attack")
        this.attackCooldown = 30
      }
    }
  }

  onTouched("Slime") {
    this.hp += -10
    this.setText("HP: " + this.hp)
    this.floatingText("-10")
  }
}

class Slime {
  onCreate() {
    this.setPhysics("dynamic")
    this.setAllowGravity(false)
    this.moveTimer = 0
    this.alive = true
  }

  onUpdate() {
    this.moveTimer += 1
    if (this.moveTimer > 120) {
      this.setVelocity(0, 0)
      // ランダムな方向に移動
      this.setVelocityX(20)
      this.moveTimer = 0
    }
  }

  onEvent("attack") {
    if (this.touching("Hero")) {
      this.hide()
      this.alive = false
      this.disableBody()
    }
  }
}
```

---

## API対応表（Phaser → 新疑似コード）

| Phaser API | 新疑似コード | 備考 |
|-----------|-------------|------|
| `this.setVelocityX(v)` | `this.setVelocityX(v)` | そのまま対応 |
| `this.setVelocityY(v)` | `this.setVelocityY(v)` | そのまま対応 |
| `this.setVelocity(vx, vy)` | `this.setVelocity(vx, vy)` | そのまま対応 |
| `this.setBounce(v)` | `this.setBounce(v)` | そのまま対応 |
| `this.setCollideWorldBounds(true)` | `this.setCollideWorldBounds(true)` | そのまま対応 |
| `this.body.touching.down` | `this.isOnGround()` | 接地判定 |
| `this.setPosition(x, y)` | `this.setPosition(x, y)` | そのまま対応 |
| `this.x` / `this.y` | `this.x` / `this.y` | プロパティ読み取り |
| `this.setVisible(true/false)` | `this.show()` / `this.hide()` | メソッド分離 |
| `this.setTint(color)` | `this.setTint(color)` | そのまま対応 |
| `this.setAlpha(v)` | `this.setAlpha(v)` | そのまま対応 |
| `this.setFlipX(true)` | `this.setFlipX(true)` | そのまま対応 |
| `scene.physics.add.existing(this)` | `this.setPhysics("dynamic")` | 物理有効化 |
| `this.setImmovable(true)` | `this.setPhysics("static")` | 静的物理ボディ |
| `this.setGravityY(v)` | `this.setGravity(v)` | Y軸重力 |
| `cursors.left.isDown` | `this.isKeyPressed("left")` | キー入力判定 |
| `this.physics.add.collider(a, b, cb)` | `onTouched("B")` | 衝突イベント |
| `this.physics.add.overlap(a, b, cb)` | `onTouched("B")` | 重なりイベント |
| `this.scene.start("Scene")` | `this.restart()` | シーン遷移 |
| `sprite.disableBody(true, true)` | `this.hide()` + `this.disableBody()` | ボディ無効化＋非表示 |
| `this.cameras.main.shake()` | 未対応 | カメラシェイク |
| `this.cameras.main.startFollow()` | 未対応 | カメラ追従 |
| `Phaser.Math.Between(a, b)` | 未対応 | ランダム整数 |
| `this.time.addEvent({})` | `repeat` / `forever` で代替 | タイマー |
| `Phaser.Actions.ShiftPosition()` | 未対応 | グループ要素の連鎖移動 |
| `this.add.particles()` | 未対応 | パーティクルシステム |
| `this.tweens.add()` | `this.tweenTo()` | Tween アニメーション |

### 未対応だが将来追加候補のAPI

| Phaser API | 用途 | 優先度 |
|-----------|------|--------|
| `Phaser.Math.Between(a, b)` | ランダム整数 | 高（多くのゲームで必須） |
| `cameras.main.startFollow()` | カメラ追従 | 高（スクロールゲームに必須） |
| `cameras.main.shake()` | 画面振動演出 | 中 |
| `this.add.particles()` | パーティクル | 中 |
| `sprite.disableBody()` | 物理ボディ無効化 | 高（既存opcodeあり） |
| `sprite.enableBody()` | 物理ボディ有効化 | 高（既存opcodeあり） |
| `staticGroup / group` | オブジェクトグループ管理 | 高（クローンで代替可能） |
| `this.anims.play()` | スプライトアニメーション | 中（コスチュームで代替） |
| `Phaser.Math.Distance.Between()` | 距離計算 | 中 |
| `this.physics.world.setBoundsCollision()` | 境界衝突の部分制御 | 低 |
