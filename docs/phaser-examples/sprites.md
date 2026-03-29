# Sprites

Phaser 3.85.0 のスプライト基本操作サンプルコード集。

### Create From Config

> 設定オブジェクトからテキストゲームオブジェクトを作成するサンプル。スタイル設定（フォント、色、影など）を含む。

```javascript
class Example extends Phaser.Scene
{
    text;

    create ()
    {
        //  Implicit values
        const config1 = {
            x: 100,
            y: 100,
            text: 'Text\nGame Object\nCreated from config',
            style: {
                fontSize: '64px',
                fontFamily: 'Arial',
                color: '#ffffff',
                align: 'center',
                backgroundColor: '#ff00ff',
                shadow: {
                    color: '#000000',
                    fill: true,
                    offsetX: 2,
                    offsetY: 2,
                    blur: 8
                }
            }
        };

        this.make.text(config1);
    }
}

const config = {
    type: Phaser.WEBGL,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    scene: Example
};

const game = new Phaser.Game(config);
```

### Custom Sprite Class Es6

> ES6クラスを使ったカスタムスプライトの作成。Phaser.GameObjects.Spriteを継承し、preUpdateで回転を追加。

```javascript
class Brain extends Phaser.GameObjects.Sprite {

    constructor (scene, x, y)
    {
        super(scene, x, y);

        this.setTexture('brain');
        this.setPosition(x, y);
    }

    preUpdate (time, delta)
    {
        super.preUpdate(time, delta);

        this.rotation += 0.01;
    }

}

var config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    scene: {
        preload: preload,
        create: create
    }
};

var game = new Phaser.Game(config);

function preload ()
{
    this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
    this.load.image('brain', 'assets/sprites/brain.png');
}

function create ()
{
    this.add.existing(new Brain(this, 264, 250));
    this.add.existing(new Brain(this, 464, 350));
    this.add.existing(new Brain(this, 664, 450));
}
```

### Moving Sprite

> スプライトを水平方向に移動させ、画面外に出たらリセットするサンプル。updateループでx座標を更新。

```javascript
class Example extends Phaser.Scene
{
    bunny;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('bunny', 'assets/sprites/bunny.png');
    }

    create ()
    {
        this.bunny = this.add.sprite(-150, 300, 'bunny');
    }

    update ()
    {
        this.bunny.x += 2;

        if (this.bunny.x > 950)
        {
            this.bunny.x = -150;
        }
    }
}

const config = {
    type: Phaser.WEBGL,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    scene: Example
};

const game = new Phaser.Game(config);
```

### Multiple Sprites

> 複数のスプライトを画面上に配置するシンプルなサンプル。異なる画像を異なる位置に表示。

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');

        this.load.image('beball', 'assets/sprites/beball1.png');
        this.load.image('atari', 'assets/sprites/atari400.png');
        this.load.image('bikkuriman', 'assets/sprites/bikkuriman.png');

    }

    create ()
    {

        this.add.sprite(200, 300, 'beball');
        this.add.sprite(500, 300, 'atari');
        this.add.sprite(800, 300, 'bikkuriman');

    }
}

const config = {
    type: Phaser.WEBGL,
    parent: 'phaser-example',
    scene: Example
};

const game = new Phaser.Game(config);
```

### Rotate Around A Sprite

> スプライトを別のスプライトの周りで回転させるサンプル。RotateAroundDistanceを使った軌道運動。

```javascript
class Example extends Phaser.Scene
{
    distance2 = 80;
    angle2 = 0;
    distance1 = 200;
    angle1 = 0;
    ball3;
    ball2;
    ball1;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('ballRed', 'assets/demoscene/ball.png');
        this.load.image('ballBlue', 'assets/demoscene/blue_ball.png');
        this.load.image('ballSmall', 'assets/demoscene/ball-tlb.png');
    }

    create ()
    {
        this.ball1 = this.add.sprite(400, 300, 'ballRed');
        this.ball2 = this.add.sprite(400, 300, 'ballBlue');
        this.ball3 = this.add.sprite(400, 300, 'ballSmall');
    }

    update ()
    {
        this.ball2.setPosition(400, 300);
        this.ball3.setPosition(400, 300);

        Phaser.Math.RotateAroundDistance(this.ball2, this.ball1.x, this.ball1.y, this.angle1, this.distance1);
        Phaser.Math.RotateAroundDistance(this.ball3, this.ball2.x, this.ball2.y, this.angle2, this.distance2);

        this.angle1 = Phaser.Math.Angle.Wrap(this.angle1 + 0.02);
        this.angle2 = Phaser.Math.Angle.Wrap(this.angle2 + 0.03);
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    scene: Example
};

