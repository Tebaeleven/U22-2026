# Games

Phaser 3.85.0 の完成ゲームサンプルコード集。

## Breakout

### Breakout

> クラシックなブロック崩しゲーム。パドルでボールを跳ね返してブロックを全て破壊する。マウスでパドルを操作し、クリックでボールを発射。

```javascript
class Breakout extends Phaser.Scene
{
    constructor ()
    {
        super({ key: 'breakout' });

        this.bricks;
        this.paddle;
        this.ball;
    }

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.atlas('assets', 'assets/games/breakout/breakout.png', 'assets/games/breakout/breakout.json');
    }

    create ()
    {
        this.physics.world.setBoundsCollision(true, true, true, false);

        this.bricks = this.physics.add.staticGroup({
            key: 'assets', frame: [ 'blue1', 'red1', 'green1', 'yellow1', 'silver1', 'purple1' ],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 6, cellWidth: 64, cellHeight: 32, x: 112, y: 100 }
        });

        this.ball = this.physics.add.image(400, 500, 'assets', 'ball1').setCollideWorldBounds(true).setBounce(1);
        this.ball.setData('onPaddle', true);

        this.paddle = this.physics.add.image(400, 550, 'assets', 'paddle1').setImmovable();

        this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);
        this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, null, this);

        this.input.on('pointermove', function (pointer)
        {
            this.paddle.x = Phaser.Math.Clamp(pointer.x, 52, 748);

            if (this.ball.getData('onPaddle'))
            {
                this.ball.x = this.paddle.x;
            }
        }, this);

        this.input.on('pointerup', function (pointer)
        {
            if (this.ball.getData('onPaddle'))
            {
                this.ball.setVelocity(-75, -300);
                this.ball.setData('onPaddle', false);
            }
        }, this);
    }

    hitBrick (ball, brick)
    {
        brick.disableBody(true, true);

        if (this.bricks.countActive() === 0)
        {
            this.resetLevel();
        }
    }

    resetBall ()
    {
        this.ball.setVelocity(0);
        this.ball.setPosition(this.paddle.x, 500);
        this.ball.setData('onPaddle', true);
    }

    resetLevel ()
    {
        this.resetBall();

        this.bricks.children.each(brick =>
        {
            brick.enableBody(false, 0, 0, true, true);
        });
    }

    hitPaddle (ball, paddle)
    {
        let diff = 0;

        if (ball.x < paddle.x)
        {
            diff = paddle.x - ball.x;
            ball.setVelocityX(-10 * diff);
        }
        else if (ball.x > paddle.x)
        {
            diff = ball.x - paddle.x;
            ball.setVelocityX(10 * diff);
        }
        else
        {
            ball.setVelocityX(2 + Math.random() * 8);
        }
    }

    update ()
    {
        if (this.ball.y > 600)
        {
            this.resetBall();
        }
    }
}

const config = {
    type: Phaser.WEBGL,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    scene: [ Breakout ],
    physics: {
        default: 'arcade'
    }
};

const game = new Phaser.Game(config);
```

## First Game (プラットフォーマー)

> **注意:** Phaserサイトのデータエラーにより、First Game Parts 1-7 (IDs 2034-2040) には実際にはSnakeのコードが含まれている。Parts 8, 9, 10 のみが実際のプラットフォーマーゲームのコード。

### Part8

> プラットフォーマーの基本構造。プラットフォーム配置、プレイヤーの物理演算、アニメーション、キーボード操作、星の収集機能。

