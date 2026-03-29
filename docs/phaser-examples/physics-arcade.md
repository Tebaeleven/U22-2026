# Physics - Arcade

Phaser 3.85.0 の Arcade Physics サンプルコード集。


## 基本操作 (Basic)

### Simple Group

> シンプルな物理グループの作成

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('block', 'assets/sprites/block.png');
    }

    create ()
    {
        const group = this.physics.add.group({
            bounceX: 1,
            bounceY: 1,
            collideWorldBounds: true
        });

        group.create(100, 200, 'block').setVelocity(100, 200);
        group.create(500, 200, 'block').setVelocity(-100, -100);
        group.create(300, 400, 'block').setVelocity(60, 100);
        group.create(600, 300, 'block').setVelocity(-30, -50);

        this.physics.add.collider(group);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: { y: 200 }
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Add Body To Shape

> 図形に物理ボディを追加する

```javascript
class Example extends Phaser.Scene
{
    player;
    cursors;

    create ()
    {
        this.player = this.add.rectangle(400, 300, 64, 64, 0xffffff);

        this.physics.add.existing(this.player, false);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.player.body.setCollideWorldBounds(true);
    }

    update ()
    {
        this.player.body.setVelocity(0);

        if (this.cursors.left.isDown)
        {
            this.player.body.setVelocityX(-300);
        }
        else if (this.cursors.right.isDown)
        {
            this.player.body.setVelocityX(300);
        }

        if (this.cursors.up.isDown)
        {
            this.player.body.setVelocityY(-300);
        }
        else if (this.cursors.down.isDown)
        {
            this.player.body.setVelocityY(300);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    backgroundColor: '#0072bc',
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Static Body

> 静的ボディの基本

```javascript
class Example extends Phaser.Scene
{
    static3;
    static2;
    static1;
    sprite;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('bar', 'assets/sprites/healthbar.png');
        this.load.image('mushroom', 'assets/sprites/mushroom2.png');
    }

    create ()
    {
        this.sprite = this.physics.add.image(100, 100, 'mushroom');

        this.static1 = this.physics.add.staticImage(400, 100, 'bar');
        this.static2 = this.physics.add.staticImage(100, 400, 'bar');
        this.static3 = this.physics.add.staticImage(500, 300, 'bar');

        this.sprite.body.setVelocity(100, 200).setBounce(1, 1).setCollideWorldBounds(true);
    }

    update ()
    {
        this.physics.world.collide(this.sprite, [ this.static1, this.static2, this.static3 ]);
    }
}

const config = {
    type: Phaser.WEBGL,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 200 },
            debug: true
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Static Group

> 静的グループの作成

```javascript
class Example extends Phaser.Scene
{
    group;
    sprite;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('mushroom', 'assets/sprites/mushroom2.png');
        this.load.image('ball', 'assets/sprites/shinyball.png');
    }

    create ()
    {
        this.sprite = this.physics.add.image(400, 300, 'mushroom');

        this.group = this.physics.add.staticGroup({
            key: 'ball',
            frameQuantity: 30
        });

        Phaser.Actions.PlaceOnRectangle(this.group.getChildren(), new Phaser.Geom.Rectangle(84, 84, 616, 416));

        //  We need to call this because placeOnRectangle has changed the coordinates of all the children
        //  If we don't call it, the static physics bodies won't be updated to reflect them
        this.group.refresh();

        this.sprite.setVelocity(100, 200).setBounce(1, 1).setCollideWorldBounds(true).setGravityY(200);
    }

    update ()
    {
        this.physics.world.collide(this.sprite, this.group);
    }
}

const config = {
    type: Phaser.WEBGL,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Scene Config

> シーン設定での物理有効化

```javascript
class Boot extends Phaser.Scene
{
    constructor ()
    {
        super({ key: 'boot' });
    }

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('sky', 'assets/skies/space2.png');
        this.load.image('logo', 'assets/sprites/phaser3-logo.png');
        this.load.image('red', 'assets/particles/red.png');
    }

    create ()
    {
        this.scene.start('outerSpace');
    }
}

class OuterSpace extends Phaser.Scene
{
    constructor ()
    {
        super({
            key: 'outerSpace',
            physics: {
                arcade: {
                    gravity: { y: 200 }
                }
            }
        });
    }

    create ()
    {
        this.add.image(400, 300, 'sky');

        const particles = this.add.particles(0, 0, 'red', {
            speed: 100,
            scale: { start: 1, end: 0 },
            blendMode: 'ADD'
        });

        const logo = this.physics.add.image(400, 100, 'logo')
            .setVelocity(100, 200)
            .setBounce(1, 1)
            .setCollideWorldBounds(true);

        particles.startFollow(logo);
    }
}

const gameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    scene: [ Boot, OuterSpace ]
};