const game = new Phaser.Game(config);
```

### Single Sprite

> 単一のスプライトを表示し、インタラクティブに操作するサンプル。クリックで色を変更、常時回転。

```javascript
class Example extends Phaser.Scene
{
    sprite;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('eye', 'assets/pics/lance-overdose-loader-eye.png');
    }

    create ()
    {
        this.sprite = this.add.sprite(400, 300, 'eye');

        this.sprite.setInteractive();

        this.sprite.on('pointerdown', function ()
        {
            this.setTint(0xff0000);
        });

        this.sprite.on('pointerup', function ()
        {
            this.clearTint();
        });
    }

    update ()
    {
        this.sprite.rotation += 0.01;
    }
}

const config = {
    type: Phaser.WEBGL,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    scene: Example
};

const game = new Phaser.Game(config);
```

### Sprite Alpha

> スプライトの透明度（alpha）を設定するサンプル。alpha値を0.5に設定して半透明に表示。

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('bunny', 'assets/sprites/bunny.png');
    }

    create ()
    {
        const bunny = this.add.sprite(400, 300, 'bunny');

        bunny.alpha = 0.5;
    }
}

const config = {
    type: Phaser.WEBGL,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    scene: Example
};

const game = new Phaser.Game(config);
```

### Sprite Rotation

> スプライトの回転を視覚化するサンプル。角度とラジアンの両方をリアルタイムで表示。

```javascript
class Example extends Phaser.Scene
{
    arrow;
    text;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('arrow', 'assets/sprites/longarrow-white.png');
    }

    create ()
    {
        const labelStyle = { font: '16px courier', fill: '#00ff00', align: 'center' };

        const circle = new Phaser.Geom.Circle(400, 300, 225);
        const labelCircle = new Phaser.Geom.Circle(400, 300, 265);

        const graphics = this.add.graphics();

        graphics.lineStyle(2, 0x00bb00, 1);

        graphics.strokeCircleShape(circle);

        graphics.beginPath();

        for (let a = 0; a < 360; a += 22.5)
        {
            graphics.moveTo(400, 300);

            const p = Phaser.Geom.Circle.CircumferencePoint(circle, Phaser.Math.DegToRad(a));

            graphics.lineTo(p.x, p.y);

            const lp = Phaser.Geom.Circle.CircumferencePoint(labelCircle, Phaser.Math.DegToRad(a));

            let na = a;

            if (a > 180)
            {
                na -= 360;
            }

            const rads = String(Phaser.Math.DegToRad(na)).substr(0, 5);
            const info = `${na}\u00b0\n${rads}`;
            const label = this.add.text(lp.x, lp.y, info, labelStyle).setOrigin(0.5);
        }

        graphics.strokePath();

        this.arrow = this.add.sprite(400, 300, 'arrow').setOrigin(0, 0.5);

        this.text = this.add.text(10, 10, '', { font: '16px Courier', fill: '#ffffff' });
    }

    update ()
    {
        this.arrow.angle += 0.2;

        this.text.setText([
            'Sprite Rotation',
            `Angle: ${this.arrow.angle.toFixed(2)}`,
            `Rotation: ${this.arrow.rotation.toFixed(2)}`
        ]);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    scene: Example
};

const game = new Phaser.Game(config);
```