```javascript
class Example extends Phaser.Scene
{
    cursors;
    platforms;
    stars;
    player;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('sky', 'src/games/firstgame/assets/sky.png');
        this.load.image('ground', 'src/games/firstgame/assets/platform.png');
        this.load.image('star', 'src/games/firstgame/assets/star.png');
        this.load.image('bomb', 'src/games/firstgame/assets/bomb.png');
        this.load.spritesheet('dude', 'src/games/firstgame/assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    }

    create ()
    {
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
            frames: [ { key: 'dude', frame: 4 } ],
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

        this.stars.children.iterate(child =>
        {
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });

        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.stars, this.platforms);

        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
    }

    update ()
    {
        if (this.cursors.left.isDown)
        {
            this.player.setVelocityX(-160);
            this.player.anims.play('left', true);
        }
        else if (this.cursors.right.isDown)
        {
            this.player.setVelocityX(160);
            this.player.anims.play('right', true);
        }
        else
        {
            this.player.setVelocityX(0);
            this.player.anims.play('turn');
        }

        if (this.cursors.up.isDown && this.player.body.touching.down)
        {
            this.player.setVelocityY(-330);
        }
    }

    collectStar (player, star)
    {
        star.disableBody(true, true);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Part9

> Part8にスコアシステムを追加。星を集めるとスコアが加算され、画面上にスコアテキストを表示。

```javascript
class Example extends Phaser.Scene
{
    scoreText;
    score = 0;
    cursors;
    platforms;
    stars;
    player;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('sky', 'src/games/firstgame/assets/sky.png');
        this.load.image('ground', 'src/games/firstgame/assets/platform.png');
        this.load.image('star', 'src/games/firstgame/assets/star.png');
        this.load.image('bomb', 'src/games/firstgame/assets/bomb.png');
        this.load.spritesheet('dude', 'src/games/firstgame/assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    }

    create ()
    {
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
            frames: [ { key: 'dude', frame: 4 } ],
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

        this.stars.children.iterate(child =>
        {
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });

        this.scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.stars, this.platforms);

        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
    }

    update ()
    {
        if (this.cursors.left.isDown)
        {
            this.player.setVelocityX(-160);
            this.player.anims.play('left', true);
        }
        else if (this.cursors.right.isDown)
        {
            this.player.setVelocityX(160);
            this.player.anims.play('right', true);
        }
        else
        {
            this.player.setVelocityX(0);
            this.player.anims.play('turn');
        }

        if (this.cursors.up.isDown && this.player.body.touching.down)
        {
            this.player.setVelocityY(-330);
        }
    }