const game = new Phaser.Game(gameConfig);
```


## 移動・速度 (Movement & Velocity)

### Asteroids Movement

> アステロイド風の慣性移動

```javascript
class Example extends Phaser.Scene
{
    text;
    cursors;
    sprite;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('bullet', 'assets/games/asteroids/bullets.png');
        this.load.image('ship', 'assets/games/asteroids/ship.png');
    }

    create ()
    {
        this.sprite = this.physics.add.image(400, 300, 'ship');

        this.sprite.setDamping(true);
        this.sprite.setDrag(0.99);
        this.sprite.setMaxVelocity(200);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.text = this.add.text(10, 10, '', { font: '16px Courier', fill: '#00ff00' });
    }

    update ()
    {
        if (this.cursors.up.isDown)
        {
            this.physics.velocityFromRotation(this.sprite.rotation, 200, this.sprite.body.acceleration);
        }
        else
        {
            this.sprite.setAcceleration(0);
        }

        if (this.cursors.left.isDown)
        {
            this.sprite.setAngularVelocity(-300);
        }
        else if (this.cursors.right.isDown)
        {
            this.sprite.setAngularVelocity(300);
        }
        else
        {
            this.sprite.setAngularVelocity(0);
        }

        this.text.setText(`Speed: ${this.sprite.body.speed}`);

        this.physics.world.wrap(this.sprite, 32);
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Dragon Movement

> ドラゴンのアニメーション付き移動

```javascript
class Example extends Phaser.Scene
{
    cursors;
    dragon;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('clouds', 'assets/skies/clouds.png');
        this.load.spritesheet('dragon', 'assets/sprites/stormlord-dragon96x64.png', { frameWidth: 96, frameHeight: 64 });
    }

    create ()
    {
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dragon', { start: 0, end: 5 }),
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dragon', { start: 6, end: 11 }),
            frameRate: 12,
            repeat: -1
        });

        this.add.image(400, 400, 'clouds');

        this.dragon = this.physics.add.sprite(400, 300, 'dragon')
            .play('right')
            .setBounce(0.2, 0.2)
            .setCollideWorldBounds(true)
            .setDrag(300, 300)
            .setMaxVelocity(600, 600)
            .setGravity(0, 450);

        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update ()
    {
        const { left, right, up, down } = this.cursors;

        this.dragon.setAcceleration(0, 0);

        if (left.isDown)
        {
            this.dragon.setAccelerationX(-600);
        }
        else if (right.isDown)
        {
            this.dragon.setAccelerationX(600);
        }

        if (up.isDown)
        {
            this.dragon.setAccelerationY(-600);
        }
        else if (down.isDown)
        {
            this.dragon.setAccelerationY(600);
        }

        const { x } = this.dragon.body.velocity;

        if (x < 0)
        {
            this.dragon.play('left', true);
        }
        else if (x > 0)
        {
            this.dragon.play('right', true);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    pixelArt: true,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Racecar

> レースカーの操作

```javascript
// velocityFromRotation() can be called like a plain function.
const VelocityFromRotation = Phaser.Physics.Arcade.ArcadePhysics.prototype.velocityFromRotation;

class Racecar extends Phaser.Physics.Arcade.Image
{
    throttle = 0;

    configure ()
    {
        this.angle = -90;

        this.body.angularDrag = 120;
        this.body.maxSpeed = 1024;

        this.body.setSize(64, 64, true);
    }

    update (delta, cursorKeys)
    {
        const { left, right, up, down } = cursorKeys;

        if (up.isDown)
        {
            this.throttle += 0.5 * delta;
        }
        else if (down.isDown)
        {
            this.throttle -= 0.5 * delta;
        }

        this.throttle = Phaser.Math.Clamp(this.throttle, -64, 1024);

        if (left.isDown)
        {
            this.body.setAngularAcceleration(-360);
        }
        else if (right.isDown)
        {
            this.body.setAngularAcceleration(360);
        }
        else
        {
            this.body.setAngularAcceleration(0);
        }

        VelocityFromRotation(this.rotation, this.throttle, this.body.velocity);

        this.body.maxAngular = Phaser.Math.Clamp(90 * this.body.speed / 1024, 0, 90);
    }
}

class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('soil', 'assets/textures/soil.png');
        this.load.image('car', 'assets/sprites/car-yellow.png');
    }

    create ()
    {
        this.ground = this.add.tileSprite(256, 256, 512, 512, 'soil').setScrollFactor(0, 0);

        this.car = new Racecar(this, 256, 512, 'car');
        this.add.existing(this.car);
        this.physics.add.existing(this.car);
        this.car.configure();

        this.cursorKeys = this.input.keyboard.createCursorKeys();

        this.cameras.main.startFollow(this.car);
    }

    update (time, delta)
    {
        const { scrollX, scrollY } = this.cameras.main;

        this.ground.setTilePosition(scrollX, scrollY);

        this.car.update(delta, this.cursorKeys);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 512,
    height: 512,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Angular Velocity

> 角速度による回転

```javascript
class Example extends Phaser.Scene
{
    plane;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('clouds', 'assets/skies/clouds.png');
        this.load.image('plane', 'assets/sprites/ww2plane90.png');
    }

    create ()
    {
        this.add.image(0, 0, 'clouds').setOrigin(0, 0);

        this.plane = this.physics.add.image(400, 300, 'plane')
            .setCircle(24, 0, 7.5)
            .setVelocity(0, -100);

        this.input.keyboard
            .on('keydown-LEFT', () => { this.plane.setAngularVelocity(-60); })
            .on('keydown-RIGHT', () => { this.plane.setAngularVelocity(60); })
            .on('keydown-UP', () => { this.plane.setAngularVelocity(0); });
    }

    update ()
    {
        this.physics.velocityFromAngle(this.plane.angle, 150, this.plane.body.velocity);

        this.physics.world.wrap(this.plane, 32);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Angular Acceleration

> 角加速度による回転

```javascript
class Example extends Phaser.Scene
{
    cursors;
    graphics;
    text;
    wheel;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('wheel', 'assets/sprites/blade.png');
    }

    create ()
    {
        this.wheel = this.physics.add.image(400, 300, 'wheel')
            .setAngularDrag(0)
            .setAngularVelocity(360);

        this.graphics = this.add.graphics({ fillStyle: { color: 0xffff00, alpha: 0.5 } });

        this.text = this.add.text(0, 0, '', {
            fixedWidth: 350,
            fixedHeight: 150,
            fill: 'aqua',
            backgroundColor: '#000c'
        });

        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update ()
    {
        const { left, right, down } = this.cursors;

        this.wheel.setAngularAcceleration(0).setAngularDrag(0);

        if (left.isDown)
        {
            this.wheel.setAngularAcceleration(-360);
        }
        else if (right.isDown)
        {
            this.wheel.setAngularAcceleration(360);
        }

        if (down.isDown)
        {
            this.wheel.setAngularDrag(360);
        }

        const deltaZ = this.wheel.body.deltaZ();

        this.graphics
            .clear()
            .slice(
                this.wheel.x,
                this.wheel.y,
                0.5 * this.wheel.width,
                0,
                Phaser.Math.DegToRad(deltaZ),
                deltaZ < 0
            )
            .fillPath();

        const { angularAcceleration, angularDrag, angularVelocity } = this.wheel.body;

        this.text.setText(`
Accelerate with LEFT and RIGHT keys.
Drag with DOWN key.

Angular Acceleration: ${angularAcceleration.toFixed(1)} deg/s²
Angular Drag:         ${angularDrag.toFixed(1)} deg/s²
Angular Velocity:     ${angularVelocity.toFixed(1)} deg/s
Delta Z:              ${deltaZ.toFixed(1)} deg/step`
        );
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Velocity From Angle

> 角度から速度を算出

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('backdrop', 'assets/pics/platformer-backdrop.png');
        this.load.image('cannon_head', 'assets/tests/timer/cannon_head.png');
        this.load.image('cannon_body', 'assets/tests/timer/cannon_body.png');
        this.load.spritesheet('chick', 'assets/sprites/chick.png', { frameWidth: 16, frameHeight: 18 });
    }

    create ()
    {
        this.anims.create({ key: 'fly', frames: this.anims.generateFrameNumbers('chick', [ 0, 1, 2, 3 ]), frameRate: 5, repeat: -1 });

        this.add.image(320, 256, 'backdrop').setScale(2);

        const cannonHead = this.add.image(130, 416, 'cannon_head').setDepth(1);
        const cannon = this.add.image(130, 464, 'cannon_body').setDepth(1);
        const chick = this.physics.add.sprite(cannon.x, cannon.y - 50, 'chick').setScale(2);
        const graphics = this.add.graphics({ lineStyle: { width: 10, color: 0xffdd00, alpha: 0.5 } });
        const line = new Phaser.Geom.Line();

        chick.disableBody(true, true);

        let angle = 0;

        this.input.on('pointermove', (pointer) =>
        {
            angle = Phaser.Math.Angle.BetweenPoints(cannon, pointer);
            cannonHead.rotation = angle;
            Phaser.Geom.Line.SetToAngle(line, cannon.x, cannon.y - 50, angle, 128);
            graphics.clear().strokeLineShape(line);
        });

        this.input.on('pointerup', () =>
        {
            chick.enableBody(true, cannon.x, cannon.y - 50, true, true);
            chick.play('fly');
            this.physics.velocityFromRotation(angle, 600, chick.body.velocity);
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 640,
    height: 512,
    parent: 'phaser-example',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 }
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Max Speed

> 最大速度の制限

```javascript
class Example extends Phaser.Scene
{
    text;
    cursors;
    circle;
    sprite;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('ship', 'assets/games/asteroids/ship.png');
    }

    create ()
    {
        this.sprite = this.physics.add.image(400, 300, 'ship');

        this.sprite.body.setMaxSpeed(200);

        this.circle = this.add.circle(this.sprite.x, this.sprite.y, 0.5 * this.sprite.body.maxSpeed, 0xffffff, 0.2);

        console.log(this.circle);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.text = this.add.text(10, 10, '', { font: '16px Courier', fill: '#00ff00' });
    }

    update ()
    {
        if (this.cursors.up.isDown)
        {
            this.physics.velocityFromRotation(this.sprite.rotation, this.sprite.body.maxSpeed, this.sprite.body.acceleration);
        }
        else
        {
            this.sprite.setAcceleration(0);
        }

        if (this.cursors.left.isDown)
        {
            this.sprite.setAngularVelocity(-300);
        }
        else if (this.cursors.right.isDown)
        {
            this.sprite.setAngularVelocity(300);
        }
        else
        {
            this.sprite.setAngularVelocity(0);
        }

        this.text.setText(`Speed: ${this.sprite.body.speed}`);

        this.physics.world.wrap(this.sprite, 100);

        this.circle.setPosition(this.sprite.x, this.sprite.y);
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Random Velocity

> ランダムな速度の設定

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('bg', 'assets/skies/space2.png');
        this.load.spritesheet('ball', 'assets/sprites/balls.png', { frameWidth: 17, frameHeight: 17 });
    }

    create ()
    {
        this.add.image(400, 300, 'bg');

        const balls = this.physics.add.group({
            key: 'ball',
            frame: [ 0, 1, 2, 3 ],
            quantity: 12,
            bounceX: 1,
            bounceY: 1,
            collideWorldBounds: true
        });

        Phaser.Actions.RandomRectangle(balls.getChildren(), this.physics.world.bounds);

        for (const ball of balls.getChildren())
        {
            Phaser.Math.RandomXY(ball.body.velocity, 100);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Wrap Sprite

> 画面端でのワープ

```javascript
class Example extends Phaser.Scene
{
    block;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('block', 'assets/sprites/block.png');
    }

    create ()
    {
        this.block = this.physics.add.image(0, 0, 'block').setVelocity(150, 150);
    }

    update ()
    {
        this.physics.world.wrap(this.block, 48);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade'
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Rolling Body

> 転がるボディ

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('ball', 'assets/sprites/wizball.png');
    }

    create ()
    {
        const wheel = this.physics.add.image(50, 300, 'ball')
            .setAccelerationX(100)
            .setBounce(1)
            .setCollideWorldBounds(true);

        this.physics.world.on('worldstep', () =>
        {
            wheel.setAngularVelocity(
                Phaser.Math.RadToDeg(wheel.body.velocity.x / wheel.body.halfWidth)
            );
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: { debug: true }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```


## ターゲット追従 (Move To / Follow)

### Accelerate To

> ターゲットに向かって加速

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('flower', 'assets/sprites/flower-exo.png');
        this.load.image('cursor', 'assets/sprites/drawcursor.png');
    }

    create ()
    {
        const flower = this.physics.add.image(100, 300, 'flower');

        flower.body
            .setBounce(1, 1)
            .setCollideWorldBounds(true)
            .setMaxSpeed(300);

        const cursor = this.add.image(0, 0, 'cursor').setVisible(false);

        this.add.text(10, 10, 'Click to set target', { fill: '#00ff00' });

        this.input.on('pointerdown', (pointer) =>
        {
            cursor.copyPosition(pointer).setVisible(true);

            flower.body.stop();

            this.physics.accelerateToObject(flower, cursor, 100);
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: { debug: true }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Move To

> 指定位置への移動

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('flower', 'assets/sprites/flower-exo.png');
        this.load.image('cursor', 'assets/sprites/drawcursor.png');
    }

    create ()
    {
        const flower = this.physics.add.image(100, 300, 'flower')
            .setBounce(1, 1)
            .setCollideWorldBounds(true);

        const cursor = this.add.image(0, 0, 'cursor').setVisible(false);

        this.add.text(10, 10, 'Click to set target', { fill: '#00ff00' });

        this.input.on('pointerdown', (pointer) =>
        {
            cursor.copyPosition(pointer).setVisible(true);

            // Move toward target at 200 px/s:
            this.physics.moveToObject(flower, cursor, 200);

            // See  for stopping.
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: { debug: true }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Move To Pointer

> マウスポインタへの移動

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('block', 'assets/sprites/block.png');
        this.load.image('clown', 'assets/sprites/clown.png');
        this.load.image('cursor', 'assets/sprites/drawcursor.png');
    }

    create ()
    {
        const blocks = this.physics.add.group({key: 'block', frameQuantity: 6, setXY: { x: 100, y: 400, stepX: 100 }});
        const clown = this.physics.add.image(200, 300, 'clown');
        const cursor = this.add.image(0, 0, 'cursor').setVisible(false);

        this.input.on('pointermove', (pointer) =>
        {
            cursor.setVisible(true).copyPosition(pointer);

            // Move at 240 px/s
            this.physics.moveToObject(clown, pointer, 240);

            for (const block of blocks.getChildren())
            {
                // Move at 120 px/s
                this.physics.moveToObject(block, pointer, 120);
            }
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: { debug: true }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Move To Position By Duration

> 時間指定での位置移動

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('flower', 'assets/sprites/flower-exo.png');
        this.load.image('cursor', 'assets/sprites/drawcursor.png');
    }

    create ()
    {
        const flower = this.physics.add.image(100, 300, 'flower')
            .setBounce(1, 1)
            .setCollideWorldBounds(true);

        const cursor = this.add.image(0, 0, 'cursor').setVisible(false);

        this.add.text(10, 10, 'Click to set target', { fill: '#00ff00' });

        this.input.on('pointerdown', (pointer) =>
        {
            cursor.copyPosition(pointer).setVisible(true);

            // Move toward target in 1 second:
            this.physics.moveToObject(flower, cursor, 0, 1000);

            console.log('New speed is %.3f px/s', flower.body.velocity.length());

            // See  for stopping.
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: { debug: true }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Move And Stop At Position

> 指定位置で停止する移動

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('flower', 'assets/sprites/flower-exo.png');
        this.load.image('cursor', 'assets/sprites/drawcursor.png');
    }

    create ()
    {
        this.source = this.physics.add.image(100, 300, 'flower');

        this.target = new Phaser.Math.Vector2();

        const cursor = this.add.image(0, 0, 'cursor').setVisible(false);

        this.distanceText = this.add.text(10, 10, 'Click to set target', { fill: '#00ff00' });

        this.input.on('pointerdown', (pointer) =>
        {
            this.target.x = pointer.x;
            this.target.y = pointer.y;

            // Move at 200 px/s:
            this.physics.moveToObject(this.source, this.target, 200);

            cursor.copyPosition(this.target).setVisible(true);
        });
    }

    update ()
    {
        const tolerance = 4;

        const distance = Phaser.Math.Distance.BetweenPoints(this.source, this.target);

        if (this.source.body.speed > 0)
        {
            this.distanceText.setText(`Distance: ${distance}`);

            if (distance < tolerance)
            {
                this.source.body.reset(this.target.x, this.target.y);
            }
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade'
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Smooth Stop

> スムーズな停止

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('flower', 'assets/sprites/flower-exo.png');
        this.load.image('cursor', 'assets/sprites/drawcursor.png');
    }

    create ()
    {
        this.target = this.add.image(0, 0, 'flower').setAlpha(0.4);

        this.source = this.physics.add.image(100, 300, 'flower');

        this.distanceText = this.add.text(10, 10, 'Click to set target', { fill: 'lime' });

        this.input.on('pointerdown', (pointer) =>
        {
            this.target.copyPosition(pointer).setVisible(true);

            this.physics.moveToObject(this.source, this.target, 200);
        });
    }

    update ()
    {
        const distance = Phaser.Math.Distance.BetweenPoints(this.source.body.center, this.target);

        this.distanceText.setText(`Distance: ${distance.toFixed(3)} Speed: ${this.source.body.speed.toFixed(3)}`);

        if (this.source.body.speed > 0)
        {
            // Set a maximum velocity
            this.physics.moveToObject(this.source, this.target, 200);

            // Scale down based on distance, starting from 20px away
            this.source.body.velocity.scale(
                Phaser.Math.SmoothStep(distance, 0, 20)
            );

            if (distance < 1)
            {
                // Close enough
                this.source.body.reset(this.target.x, this.target.y);

                this.source.body.debugBodyColor = 0xff0000;
            }
            else
            {
                this.source.body.debugBodyColor = 0xffff00;
            }
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Rotate To Pointer

> マウスポインタへの回転

```javascript
// Forward speed in px/s.
const SPEED = 100;

// Turning speed in deg/s.
// At 60 steps/s, this is 1.5 deg/step.
const ROTATION_SPEED = 90;

// The angle tolerance in degrees.
const TOLERANCE = 3;

class Example extends Phaser.Scene
{
    cursor;
    ship;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('space', 'assets/skies/space2.png');
        this.load.image('ship', 'assets/sprites/thrust_ship.png');
        this.load.image('cursor', 'assets/sprites/drawcursor.png');
    }

    create ()
    {
        this.add.image(400, 300, 'space');

        this.ship = this.physics.add.image(200, 150, 'ship')
            .setBodySize(20, 20)
            .setVelocity(SPEED, 0);

        this.cursor = this.add.image(0, 0, 'cursor').setAlpha(0);

        this.add.text(10, 10, 'Click and hold to steer to target.');

        this.input.on('pointermove', (pointer) =>
        {
            this.cursor
                .setPosition(pointer.worldX, pointer.worldY)
                .setAlpha(0.5);
        });
    }

    update ()
    {
        const { isDown, worldX, worldY } = this.input.activePointer;

        if (isDown)
        {
            const angleToPointer = Phaser.Math.RadToDeg(
                Phaser.Math.Angle.Between(this.ship.x, this.ship.y, worldX, worldY)
            );

            const angleDelta = Phaser.Math.Angle.ShortestBetween(this.ship.body.rotation, angleToPointer);

            if (Phaser.Math.Fuzzy.Equal(angleDelta, 0, TOLERANCE))
            {
                this.ship.body.rotation = angleToPointer;
                this.ship.setAngularVelocity(0);
                this.ship.body.debugBodyColor = 0xff0000;
            }
            else
            {
                this.ship.setAngularVelocity(Math.sign(angleDelta) * ROTATION_SPEED);
                this.ship.body.debugBodyColor = 0xffff00;
            }

            this.cursor.setAlpha(1);
        }
        else
        {
            this.cursor.setAlpha(0.5);
        }

        this.physics.velocityFromRotation(
            Phaser.Math.DegToRad(this.ship.body.rotation),
            SPEED,
            this.ship.body.velocity
        );
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: { debug: true }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Closest Furthest

> 最も近い/遠いオブジェクトの取得

```javascript
class Example extends Phaser.Scene
{
    cursor;
    graphics;
    group;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('block', 'assets/sprites/block.png');
        this.load.image('cursor', 'assets/sprites/drawcursor.png');
    }

    create ()
    {
        this.group = this.physics.add.group({
            defaultKey: 'block',
            bounceX: 1,
            bounceY: 1,
            collideWorldBounds: true
        });

        this.group.create(100, 200).setVelocity(100, 200);
        this.group.create(500, 200).setVelocity(-100, -100);
        this.group.create(300, 400).setVelocity(60, 100);
        this.group.create(600, 300).setVelocity(-30, -50);

        this.graphics = this.add.graphics();

        this.cursor = this.add.image(400, 300, 'cursor');

        this.input.on('pointermove', pointer =>
        {
            this.cursor.copyPosition(pointer);
        });

    }

    update ()
    {
        const closest = this.physics.closest(this.cursor);
        const furthest = this.physics.furthest(this.cursor);

        this.graphics.clear()
            .lineStyle(2, 0xff3300)
            .lineBetween(closest.center.x, closest.center.y, this.cursor.x, this.cursor.y)
            .lineStyle(2, 0x0099ff)
            .lineBetween(furthest.center.x, furthest.center.y, this.cursor.x, this.cursor.y);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Body On A Path

> パスに沿った物理ボディの移動

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('sky', 'src/games/firstgame/assets/sky.png');
        this.load.image('ground', 'src/games/firstgame/assets/platform.png');
        this.load.image('star', 'src/games/firstgame/assets/star.png');
        this.load.spritesheet('dude', 'src/games/firstgame/assets/dude.png', {
            frameWidth: 32,
            frameHeight: 48
        });
    }

    create ()
    {
        this.add.image(400, 300, 'sky');

        const platforms = this.physics.add.staticGroup();

        platforms.create(400, 568, 'ground').setScale(2).refreshBody();
        platforms.create(600, 400, 'ground');
        platforms.create(50, 250, 'ground');

        this.player = this.physics.add.sprite(100, 450, 'dude');

        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        const stars = this.physics.add.group({ allowGravity: false });

        stars.add(new FlyingStar(this, 150, 100, 100, 100, 0.005), true);
        stars.add(new FlyingStar(this, 500, 200, 40, 100, 0.005), true);
        stars.add(new FlyingStar(this, 600, 200, 40, 100, -0.005), true);
        stars.add(new FlyingStar(this, 700, 200, 40, 100, 0.01), true);

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

        this.physics.add.collider(this.player, platforms);

        this.physics.add.overlap(this.player, stars, this.collectStar, null, this);
    }

    update ()
    {
        const { left, right, up } = this.cursors;

        if (left.isDown)
        {
            this.player.setVelocityX(-160);

            this.player.anims.play('left', true);
        }
        else if (right.isDown)
        {
            this.player.setVelocityX(160);

            this.player.anims.play('right', true);
        }
        else
        {
            this.player.setVelocityX(0);

            this.player.anims.play('turn');
        }

        if (up.isDown && this.player.body.touching.down)
        {
            this.player.setVelocityY(-330);
        }
    }

    collectStar (player, star)
    {
        star.disableBody(true, true);
    }
}

class FlyingStar extends Phaser.Physics.Arcade.Sprite
{
    constructor (scene, x, y, width, height, speed)
    {
        super(scene, x, y, 'star');

        this.path = new Phaser.Curves.Ellipse(x, y, width, height);
        this.pathIndex = 0;
        this.pathSpeed = speed;
        this.pathVector = new Phaser.Math.Vector2();

        this.path.getPoint(0, this.pathVector);

        this.setPosition(this.pathVector.x, this.pathVector.y);
    }

    preUpdate (time, delta)
    {
        super.preUpdate(time, delta);

        this.path.getPoint(this.pathIndex, this.pathVector);

        this.setPosition(this.pathVector.x, this.pathVector.y);

        this.pathIndex = Phaser.Math.Wrap(this.pathIndex + this.pathSpeed, 0, 1);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
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

### Sprite Follow Physics Body

> スプライトが物理ボディに追従

```javascript
class Example extends Phaser.Scene
{
    block;
    flower;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('block', 'assets/sprites/block.png');
        this.load.image('flower', 'assets/sprites/flower-exo.png');
    }

    create ()
    {
        this.block = this.physics.add.image(400, 100, 'block')
            .setVelocity(100, 200)
            .setBounce(1, 1)
            .setCollideWorldBounds(true);

        this.flower = this.add.image(0, 0, 'flower');
    }

    update ()
    {
        Phaser.Display.Bounds.SetCenterX(this.flower, this.block.body.center.x);
        Phaser.Display.Bounds.SetBottom(this.flower, this.block.body.top);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: { debug: true }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```


## 衝突判定 (Collision)

### Collider 1

> 基本的なコライダーの設定

```javascript
class Example extends Phaser.Scene
{
    group;
    sprite;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('mushroom', 'assets/sprites/mushroom2.png');
        this.load.image('ball', 'assets/sprites/shinyball.png');
    }

    create ()
    {
        this.sprite = this.physics.add.image(400, 300, 'mushroom');

        this.group = this.physics.add.staticGroup({
            key: 'ball',
            frameQuantity: 30
        });

        Phaser.Actions.PlaceOnRectangle(this.group.getChildren(), new Phaser.Geom.Rectangle(84, 84, 616, 416));

        this.group.refresh();

        this.sprite.setVelocity(100, 200).setBounce(1, 1).setCollideWorldBounds(true).setGravityY(200);

        this.physics.add.collider(this.sprite, this.group);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Collide Event

> 衝突イベントのハンドリング

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('atari', 'assets/sprites/atari130xe.png');
        this.load.image('ball', 'assets/sprites/shinyball.png');
        this.load.image('mushroom', 'assets/sprites/mushroom2.png');
    }

    create ()
    {
        const atari = this.physics.add.image(250, 200, 'atari')
            .setImmovable(true);

        const sprite = this.physics.add.image(400, 300, 'mushroom')
            .setVelocity(100, 200)
            .setBounce(1, 1)
            .setCollideWorldBounds(true)
            .setGravityY(200);

        sprite.body.onCollide = true;

        const balls = this.physics.add.staticGroup({
            key: 'ball',
            frameQuantity: 30
        });

        Phaser.Actions.PlaceOnRectangle(
            balls.getChildren(),
            new Phaser.Geom.Rectangle(84, 84, 616, 416)
        );

        balls.refresh();

        this.physics.add.collider(sprite, atari);
        this.physics.add.collider(sprite, balls);

        this.physics.world.on('collide', (gameObject1, gameObject2, body1, body2) =>
        {
            gameObject1.setAlpha(0.5);
            gameObject2.setAlpha(0.5);
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Collision Direction

> 衝突方向の判定

```javascript
class Example extends Phaser.Scene
{
    platform;
    cursors;
    ground;
    stars;
    player;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('sky', 'src/games/firstgame/assets/sky.png');
        this.load.image('ground', 'src/games/firstgame/assets/platform.png');
        this.load.image('star', 'src/games/firstgame/assets/star.png');
        this.load.spritesheet('dude', 'src/games/firstgame/assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    }

    create ()
    {
        this.add.image(400, 300, 'sky');

        this.ground = this.physics.add.staticImage(400, 568, 'ground').setScale(2).refreshBody();

        this.platform = this.physics.add.image(400, 400, 'ground');

        this.platform.setImmovable(true);
        this.platform.body.allowGravity = false;

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
            frameQuantity: 12,
            maxSize: 12,
            active: false,
            visible: false,
            enable: false,
            collideWorldBounds: true,
            bounceX: 0.5,
            bounceY: 0.5,
            dragX: 30,
            dragY: 0
        });

        this.physics.add.collider(
            this.player,
            this.platform,
            (player, platform) =>
            {
                if (player.body.touching.up && platform.body.touching.down)
                {
                    this.createStar(
                        player.body.center.x,
                        platform.body.top - 16,
                        player.body.velocity.x,
                        player.body.velocity.y * -3
                    );
                }
            });

        this.physics.add.collider(this.player, this.ground);
        this.physics.add.collider(this.stars, this.ground);
        this.physics.add.collider(this.stars, this.platform);

        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
    }

    update ()
    {
        if (this.cursors.left.isDown)
        {
            this.player.setVelocityX(-180);

            this.player.anims.play('left', true);
        }
        else if (this.cursors.right.isDown)
        {
            this.player.setVelocityX(180);

            this.player.anims.play('right', true);
        }
        else
        {
            this.player.setVelocityX(0);

            this.player.anims.play('turn');
        }

        if (this.cursors.up.isDown && this.player.body.touching.down)
        {
            this.player.setVelocityY(-360);
        }
    }

    collectStar (player, star)
    {
        star.disableBody(true, true);
    }

    createStar (x, y, vx, vy)
    {
        const star = this.stars.get();

        if (!star) { return; }

        star
            .enableBody(true, x, y, true, true)
            .setVelocity(vx, vy);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
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

### Sprite Vs Sprite

> スプライト同士の衝突

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('mushroom', 'assets/sprites/mushroom2.png');
    }

    create ()
    {
        const sprite1 = this.physics.add.image(100, 100, 'mushroom');
        const sprite2 = this.physics.add.image(400, 100, 'mushroom');

        sprite1.setVelocity(100, 200).setBounce(1, 1).setCollideWorldBounds(true);
        sprite2.setVelocity(100, 200).setBounce(1, 1).setCollideWorldBounds(true);

        this.physics.add.collider(sprite1, sprite2);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 200 },
            debug: true
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Sprite Vs Group

> スプライトとグループの衝突

```javascript
class Example extends Phaser.Scene
{
    group;
    sprite;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('mushroom', 'assets/sprites/mushroom2.png');
        this.load.image('ball', 'assets/sprites/shinyball.png');
    }

    create ()
    {
        this.sprite = this.physics.add.image(400, 300, 'mushroom');

        this.group = this.physics.add.group({
            key: 'ball',
            frameQuantity: 30,
            immovable: true
        });

        Phaser.Actions.PlaceOnRectangle(this.group.getChildren(), new Phaser.Geom.Rectangle(84, 84, 616, 416));

        this.sprite.setVelocity(100, 200).setBounce(1, 1).setCollideWorldBounds(true).setGravityY(200);
    }

    update ()
    {
        this.physics.world.collide(this.sprite, this.group);
    }
}

const config = {
    type: Phaser.WEBGL,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Sprite Vs Immovable

> スプライトと不動オブジェクトの衝突

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('mushroom', 'assets/sprites/mushroom2.png');
        this.load.image('flectrum', 'assets/sprites/flectrum.png');
    }

    create ()
    {
        const wall = this.physics.add.image(200, 300, 'flectrum').setImmovable();

        const sprite = this.physics.add.image(500, 300, 'mushroom').setVelocity(-100, 0).setBounce(1).setCollideWorldBounds(true);

        this.physics.add.collider(wall, sprite, function ()
        {
            wall.setAlpha(0.5);
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Sprite Vs Multiple Groups

> スプライトと複数グループの衝突

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('mushroom', 'assets/sprites/mushroom2.png');
        this.load.image('ball', 'assets/sprites/shinyball.png');
        this.load.image('crate', 'assets/sprites/crate32.png');
    }

    create ()
    {
        const sprite = this.physics.add.image(400, 300, 'mushroom');

        const outer = new Phaser.Geom.Rectangle(0, 0, 800, 600);
        const inner = new Phaser.Geom.Rectangle(350, 250, 100, 100);

        //  Create a few balls

        const balls = this.physics.add.group({ immovable: true });

        for (let i = 0; i < 8; i++)
        {
            const point = Phaser.Geom.Rectangle.RandomOutside(outer, inner);
            const ball = balls.create(point.x, point.y, 'ball');

            this.physics.add.existing(ball);

            ball.body.setImmovable();
        }

        //  Create a few crates

        const crates = this.physics.add.group({ immovable: true });

        for (let i = 0; i < 8; i++)
        {
            const point = Phaser.Geom.Rectangle.RandomOutside(outer, inner);
            const ball = crates.create(point.x, point.y, 'crate');

            this.physics.add.existing(ball);

            ball.body.setImmovable();
        }

        sprite.setVelocity(100, 200).setBounce(1, 1).setCollideWorldBounds(true).setGravityY(200);

        this.physics.add.collider(sprite, [ balls, crates ]);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Group Vs Group

> グループ同士の衝突

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('ball', 'assets/sprites/shinyball.png');
        this.load.image('crate', 'assets/sprites/crate32.png');
    }

    create ()
    {
        //  Create a few balls

        const balls = this.physics.add.group({
            key: 'ball',
            quantity: 24,
            bounceX: 1,
            bounceY: 1,
            collideWorldBounds: true,
            velocityX: 300,
            velocityY: 150
        });

        //  Create a few crates

        const crates = this.physics.add.group({
            key: 'crate',
            quantity: 24,
            bounceX: 1,
            bounceY: 1,
            collideWorldBounds: true,
            velocityX: -150,
            velocityY: -300
        });

        Phaser.Actions.RandomRectangle(balls.getChildren(), this.physics.world.bounds);
        Phaser.Actions.RandomRectangle(crates.getChildren(), this.physics.world.bounds);

        this.physics.add.collider(
            balls,
            crates,
            (ball, crate) =>
            {
                ball.setAlpha(0.5);
                crate.setAlpha(0.5);
            });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Group Vs Self

> グループ内での自己衝突

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('ball', 'assets/sprites/shinyball.png');
    }

    create ()
    {
        const crates = this.physics.add.group({
            key: 'ball',
            quantity: 24,
            bounceX: 1,
            bounceY: 1,
            collideWorldBounds: true,
            velocityX: 300,
            velocityY: 150
        });

        Phaser.Actions.RandomRectangle(crates.getChildren(), this.physics.world.bounds);

        this.physics.add.collider(crates);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 300 }
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Circular Collisions

> 円形ボディの衝突判定

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.spritesheet('ball', 'assets/sprites/balls.png', { frameWidth: 17, frameHeight: 17 });
        this.load.image('wizball', 'assets/sprites/wizball.png');
    }
    create ()
    {
        this.cameras.main.centerOn(0, 0);

        const globe = this.physics.add.staticImage(0, 0, 'wizball')
            .setCircle(45);

        const balls = this.physics.add.group({
            defaultKey: 'ball',
            bounceX: 1,
            bounceY: 1
        });

        balls.defaults.setVelocityX = 100;
        balls.defaults.setVelocityY = 100;

        let created;

        created = balls.createMultiple({
            quantity: 20,
            key: balls.defaultKey,
            frame: 0
        });

        Phaser.Actions.PlaceOnCircle(created, { x: -200, y: -200, radius: 50 });

        balls.defaults.setVelocityX = -100;
        balls.defaults.setVelocityY = 100;

        created = balls.createMultiple({
            quantity: 20,
            key: balls.defaultKey,
            frame: 1
        });

        Phaser.Actions.PlaceOnCircle(created, { x: 400, y: -400, radius: 50 });

        balls.defaults.setVelocityX = -100;
        balls.defaults.setVelocityY = -100;

        created = balls.createMultiple({
            quantity: 20,
            key: balls.defaultKey,
            frame: 2
        });

        Phaser.Actions.PlaceOnCircle(created, { x: 600, y: 600, radius: 50 });

        balls.defaults.setVelocityX = 100;
        balls.defaults.setVelocityY = -100;

        created = balls.createMultiple({
            quantity: 20,
            key: balls.defaultKey,
            frame: 3
        });

        Phaser.Actions.PlaceOnCircle(created, { x: -800, y: 800, radius: 50 });

        for (const ball of balls.getChildren())
        {
            ball.setCircle(8);
        }

        this.physics.add.collider(globe, balls);
    }
}


const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Custom Separate

> カスタム分離処理

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('crate', 'assets/sprites/crate32.png');
    }

    create ()
    {
        this.physics.world.checkCollision.up = false;

        const group = this.physics.add.group({
            bounceY: 0.5,
            collideWorldBounds: true,
            dragY: 30,
            frameQuantity: 18,
            key: 'crate',
            setXY: { x: 200, y: 0, stepX: 16, stepY: -64 },
            velocityY: 300
        });

        group.shuffle();

        for (const crate of group.getChildren())
        {
            crate.body.customSeparateY = true;
        }

        this.physics.add.collider(group, group, function (gameObject1, gameObject2)
        {
            const b1 = gameObject1.body;
            const b2 = gameObject2.body;

            if (b1.y > b2.y)
            {
                b2.y += (b1.top - b2.bottom);
                b2.stop();
            }
            else
            {
                b1.y += (b2.top - b1.bottom);
                b1.stop();
            }
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            fps: 60,
            gravity: { y: 600 }
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Remove Collider

> コライダーの削除

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('mushroom', 'assets/sprites/mushroom2.png');
        this.load.image('ball', 'assets/sprites/shinyball.png');
    }

    create ()
    {
        const sprite = this.physics.add.image(400, 300, 'mushroom');

        const group = this.physics.add.staticGroup({
            key: 'ball',
            frameQuantity: 30
        });

        Phaser.Actions.PlaceOnRectangle(
            group.getChildren(),
            new Phaser.Geom.Rectangle(84, 84, 616, 416)
        );

        // Static bodies must be refreshed if their game objects are moved.
        group.refresh();

        sprite
            .setVelocity(100, 200)
            .setBounce(1, 1)
            .setCollideWorldBounds(true)
            .setGravityY(200);

        const collider = this.physics.add.collider(sprite, group, null, () =>
        {
            this.physics.world.removeCollider(collider);
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: { debug: true }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```


## オーバーラップ (Overlap)

### Overlap Event

> オーバーラップイベントの検出

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('atari', 'assets/sprites/atari130xe.png');
        this.load.image('ball', 'assets/sprites/shinyball.png');
        this.load.image('mushroom', 'assets/sprites/mushroom2.png');
    }

    create ()
    {
        const atari = this.physics.add.image(250, 200, 'atari');

        const sprite = this.physics.add.image(400, 300, 'mushroom')
            .setVelocity(100, 200)
            .setBounce(1, 1)
            .setCollideWorldBounds(true)
            .setGravityY(200);

        sprite.body.onOverlap = true;

        const balls = this.physics.add.staticGroup({
            key: 'ball',
            frameQuantity: 30
        });

        Phaser.Actions.PlaceOnRectangle(
            balls.getChildren(),
            new Phaser.Geom.Rectangle(84, 84, 616, 416)
        );

        balls.refresh();

        this.physics.add.overlap(sprite, atari);
        this.physics.add.overlap(sprite, balls);

        this.physics.world.on('overlap', (gameObject1, gameObject2, body1, body2) =>
        {
            gameObject1.setAlpha(0.5);
            gameObject2.setAlpha(0.5);
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Overlap Zone

> オーバーラップゾーンの設定

```javascript
class Example extends Phaser.Scene
{
    zone;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('block', 'assets/sprites/block.png');
    }

    create ()
    {
        this.zone = this.add.zone(300, 200, 200, 200);

        // Dynamic body
        this.physics.add.existing(this.zone, false);

        this.zone.body.moves = false;

        const blocks = this.physics.add.group({
            defaultKey: 'block',
            bounceX: 1,
            bounceY: 1,
            collideWorldBounds: true
        });

        blocks.create(100, 200).setVelocity(100, 200);
        blocks.create(500, 200).setVelocity(-100, -100);
        blocks.create(300, 400).setVelocity(60, 100);
        blocks.create(600, 300).setVelocity(-30, -50);

        this.physics.add.overlap(this.zone, blocks, (zone, block) =>
        {
            block.setAlpha(0.5);
        });
    }

    update ()
    {
        this.zone.body.debugBodyColor = this.zone.body.touching.none ? 0x00ffff : 0xffff00;
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: { y: 200 }
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Sprite Overlap Group

> スプライトとグループのオーバーラップ

```javascript
class Example extends Phaser.Scene
{
    timedEvent;
    maxHealth = 100;
    currentHealth = 100;
    cursors;
    text;
    healthGroup;
    sprite;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('cat', 'assets/sprites/orange-cat1.png');
        this.load.image('health', 'assets/sprites/firstaid.png');
    }

    create ()
    {
        this.sprite = this.physics.add.image(400, 300, 'cat');

        this.sprite.setCollideWorldBounds(true);

        this.healthGroup = this.physics.add.staticGroup({
            key: 'health',
            frameQuantity: 10,
            immovable: true
        });

        const children = this.healthGroup.getChildren();

        for (let i = 0; i < children.length; i++)
        {
            const x = Phaser.Math.Between(50, 750);
            const y = Phaser.Math.Between(50, 550);

            children[i].setPosition(x, y);
        }

        this.healthGroup.refresh();

        this.text = this.add.text(10, 10, 'Health: 100', { font: '32px Courier', fill: '#000000' });

        this.cursors = this.input.keyboard.createCursorKeys();

        this.physics.add.overlap(this.sprite, this.healthGroup, this.spriteHitHealth, null, this);

        this.timedEvent = this.time.addEvent({ delay: 50, callback: this.reduceHealth, callbackScope: this, loop: true });
    }

    update ()
    {
        if (this.currentHealth === 0)
        {
            return;
        }

        this.text.setText(`Health: ${this.currentHealth}`);

        this.sprite.setVelocity(0);

        if (this.cursors.left.isDown)
        {
            this.sprite.setVelocityX(-200);
        }
        else if (this.cursors.right.isDown)
        {
            this.sprite.setVelocityX(200);
        }

        if (this.cursors.up.isDown)
        {
            this.sprite.setVelocityY(-200);
        }
        else if (this.cursors.down.isDown)
        {
            this.sprite.setVelocityY(200);
        }
    }

    reduceHealth ()
    {
        this.currentHealth--;

        if (this.currentHealth === 0)
        {
            this.sprite.body.reset(400, 300);

            this.text.setText('Health: RIP');

            this.timedEvent.remove();
        }
    }

    spriteHitHealth (sprite, health)
    {
        this.healthGroup.killAndHide(health);

        health.body.enable = false;

        this.currentHealth = Phaser.Math.MaxAdd(this.currentHealth, 10, this.maxHealth);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#2d6b2d',
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: 0
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```


## 物理プロパティ (Physics Properties)

### Gravity

> 重力の設定

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('block', 'assets/sprites/block.png');
    }

    create ()
    {
        const group = this.physics.add.group({
            defaultKey: 'block',
            bounceX: 1,
            bounceY: 1,
            collideWorldBounds: true
        });

        // World gravity
        this.physics.world.gravity.y = 150;

        // Total gravity is 150.
        group.create(250, 300);

        // Total gravity is 450.
        group.create(350, 300).setGravity(0, 300);

        // Total gravity is 150.
        group.create(450, 300).setGravity(0, -300);

        // No gravity.
        group.create(550, 300, 'block').body.setAllowGravity(false);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: { debug: true }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Bounce Test

> 反発係数のテスト

```javascript
class Example extends Phaser.Scene
{
    logo;
    text;
    prevDirection;
    direction;

    maxY = 0;
    minY = 600;
    lastY = 0;
    duration = 0;
    prevDuration = 0;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('logo', 'assets/sprites/phaser3-logo.png');
        this.load.image('marker', 'assets/sprites/longarrow.png');
    }

    create ()
    {
        this.logo = this.physics.add.image(400, 100, 'logo');

        this.logo.setOrigin(0.5, 0);
        this.logo.setVelocity(0, 60);
        this.logo.setBounce(1, 1);
        this.logo.setCollideWorldBounds(true);

        this.lastY = this.logo.y;

        this.text = this.add.text(10, 10, '', { font: '16px Courier', fill: '#00ff00' });
    }

    update (time, delta)
    {
        this.text.setText([
            `steps: ${this.physics.world._lastCount}`,
            `this.duration: ${this.prevDuration}`,
            `last y: ${this.lastY}`,
            `min y: ${this.minY}`,
            `max y: ${this.maxY}`
        ]);

        if (Phaser.Math.Fuzzy.LessThan(this.logo.body.velocity.y, 0, 0.1))
        {
            this.direction = 'up';
        }
        else
        {
            this.direction = 'down';
        }

        if (this.prevDirection !== this.direction && this.prevDirection === 'up')
        {
            const marker = this.add.sprite(0, this.logo.y + 18, 'marker');

            marker.setOrigin(0, 1);

            this.lastY = this.logo.y;

            this.prevDuration = this.duration;
            this.duration = 0;
        }

        this.prevDirection = this.direction;
        this.duration += delta;

        this.minY = Math.min(this.minY, this.logo.y);
        this.maxY = Math.max(this.minY, this.maxY, this.lastY);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 150 }
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Drag

> ドラッグ（抵抗）の設定

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('block', 'assets/sprites/block.png');
    }

    create ()
    {
        this.physics.add.image(100, 100, 'block').setVelocityX(100).setDragX(10);
        this.physics.add.image(100, 200, 'block').setVelocityX(100).setDragX(20);
        this.physics.add.image(100, 300, 'block').setVelocityX(100).setDragX(50);
        this.physics.add.image(100, 400, 'block').setVelocityX(100).setDragX(100);
        this.physics.add.image(100, 500, 'block').setVelocityX(100).setDragX(1000);

        for (const body of this.physics.world.bodies.getArray())
        {
            const { drag, velocity } = body;

            console.log('Body will stop after %.3f seconds', velocity.x / drag.x);
        }
    }

    update ()
    {
        for (const body of this.physics.world.bodies.getArray())
        {
            body.debugBodyColor = body.speed > 0 ? 0x00ff00 : 0xff0000;
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: { debug: true }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Drag With Damping

> ダンピング付きドラッグ

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('block', 'assets/sprites/block.png');
    }

    create ()
    {
        this.physics.add.image(100, 100, 'block').setVelocityX(100).setDamping(true).setDrag(0.5);
        this.physics.add.image(100, 200, 'block').setVelocityX(100).setDamping(true).setDrag(0.2);
        this.physics.add.image(100, 300, 'block').setVelocityX(100).setDamping(true).setDrag(0.1);
        this.physics.add.image(100, 400, 'block').setVelocityX(100).setDamping(true).setDrag(0.05);
        this.physics.add.image(100, 500, 'block').setVelocityX(100).setDamping(true).setDrag(0.01);

        for (const body of this.physics.world.bodies.getArray())
        {
            const { drag, velocity } = body;

            console.log('Body will stop after %.3f seconds', Math.log(0.001 / velocity.x) / Math.log(drag.x));
        }
    }

    update ()
    {
        for (const body of this.physics.world.bodies.getArray())
        {
            body.debugBodyColor = body.speed > 0 ? 0x00ff00 : 0xff0000;
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: { debug: true }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Friction

> 摩擦の設定

```javascript
class Example extends Phaser.Scene
{
    lemmings;
    platforms;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('platform', 'assets/sprites/platform.png');
        this.load.image('lemming', 'assets/sprites/lemming.png');
        this.load.image('spikedball', 'assets/sprites/spikedball.png');
    }

    create ()
    {
        this.platforms = this.physics.add.group({
            key: 'platform',
            frameQuantity: 3,
            setXY: { x: 400, y: 150, stepY: 150 },
            velocityX: 60,
            immovable: true
        });

        const [ platform1, platform2, platform3 ] = this.platforms.getChildren();

        platform1.setFrictionX(1);
        platform2.setFrictionX(0.5);
        platform3.setFrictionX(0);

        this.lemmings = this.physics.add.group({ gravityY: 600 });

        this.lemmings.createMultiple([
            {
                key: 'lemming',
                repeat: 3,
                setXY: { x: 250, y: 0, stepX: 100 }
            },
            {
                key: 'lemming',
                repeat: 3,
                setXY: { x: 250, y: 200, stepX: 100 }
            },
            {
                key: 'lemming',
                repeat: 3,
                setXY: { x: 250, y: 350, stepX: 100 }
            }
        ]);

        this.physics.add.group({
            key: 'spikedball',
            frameQuantity: 6,
            setXY: { x: 0, y: 625, stepX: 150 },
            angularVelocity: 60
        });

        this.physics.add.collider(this.lemmings, this.platforms);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: { default: 'arcade' },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Mass

> 質量の設定

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('block', 'assets/sprites/block.png');
        this.load.image('ball', 'assets/sprites/shinyball.png');
    }

    create ()
    {
        const blocks = this.physics.add.group({
            key: 'block',
            frameQuantity: 5,
            setXY: { x: 200, y: 100, stepY: 100 },
            bounceX: 1
        });

        const balls = this.physics.add.group({
            defaultKey: 'ball',
            bounceX: 1,
            velocityX: 100
        });

        balls.create(0, 100).setMass(0.1);
        balls.create(0, 200).setMass(0.5);
        balls.create(0, 300).setMass(1);
        balls.create(0, 400).setMass(5);
        balls.create(0, 500).setMass(10);

        for (const ball of balls.getChildren())
        {
            ball.setScale(ball.body.mass ** 0.333);
        }

        this.physics.add.collider(balls, blocks);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Immovable Body

> 不動ボディの設定

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('atari', 'assets/sprites/atari130xe.png');
        this.load.image('diamond', 'assets/sprites/diamond.png');
    }

    create ()
    {
        // An "immovable" body never separates or bounces during a collision.
        // It can still move by velocity.

        const atari = this.physics.add.image(400, 300, 'atari')
            .setBounce(1, 1)
            .setCollideWorldBounds(true)
            .setImmovable(true)
            .setVelocity(200, 100);

        const gems = this.physics.add.group({
            key: 'diamond',
            quantity: 24,
            collideWorldBounds: true
        });

        Phaser.Actions.PlaceOnCircle(gems.getChildren(), new Phaser.Geom.Circle(400, 300, 200));

        this.physics.add.collider(atari, gems);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Non Pushable Bodies

> 押し出し不可ボディの設定

```javascript
class Example extends Phaser.Scene
{
    cursors;
    currentPlayer;
    player2;
    player1;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('sky', 'src/games/firstgame/assets/sky.png');
        this.load.image('ground', 'src/games/firstgame/assets/platform.png');
        this.load.image('star', 'src/games/firstgame/assets/star.png');
        this.load.spritesheet('dude', 'src/games/firstgame/assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    }

    create ()
    {
        this.add.image(400, 300, 'sky');

        const ground = this.physics.add.staticGroup();
        ground.create(400, 568, 'ground').setScale(2).refreshBody();

        this.player1 = this.physics.add.sprite(100, 450, 'dude').setBounce(0.2).setCollideWorldBounds(true);
        this.player2 = this.physics.add.sprite(500, 450, 'dude').setTint(0xff0000).setBounce(0.2).setCollideWorldBounds(true);

        this.player1.name = 'Purple';
        this.player2.name = 'Red';

        this.player2.setPushable(false);
        this.currentPlayer = this.player1;

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

        this.physics.add.collider(this.player1, ground);
        this.physics.add.collider(this.player2, ground);
        this.physics.add.collider(this.player1, this.player2);

        this.input.on('pointerdown', () => {
            if (this.currentPlayer === this.player1) {
                this.currentPlayer = this.player2;
            } else {
                this.currentPlayer = this.player1;
            }
        }, this);

        this.add.text(10, 10, 'Click to change character', { fontSize: '22px', fill: '#ecf0f1' });
    }

    update ()
    {
        if (this.cursors.left.isDown) {
            this.currentPlayer.setVelocityX(-160);
            this.currentPlayer.anims.play('left', true);
        }
        else if (this.cursors.right.isDown) {
            this.currentPlayer.setVelocityX(160);
            this.currentPlayer.anims.play('right', true);
        }
        else {
            this.currentPlayer.setVelocityX(0);
            this.currentPlayer.anims.play('turn');
        }

        if (this.cursors.up.isDown && this.currentPlayer.body.touching.down) {
            this.currentPlayer.setVelocityY(-330);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: true
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Larger Bounding Box

> バウンディングボックスの拡大

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('atari', 'assets/sprites/atari130xe.png');
        this.load.image('mushroom', 'assets/sprites/mushroom2.png');
    }

    create ()
    {
        const atari = this.physics.add.image(200, 400, 'atari').setImmovable(true);

        atari.setSize(300, 260, true);

        const mushroom1 = this.physics.add.image(700, 350, 'mushroom');
        const mushroom2 = this.physics.add.image(200, 50, 'mushroom');

        mushroom1.setVelocity(-100, 0);
        mushroom2.setVelocity(0, 100);

        this.physics.add.collider(atari, [ mushroom1, mushroom2 ]);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Smaller Bounding Box

> バウンディングボックスの縮小

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('atari', 'assets/sprites/atari130xe.png');
        this.load.image('mushroom', 'assets/sprites/mushroom2.png');
    }

    create ()
    {
        const atari = this.physics.add.image(200, 400, 'atari').setImmovable(true);

        //  In this example the new collision box is smaller than the original sprite

        //  220x104 original size, 110x52 new size, the 'true' argument means "center it on the gameobject"
        atari.setSize(110, 52, true);

        //  And this sprite will collide with it
        const mushroom1 = this.physics.add.image(700, 350, 'mushroom');
        const mushroom2 = this.physics.add.image(200, 50, 'mushroom');

        mushroom1.setVelocity(-100, 0);
        mushroom2.setVelocity(0, 100);

        this.physics.add.collider(atari, [ mushroom1, mushroom2 ]);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```


## ワールド境界 (World Bounds)

### Custom Bounds

> カスタム境界の設定

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('clown', 'assets/sprites/clown.png');
        this.load.image('monitor', 'assets/demoscene/monitor.png');
        this.load.image('sky', 'assets/skies/space2.png');
        this.load.spritesheet('ball', 'assets/sprites/balls.png', { frameWidth: 17, frameHeight: 17 });
    }

    create ()
    {
        this.add.image(400, 300, 'sky');

        const balls = this.physics.add.group({
            key: 'ball',
            frame: [ 0, 1, 2, 3, 4 ],
            frameQuantity: 10,
            bounceX: 1,
            bounceY: 1,
            collideWorldBounds: true,
            velocityX: 100,
            velocityY: 100
        });

        Phaser.Actions.RandomRectangle(balls.getChildren(), this.physics.world.bounds);

        this.add.image(400, 300, 'monitor');

        const clown = this.physics.add.image(400, 300, 'clown')
            .setCollideWorldBounds(true, 1, 1)
            .setVelocity(100, -100);

        clown.body.setBoundsRectangle(new Phaser.Geom.Rectangle(254, 186, 292, 210));
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 200 }
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Custom World Bounds

> カスタムワールド境界

```javascript
// TODO rename 

class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('monitor', 'assets/demoscene/monitor.png');
        this.load.image('sky', 'assets/skies/space2.png');
        this.load.spritesheet('ball', 'assets/sprites/balls.png', { frameWidth: 17, frameHeight: 17 });
    }

    create ()
    {
        this.add.image(400, 300, 'sky');

        // Balls in the default world bounds

        const balls1 = this.physics.add.group({
            key: 'ball',
            frame: 1,
            frameQuantity: 50,
            bounceX: 1,
            bounceY: 1,
            collideWorldBounds: true,
            velocityX: 100,
            velocityY: 100
        });

        Phaser.Actions.RandomRectangle(balls1.getChildren(), this.physics.world.bounds);

        this.add.image(400, 300, 'monitor');

        // Balls in smaller bounds

        const smallBounds = new Phaser.Geom.Rectangle(254, 186, 292, 210);

        const balls2 = this.physics.add.group({
            key: 'ball',
            frame: 3,
            frameQuantity: 50,
            bounceX: 1,
            bounceY: 1,
            collideWorldBounds: true,
            velocityX: 100,
            velocityY: 100
        });

        for (const ball of balls2.getChildren())
        {
            ball.body.customBoundsRectangle = smallBounds;
        }

        Phaser.Actions.RandomRectangle(balls2.getChildren(), smallBounds);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 200 }
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Set World Bounds

> ワールド境界の動的設定

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('bg', 'assets/skies/space2.png');
        this.load.image('cockpit', 'assets/pics/cockpit.png');
        this.load.spritesheet('ball', 'assets/sprites/balls.png', { frameWidth: 17, frameHeight: 17 });
    }

    create ()
    {
        this.add.image(320, 200, 'bg');
        this.add.image(320, 200, 'cockpit').setScale(2);

        this.physics.world.setBounds(32, 20, 576, 240);

        const group = this.physics.add.group({
            key: 'ball',
            frameQuantity: 48,
            bounceX: 1,
            bounceY: 1,
            collideWorldBounds: true,
            velocityX: 200,
            velocityY: 150
        });

        Phaser.Actions.RandomRectangle(group.getChildren(), this.physics.world.bounds);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 640,
    height: 400,
    parent: 'phaser-example',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 200 }
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### World Bounds Event

> ワールド境界イベント

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('bg', 'assets/skies/space2.png');
        this.load.image('arrow', 'assets/sprites/arrow.png');
    }

    create ()
    {
        this.add.image(400, 300, 'bg');

        this.physics.add.sprite(200, 150, 'arrow')
            .setVelocity(200, -200)
            .setCollideWorldBounds(true, 1, 1, true);

        this.physics.world.on('worldbounds', (body, up, down, left, right) =>
        {
            const { gameObject } = body;

            if (up) { gameObject.setAngle(90); }
            else if (down) { gameObject.setAngle(-90); }
            else if (left) { gameObject.setAngle(0); }
            else if (right) { gameObject.setAngle(180); }
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    pixelArt: true,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Group World Bounds Event

> グループのワールド境界イベント

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('bg', 'assets/skies/space2.png');
        this.load.spritesheet('ball', 'assets/sprites/balls.png', { frameWidth: 17, frameHeight: 17 });
    }

    create ()
    {
        this.add.image(400, 300, 'bg');

        const balls = this.physics.add.group({
            key: 'ball',
            frameQuantity: 48,
            bounceX: 1,
            bounceY: 1,
            collideWorldBounds: true,
            velocityX: 200,
            velocityY: 150
        });

        Phaser.Actions.RandomRectangle(balls.getChildren(), this.physics.world.bounds);

        for (const ball of balls.getChildren())
        {
            ball.body.onWorldBounds = true;
        }

        this.physics.world.on('worldbounds', (body) =>
        {
            const ball = body.gameObject;

            ball.setFrame((ball.frame.name + 1) % 5);
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: {
                y: 200
            }
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```


## 弾丸・シューティング (Bullets & Shooting)

### Bullets Group

> 弾丸グループの管理

```javascript
class Bullet extends Phaser.Physics.Arcade.Sprite
{
    constructor (scene, x, y)
    {
        super(scene, x, y, 'bullet');
    }

    fire (x, y)
    {
        this.body.reset(x, y);

        this.setActive(true);
        this.setVisible(true);

        this.setVelocityY(-300);
    }

    preUpdate (time, delta)
    {
        super.preUpdate(time, delta);

        if (this.y <= -32)
        {
            this.setActive(false);
            this.setVisible(false);
        }
    }
}

class Bullets extends Phaser.Physics.Arcade.Group
{
    constructor (scene)
    {
        super(scene.physics.world, scene);

        this.createMultiple({
            frameQuantity: 5,
            key: 'bullet',
            active: false,
            visible: false,
            classType: Bullet
        });
    }

    fireBullet (x, y)
    {
        const bullet = this.getFirstDead(false);

        if (bullet)
        {
            bullet.fire(x, y);
        }
    }
}

class Example extends Phaser.Scene
{
    constructor ()
    {
        super();

        this.bullets;
        this.ship;
    }

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('bullet', 'assets/sprites/bullets/bullet7.png');
        this.load.image('ship', 'assets/sprites/bsquadron1.png');
    }

    create ()
    {
        this.bullets = new Bullets(this);

        this.ship = this.add.image(400, 500, 'ship');

        this.input.on('pointermove', (pointer) =>
        {

            this.ship.x = pointer.x;

        });

        this.input.on('pointerdown', (pointer) =>
        {

            this.bullets.fireBullet(this.ship.x, this.ship.y);

        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Space

> 宇宙シューティング

```javascript
class Bullet extends Phaser.Physics.Arcade.Image
{
    constructor (scene)
    {
        super(scene, 0, 0, 'space', 'blaster');

        this.setBlendMode(1);
        this.setDepth(1);

        this.speed = 1000;
        this.lifespan = 1000;

        this._temp = new Phaser.Math.Vector2();
    }

    fire (ship)
    {
        this.lifespan = 1000;

        this.setActive(true);
        this.setVisible(true);
        this.setAngle(ship.body.rotation);
        this.setPosition(ship.x, ship.y);
        this.body.reset(ship.x, ship.y);

        const angle = Phaser.Math.DegToRad(ship.body.rotation);

        this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);

        this.body.velocity.x *= 2;
        this.body.velocity.y *= 2;
    }

    update (time, delta)
    {
        this.lifespan -= delta;

        if (this.lifespan <= 0)
        {
            this.setActive(false);
            this.setVisible(false);
            this.body.stop();
        }
    }
}

class Example extends Phaser.Scene
{
    lastFired = 0;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('background', 'assets/tests/space/nebula.jpg');
        this.load.image('stars', 'assets/tests/space/stars.png');
        this.load.atlas('space', 'assets/tests/space/space.png', 'assets/tests/space/space.json');
    }
    create ()
    {
        this.textures.addSpriteSheetFromAtlas('mine-sheet', { atlas: 'space', frame: 'mine', frameWidth: 64 });
        this.textures.addSpriteSheetFromAtlas('asteroid1-sheet', { atlas: 'space', frame: 'asteroid1', frameWidth: 96 });
        this.textures.addSpriteSheetFromAtlas('asteroid2-sheet', { atlas: 'space', frame: 'asteroid2', frameWidth: 96 });
        this.textures.addSpriteSheetFromAtlas('asteroid3-sheet', { atlas: 'space', frame: 'asteroid3', frameWidth: 96 });
        this.textures.addSpriteSheetFromAtlas('asteroid4-sheet', { atlas: 'space', frame: 'asteroid4', frameWidth: 64 });

        this.anims.create({ key: 'mine-anim', frames: this.anims.generateFrameNumbers('mine-sheet', { start: 0, end: 15 }), frameRate: 20, repeat: -1 });
        this.anims.create({ key: 'asteroid1-anim', frames: this.anims.generateFrameNumbers('asteroid1-sheet', { start: 0, end: 24 }), frameRate: 20, repeat: -1 });
        this.anims.create({ key: 'asteroid2-anim', frames: this.anims.generateFrameNumbers('asteroid2-sheet', { start: 0, end: 24 }), frameRate: 20, repeat: -1 });
        this.anims.create({ key: 'asteroid3-anim', frames: this.anims.generateFrameNumbers('asteroid3-sheet', { start: 0, end: 24 }), frameRate: 20, repeat: -1 });
        this.anims.create({ key: 'asteroid4-anim', frames: this.anims.generateFrameNumbers('asteroid4-sheet', { start: 0, end: 23 }), frameRate: 20, repeat: -1 });

        this.bg = this.add.tileSprite(400, 300, 800, 600, 'background').setScrollFactor(0);

        this.add.image(512, 680, 'space', 'blue-planet').setOrigin(0).setScrollFactor(0.6);
        this.add.image(2833, 1246, 'space', 'brown-planet').setOrigin(0).setScrollFactor(0.6);
        this.add.image(3875, 531, 'space', 'sun').setOrigin(0).setScrollFactor(0.6);
        const galaxy = this.add.image(5345 + 1024, 327 + 1024, 'space', 'galaxy').setBlendMode(1).setScrollFactor(0.6);
        this.add.image(908, 3922, 'space', 'gas-giant').setOrigin(0).setScrollFactor(0.6);
        this.add.image(3140, 2974, 'space', 'brown-planet').setOrigin(0).setScrollFactor(0.6).setScale(0.8).setTint(0x882d2d);
        this.add.image(6052, 4280, 'space', 'purple-planet').setOrigin(0).setScrollFactor(0.6);

        for (let i = 0; i < 8; i++)
        {
            this.add.image(Phaser.Math.Between(0, 8000), Phaser.Math.Between(0, 6000), 'space', 'eyes').setBlendMode(1).setScrollFactor(0.8);
        }

        this.stars = this.add.tileSprite(400, 300, 800, 600, 'stars').setScrollFactor(0);

        const emitter = this.add.particles(0, 0, 'space', {
            frame: 'blue',
            speed: 100,
            lifespan: {
                onEmit: (particle, key, t, value) =>
                {
                    return Phaser.Math.Percent(this.ship.body.speed, 0, 300) * 2000;
                }
            },
            alpha: {
                onEmit: (particle, key, t, value) =>
                {
                    return Phaser.Math.Percent(this.ship.body.speed, 0, 300);
                }
            },
            angle: {
                onEmit: (particle, key, t, value) =>
                {
                    return (this.ship.angle - 180) + Phaser.Math.Between(-10, 10);
                }
            },
            scale: { start: 0.6, end: 0 },
            blendMode: 'ADD'
        });

        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: 30,
            runChildUpdate: true
        });

        this.ship = this.physics.add.image(4000, 3000, 'space', 'ship').setDepth(2);

        this.ship.setDrag(300);
        this.ship.setAngularDrag(400);
        this.ship.setMaxVelocity(600);

        emitter.startFollow(this.ship);

        this.cameras.main.startFollow(this.ship);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.fire = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.add.sprite(4300, 3000).play('asteroid1-anim');

        this.tweens.add({
            targets: galaxy,
            angle: 360,
            duration: 100000,
            ease: 'Linear',
            loop: -1
        });
    }

    update (time, delta)
    {
        const { left, right, up } = this.cursors;

        if (left.isDown)
        {
            this.ship.setAngularVelocity(-150);
        }
        else if (right.isDown)
        {
            this.ship.setAngularVelocity(150);
        }
        else
        {
            this.ship.setAngularVelocity(0);
        }

        if (up.isDown)
        {
            this.physics.velocityFromRotation(this.ship.rotation, 600, this.ship.body.acceleration);
        }
        else
        {
            this.ship.setAcceleration(0);
        }

        if (this.fire.isDown && time > this.lastFired)
        {
            const bullet = this.bullets.get();

            if (bullet)
            {
                bullet.fire(this.ship);

                this.lastFired = time + 100;
            }
        }

        this.bg.tilePositionX += this.ship.body.deltaX() * 0.5;
        this.bg.tilePositionY += this.ship.body.deltaY() * 0.5;

        this.stars.tilePositionX += this.ship.body.deltaX() * 2;
        this.stars.tilePositionY += this.ship.body.deltaY() * 2;
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Space Battle

> 宇宙戦闘

```javascript
class Bullet extends Phaser.Physics.Arcade.Image
{
    fire (x, y, vx, vy)
    {
        this.enableBody(true, x, y, true, true);
        this.setVelocity(vx, vy);
    }

    onCreate ()
    {
        this.disableBody(true, true);
        this.body.collideWorldBounds = true;
        this.body.onWorldBounds = true;
    }

    onWorldBounds ()
    {
        this.disableBody(true, true);
    }
}

class Bullets extends Phaser.Physics.Arcade.Group
{
    constructor (world, scene, config)
    {
        super(
            world,
            scene,
            { ...config, classType: Bullet, createCallback: Bullets.prototype.onCreate }
        );
    }

    fire (x, y, vx, vy)
    {
        const bullet = this.getFirstDead(false);

        if (bullet)
        {
            bullet.fire(x, y, vx, vy);
        }
    }

    onCreate (bullet)
    {
        bullet.onCreate();
    }

    poolInfo ()
    {
        return `${this.name} total=${this.getLength()} active=${this.countActive(true)} inactive=${this.countActive(false)}`;
    }
}

class Example extends Phaser.Scene
{
    bullets;
    enemy;
    enemyBullets;
    enemyFiring;
    enemyMoving;
    plasma;
    player;
    stars;
    text;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('bullet', 'assets/sprites/bullets/bullet7.png');
        this.load.image('enemyBullet', 'assets/sprites/bullets/bullet6.png');
        this.load.image('ship', 'assets/sprites/bsquadron1.png');
        this.load.image('starfield', 'assets/skies/starfield.png');
        this.load.spritesheet('enemy', 'assets/sprites/bsquadron-enemies.png', {
            frameWidth: 192,
            frameHeight: 160
        });
    }

    create ()
    {
        this.stars = this.add.blitter(0, 0, 'starfield');
        this.stars.create(0, 0);
        this.stars.create(0, -512);

        this.bullets = this.add.existing(
            new Bullets(this.physics.world, this, { name: 'bullets' })
        );
        this.bullets.createMultiple({
            key: 'bullet',
            quantity: 5
        });

        this.enemyBullets = this.add.existing(
            new Bullets(this.physics.world, this, { name: 'enemyBullets' })
        );
        this.enemyBullets.createMultiple({
            key: 'enemyBullet',
            quantity: 5
        });

        this.enemy = this.physics.add.sprite(256, 128, 'enemy', 1);
        this.enemy.setBodySize(160, 64);
        this.enemy.state = 5;

        this.enemyMoving = this.tweens.add({
            targets: this.enemy.body.velocity,
            props: {
                x: { from: 150, to: -150, duration: 4000 },
                y: { from: 50, to: -50, duration: 2000 }
            },
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        this.enemyFiring = this.time.addEvent({
            delay: 750,
            loop: true,
            callback: () =>
            {
                this.enemyBullets.fire(this.enemy.x, this.enemy.y + 32, 0, 150);
            }
        });

        this.player = this.physics.add.image(256, 448, 'ship');

        this.plasma = this.add.particles(0, 0, 'bullet', {
            alpha: { start: 1, end: 0, ease: 'Cubic.easeIn' },
            blendMode: Phaser.BlendModes.SCREEN,
            frequency: -1,
            lifespan: 500,
            radial: false,
            scale: { start: 1, end: 5, ease: 'Cubic.easeOut' }
        });

        this.text = this.add.text(0, 480, '', {
            font: '16px monospace',
            fill: 'aqua'
        });

        this.physics.add.overlap(this.enemy, this.bullets, (enemy, bullet) =>
        {
            const { x, y } = bullet.body.center;

            enemy.state -= 1;
            bullet.disableBody(true, true);
            this.plasma.emitParticleAt(x, y);

            if (enemy.state <= 0)
            {
                enemy.setFrame(3);
                enemy.body.checkCollision.none = true;
                this.enemyFiring.remove();
                this.enemyMoving.stop();
            }
        });

        this.physics.add.overlap(this.player, this.enemyBullets, (player, bullet) =>
        {
            const { x, y } = bullet.body.center;

            bullet.disableBody(true, true);
            this.plasma.emitParticleAt(x, y);
        });

        this.physics.world.on('worldbounds', (body) =>
        {
            body.gameObject.onWorldBounds();
        });

        this.input.on('pointermove', (pointer) =>
        {
            this.player.x = pointer.worldX;
        });

        this.input.on('pointerdown', () =>
        {
            this.bullets.fire(this.player.x, this.player.y, 0, -300);
        });
    }

    update ()
    {
        this.stars.y += 1;
        this.stars.y %= 512;

        this.text.setText([ this.bullets.poolInfo(), this.enemyBullets.poolInfo() ]);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 512,
    height: 512,
    pixelArt: true,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Apply Force

> 力の適用

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('block', 'assets/sprites/block.png');
        this.load.spritesheet('boom', 'assets/sprites/explosion.png', { frameWidth: 64, frameHeight: 64, endFrame: 23 });
    }

    create ()
    {
        this.anims.create({
            key: 'explode',
            frames: 'boom',
            frameRate: 20,
            showOnStart: true,
            hideOnComplete: true
        });

        const blocks = this.physics.add.group({
            defaultKey: 'block',
            bounceX: 1,
            bounceY: 1,
            collideWorldBounds: true,
            dragX: 0.5,
            dragY: 0.5,
            useDamping: true
        });

        for (let i = 0; i < 10; i++)
        {
            const block = blocks.create(Phaser.Math.Between(100, 700), Phaser.Math.Between(100, 500));

            block.setMass(Phaser.Math.Between(1, 2));
            block.setScale(block.body.mass ** 0.5);
        }

        const boom = this.add.sprite(0, 0, 'boom').setBlendMode('ADD').setScale(4).setVisible(false);

        this.input.on('pointerdown', (pointer) =>
        {
            boom.copyPosition(pointer).play('explode');

            const distance = new Phaser.Math.Vector2();
            const force = new Phaser.Math.Vector2();
            const acceleration = new Phaser.Math.Vector2();

            for (const block of blocks.getChildren())
            {
                distance.copy(block.body.center).subtract(pointer);
                force.copy(distance).setLength(5000000 / distance.lengthSq()).limit(1000);
                acceleration.copy(force).scale(1 / block.body.mass);
                block.body.velocity.add(acceleration);
            }
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```


## プラットフォーマー (Platformer)

### Basic Platform

> 基本的なプラットフォーマー

```javascript
class Example extends Phaser.Scene
{
    movingPlatform;
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
        this.load.spritesheet('dude', 'src/games/firstgame/assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    }

    create ()
    {
        this.add.image(400, 300, 'sky');

        this.platforms = this.physics.add.staticGroup();

        this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();

        this.movingPlatform = this.physics.add.image(400, 400, 'ground');

        this.movingPlatform.setImmovable(true);
        this.movingPlatform.body.allowGravity = false;
        this.movingPlatform.setVelocityX(50);

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

        for (const star of this.stars.getChildren())
        {
            star.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        }

        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.movingPlatform);
        this.physics.add.collider(this.stars, this.platforms);
        this.physics.add.collider(this.stars, this.movingPlatform);

        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
    }

    update ()
    {
        const { left, right, up } = this.cursors;

        if (left.isDown)
        {
            this.player.setVelocityX(-160);

            this.player.anims.play('left', true);
        }
        else if (right.isDown)
        {
            this.player.setVelocityX(160);

            this.player.anims.play('right', true);
        }
        else
        {
            this.player.setVelocityX(0);

            this.player.anims.play('turn');
        }

        if (up.isDown && this.player.body.touching.down)
        {
            this.player.setVelocityY(-330);
        }

        if (this.movingPlatform.x >= 500)
        {
            this.movingPlatform.setVelocityX(-50);
        }
        else if (this.movingPlatform.x <= 300)
        {
            this.movingPlatform.setVelocityX(50);
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
    parent: 'phaser-example',
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

### Direct Control Platforms

> プラットフォームの直接制御

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.spritesheet('dude', 'src/games/firstgame/assets/dude.png', { frameWidth: 32, frameHeight: 48 });
        this.load.atlas('tiles', 'assets/sets/platformer.png', 'assets/sets/platformer.json');
        this.load.image('bg', 'assets/sets/background.png');
    }

    create ()
    {
        this.add.image(400, 300, 'bg');

        const water = this.physics.add.staticGroup();

        for (let i = 0; i < 6; i++)
        {
            water.create(i * 128, 552, 'tiles', '17');
        }

        const ground = this.physics.add.staticGroup();

        ground.create(64, 536, 'tiles', '6');
        ground.create(64, 536-128, 'tiles', '6');
        ground.create(64, 536-256, 'tiles', '6');
        ground.create(64, 536-384, 'tiles', '3');
        ground.create(736, 536, 'tiles', '1');

        this.add.image(740, 440, 'tiles', 'sign2');

        const platform1 = this.physics.add.image(600, 128, 'tiles', 'platform1').setScale(0.5).setDirectControl().setImmovable();
        const platform2 = this.physics.add.image(700, 270, 'tiles', 'platform1').setScale(0.5).setDirectControl().setImmovable();
        const platform3 = this.physics.add.image(200, 400, 'tiles', 'platform1').setScale(0.5).setDirectControl().setImmovable();

        this.physics.world.setBounds(0, -400, 800, 1000);

        this.player = this.physics.add.sprite(64, 64, 'dude').setBounce(0.2).setCollideWorldBounds(true);

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

        this.tweens.add({
            targets: platform1,
            x: 200,
            duration: 4000,
            yoyo: true,
            repeat: -1
        });

        this.tweens.add({
            targets: platform2,
            x: 250,
            duration: 3000,
            yoyo: true,
            repeat: -1
        });

        this.tweens.add({
            targets: platform3,
            x: 550,
            y: 450,
            duration: 2500,
            yoyo: true,
            repeat: -1
        });

        this.cursors = this.input.keyboard.createCursorKeys();

        this.physics.add.collider(this.player, ground);
        this.physics.add.collider(this.player, [ platform1, platform2, platform3 ]);
        this.physics.add.collider(this.player, water, () => this.player.setPosition(64, 64));
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
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 },
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Sticky Platform

> くっつくプラットフォーム

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('block', 'assets/sprites/block.png');
        this.load.image('dude', 'assets/sprites/phaser-dude.png');
        this.load.image('ball', 'assets/sprites/blue_ball.png');
        this.load.image('sky', 'assets/skies/cavern2.png');
    }

    create ()
    {
        const targets = [
            new Phaser.Math.Vector2(100, 500),
            new Phaser.Math.Vector2(700, 100),
            new Phaser.Math.Vector2(700, 500),
            new Phaser.Math.Vector2(100, 100)
        ];

        let targetIndex = 0;

        this.add.image(400, 300, 'sky');

        const block = this.physics.add.image(100, 100, 'block');

        block.body.immovable = true;
        block.body.allowGravity = false;

        const dude = this.physics.add.image(100, 0, 'dude');

        this.time.addEvent({
            delay: 2000,
            startAt: 1500,
            loop: -1,
            callback: () =>
            {
                this.physics.moveToObject(block, targets[targetIndex++ % targets.length], 0, 2000);
            }
        });

        this.physics.add.collider(block, dude, () =>
        {
            dude.setGravityY(12000);
        });

        this.input.on('pointerdown', () =>
        {
            if (dude.body.onFloor())
            {
                // Jump!
                dude.setGravityY(0);
                dude.body.velocity.y -= 300;
            }
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: { y: 800 }
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Trick Platforms

> トリックプラットフォーム

```javascript
class Example extends Phaser.Scene
{
    cursors;
    player;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('block', 'assets/sprites/block.png');
        this.load.image('sky', 'src/games/firstgame/assets/sky.png');
        this.load.image('ground', 'src/games/firstgame/assets/platform.png');
        this.load.image('star', 'src/games/firstgame/assets/star.png');
        this.load.spritesheet('dude', 'src/games/firstgame/assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    }

    create ()
    {
        this.createAnims();
        this.physics.world.checkCollision.up = false;
        this.physics.world.checkCollision.down = false;
        this.add.image(400, 300, 'sky');

        const platforms = this.physics.add.group({
            defaultKey: 'ground'
        });

        platforms.create(400, 500);
        platforms.create(450, 400);
        platforms.create(500, 300);
        platforms.create(550, 200);
        platforms.create(600, 100);

        for (const platform of platforms.getChildren())
        {
            platform.body.immovable = true;
            platform.body.moves = false;
        }

        const block = this.physics.add.staticImage(100, 300, 'block');
        this.player = this.physics.add.sprite(100, 150, 'dude');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.cursors = this.input.keyboard.createCursorKeys();

        const stars = this.physics.add.group({
            allowGravity: false,
            bounceX: 1,
            bounceY: 1,
            velocityY: 50
        });

        stars.createMultiple([
            { key: 'star', quantity: 6, setXY: { x: 450, y: 150, stepX: 50, stepY: 5 } },
            { key: 'star', quantity: 6, setXY: { x: 400, y: 250, stepX: 50, stepY: 5 } },
            { key: 'star', quantity: 6, setXY: { x: 350, y: 350, stepX: 50, stepY: 5 } }
        ]);

        this.physics.add.collider(this.player, platforms, (player, platform) =>
        {
            platform.body.moves = true;
            platform.body.checkCollision.none = true;
        });

        this.physics.add.collider(this.player, block);
        this.physics.add.collider(stars, platforms);
        this.physics.add.overlap(this.player, stars, this.collectStar, null, this);
    }

    update ()
    {
        const { left, right, up } = this.cursors;

        if (left.isDown)
        {
            this.player.setVelocityX(-150);
            this.player.anims.play('left', true);
        }
        else if (right.isDown)
        {
            this.player.setVelocityX(150);
            this.player.anims.play('right', true);
        }
        else
        {
            this.player.setVelocityX(0);
            this.player.anims.play('turn');
        }

        if (up.isDown && this.player.body.onFloor())
        {
            this.player.setVelocityY(-300);
        }
    }

    collectStar (player, star)
    {
        star.disableBody(true, true);
    }

    createAnims ()
    {
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
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 300 }
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Body Push Blocks

> ブロックを押す物理

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('block', 'assets/sprites/crate32.png');
        this.load.image('ice', 'assets/sprites/block-ice.png');
        this.load.image('be', 'assets/sprites/beball1.png');
    }

    create ()
    {
        this.player = this.physics.add.sprite(400, 300, 'be');

        this.player.setCollideWorldBounds(true);
        this.player.setPushable(false);

        const boxes = [];

        for (let i = 0; i < 16; i++)
        {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(0, 600);

            const box = this.physics.add.image(x, y, 'block');

            box.setCollideWorldBounds(true);
            box.body.slideFactor.set(0, 0);

            boxes.push(box);
        }

        for (let i = 0; i < 16; i++)
        {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(0, 600);

            const box = this.physics.add.image(x, y, 'ice').setScale(0.125);

            box.setCollideWorldBounds(true);
            box.setDrag(100);
            box.setBounce(1);

            boxes.push(box);
        }

        let playerIsNPC = false;

        this.cursors = this.input.keyboard.createCursorKeys();

        this.physics.add.collider(this.player, boxes, null, (player, box) => {

            if (playerIsNPC)
            {
                box.setPushable(false);
            }
            else
            {
                box.setPushable(true);
            }

            return true;

        });

        this.input.on('pointerdown', () => {

            playerIsNPC = !playerIsNPC;

            if (playerIsNPC)
            {
                this.player.setTint(0xff0000);
            }
            else
            {
                this.player.clearTint();
            }

        });
    }

    update ()
    {
        this.player.setVelocity(0, 0);

        if (this.cursors.left.isDown)
        {
            this.player.setVelocityX(-200);
        }
        else if (this.cursors.right.isDown)
        {
            this.player.setVelocityX(200);
        }

        if (this.cursors.up.isDown)
        {
            this.player.setVelocityY(-200);
        }
        else if (this.cursors.down.isDown)
        {
            this.player.setVelocityY(200);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```


## ダイレクトコントロール (Direct Control)

### Direct Control

> 物理ボディの直接制御

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('master', 'assets/sprites/master.png');
        this.load.image('mushroom', 'assets/sprites/mushroom16x16.png');
    }

    create ()
    {
        this.master = this.physics.add.image(100, 300, 'master');

        this.master.setDirectControl();
        this.master.setImmovable();

        this.tweens.add({
            targets: this.master,
            x: 700,
            duration: 3000,
            ease: 'sine.inout',
            repeat: -1,
            yoyo: true
        });

        this.debug = this.add.text(10, 10, '', { font: '16px Courier', fill: '#00ff00' });

        this.mushrooms = [];

        for (let i = 0; i < 64; i++)
        {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(-1900, 0);

            const mushroom = this.physics.add.image(x, y, 'mushroom');

            mushroom.body.setBounce(1);
            mushroom.body.setMaxVelocity(2000, 2000);
            mushroom.setCollideWorldBounds(true);

            this.mushrooms.push(mushroom);
        }

        this.physics.world.setBounds(0, -2000, 800, 2600);

        this.physics.add.collider(this.master, this.mushrooms);
    }

    update ()
    {
        const block = this.master;

        this.debug.setText([
            'velocity.x: ' + block.body.velocity.x,
            'velocity.y: ' + block.body.velocity.y
        ]);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: { y: 50 },
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Direct Control Follow Mouse

> マウス追従の直接制御

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('bg', 'assets/skies/clouds.png');
        this.load.image('ground', 'assets/skies/sf2floor.png');
        this.load.image('master', 'assets/sprites/master.png');
        this.load.spritesheet('coin', 'assets/sprites/coin.png', { frameWidth: 32, frameHeight: 32 });
    }

    create ()
    {
        this.add.image(400, 400, 'bg');
        this.add.image(400, 600, 'ground');

        const master = this.physics.add.image(400, 300, 'master');

        master.setDirectControl();
        master.setImmovable();

        this.input.on('pointermove', pointer => {

            master.setPosition(pointer.worldX, pointer.worldY);

        });

        this.anims.create({
            key: 'spin',
            frames: this.anims.generateFrameNumbers('coin', { frames: [ 0, 1, 2, 3, 4, 5 ] }),
            frameRate: 16,
            repeat: -1
        });

        const coins = [];

        for (let i = 0; i < 64; i++)
        {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(-1500, 0);

            const coin = this.physics.add.sprite(x, y, 'coin').playAfterDelay('spin', Math.random() * 1000);

            coin.setBounce(1);
            coin.setDrag(5);
            coin.setVelocityX(Phaser.Math.Between(-80, 80));
            coin.setVelocityY(Phaser.Math.Between(10, 50));
            coin.setMaxVelocity(500, 500);
            coin.setCollideWorldBounds(true);

            coins.push(coin);
        }

        this.physics.world.setBounds(0, -1500, 800, 2080);

        this.physics.add.collider(master, coins);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 50 },
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Draggable Body

> ドラッグ可能な物理ボディ

```javascript
class Example extends Phaser.Scene
{
    block;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('block', 'assets/sprites/block.png');
    }

    create ()
    {
        this.block = this.physics.add.image(400, 100, 'block')
            .setVelocity(100, 200)
            .setBounce(1, 1)
            .setCollideWorldBounds(true);

        this.input.setDraggable(this.block.setInteractive());

        this.input.on('dragstart', (pointer, obj) =>
        {
            obj.body.moves = false;
        });

        this.input.on('drag', (pointer, obj, dragX, dragY) =>
        {
            obj.setPosition(dragX, dragY);
        });

        this.input.on('dragend', (pointer, obj) =>
        {
            obj.body.moves = true;
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: { y: 200 }
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```


## トップダウンシューター (Top-down Shooter)

### Topdown Shooter Player Focus

> プレイヤーフォーカスのトップダウンシューター

```javascript
class Example extends Phaser.Scene
{
    time = 0;
    bullets;
    moveKeys;
    reticle;
    player;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        // Load in images and sprites

        this.load.spritesheet('player_handgun', 'assets/sprites/player_handgun.png',
            { frameWidth: 66, frameHeight: 60 }
        ); // Made by tokkatrain: https://tokkatrain.itch.io/top-down-basic-set
        this.load.image('target', 'assets/demoscene/ball.png');
        this.load.image('background', 'assets/skies/underwater1.png');
    }

    create ()
    {
        // Create world bounds
        this.physics.world.setBounds(0, 0, 1600, 1200);

        // Add background, player, and reticle sprites
        const background = this.add.image(800, 600, 'background');
        this.player = this.physics.add.sprite(800, 600, 'player_handgun');
        this.reticle = this.physics.add.sprite(800, 700, 'target');

        // Set image/sprite properties
        background.setOrigin(0.5, 0.5).setDisplaySize(1600, 1200);
        this.player.setOrigin(0.5, 0.5).setDisplaySize(132, 120).setCollideWorldBounds(true).setDrag(500, 500);
        this.reticle.setOrigin(0.5, 0.5).setDisplaySize(25, 25).setCollideWorldBounds(true);

        // Set camera zoom
        this.cameras.main.zoom = 0.5;

        // Creates object for input with WASD keys
        this.moveKeys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Enables movement of player with WASD keys
        this.input.keyboard.on('keydown_W', event => {
            this.player.setAccelerationY(-800);
        });
        this.input.keyboard.on('keydown_S', event => {
            this.player.setAccelerationY(800);
        });
        this.input.keyboard.on('keydown_A', event => {
            this.player.setAccelerationX(-800);
        });
        this.input.keyboard.on('keydown_D', event => {
            this.player.setAccelerationX(800);
        });

        // Stops player acceleration on uppress of WASD keys
        this.input.keyboard.on('keyup_W', event => {
            if (this.moveKeys['down'].isUp) { this.player.setAccelerationY(0); }
        });
        this.input.keyboard.on('keyup_S', event => {
            if (this.moveKeys['up'].isUp) { this.player.setAccelerationY(0); }
        });
        this.input.keyboard.on('keyup_A', event => {
            if (this.moveKeys['right'].isUp) { this.player.setAccelerationX(0); }
        });
        this.input.keyboard.on('keyup_D', event => {
            if (this.moveKeys['left'].isUp) { this.player.setAccelerationX(0); }
        });

        // Locks pointer on mousedown
        game.canvas.addEventListener('mousedown', () => {
            game.input.mouse.requestPointerLock();
        });

        // Exit pointer lock when Q or escape (by default) is pressed.
        this.input.keyboard.on('keydown_Q', event => {
            if (game.input.mouse.locked) { game.input.mouse.releasePointerLock(); }
        }, 0, this);

        // Move reticle upon locked pointer move
        this.input.on('pointermove', function (pointer)
        {
            if (this.input.mouse.locked)
            {
                this.reticle.x += pointer.movementX;
                this.reticle.y += pointer.movementY;
            }
        }, this);

    }

    update (time, delta)
    {
        // Rotates player to face towards reticle
        this.player.rotation = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.reticle.x, this.reticle.y);

        // Camera follows player ( can be set in create )
        this.cameras.main.startFollow(this.player);

        // Makes reticle move with player
        this.reticle.body.velocity.x = this.player.body.velocity.x;
        this.reticle.body.velocity.y = this.player.body.velocity.y;

        // Constrain velocity of player
        this.constrainVelocity(this.player, 500);

        // Constrain position of reticle
        this.constrainReticle(this.reticle);

    }

    constrainVelocity (sprite, maxVelocity)
    {
        if (!sprite || !sprite.body)
        { return; }

        let angle, currVelocitySqr, vx, vy;
        vx = sprite.body.velocity.x;
        vy = sprite.body.velocity.y;
        currVelocitySqr = vx * vx + vy * vy;

        if (currVelocitySqr > maxVelocity * maxVelocity)
        {
            angle = Math.atan2(vy, vx);
            vx = Math.cos(angle) * maxVelocity;
            vy = Math.sin(angle) * maxVelocity;
            sprite.body.velocity.x = vx;
            sprite.body.velocity.y = vy;
        }
    }

    constrainReticle (reticle)
    {
        const distX = reticle.x - this.player.x; // X distance between player & reticle
        const distY = reticle.y - this.player.y; // Y distance between player & reticle

        // Ensures reticle cannot be moved offscreen
        if (distX > 800)
        { reticle.x = this.player.x + 800; }
        else if (distX < -800)
        { reticle.x = this.player.x - 800; }

        if (distY > 600)
        { reticle.y = this.player.y + 600; }
        else if (distY < -600)
        { reticle.y = this.player.y - 600; }
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Topdown Shooter Target Focus

> ターゲットフォーカスのトップダウンシューター

```javascript
class Example extends Phaser.Scene
{
    time = 0;
    lastFired = 0;
    bullets;
    moveKeys;
    reticle;
    player;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.spritesheet('player_handgun', 'assets/sprites/player_handgun.png',
            { frameWidth: 66, frameHeight: 60 }
        );
        this.load.image('target', 'assets/demoscene/ball.png');
        this.load.image('background', 'assets/skies/underwater1.png');
    }

    create ()
    {
        this.physics.world.setBounds(0, 0, 1600, 1200);

        const background = this.add.image(800, 600, 'background');
        this.player = this.physics.add.sprite(800, 600, 'player_handgun');
        this.reticle = this.physics.add.sprite(800, 700, 'target');

        background.setOrigin(0.5, 0.5).setDisplaySize(1600, 1200);
        this.player.setOrigin(0.5, 0.5).setDisplaySize(132, 120).setCollideWorldBounds(true).setDrag(500, 500);
        this.reticle.setOrigin(0.5, 0.5).setDisplaySize(25, 25).setCollideWorldBounds(true);

        this.cameras.main.zoom = 0.5;

        this.moveKeys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        this.input.keyboard.on('keydown_W', event => {
            this.player.setAccelerationY(-800);
        });
        this.input.keyboard.on('keydown_S', event => {
            this.player.setAccelerationY(800);
        });
        this.input.keyboard.on('keydown_A', event => {
            this.player.setAccelerationX(-800);
        });
        this.input.keyboard.on('keydown_D', event => {
            this.player.setAccelerationX(800);
        });

        this.input.keyboard.on('keyup_W', event => {
            if (this.moveKeys['down'].isUp) { this.player.setAccelerationY(0); }
        });
        this.input.keyboard.on('keyup_S', event => {
            if (this.moveKeys['up'].isUp) { this.player.setAccelerationY(0); }
        });
        this.input.keyboard.on('keyup_A', event => {
            if (this.moveKeys['right'].isUp) { this.player.setAccelerationX(0); }
        });
        this.input.keyboard.on('keyup_D', event => {
            if (this.moveKeys['left'].isUp) { this.player.setAccelerationX(0); }
        });

        game.canvas.addEventListener('mousedown', () => {
            game.input.mouse.requestPointerLock();
        });

        this.input.keyboard.on('keydown_Q', event => {
            if (game.input.mouse.locked) { game.input.mouse.releasePointerLock(); }
        }, 0, this);

        this.input.on('pointermove', function (pointer)
        {
            if (this.input.mouse.locked)
            {
                this.reticle.x += pointer.movementX;
                this.reticle.y += pointer.movementY;
            }
        }, this);
    }

    update (time, delta)
    {
        this.player.rotation = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.reticle.x, this.reticle.y);

        this.cameras.main.startFollow(this.reticle);

        this.reticle.body.velocity.x = this.player.body.velocity.x;
        this.reticle.body.velocity.y = this.player.body.velocity.y;

        this.constrainVelocity(this.player, 500);

        this.constrainReticle(this.reticle, 550);
    }

    constrainVelocity (sprite, maxVelocity)
    {
        if (!sprite || !sprite.body)
        { return; }

        let angle, currVelocitySqr, vx, vy;
        vx = sprite.body.velocity.x;
        vy = sprite.body.velocity.y;
        currVelocitySqr = vx * vx + vy * vy;

        if (currVelocitySqr > maxVelocity * maxVelocity)
        {
            angle = Math.atan2(vy, vx);
            vx = Math.cos(angle) * maxVelocity;
            vy = Math.sin(angle) * maxVelocity;
            sprite.body.velocity.x = vx;
            sprite.body.velocity.y = vy;
        }
    }

    constrainReticle (reticle, radius)
    {
        const distX = reticle.x - this.player.x;
        const distY = reticle.y - this.player.y;

        if (distX > 800)
        { reticle.x = this.player.x + 800; }
        else if (distX < -800)
        { reticle.x = this.player.x - 800; }

        if (distY > 600)
        { reticle.y = this.player.y + 600; }
        else if (distY < -600)
        { reticle.y = this.player.y - 600; }

        const distBetween = Phaser.Math.Distance.Between(this.player.x, this.player.y, reticle.x, reticle.y);
        if (distBetween > radius)
        {
            const scale = distBetween / radius;

            reticle.x = this.player.x + (reticle.x - this.player.x) / scale;
            reticle.y = this.player.y + (reticle.y - this.player.y) / scale;
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Topdown Shooter Average Focus

> 平均フォーカスのトップダウンシューター

```javascript
class Example extends Phaser.Scene
{
    time = 0;
    lastFired = 0;
    bullets;
    moveKeys;
    reticle;
    player;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.spritesheet(
            'player_handgun',
            'assets/sprites/player_handgun.png',
            { frameWidth: 66, frameHeight: 60 }
        );
        this.load.image('target', 'assets/demoscene/ball.png');
        this.load.image('background', 'assets/skies/underwater1.png');
    }

    create ()
    {
        this.physics.world.setBounds(0, 0, 1600, 1200);

        const background = this.add.image(800, 600, 'background');
        this.player = this.physics.add.sprite(800, 600, 'player_handgun');
        this.reticle = this.physics.add.sprite(800, 700, 'target');

        background.setOrigin(0.5, 0.5).setDisplaySize(1600, 1200);
        this.player
            .setOrigin(0.5, 0.5)
            .setDisplaySize(132, 120)
            .setCollideWorldBounds(true)
            .setDrag(500, 500);
        this.reticle
            .setOrigin(0.5, 0.5)
            .setDisplaySize(25, 25)
            .setCollideWorldBounds(true);

        this.cameras.main.zoom = 0.5;

        this.moveKeys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        this.input.keyboard.on('keydown_W', (event) => {
            this.player.setAccelerationY(-800);
        });
        this.input.keyboard.on('keydown_S', (event) => {
            this.player.setAccelerationY(800);
        });
        this.input.keyboard.on('keydown_A', (event) => {
            this.player.setAccelerationX(-800);
        });
        this.input.keyboard.on('keydown_D', (event) => {
            this.player.setAccelerationX(800);
        });

        this.input.keyboard.on('keyup_W', (event) => {
            if (this.moveKeys['down'].isUp) { this.player.setAccelerationY(0); }
        });
        this.input.keyboard.on('keyup_S', (event) => {
            if (this.moveKeys['up'].isUp) { this.player.setAccelerationY(0); }
        });
        this.input.keyboard.on('keyup_A', (event) => {
            if (this.moveKeys['right'].isUp) { this.player.setAccelerationX(0); }
        });
        this.input.keyboard.on('keyup_D', (event) => {
            if (this.moveKeys['left'].isUp) { this.player.setAccelerationX(0); }
        });

        game.canvas.addEventListener('mousedown', () => {
            game.input.mouse.requestPointerLock();
        });

        this.input.keyboard.on(
            'keydown_Q',
            (event) =>
            {
                if (game.input.mouse.locked) { game.input.mouse.releasePointerLock(); }
            },
            0,
        );

        this.input.on(
            'pointermove',
            function (pointer)
            {
                if (this.input.mouse.locked)
                {
                    this.reticle.x += pointer.movementX;
                    this.reticle.y += pointer.movementY;

                    const distX = this.reticle.x - this.player.x;
                    const distY = this.reticle.y - this.player.y;

                    if (distX > 800) { this.reticle.x = this.player.x + 800; }
                    else if (distX < -800) { this.reticle.x = this.player.x - 800; }

                    if (distY > 600) { this.reticle.y = this.player.y + 600; }
                    else if (distY < -600) { this.reticle.y = this.player.y - 600; }
                }
            },
            this
        );
    }

    update (time, delta)
    {
        this.player.rotation = Phaser.Math.Angle.Between(
            this.player.x,
            this.player.y,
            this.reticle.x,
            this.reticle.y
        );

        const avgX = (this.player.x + this.reticle.x) / 2 - 400;
        const avgY = (this.player.y + this.reticle.y) / 2 - 300;
        this.cameras.main.scrollX = avgX;
        this.cameras.main.scrollY = avgY;

        this.reticle.body.velocity.x = this.player.body.velocity.x;
        this.reticle.body.velocity.y = this.player.body.velocity.y;

        this.constrainVelocity(this.player, 500);
        this.constrainReticle(this.reticle, 550);
    }

    constrainVelocity (sprite, maxVelocity)
    {
        if (!sprite || !sprite.body) { return; }

        let angle, currVelocitySqr, vx, vy;
        vx = sprite.body.velocity.x;
        vy = sprite.body.velocity.y;
        currVelocitySqr = vx * vx + vy * vy;

        if (currVelocitySqr > maxVelocity * maxVelocity)
        {
            angle = Math.atan2(vy, vx);
            vx = Math.cos(angle) * maxVelocity;
            vy = Math.sin(angle) * maxVelocity;
            sprite.body.velocity.x = vx;
            sprite.body.velocity.y = vy;
        }
    }

    constrainReticle (reticle, radius)
    {
        const distX = reticle.x - this.player.x;
        const distY = reticle.y - this.player.y;

        if (distX > 800) { reticle.x = this.player.x + 800; }
        else if (distX < -800) { reticle.x = this.player.x - 800; }

        if (distY > 600) { reticle.y = this.player.y + 600; }
        else if (distY < -600) { reticle.y = this.player.y - 600; }

        const distBetween = Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            reticle.x,
            reticle.y
        );
        if (distBetween > radius)
        {
            const scale = distBetween / radius;

            reticle.x = this.player.x + (reticle.x - this.player.x) / scale;
            reticle.y = this.player.y + (reticle.y - this.player.y) / scale;
        }
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Topdown Shooter Combat Mechanics

> トップダウンシューターの戦闘メカニクス

```javascript
class Example extends Phaser.Scene
{
    time = 0;
    enemyBullets;
    playerBullets;
    moveKeys;
    reticle;
    healthpoints;
    player;
    enemy;
    hp1;
    hp2;
    hp3;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.spritesheet('player_handgun', 'assets/sprites/player_handgun.png',
            { frameWidth: 66, frameHeight: 60 }
        );
        this.load.image('bullet', 'assets/sprites/bullets/bullet6.png');
        this.load.image('target', 'assets/demoscene/ball.png');
        this.load.image('background', 'assets/skies/underwater1.png');
    }

    create ()
    {
        this.physics.world.setBounds(0, 0, 1600, 1200);
        this.playerBullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
        this.enemyBullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });

        const background = this.add.image(800, 600, 'background');
        this.player = this.physics.add.sprite(800, 600, 'player_handgun');
        this.enemy = this.physics.add.sprite(300, 600, 'player_handgun');
        this.reticle = this.physics.add.sprite(800, 700, 'target');
        this.hp1 = this.add.image(-350, -250, 'target').setScrollFactor(0.5, 0.5);
        this.hp2 = this.add.image(-300, -250, 'target').setScrollFactor(0.5, 0.5);
        this.hp3 = this.add.image(-250, -250, 'target').setScrollFactor(0.5, 0.5);

        background.setOrigin(0.5, 0.5).setDisplaySize(1600, 1200);
        this.player.setOrigin(0.5, 0.5).setDisplaySize(132, 120).setCollideWorldBounds(true).setDrag(500, 500);
        this.enemy.setOrigin(0.5, 0.5).setDisplaySize(132, 120).setCollideWorldBounds(true);
        this.reticle.setOrigin(0.5, 0.5).setDisplaySize(25, 25).setCollideWorldBounds(true);
        this.hp1.setOrigin(0.5, 0.5).setDisplaySize(50, 50);
        this.hp2.setOrigin(0.5, 0.5).setDisplaySize(50, 50);
        this.hp3.setOrigin(0.5, 0.5).setDisplaySize(50, 50);

        this.player.health = 3;
        this.enemy.health = 3;
        this.enemy.lastFired = 0;

        this.cameras.main.zoom = 0.5;
        this.cameras.main.startFollow(this.player);

        this.moveKeys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        this.input.keyboard.on('keydown_W', event => {
            this.player.setAccelerationY(-800);
        });
        this.input.keyboard.on('keydown_S', event => {
            this.player.setAccelerationY(800);
        });
        this.input.keyboard.on('keydown_A', event => {
            this.player.setAccelerationX(-800);
        });
        this.input.keyboard.on('keydown_D', event => {
            this.player.setAccelerationX(800);
        });

        this.input.keyboard.on('keyup_W', event => {
            if (this.moveKeys['down'].isUp) { this.player.setAccelerationY(0); }
        });
        this.input.keyboard.on('keyup_S', event => {
            if (this.moveKeys['up'].isUp) { this.player.setAccelerationY(0); }
        });
        this.input.keyboard.on('keyup_A', event => {
            if (this.moveKeys['right'].isUp) { this.player.setAccelerationX(0); }
        });
        this.input.keyboard.on('keyup_D', event => {
            if (this.moveKeys['left'].isUp) { this.player.setAccelerationX(0); }
        });

        this.input.on('pointerdown', (pointer, time, lastFired) =>
        {
            if (this.player.active === false) { return; }
            const bullet = this.playerBullets.get().setActive(true).setVisible(true);
            if (bullet)
            {
                bullet.fire(this.player, this.reticle);
                this.physics.add.collider(this.enemy, bullet, (enemyHit, bulletHit) => this.enemyHitCallback(enemyHit, bulletHit));
            }
        });

        game.canvas.addEventListener('mousedown', () => {
            game.input.mouse.requestPointerLock();
        });

        this.input.keyboard.on('keydown_Q', event => {
            if (game.input.mouse.locked) { game.input.mouse.releasePointerLock(); }
        }, 0);

        this.input.on('pointermove', pointer =>
        {
            if (this.input.mouse.locked)
            {
                this.reticle.x += pointer.movementX;
                this.reticle.y += pointer.movementY;
            }
        });
    }

    update (time, delta)
    {
        this.player.rotation = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.reticle.x, this.reticle.y);
        this.enemy.rotation = Phaser.Math.Angle.Between(this.enemy.x, this.enemy.y, this.player.x, this.player.y);
        this.reticle.body.velocity.x = this.player.body.velocity.x;
        this.reticle.body.velocity.y = this.player.body.velocity.y;
        this.constrainVelocity(this.player, 500);
        this.constrainReticle(this.reticle);
        this.enemyFire(time);
    }

    enemyHitCallback (enemyHit, bulletHit)
    {
        if (bulletHit.active === true && enemyHit.active === true)
        {
            enemyHit.health = enemyHit.health - 1;
            console.log('Enemy hp: ', enemyHit.health);
            if (enemyHit.health <= 0)
            {
                enemyHit.setActive(false).setVisible(false);
            }
            bulletHit.setActive(false).setVisible(false);
        }
    }

    playerHitCallback (playerHit, bulletHit)
    {
        if (bulletHit.active === true && playerHit.active === true)
        {
            playerHit.health = playerHit.health - 1;
            console.log('Player hp: ', playerHit.health);
            if (playerHit.health === 2)
            {
                this.hp3.destroy();
            }
            else if (playerHit.health === 1)
            {
                this.hp2.destroy();
            }
            else
            {
                this.hp1.destroy();
            }
            bulletHit.setActive(false).setVisible(false);
        }
    }

    enemyFire (time)
    {
        if (this.enemy.active === false)
        {
            return;
        }
        if ((time - this.enemy.lastFired) > 1000)
        {
            this.enemy.lastFired = time;
            const bullet = this.enemyBullets.get().setActive(true).setVisible(true);
            if (bullet)
            {
                bullet.fire(this.enemy, this.player);
                this.physics.add.collider(this.player, bullet, (playerHit, bulletHit) => this.playerHitCallback(playerHit, bulletHit));
            }
        }
    }

    constrainVelocity (sprite, maxVelocity)
    {
        if (!sprite || !sprite.body)
        { return; }
        let angle, currVelocitySqr, vx, vy;
        vx = sprite.body.velocity.x;
        vy = sprite.body.velocity.y;
        currVelocitySqr = vx * vx + vy * vy;
        if (currVelocitySqr > maxVelocity * maxVelocity)
        {
            angle = Math.atan2(vy, vx);
            vx = Math.cos(angle) * maxVelocity;
            vy = Math.sin(angle) * maxVelocity;
            sprite.body.velocity.x = vx;
            sprite.body.velocity.y = vy;
        }
    }

    constrainReticle (reticle)
    {
        const distX = reticle.x - this.player.x;
        const distY = reticle.y - this.player.y;
        if (distX > 800)
        { reticle.x = this.player.x + 800; }
        else if (distX < -800)
        { reticle.x = this.player.x - 800; }
        if (distY > 600)
        { reticle.y = this.player.y + 600; }
        else if (distY < -600)
        { reticle.y = this.player.y - 600; }
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);

class Bullet extends Phaser.GameObjects.Image
{
    constructor (scene)
    {
        super(scene, 0, 0, 'bullet');
        this.speed = 1;
        this.born = 0;
        this.direction = 0;
        this.xSpeed = 0;
        this.ySpeed = 0;
        this.setSize(12, 12, true);
    }

    fire (shooter, target)
    {
        this.setPosition(shooter.x, shooter.y);
        this.direction = Math.atan((target.x - this.x) / (target.y - this.y));
        if (target.y >= this.y)
        {
            this.xSpeed = this.speed * Math.sin(this.direction);
            this.ySpeed = this.speed * Math.cos(this.direction);
        }
        else
        {
            this.xSpeed = -this.speed * Math.sin(this.direction);
            this.ySpeed = -this.speed * Math.cos(this.direction);
        }
        this.rotation = shooter.rotation;
        this.born = 0;
    }

    update (time, delta)
    {
        this.x += this.xSpeed * delta;
        this.y += this.ySpeed * delta;
        this.born += delta;
        if (this.born > 1800)
        {
            this.setActive(false);
            this.setVisible(false);
        }
    }
}
```


## その他 (Others)

### Extending Arcade Sprite

> Arcade Spriteの拡張クラス

```javascript
class SpaceShip extends Phaser.Physics.Arcade.Sprite
{
    constructor (scene, x, y)
    {
        super(scene, x, y, 'ship');
        this.play('thrust');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setScale(2);
        this.setBounce(1, 1);
        this.setCollideWorldBounds(true);
        this.body.onWorldBounds = true;
        this.setVelocity(0, -200);
    }
}

function onWorldBounds (body)
{
    body.gameObject.toggleFlipY();
}

class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.spritesheet('ship', 'assets/games/lazer/ship.png', { frameWidth: 16, frameHeight: 24 });
    }
    create ()
    {
        this.anims.create({
            key: 'thrust',
            frames: this.anims.generateFrameNumbers('ship', { frames: [ 2, 7 ] }),
            frameRate: 20,
            repeat: -1
        });
        for (let i = 0; i < 32; i++)
        {
            new SpaceShip(this, Phaser.Math.Between(64, 736), Phaser.Math.Between(100, 500));
        }
        this.physics.world.on('worldbounds', onWorldBounds);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    pixelArt: true,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Tween Body

> トゥイーンによるボディ移動

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('block', 'assets/sprites/block.png');
        this.load.image('dude', 'assets/sprites/phaser-dude.png');
    }

    create ()
    {
        // this.physics.world.OVERLAP_BIAS = 8;

        const block = this.physics.add.image(400, 200, 'block');

        block.body.allowGravity = false;
        block.body.immovable = true;
        block.body.moves = false;

        const sprite = this.physics.add.image(400, 100, 'dude');

        this.tweens.add({
            targets: block,
            y: 400,
            duration: 2000,
            ease: 'Sine.easeInOut',
            repeat: -1,
            yoyo: true
        });

        this.physics.add.collider(sprite, block);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: { y: 300 },
            overlapBias: 8
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Tween Velocity

> トゥイーンによる速度制御

```javascript
class Ship extends Phaser.Physics.Arcade.Sprite
{
    constructor (scene, x, y, points)
    {
        super(scene, x, y, 'ship', 2);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(2);
        this.play('thrust');

        this.speed = 150;
        this.points = points;

        this.target;
        this.targetIndex = -1;

        this.isSeeking = true;

        this.seek();
    }

    seek ()
    {
        const entry = Phaser.Utils.Array.GetRandom(this.points);

        this.target = entry;

        this.isSeeking = false;

        this.scene.tweens.add({
            targets: this.body.velocity,
            x: 0,
            y: 0,
            ease: 'Linear',
            duration: 500,
            onComplete: function (tween, targets, ship)
            {
                ship.isSeeking = true;
                ship.scene.tweens.add({
                    targets: ship,
                    speed: 150,
                    delay: 500,
                    ease: 'Sine.easeOut',
                    duration: 1000
                });
            },
            onCompleteParams: [ this ]
        });
    }

    preUpdate (time, delta)
    {
        super.preUpdate(time, delta);

        if (this.target.contains(this.x, this.y))
        {
            this.seek();
        }
        else if (this.isSeeking)
        {
            const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);

            this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
        }
    }
}

class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.spritesheet('ship', 'assets/games/lazer/ship.png', { frameWidth: 16, frameHeight: 24 });
    }

    create ()
    {
        this.anims.create(
            {
                key: 'thrust',
                frames: this.anims.generateFrameNumbers('ship', { frames: [ 2, 7 ] }),
                frameRate: 20,
                repeat: -1
            });

        const points = [
            new Phaser.Geom.Circle(100, 100, 32),
            new Phaser.Geom.Circle(400, 100, 32),
            new Phaser.Geom.Circle(700, 100, 32),
            new Phaser.Geom.Circle(100, 300, 32),
            new Phaser.Geom.Circle(400, 300, 32),
            new Phaser.Geom.Circle(700, 300, 32),
            new Phaser.Geom.Circle(100, 500, 32),
            new Phaser.Geom.Circle(400, 500, 32),
            new Phaser.Geom.Circle(700, 500, 32)
        ];

        const debug = this.add.graphics();

        debug.lineStyle(1, 0x00ff00);

        for (const p of points)
        {
            debug.strokeCircleShape(p);
        }

        this.graphics = this.add.graphics();

        this.ship = new Ship(this, 400, 300, points);
    }

    update ()
    {
        this.graphics.clear();
        this.graphics.fillStyle(0xff0000);
        this.graphics.fillRect(this.ship.target.x, this.ship.target.y, 4, 4);
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: { y: 0 }
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Body Controls

> ボディのコントロール操作

```javascript
class Example extends Phaser.Scene
{
    sprite;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('mushroom', 'assets/sprites/mushroom2.png');
        this.load.image('block', 'assets/sprites/atari800.png');
    }

    create ()
    {
        this.sprite = this.physics.add.image(400, 300, 'mushroom')
            .setBounce(1, 1)
            .setVelocityX(300);

        const block = this.physics.add.staticImage(400, 450, 'block');

        this.physics.add.collider(this.sprite, block);

        this.createBodyGui(this.sprite.body);
    }

    update ()
    {
        this.physics.world.wrap(this.sprite);
    }

    createBodyGui (body)
    {
        const gui = new dat.GUI({ width: 600 });

        gui.add(body, 'allowDrag');
        gui.add(body, 'allowGravity');
        gui.add(body, 'allowRotation');
        gui.add(body, 'angularAcceleration', -360, 360, 5);
        gui.add(body, 'angularVelocity', -360, 360, 5);
        gui.add(body, 'collideWorldBounds');
        gui.add(body, 'debugShowBody');
        gui.add(body, 'debugShowVelocity');
        gui.add(body, 'enable');
        gui.add(body, 'immovable');
        gui.add(body, 'isCircle');
        gui.add(body, 'mass', 0.1, 10, 0.1);
        gui.add(body, 'moves');
        gui.add(body, 'useDamping');
        gui.addColor(body, 'debugBodyColor');

        this.createVectorGui(gui, 'acceleration', body.acceleration, -600, 600, 10);
        this.createVectorGui(gui, 'bounce', body.bounce, 0, 1, 0.1);
        this.createVectorGui(gui, 'deltaMax', body.deltaMax, 0, 60, 1);
        this.createVectorGui(gui, 'drag', body.drag, 0, 60, 0.1);
        this.createVectorGui(gui, 'friction', body.friction, 0, 1, 0.05);
        this.createVectorGui(gui, 'gravity', body.gravity, -600, 600, 10);
        this.createVectorGui(gui, 'maxVelocity', body.maxVelocity, 0, 10000, 100);
        this.createVectorGui(gui, 'velocity', body.velocity, -600, 600, 10);

        const check = gui.addFolder('checkCollision');
        check.add(body.checkCollision, 'left');
        check.add(body.checkCollision, 'up');
        check.add(body.checkCollision, 'right');
        check.add(body.checkCollision, 'down');

        return gui;
    }

    createVectorGui (gui, name, vector, min, max, step)
    {
        const folder = gui.addFolder(name);

        folder.add(vector, 'x', min, max, step);
        folder.add(vector, 'y', min, max, step);

        return folder;
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: { debug: true }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Recycle Physics Body

> 物理ボディのリサイクル

```javascript
class Example extends Phaser.Scene
{
    constructor ()
    {
        super();
    }

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('player', 'assets/sprites/ship.png');
        this.load.image('ship', 'assets/sprites/bsquadron1.png');
        this.load.image('apple', 'assets/sprites/apple.png');
        this.load.image('beball', 'assets/sprites/beball1.png');
        this.load.image('clown', 'assets/sprites/clown.png');
        this.load.image('ghost', 'assets/sprites/ghost.png');
    }

    create ()
    {
        const player = this.physics.add.image(400, 500, 'player');
        this.active = [];
        this.pool = [];

        const dummy = this.add.image();
        const { world } = this.physics;

        for (let i = 0; i < 100; i++)
        {
            const body = new Phaser.Physics.Arcade.Body(world, dummy);
            this.pool.push(body);
        }

        this.time.addEvent({ delay: 250, callback: () => this.releaseEnemy(), loop: true });

        this.input.on('pointermove', pointer =>
        {
            player.x = pointer.worldX;
            player.y = pointer.worldY;
        });
    }

    update ()
    {
        this.checkEnemyBounds();
    }

    checkEnemyBounds ()
    {
        const { world } = this.physics;

        for (let i = this.active.length - 1; i >= 0; i--)
        {
            const enemy = this.active[i];

            if (enemy.y > 700)
            {
                const { body } = enemy;
                world.disableBody(body);
                body.gameObject = undefined;
                this.pool.push(body);
                enemy.body = undefined;
                enemy.destroy();
                this.active.splice(i, 1);
            }
        }
    }

    releaseEnemy ()
    {
        const { pool } = this;
        const body = pool.pop();
        const x = Phaser.Math.Between(0, 800);
        const y = Phaser.Math.Between(-1200, 0);
        const frames = [ 'ship', 'apple', 'beball', 'clown', 'ghost' ];
        const enemy = this.add.image(x, y, Phaser.Utils.Array.GetRandom(frames));

        enemy.body = body;
        body.gameObject = enemy;
        body.setSize();
        this.physics.world.add(body);
        body.setVelocity(0, Phaser.Math.Between(200, 400));
        this.active.push(enemy);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            debugShowVelocity: false
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Physics Body Without Sprite

> スプライトなしの物理ボディ

```javascript
class PhysicsBob extends Phaser.GameObjects.Bob
{
    constructor (blitter, x, y, frame, visible, body)
    {
        super(blitter, x, y, frame, visible);
        this.body = body;
        this.scaleX = 1;
        this.scaleY = 1;
        this.angle = 0;
        this.rotation = 0;
        this.originX = 0;
        this.originY = 0;
        this.displayOriginX = 0;
        this.displayOriginY = 0;
        this.width = this.frame.realWidth;
        this.height = this.frame.realHeight;
    }
}

class Example extends Phaser.Scene
{
    active;
    blitter;
    pool;
    textureFrames;

    preload () {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('player', 'assets/sprites/ship.png');
        this.load.atlas('atlas', 'assets/atlas/megaset-0.png', 'assets/atlas/megaset-0.json');
    }

    create () {
        this.textureFrames = [ '32x32', 'aqua_ball', 'asteroids_ship', 'block', 'blue_ball', 'bsquadron1', 'carrot', 'eggplant', 'flectrum', 'gem', 'ilkke', 'maggot', 'melon', 'mushroom', 'onion', 'orb-blue', 'orb-green', 'orb-red', 'pepper', 'phaser1', 'pineapple', 'slime', 'space-baddie', 'spinObj_01', 'spinObj_02', 'spinObj_03', 'splat' ];
        this.blitter = this.add.blitter(0, 0, 'atlas');
        const player = this.physics.add.image(400, 500, 'player');
        this.active = [];
        this.pool = [];
        const dummy = this.add.image();
        const { world } = this.physics;
        for (let i = 0; i < 100; i++) {
            const body = new Phaser.Physics.Arcade.Body(world, dummy);
            this.pool.push(body);
        }
        this.time.addEvent({ delay: 100, callback: () => { this.releaseEnemy(); }, loop: true });
        this.input.on('pointermove', (pointer) => {
            player.x = pointer.worldX;
            player.y = pointer.worldY;
        });
    }

    update () {
        this.checkEnemyBounds();
    }

    checkEnemyBounds () {
        const { world } = this.physics;
        for (let i = this.active.length - 1; i >= 0; i--) {
            const enemy = this.active[i];
            if (enemy.y > 600 + enemy.height) {
                const { body } = enemy;
                world.disableBody(body);
                body.gameObject = undefined;
                this.pool.push(body);
                enemy.body = undefined;
                enemy.destroy();
                this.active.splice(i, 1);
            }
        }
    }

    releaseEnemy () {
        const { pool } = this;
        const body = pool.pop();
        const x = Phaser.Math.Between(0, 800);
        const y = Phaser.Math.Between(-1200, -300);
        const frame = this.blitter.texture.get(Phaser.Utils.Array.GetRandom(this.textureFrames));
        const enemy = new PhysicsBob(this.blitter, x, y, frame, true, body);
        this.blitter.children.add(enemy);
        this.blitter.dirty = true;
        body.gameObject = enemy;
        body.setSize();
        this.physics.world.add(body);
        body.setVelocity(0, Phaser.Math.Between(200, 500));
        this.active.push(enemy);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            debugShowVelocity: false
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Mass Collision Test

> 大量衝突テスト

```javascript
class Example extends Phaser.Scene
{
    text;
    spriteBounds;
    group;
    player;
    cursors;
    controls;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('chunk', 'assets/sprites/rain.png');
        this.load.image('crate', 'assets/sprites/crate.png');
    }

    create ()
    {
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000044);
        graphics.fillRect(0,140,800,460);

        this.physics.world.setBounds(0, 0, 800, 600);

        this.spriteBounds = Phaser.Geom.Rectangle.Inflate(Phaser.Geom.Rectangle.Clone(this.physics.world.bounds), -10, -200);
        this.spriteBounds.y += 100;

        this.group = this.physics.add.group();
        this.group.runChildUpdate = false;

        this.time.addEvent({ delay: 500, callback: this.release, callbackScope: this, repeat: (10000 / 100) - 1 });

        this.cursors = this.input.keyboard.createCursorKeys();

        this.player = this.physics.add.image(400, 100, 'crate');

        this.player.setImmovable();
        this.player.setCollideWorldBounds(true);

        this.physics.add.collider(this.player, this.group);

        this.text = this.add.text(10, 10, 'Total: 0', { font: '16px Courier', fill: '#ffffff' });
    }

    update ()
    {
        this.player.setVelocity(0);

        if (this.cursors.left.isDown)
        {
            this.player.setVelocityX(-500);
        }
        else if (this.cursors.right.isDown)
        {
            this.player.setVelocityX(500);
        }

        if (this.cursors.up.isDown)
        {
            this.player.setVelocityY(-500);
        }
        else if (this.cursors.down.isDown)
        {
            this.player.setVelocityY(500);
        }
    }

    release ()
    {
        for (let i = 0; i < 100; i++)
        {
            const pos = Phaser.Geom.Rectangle.Random(this.spriteBounds);

            const block = this.group.create(pos.x, pos.y, 'chunk');

            block.setBounce(1);
            block.setCollideWorldBounds(true);
            block.setVelocity(Phaser.Math.Between(-200, 200), Phaser.Math.Between(-100, -200));
            block.setMaxVelocity(300);
            block.setBlendMode(1);
        }

        this.text.setText(`Total: ${this.group.getLength()}`);
    }
}

const config = {
    type: Phaser.WEBGL,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            useTree: false,
            gravity: { y: 100 }
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```