    collectStar (player, star)
    {
        star.disableBody(true, true);

        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Part10

> 完成版プラットフォーマー。星の収集、スコアシステム、爆弾の追加、ゲームオーバー判定を含む。全ての星を集めると爆弾が出現し、プレイヤーに当たるとゲームオーバー。

```javascript
class Example extends Phaser.Scene
{
    scoreText;
    gameOver = false;
    score = 0;
    cursors;
    platforms;
    bombs;
    stars;
    player;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('sky', 'src/games/firstgame/assets/sky.png');
        this.load.image('ground', 'src/games/firstgame/assets/platform.png');
        this.load.image('star', 'src/games/firstgame/assets/star.png');
        this.load.image('bomb', 'src/games/firstgame/assets/bomb.png');
        this.load.spritesheet('dude', 'src/games/firstgame/assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    }

    create ()
    {
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
            frames: [ { key: 'dude', frame: 4 } ],
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

        this.stars.children.iterate(child => {
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

    update ()
    {
        if (this.gameOver) return;

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.anims.play('left', true);
        }
        else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            this.player.anims.play('right', true);
        }
        else {
            this.player.setVelocityX(0);
            this.player.anims.play('turn');
        }

        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
        }
    }

    collectStar (player, star)
    {
        star.disableBody(true, true);
        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);

        if (this.stars.countActive(true) === 0) {
            this.stars.children.iterate(child => {
                child.enableBody(true, child.x, 0, true, true);
            });

            const x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
            const bomb = this.bombs.create(x, 16, 'bomb');
            bomb.setBounce(1);
            bomb.setCollideWorldBounds(true);
            bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        }
    }

    hitBomb (player, bomb)
    {
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
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

## Snake

### Part1

> Snakeゲームの基本構造。アセットの読み込みと空のシーン設定。

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('food', 'assets/games/snake/food.png');
        this.load.image('body', 'assets/games/snake/body.png');
    }

    create ()
    {
    }

    update (time, delta)
    {
    }
}

const config = {
    type: Phaser.WEBGL,
    width: 640,
    height: 480,
    backgroundColor: '#bfcc00',
    parent: 'phaser-example',
    scene: Example
};

const game = new Phaser.Game(config);
```

### Part2

> Snakeクラスの実装。移動ロジック、方向制御、キーボード入力によるヘビの操作。

```javascript
var config = {
    type: Phaser.WEBGL,
    width: 640,
    height: 480,
    backgroundColor: '#bfcc00',
    parent: 'phaser-example',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var snake;
var cursors;

var UP = 0;
var DOWN = 1;
var LEFT = 2;
var RIGHT = 3;

var game = new Phaser.Game(config);

function preload ()
{
    this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
    this.load.image('food', 'assets/games/snake/food.png');
    this.load.image('body', 'assets/games/snake/body.png');
}

function create ()
{
    var Snake = new Phaser.Class({

        initialize:

        function Snake (scene, x, y)
        {
            this.headPosition = new Phaser.Geom.Point(x, y);
            this.body = scene.add.group();
            this.head = this.body.create(x * 16, y * 16, 'body');
            this.head.setOrigin(0);
            this.alive = true;
            this.speed = 100;
            this.moveTime = 0;
            this.heading = RIGHT;
            this.direction = RIGHT;
        },

        update: function (time)
        {
            if (time >= this.moveTime)
            {
                return this.move(time);
            }
        },

        faceLeft: function ()
        {
            if (this.direction === UP || this.direction === DOWN)
            {
                this.heading = LEFT;
            }
        },

        faceRight: function ()
        {
            if (this.direction === UP || this.direction === DOWN)
            {
                this.heading = RIGHT;
            }
        },

        faceUp: function ()
        {
            if (this.direction === LEFT || this.direction === RIGHT)
            {
                this.heading = UP;
            }
        },

        faceDown: function ()
        {
            if (this.direction === LEFT || this.direction === RIGHT)
            {
                this.heading = DOWN;
            }
        },

        move: function (time)
        {
            switch (this.heading)
            {
                case LEFT:
                    this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x - 1, 0, 40);
                    break;
                case RIGHT:
                    this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x + 1, 0, 40);
                    break;
                case UP:
                    this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y - 1, 0, 30);
                    break;
                case DOWN:
                    this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y + 1, 0, 30);
                    break;
            }
            this.direction = this.heading;
            Phaser.Actions.ShiftPosition(this.body.getChildren(), this.headPosition.x * 16, this.headPosition.y * 16, 1);
            this.moveTime = time + this.speed;
            return true;
        }

    });

    snake = new Snake(this, 8, 8);
    cursors = this.input.keyboard.createCursorKeys();
}

function update (time, delta)
{
    if (!snake.alive)
    {
        return;
    }
    if (cursors.left.isDown)
    {
        snake.faceLeft();
    }
    else if (cursors.right.isDown)
    {
        snake.faceRight();
    }
    else if (cursors.up.isDown)
    {
        snake.faceUp();
    }
    else if (cursors.down.isDown)
    {
        snake.faceDown();
    }
    snake.update(time);
}
```

### Part3

> Foodクラスの追加。食べ物オブジェクトの生成と表示。尾の位置追跡の追加。

```javascript
var config = {
    type: Phaser.WEBGL,
    width: 640,
    height: 480,
    backgroundColor: '#bfcc00',
    parent: 'phaser-example',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var snake;
var food;
var cursors;

var UP = 0;
var DOWN = 1;
var LEFT = 2;
var RIGHT = 3;

var game = new Phaser.Game(config);

function preload ()
{
    this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
    this.load.image('food', 'assets/games/snake/food.png');
    this.load.image('body', 'assets/games/snake/body.png');
}

function create ()
{
    var Food = new Phaser.Class({
        Extends: Phaser.GameObjects.Image,
        initialize: function Food (scene, x, y)
        {
            Phaser.GameObjects.Image.call(this, scene)
            this.setTexture('food');
            this.setPosition(x * 16, y * 16);
            this.setOrigin(0);
            this.total = 0;
            scene.children.add(this);
        }
    });

    var Snake = new Phaser.Class({
        initialize: function Snake (scene, x, y)
        {
            this.headPosition = new Phaser.Geom.Point(x, y);
            this.body = scene.add.group();
            this.head = this.body.create(x * 16, y * 16, 'body');
            this.head.setOrigin(0);
            this.alive = true;
            this.speed = 100;
            this.moveTime = 0;
            this.tail = new Phaser.Geom.Point(x, y);
            this.heading = RIGHT;
            this.direction = RIGHT;
        },
        update: function (time)
        {
            if (time >= this.moveTime)
            {
                return this.move(time);
            }
        },
        faceLeft: function ()
        {
            if (this.direction === UP || this.direction === DOWN)
            {
                this.heading = LEFT;
            }
        },
        faceRight: function ()
        {
            if (this.direction === UP || this.direction === DOWN)
            {
                this.heading = RIGHT;
            }
        },
        faceUp: function ()
        {
            if (this.direction === LEFT || this.direction === RIGHT)
            {
                this.heading = UP;
            }
        },
        faceDown: function ()
        {
            if (this.direction === LEFT || this.direction === RIGHT)
            {
                this.heading = DOWN;
            }
        },
        move: function (time)
        {
            switch (this.heading)
            {
                case LEFT:
                    this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x - 1, 0, 40);
                    break;
                case RIGHT:
                    this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x + 1, 0, 40);
                    break;
                case UP:
                    this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y - 1, 0, 30);
                    break;
                case DOWN:
                    this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y + 1, 0, 30);
                    break;
            }
            this.direction = this.heading;
            Phaser.Actions.ShiftPosition(this.body.getChildren(), this.headPosition.x * 16, this.headPosition.y * 16, 1, this.tail);
            this.moveTime = time + this.speed;
            return true;
        }
    });

    food = new Food(this, 3, 4);
    snake = new Snake(this, 8, 8);
    cursors = this.input.keyboard.createCursorKeys();
}

function update (time, delta)
{
    if (!snake.alive)
    {
        return;
    }
    if (cursors.left.isDown)
    {
        snake.faceLeft();
    }
    else if (cursors.right.isDown)
    {
        snake.faceRight();
    }
    else if (cursors.up.isDown)
    {
        snake.faceUp();
    }
    else if (cursors.down.isDown)
    {
        snake.faceDown();
    }
    snake.update(time);
}
```

### Part4

> 食べ物の摂取と成長の実装。ヘビが食べ物に重なると体が伸び、食べ物が新しいランダム位置に再配置される。

```javascript
var config = {
    type: Phaser.WEBGL,
    width: 640,
    height: 480,
    backgroundColor: '#bfcc00',
    parent: 'phaser-example',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var snake;
var food;
var cursors;

var UP = 0;
var DOWN = 1;
var LEFT = 2;
var RIGHT = 3;

var game = new Phaser.Game(config);

function preload ()
{
    this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
    this.load.image('food', 'assets/games/snake/food.png');
    this.load.image('body', 'assets/games/snake/body.png');
}

function create ()
{
    var Food = new Phaser.Class({
        Extends: Phaser.GameObjects.Image,
        initialize: function Food (scene, x, y)
        {
            Phaser.GameObjects.Image.call(this, scene)
            this.setTexture('food');
            this.setPosition(x * 16, y * 16);
            this.setOrigin(0);
            this.total = 0;
            scene.children.add(this);
        },
        eat: function ()
        {
            this.total++;
            var x = Phaser.Math.Between(0, 39);
            var y = Phaser.Math.Between(0, 29);
            this.setPosition(x * 16, y * 16);
        }
    });

    var Snake = new Phaser.Class({
        initialize: function Snake (scene, x, y)
        {
            this.headPosition = new Phaser.Geom.Point(x, y);
            this.body = scene.add.group();
            this.head = this.body.create(x * 16, y * 16, 'body');
            this.head.setOrigin(0);
            this.alive = true;
            this.speed = 100;
            this.moveTime = 0;
            this.tail = new Phaser.Geom.Point(x, y);
            this.heading = RIGHT;
            this.direction = RIGHT;
        },
        update: function (time)
        {
            if (time >= this.moveTime)
            {
                return this.move(time);
            }
        },
        faceLeft: function ()
        {
            if (this.direction === UP || this.direction === DOWN)
            {
                this.heading = LEFT;
            }
        },
        faceRight: function ()
        {
            if (this.direction === UP || this.direction === DOWN)
            {
                this.heading = RIGHT;
            }
        },
        faceUp: function ()
        {
            if (this.direction === LEFT || this.direction === RIGHT)
            {
                this.heading = UP;
            }
        },
        faceDown: function ()
        {
            if (this.direction === LEFT || this.direction === RIGHT)
            {
                this.heading = DOWN;
            }
        },
        move: function (time)
        {
            switch (this.heading)
            {
                case LEFT:
                    this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x - 1, 0, 40);
                    break;
                case RIGHT:
                    this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x + 1, 0, 40);
                    break;
                case UP:
                    this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y - 1, 0, 30);
                    break;
                case DOWN:
                    this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y + 1, 0, 30);
                    break;
            }
            this.direction = this.heading;
            Phaser.Actions.ShiftPosition(this.body.getChildren(), this.headPosition.x * 16, this.headPosition.y * 16, 1, this.tail);
            this.moveTime = time + this.speed;
            return true;
        },
        grow: function ()
        {
            var newPart = this.body.create(this.tail.x, this.tail.y, 'body');
            newPart.setOrigin(0);
        },
        collideWithFood: function (food)
        {
            if (this.head.x === food.x && this.head.y === food.y)
            {
                this.grow();
                food.eat();
                return true;
            }
            else
            {
                return false;
            }
        }
    });

    food = new Food(this, 3, 4);
    snake = new Snake(this, 8, 8);
    cursors = this.input.keyboard.createCursorKeys();
}

function update (time, delta)
{
    if (!snake.alive)
    {
        return;
    }
    if (cursors.left.isDown)
    {
        snake.faceLeft();
    }
    else if (cursors.right.isDown)
    {
        snake.faceRight();
    }
    else if (cursors.up.isDown)
    {
        snake.faceUp();
    }
    else if (cursors.down.isDown)
    {
        snake.faceDown();
    }
    if (snake.update(time))
    {
        snake.collideWithFood(food);
    }
}
```

### Part5

> 速度増加の実装。食べ物を5個食べるごとにヘビの移動速度が上がり、難易度が段階的に上昇。

```javascript
var config = {
    type: Phaser.WEBGL,
    width: 640,
    height: 480,
    backgroundColor: '#bfcc00',
    parent: 'phaser-example',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var snake;
var food;
var cursors;

var UP = 0;
var DOWN = 1;
var LEFT = 2;
var RIGHT = 3;

var game = new Phaser.Game(config);

function preload ()
{
    this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
    this.load.image('food', 'assets/games/snake/food.png');
    this.load.image('body', 'assets/games/snake/body.png');
}

function create ()
{
    var Food = new Phaser.Class({
        Extends: Phaser.GameObjects.Image,
        initialize: function Food (scene, x, y)
        {
            Phaser.GameObjects.Image.call(this, scene);
            this.setTexture('food');
            this.setPosition(x * 16, y * 16);
            this.setOrigin(0);
            this.total = 0;
            scene.children.add(this);
        },
        eat: function ()
        {
            this.total++;
            var x = Phaser.Math.Between(0, 39);
            var y = Phaser.Math.Between(0, 29);
            this.setPosition(x * 16, y * 16);
        }
    });

    var Snake = new Phaser.Class({
        initialize: function Snake (scene, x, y)
        {
            this.headPosition = new Phaser.Geom.Point(x, y);
            this.body = scene.add.group();
            this.head = this.body.create(x * 16, y * 16, 'body');
            this.head.setOrigin(0);
            this.alive = true;
            this.speed = 100;
            this.moveTime = 0;
            this.tail = new Phaser.Geom.Point(x, y);
            this.heading = RIGHT;
            this.direction = RIGHT;
        },
        update: function (time)
        {
            if (time >= this.moveTime)
            {
                return this.move(time);
            }
        },
        faceLeft: function ()
        {
            if (this.direction === UP || this.direction === DOWN)
            {
                this.heading = LEFT;
            }
        },
        faceRight: function ()
        {
            if (this.direction === UP || this.direction === DOWN)
            {
                this.heading = RIGHT;
            }
        },
        faceUp: function ()
        {
            if (this.direction === LEFT || this.direction === RIGHT)
            {
                this.heading = UP;
            }
        },
        faceDown: function ()
        {
            if (this.direction === LEFT || this.direction === RIGHT)
            {
                this.heading = DOWN;
            }
        },
        move: function (time)
        {
            switch (this.heading)
            {
                case LEFT:
                    this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x - 1, 0, 40);
                    break;
                case RIGHT:
                    this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x + 1, 0, 40);
                    break;
                case UP:
                    this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y - 1, 0, 30);
                    break;
                case DOWN:
                    this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y + 1, 0, 30);
                    break;
            }
            this.direction = this.heading;
            Phaser.Actions.ShiftPosition(this.body.getChildren(), this.headPosition.x * 16, this.headPosition.y * 16, 1, this.tail);
            this.moveTime = time + this.speed;
            return true;
        },
        grow: function ()
        {
            var newPart = this.body.create(this.tail.x, this.tail.y, 'body');
            newPart.setOrigin(0);
        },
        collideWithFood: function (food)
        {
            if (this.head.x === food.x && this.head.y === food.y)
            {
                this.grow();
                food.eat();
                if (this.speed > 20 && food.total % 5 === 0)
                {
                    this.speed -= 5;
                }
                return true;
            }
            return false;
        }
    });

    food = new Food(this, 3, 4);
    snake = new Snake(this, 8, 8);
    cursors = this.input.keyboard.createCursorKeys();
}

function update (time, delta)
{
    if (!snake.alive)
    {
        return;
    }
    if (cursors.left.isDown)
    {
        snake.faceLeft();
    }
    else if (cursors.right.isDown)
    {
        snake.faceRight();
    }
    else if (cursors.up.isDown)
    {
        snake.faceUp();
    }
    else if (cursors.down.isDown)
    {
        snake.faceDown();
    }
    if (snake.update(time))
    {
        snake.collideWithFood(food);
    }
}
```

### Part6

> 食べ物の安全な再配置。ヘビの体と重ならない位置にのみ食べ物を配置するグリッドベースのアルゴリズム。

```javascript
var config = {
    type: Phaser.WEBGL,
    width: 640,
    height: 480,
    backgroundColor: '#bfcc00',
    parent: 'phaser-example',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var snake;
var food;
var cursors;

var UP = 0;
var DOWN = 1;
var LEFT = 2;
var RIGHT = 3;

var game = new Phaser.Game(config);

function preload ()
{
    this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
    this.load.image('food', 'assets/games/snake/food.png');
    this.load.image('body', 'assets/games/snake/body.png');
}

function create ()
{
    var Food = new Phaser.Class({
        Extends: Phaser.GameObjects.Image,
        initialize: function Food (scene, x, y)
        {
            Phaser.GameObjects.Image.call(this, scene);
            this.setTexture('food');
            this.setPosition(x * 16, y * 16);
            this.setOrigin(0);
            this.total = 0;
            scene.children.add(this);
        },
        eat: function ()
        {
            this.total++;
        }
    });

    var Snake = new Phaser.Class({
        initialize: function Snake (scene, x, y)
        {
            this.headPosition = new Phaser.Geom.Point(x, y);
            this.body = scene.add.group();
            this.head = this.body.create(x * 16, y * 16, 'body');
            this.head.setOrigin(0);
            this.alive = true;
            this.speed = 100;
            this.moveTime = 0;
            this.tail = new Phaser.Geom.Point(x, y);
            this.heading = RIGHT;
            this.direction = RIGHT;
        },
        update: function (time)
        {
            if (time >= this.moveTime)
            {
                return this.move(time);
            }
        },
        faceLeft: function ()
        {
            if (this.direction === UP || this.direction === DOWN)
            {
                this.heading = LEFT;
            }
        },
        faceRight: function ()
        {
            if (this.direction === UP || this.direction === DOWN)
            {
                this.heading = RIGHT;
            }
        },
        faceUp: function ()
        {
            if (this.direction === LEFT || this.direction === RIGHT)
            {
                this.heading = UP;
            }
        },
        faceDown: function ()
        {
            if (this.direction === LEFT || this.direction === RIGHT)
            {
                this.heading = DOWN;
            }
        },
        move: function (time)
        {
            switch (this.heading)
            {
                case LEFT:
                    this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x - 1, 0, 40);
                    break;
                case RIGHT:
                    this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x + 1, 0, 40);
                    break;
                case UP:
                    this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y - 1, 0, 30);
                    break;
                case DOWN:
                    this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y + 1, 0, 30);
                    break;
            }
            this.direction = this.heading;
            Phaser.Actions.ShiftPosition(this.body.getChildren(), this.headPosition.x * 16, this.headPosition.y * 16, 1, this.tail);
            this.moveTime = time + this.speed;
            return true;
        },
        grow: function ()
        {
            var newPart = this.body.create(this.tail.x, this.tail.y, 'body');
            newPart.setOrigin(0);
        },
        collideWithFood: function (food)
        {
            if (this.head.x === food.x && this.head.y === food.y)
            {
                this.grow();
                food.eat();
                if (this.speed > 20 && food.total % 5 === 0)
                {
                    this.speed -= 5;
                }
                return true;
            }
            return false;
        },
        updateGrid: function (grid)
        {
            this.body.children.each(function (segment) {
                var bx = segment.x / 16;
                var by = segment.y / 16;
                grid[by][bx] = false;
            });
            return grid;
        }
    });

    food = new Food(this, 3, 4);
    snake = new Snake(this, 8, 8);
    cursors = this.input.keyboard.createCursorKeys();
}

function update (time, delta)
{
    if (!snake.alive)
    {
        return;
    }
    if (cursors.left.isDown)
    {
        snake.faceLeft();
    }
    else if (cursors.right.isDown)
    {
        snake.faceRight();
    }
    else if (cursors.up.isDown)
    {
        snake.faceUp();
    }
    else if (cursors.down.isDown)
    {
        snake.faceDown();
    }
    if (snake.update(time))
    {
        if (snake.collideWithFood(food))
        {
            repositionFood();
        }
    }
}

function repositionFood ()
{
    var testGrid = [];
    for (var y = 0; y < 30; y++)
    {
        testGrid[y] = [];
        for (var x = 0; x < 40; x++)
        {
            testGrid[y][x] = true;
        }
    }
    snake.updateGrid(testGrid);
    var validLocations = [];
    for (var y = 0; y < 30; y++)
    {
        for (var x = 0; x < 40; x++)
        {
            if (testGrid[y][x] === true)
            {
                validLocations.push({ x: x, y: y });
            }
        }
    }
    if (validLocations.length > 0)
    {
        var pos = Phaser.Math.RND.pick(validLocations);
        food.setPosition(pos.x * 16, pos.y * 16);
        return true;
    }
    return false;
}
```

### Part7

> 自己衝突判定の追加。ヘビが自分の体に衝突するとゲームオーバーになる完成版。

```javascript
var config = {
    type: Phaser.WEBGL,
    width: 640,
    height: 480,
    backgroundColor: '#bfcc00',
    parent: 'phaser-example',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var snake;
var food;
var cursors;

var UP = 0;
var DOWN = 1;
var LEFT = 2;
var RIGHT = 3;

var game = new Phaser.Game(config);

function preload ()
{
    this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
    this.load.image('food', 'assets/games/snake/food.png');
    this.load.image('body', 'assets/games/snake/body.png');
}

function create ()
{
    var Food = new Phaser.Class({
        Extends: Phaser.GameObjects.Image,
        initialize: function Food (scene, x, y)
        {
            Phaser.GameObjects.Image.call(this, scene)
            this.setTexture('food');
            this.setPosition(x * 16, y * 16);
            this.setOrigin(0);
            this.total = 0;
            scene.children.add(this);
        },
        eat: function ()
        {
            this.total++;
        }
    });

    var Snake = new Phaser.Class({
        initialize: function Snake (scene, x, y)
        {
            this.headPosition = new Phaser.Geom.Point(x, y);
            this.body = scene.add.group();
            this.head = this.body.create(x * 16, y * 16, 'body');
            this.head.setOrigin(0);
            this.alive = true;
            this.speed = 100;
            this.moveTime = 0;
            this.tail = new Phaser.Geom.Point(x, y);
            this.heading = RIGHT;
            this.direction = RIGHT;
        },
        update: function (time)
        {
            if (time >= this.moveTime)
            {
                return this.move(time);
            }
        },
        faceLeft: function ()
        {
            if (this.direction === UP || this.direction === DOWN)
            {
                this.heading = LEFT;
            }
        },
        faceRight: function ()
        {
            if (this.direction === UP || this.direction === DOWN)
            {
                this.heading = RIGHT;
            }
        },
        faceUp: function ()
        {
            if (this.direction === LEFT || this.direction === RIGHT)
            {
                this.heading = UP;
            }
        },
        faceDown: function ()
        {
            if (this.direction === LEFT || this.direction === RIGHT)
            {
                this.heading = DOWN;
            }
        },
        move: function (time)
        {
            switch (this.heading)
            {
                case LEFT:
                    this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x - 1, 0, 40);
                    break;
                case RIGHT:
                    this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x + 1, 0, 40);
                    break;
                case UP:
                    this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y - 1, 0, 30);
                    break;
                case DOWN:
                    this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y + 1, 0, 30);
                    break;
            }
            this.direction = this.heading;
            Phaser.Actions.ShiftPosition(this.body.getChildren(), this.headPosition.x * 16, this.headPosition.y * 16, 1, this.tail);
            var hitBody = Phaser.Actions.GetFirst(this.body.getChildren(), { x: this.head.x, y: this.head.y }, 1);
            if (hitBody)
            {
                console.log('dead');
                this.alive = false;
                return false;
            }
            else
            {
                this.moveTime = time + this.speed;
                return true;
            }
        },
        grow: function ()
        {
            var newPart = this.body.create(this.tail.x, this.tail.y, 'body');
            newPart.setOrigin(0);
        },
        collideWithFood: function (food)
        {
            if (this.head.x === food.x && this.head.y === food.y)
            {
                this.grow();
                food.eat();
                if (this.speed > 20 && food.total % 5 === 0)
                {
                    this.speed -= 5;
                }
                return true;
            }
            else
            {
                return false;
            }
        },
        updateGrid: function (grid)
        {
            this.body.children.each(function (segment) {
                var bx = segment.x / 16;
                var by = segment.y / 16;
                grid[by][bx] = false;
            });
            return grid;
        }
    });

    food = new Food(this, 3, 4);
    snake = new Snake(this, 8, 8);
    cursors = this.input.keyboard.createCursorKeys();
}

function update (time, delta)
{
    if (!snake.alive)
    {
        return;
    }
    if (cursors.left.isDown)
    {
        snake.faceLeft();
    }
    else if (cursors.right.isDown)
    {
        snake.faceRight();
    }
    else if (cursors.up.isDown)
    {
        snake.faceUp();
    }
    else if (cursors.down.isDown)
    {
        snake.faceDown();
    }
    if (snake.update(time))
    {
        if (snake.collideWithFood(food))
        {
            repositionFood();
        }
    }
}

function repositionFood ()
{
    var testGrid = [];
    for (var y = 0; y < 30; y++)
    {
        testGrid[y] = [];
        for (var x = 0; x < 40; x++)
        {
            testGrid[y][x] = true;
        }
    }
    snake.updateGrid(testGrid);
    var validLocations = [];
    for (var y = 0; y < 30; y++)
    {
        for (var x = 0; x < 40; x++)
        {
            if (testGrid[y][x] === true)
            {
                validLocations.push({ x: x, y: y });
            }
        }
    }
    if (validLocations.length > 0)
    {
        var pos = Phaser.Math.RND.pick(validLocations);
        food.setPosition(pos.x * 16, pos.y * 16);
        return true;
    }
    else
    {
        return false;
    }
}
```
