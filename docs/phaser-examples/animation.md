# Animation

Phaser 3.85.0 のアニメーションサンプルコード集。

## アニメーション作成 (Creating Animations)

### Create Animation From Sprite Sheet

> スプライトシートからアニメーションを作成し、クリックで切り替える

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
        this.load.spritesheet('brawler', 'assets/animations/brawler48x48.png', { frameWidth: 48, frameHeight: 48 });
        this.load.image('grid', 'assets/textures/grid-ps2.png');
    }

    create ()
    {
        // Text section
        this.add.tileSprite(400, 300, 800, 600, 'grid');

        this.add.image(0, 0, 'brawler', '__BASE').setOrigin(0, 0);

        this.add.grid(0, 0, 192, 384, 48, 48).setOrigin(0, 0).setOutlineStyle(0x00ff00);

        this.add.text(200, 24, '<- walk', { color: '#00ff00' }).setOrigin(0, 0.5);
        this.add.text(200, 72, '<- idle', { color: '#00ff00' }).setOrigin(0, 0.5);
        this.add.text(200, 120, '<- kick', { color: '#00ff00' }).setOrigin(0, 0.5);
        this.add.text(200, 168, '<- punch', { color: '#00ff00' }).setOrigin(0, 0.5);
        this.add.text(200, 216, '<- jump', { color: '#00ff00' }).setOrigin(0, 0.5);
        this.add.text(200, 264, '<- jump kick', { color: '#00ff00' }).setOrigin(0, 0.5);
        this.add.text(200, 312, '<- win', { color: '#00ff00' }).setOrigin(0, 0.5);
        this.add.text(200, 360, '<- die', { color: '#00ff00' }).setOrigin(0, 0.5);
        this.add.text(48, 440, 'Click to change animation', { color: '#00ff00' });
        const current = this.add.text(48, 460, 'Playing: walk', { color: '#00ff00' });

        // Animation set
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('brawler', { frames: [ 0, 1, 2, 3 ] }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('brawler', { frames: [ 5, 6, 7, 8 ] }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'kick',
            frames: this.anims.generateFrameNumbers('brawler', { frames: [ 10, 11, 12, 13, 10 ] }),
            frameRate: 8,
            repeat: -1,
            repeatDelay: 2000
        });

        this.anims.create({
            key: 'punch',
            frames: this.anims.generateFrameNumbers('brawler', { frames: [ 15, 16, 17, 18, 17, 15 ] }),
            frameRate: 8,
            repeat: -1,
            repeatDelay: 2000
        });

        this.anims.create({
            key: 'jump',
            frames: this.anims.generateFrameNumbers('brawler', { frames: [ 20, 21, 22, 23 ] }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'jumpkick',
            frames: this.anims.generateFrameNumbers('brawler', { frames: [ 20, 21, 22, 23, 25, 23, 22, 21 ] }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'win',
            frames: this.anims.generateFrameNumbers('brawler', { frames: [ 30, 31 ] }),
            frameRate: 8,
            repeat: -1,
            repeatDelay: 2000
        });

        this.anims.create({
            key: 'die',
            frames: this.anims.generateFrameNumbers('brawler', { frames: [ 35, 36, 37 ] }),
            frameRate: 8,
        });

        const keys = [ 'walk', 'idle', 'kick', 'punch', 'jump', 'jumpkick', 'win', 'die' ];

        const cody = this.add.sprite(600, 370);
        cody.setScale(8);
        cody.play('walk');

        let c = 0;
        this.input.on('pointerdown', function () {
            c++;
            if (c === keys.length)
            {
                c = 0;
            }
            cody.play(keys[c]);
            current.setText('Playing: ' + keys[c]);
        });
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    pixelArt: true,
    scene: Example
};

const game = new Phaser.Game(config);
```

### Create Animation From Texture Atlas

> テクスチャアトラスから複数のアニメーションを作成して海中シーンを構成する

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
        this.load.atlas('sea', 'assets/animations/seacreatures_json.png', 'assets/animations/seacreatures_json.json');

        //  Just a few images to use in our underwater scene
        this.load.image('undersea', 'assets/pics/undersea.jpg');
        this.load.image('coral', 'assets/pics/seabed.png');
    }

    create ()
    {
        this.add.image(400, 300, 'undersea');

        //  Create the Animations
        //  These are stored globally, and can be used by any Sprite

        //  In the texture atlas the jellyfish uses the frame names blueJellyfish0000 to blueJellyfish0032
        //  So we can use the handy generateFrameNames function to create this for us (and so on)
        this.anims.create({ key: 'jellyfish', frames: this.anims.generateFrameNames('sea', { prefix: 'blueJellyfish', end: 32, zeroPad: 4 }), repeat: -1 });
        this.anims.create({ key: 'crab', frames: this.anims.generateFrameNames('sea', { prefix: 'crab1', end: 25, zeroPad: 4 }), repeat: -1 });
        this.anims.create({ key: 'octopus', frames: this.anims.generateFrameNames('sea', { prefix: 'octopus', end: 24, zeroPad: 4 }), repeat: -1 });
        this.anims.create({ key: 'purpleFish', frames: this.anims.generateFrameNames('sea', { prefix: 'purpleFish', end: 20, zeroPad: 4 }), repeat: -1 });
        this.anims.create({ key: 'stingray', frames: this.anims.generateFrameNames('sea', { prefix: 'stingray', end: 23, zeroPad: 4 }), repeat: -1 });

        const jellyfish = this.add.sprite(400, 300, 'seacreatures').play('jellyfish');
        const bigCrab = this.add.sprite(550, 480, 'seacreatures').setOrigin(0).play('crab');
        const smallCrab = this.add.sprite(730, 515, 'seacreatures').setScale(0.5).setOrigin(0).play('crab');
        const octopus = this.add.sprite(100, 100, 'seacreatures').play('octopus');
        const fish = this.add.sprite(600, 200, 'seacreatures').play('purpleFish');
        const ray = this.add.sprite(100, 300, 'seacreatures').play('stingray');

        this.add.image(0, 466, 'coral').setOrigin(0);
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

### Animation From Png Sequence

> 個別のPNG画像からアニメーションを作成する

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
        this.load.path = 'assets/animations/';

        this.load.image('cat1', 'cat1.png');
        this.load.image('cat2', 'cat2.png');
        this.load.image('cat3', 'cat3.png');
        this.load.image('cat4', 'cat4.png');
    }

    create ()
    {
        this.anims.create({
            key: 'snooze',
            frames: [
                { key: 'cat1' },
                { key: 'cat2' },
                { key: 'cat3' },
                { key: 'cat4', duration: 50 }
            ],
            frameRate: 8,
            repeat: -1
        });

        this.add.sprite(400, 300, 'cat1')
            .play('snooze');
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    backgroundColor: '#fbf0e4',
    scene: Example
};

const game = new Phaser.Game(config);
```

### Create Animation From Canvas Texture

> Canvas テクスチャから動的にフレームを生成してアニメーションを作成する

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
        const framesPerRow = 8;
        const frameTotal = 32;

        const canvasFrame = this.textures.createCanvas('dynamicFrames', 256, 128);

        let radius = 0;
        const radiusInc = 16 / frameTotal;

        let x = 0;
        let y = 0;
        let ctx = canvasFrame.context;

        ctx.fillStyle = '#ffff00';

        for (let i = 1; i <= frameTotal; i++)
        {
            ctx.beginPath();
            ctx.arc(x + 16, y + 16, Math.max(1, radius), 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fill();

            canvasFrame.add(i, 0, x, y, 32, 32);

            x += 32;
            radius += radiusInc;

            if (i % framesPerRow === 0)
            {
                x = 0;
                y += 32;
            }
        }

        canvasFrame.refresh();

        this.add.image(0, 0, 'dynamicFrames', '__BASE').setOrigin(0);

        this.anims.create({
            key: 'pulse',
            frames: this.anims.generateFrameNumbers('dynamicFrames', { start: 1, end: frameTotal }),
            frameRate: 28,
            repeat: -1,
            yoyo: true
        });

        for (let i = 0; i < 50; i++)
        {
            const ball = this.add.sprite(8 + i * 16, 164, 'dynamicFrames').play('pulse');

            this.tweens.add({
                targets: ball,
                y: 584,
                duration: 2000,
                ease: 'Quad.easeInOut',
                delay: i * 30,
                yoyo: true,
                repeat: -1
            });
        }
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

### From Animation Json

> JSONファイルからアニメーション定義を読み込んで再生する

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
        this.load.animation('gemData', 'assets/animations/gems.json');
        this.load.atlas('gems', 'assets/tests/columns/gems.png', 'assets/tests/columns/gems.json');
    }

    create ()
    {
        this.add.text(400, 32, 'Animations from Animation JSON file', { color: '#00ff00' }).setOrigin(0.5, 0);

        this.add.sprite(400, 200, 'gems').play('diamond');
        this.add.sprite(400, 300, 'gems').play('prism');
        this.add.sprite(400, 400, 'gems').play('ruby');
        this.add.sprite(400, 500, 'gems').play('square');
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

### Aseprite Animation

> Aseprite形式のスプライトシートとJSONからアニメーションを作成する

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.path = 'assets/animations/aseprite/';

        this.load.aseprite('paladin', 'paladin.png', 'paladin.json');
    }

    create ()
    {
        const tags = this.anims.createFromAseprite('paladin');

        const sprite = this.add.sprite(500, 300).play({ key: 'Magnum Break', repeat: -1 }).setScale(6);

        for (let i = 0; i < tags.length; i++)
        {
            const label = this.add.text(32, 32 + (i * 16), tags[i].key, { color: '#00ff00' });

            label.setInteractive();
        }

        this.input.on('gameobjectdown', (pointer, obj) =>
        {

            sprite.play({
                key: obj.text,
                repeat: -1
            });

        });

        this.input.on('gameobjectover', (pointer, obj) =>
        {

            obj.setColor('#ff00ff');

        });

        this.input.on('gameobjectout', (pointer, obj) =>
        {

            obj.setColor('#00ff00');

        });
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    pixelArt: true,
    scene: Example
};

const game = new Phaser.Game(config);
```

### Create Animation On Sprite

> スプライト固有のアニメーションとグローバルアニメーションの違いを示す

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
        this.load.atlas('soldier', 'assets/animations/soldier.png', 'assets/animations/soldier.json');
        this.load.image('bg', 'assets/pics/town-wreck.jpg');
    }

    create ()
    {
        this.add.image(400, 300, 'bg');

        const rambo = this.add.sprite(500, 500, 'soldier');

        rambo.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNames('soldier', { prefix: 'soldier_3_walk_', start: 1, end: 8 }),
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNames('soldier', { prefix: 'Soldier_2_walk_', start: 1, end: 8 }),
            frameRate: 12,
            repeat: -1
        });

        rambo.play('walk');

        this.add.sprite(200, 500, 'soldier')
            .play('walk');
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

### Create From Sprite Config

> スプライト設定オブジェクトを使ってアニメーション付きスプライトを一括生成する

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.atlas('gems', 'assets/tests/columns/gems.png', 'assets/tests/columns/gems.json');
    }

    create ()
    {
        //  Define the animations first

        this.anims.create({ key: 'ruby', frames: this.anims.generateFrameNames('gems', { prefix: 'ruby_', end: 6, zeroPad: 4 }), repeat: -1 });
        this.anims.create({ key: 'square', frames: this.anims.generateFrameNames('gems', { prefix: 'square_', end: 14, zeroPad: 4 }), repeat: -1 });

        //  The Sprite config
        const config = {
            key: 'gems',
            x: { randInt: [ 0, 800 ] },
            y: { randInt: [ 0, 300 ] },
            scale: { randFloat: [ 0.5, 1.5 ] },
            anims: 'ruby'
        };

        //  Make 16 sprites using the config above
        for (let i = 0; i < 16; i++)
        {
            this.make.sprite(config);
        }

        //  A more complex animation config object.
        //  This time with a call to delayedPlay that's a function.
        const config2 = {
            key: 'gems',
            frame: 'square_0000',
            x: { randInt: [ 0, 800 ] },
            y: { randInt: [ 300, 600 ] },
            scale: { randFloat: [ 0.5, 1.5 ] },
            anims: {
                key: 'square',
                repeat: -1,
                repeatDelay: { randInt: [ 1000, 4000 ] },
                delayedPlay: function ()
                {
                    return Math.random() * 6000;
                }
            }
        };

        //  Make 16 sprites using the config above
        for (let i = 0; i < 16; i++)
        {
            this.make.sprite(config2);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    pixelArt: true,
    width: 800,
    height: 600,
    scene: Example
};

const game = new Phaser.Game(config);
```

## フレーム生成 (Frame Generation)

### Generate Frame Names

> テクスチャアトラスからフレーム名を自動生成してアニメーションを作成する

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
        this.load.atlas('gems', 'assets/tests/columns/gems.png', 'assets/tests/columns/gems.json');
    }

    create ()
    {
        this.add.text(400, 32, 'Check the source code for comments', { color: '#00ff00' }).setOrigin(0.5, 0);

        this.anims.create({ key: 'diamond', frames: this.anims.generateFrameNames('gems', { prefix: 'diamond_', end: 15, zeroPad: 4 }), repeat: -1 });
        this.anims.create({ key: 'prism', frames: this.anims.generateFrameNames('gems', { prefix: 'prism_', end: 6, zeroPad: 4 }), repeat: -1 });
        this.anims.create({ key: 'ruby', frames: this.anims.generateFrameNames('gems', { prefix: 'ruby_', end: 6, zeroPad: 4 }), repeat: -1 });
        this.anims.create({ key: 'square', frames: this.anims.generateFrameNames('gems', { prefix: 'square_', end: 14, zeroPad: 4 }), repeat: -1 });

        this.add.sprite(400, 200, 'gems').play('diamond');
        this.add.sprite(400, 300, 'gems').play('prism');
        this.add.sprite(400, 400, 'gems').play('ruby');
        this.add.sprite(400, 500, 'gems').play('square');
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    pixelArt: true,
    width: 800,
    height: 600,
    scene: Example
};

const game = new Phaser.Game(config);
```

### Generate Frame Numbers

> スプライトシートからフレーム番号を指定してアニメーションを作成する

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
        this.load.spritesheet('boom', 'assets/sprites/explosion.png', { frameWidth: 64, frameHeight: 64, endFrame: 23 });
    }

    create ()
    {
        this.add.text(400, 32, 'Check the source code for comments', { color: '#00ff00' }).setOrigin(0.5, 0);

        const config1 = {
            key: 'explode1',
            frames: 'boom',
            frameRate: 20,
            repeat: -1
        };

        const config2 = {
            key: 'explode2',
            frames: this.anims.generateFrameNumbers('boom', { start: 0, end: 23 }),
            frameRate: 20,
            repeat: -1
        };

        const config3 = {
            key: 'explode3',
            frames: this.anims.generateFrameNumbers('boom', { frames: [ 0, 1, 2, 1, 2, 3, 4, 0, 1, 2 ] }),
            frameRate: 20,
            repeat: -1
        };

        this.anims.create(config1);
        this.anims.create(config2);
        this.anims.create(config3);

        this.add.sprite(200, 300, 'boom').play('explode1');
        this.add.sprite(400, 300, 'boom').play('explode2');
        this.add.sprite(600, 300, 'boom').play('explode3');
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

## 再生制御 (Playback Control)

### Play Animation With Config

> 再生設定オブジェクトでフレームレートやリピートディレイを個別に指定する

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
        this.load.atlas('cube', 'assets/animations/cube.png', 'assets/animations/cube.json');
    }

    create ()
    {
        //  Our global 'spin' animation
        this.anims.create({
            key: 'spin',
            frames: this.anims.generateFrameNames('cube', { prefix: 'frame', start: 1, end: 23 }),
            frameRate: 50,
            repeat: -1
        });

        const colors = [ 0xef658c, 0xff9a52, 0xffdf00, 0x31ef8c, 0x21dfff, 0x31aade, 0x5275de, 0x9c55ad, 0xbd208c ];

        const sprite1 = this.add.sprite(200, 300, 'cube').setTint(colors[0]);
        const sprite2 = this.add.sprite(400, 300, 'cube').setTint(colors[1]);
        const sprite3 = this.add.sprite(600, 300, 'cube').setTint(colors[2]);

        //  Play the 'spin' animation
        sprite1.play({ key: 'spin' });

        //  Play the animation and override the default frameRate with a new one
        sprite2.play({ key: 'spin', frameRate: 20 });

        //  Play the animation and set the repeatDelay to 250ms
        sprite3.play({ key: 'spin', repeatDelay: 250 });
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

### Reverse Animation

> アニメーションの逆再生、一時停止、ヨーヨーをキーボードで制御する

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
        this.load.spritesheet('mummy', 'assets/animations/mummy37x45.png', { frameWidth: 37, frameHeight: 45 });
    }

    create ()
    {
        //  Frame debug view
        this.frameView = this.add.graphics({ fillStyle: { color: 0xff00ff }, x: 32, y: 32 });

        //  Show the whole animation sheet
        this.add.image(32, 32, 'mummy', '__BASE').setOrigin(0);

        const config = {
            key: 'walk',
            frames: this.anims.generateFrameNumbers('mummy'),
            frameRate: 6,
            yoyo: false,
            repeat: -1
        };

        this.anim = this.anims.create(config);

        this.sprite = this.add.sprite(400, 250, 'mummy').setScale(4);

        //  Debug text
        this.progress = this.add.text(100, 420, 'Progress: 0%', { color: '#00ff00' });

        this.input.keyboard.on('keydown-SPACE', function (event) {
            this.sprite.play('walk');
        }, this);

        this.input.keyboard.on('keydown-Y', function (event) {
            this.sprite.anims.yoyo = !this.sprite.anims.yoyo;
        }, this);

        this.input.keyboard.on('keydown-Q', function (event) {
            this.sprite.playReverse('walk');
        }, this);

        this.input.keyboard.on('keydown-R', function (event) {
            this.sprite.anims.reverse();
        }, this);

        this.input.keyboard.on('keydown-P', function (event) {

            if (this.sprite.anims.isPaused)
            {
                this.sprite.anims.resume();
            }
            else
            {
                this.sprite.anims.pause();
            }
        }, this);
    }

    update ()
    {
        this.updateFrameView();

        const debug = [
            'SPACE to play the animation, Q to play reverse,',
            'R to revert at any time, P to pause/resume,',
            'Y to toggle yoyo',
            '',
            'Yoyo: ' + this.sprite.anims.yoyo,
            'Reverse: ' + this.sprite.anims.inReverse,
            'Progress: ' + this.sprite.anims.getProgress() * 100 + '%',
            'Accumulator: ' + this.sprite.anims.accumulator,
            'NextTick: ' + this.sprite.anims.nextTick
        ];

        this.progress.setText(debug);
    }

    updateFrameView ()
    {
        if (this.sprite.anims.isPlaying)
        {
            this.frameView.clear();
            this.frameView.fillRect(this.sprite.frame.cutX, 0, 37, 45);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    backgroundColor: '#4d4d4d',
    pixelArt: true,
    scene: Example
};

const game = new Phaser.Game(config);
```

### Pause Animation Instances

> 特定のアニメーション定義に紐づく全インスタンスを一括で一時停止・再開する

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
        this.load.atlas('gems', 'assets/tests/columns/gems.png', 'assets/tests/columns/gems.json');
    }

    create ()
    {
        this.add.text(400, 32, 'Click to pause all Square animation instances', { color: '#00ff00' }).setOrigin(0.5, 0);

        const diamond = this.anims.create({ key: 'diamond', frames: this.anims.generateFrameNames('gems', { prefix: 'diamond_', end: 15, zeroPad: 4 }), repeat: -1 });
        const prism = this.anims.create({ key: 'prism', frames: this.anims.generateFrameNames('gems', { prefix: 'prism_', end: 6, zeroPad: 4 }), repeat: -1 });
        const ruby = this.anims.create({ key: 'ruby', frames: this.anims.generateFrameNames('gems', { prefix: 'ruby_', end: 6, zeroPad: 4 }), repeat: -1 });
        const square = this.anims.create({ key: 'square', frames: this.anims.generateFrameNames('gems', { prefix: 'square_', end: 14, zeroPad: 4 }), repeat: -1 });

        const keys = [ 'diamond', 'prism', 'ruby', 'square', 'square' ];

        let x = 100;
        let y = 116;

        for (let i = 0; i < 35; i++)
        {
            this.add.sprite(x, y, 'gems').play(keys[Phaser.Math.Between(0, 4)]);

            x += 100;

            if (x === 800)
            {
                x = 100;
                y += 100;
            }
        }

        this.input.on('pointerdown', function () {

            if (square.paused)
            {
                square.resume();
            }
            else
            {
                square.pause();
            }

        });
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

### Play After Delay

> 指定したミリ秒後にアニメーションを再生する

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
        this.load.atlas('zombie', 'assets/animations/zombie.png', 'assets/animations/zombie.json');
        this.load.image('bg', 'assets/textures/soil.png');
    }

    create ()
    {
        this.bg = this.add.tileSprite(400, 300, 800, 600, 'bg').setAlpha(0.8);
        const text = this.add.text(400, 32, "Click to run playAfterDelay('death', 2000)", { color: '#00ff00' }).setOrigin(0.5, 0);

        //  Our global animations, as defined in the texture atlas
        this.anims.create({ key: 'walk', frames: this.anims.generateFrameNames('zombie', { prefix: 'walk_', end: 8, zeroPad: 3 }), repeat: -1, frameRate: 8 });
        this.anims.create({ key: 'death', frames: this.anims.generateFrameNames('zombie', { prefix: 'Death_', end: 5, zeroPad: 3 }), frameRate: 12 });

        this.rob = this.add.sprite(400, 560, 'zombie').setOrigin(0.5, 1).play('walk');

        this.input.once('pointerdown', function () {
            text.setText('Playing death animation in 2000 ms');

            this.rob.anims.playAfterDelay('death', 2000);

        }, this);
    }

    update ()
    {
        if (this.rob.anims.getName() === 'walk')
        {
            this.bg.tilePositionY++;
        }
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

### Play After Repeat

> 現在のアニメーションのリピート完了後に次のアニメーションを再生する

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
        this.load.atlas('alien', 'assets/animations/alien.png', 'assets/animations/alien.json');
        this.load.image('bg', 'assets/pics/space-wreck.jpg');
    }

    create ()
    {
        this.add.image(400, 300, 'bg');

        const text = this.add.text(400, 32, "Click to toggle sequence", { color: '#00ff00' }).setOrigin(0.5, 0);

        //  Our global animations, as defined in the texture atlas
        this.anims.create({ key: 'idle', frames: this.anims.generateFrameNames('alien', { prefix: '01_Idle_', end: 17, zeroPad: 3 }), repeat: -1, repeatDelay: 500, frameRate: 18 });
        this.anims.create({ key: 'turn', frames: this.anims.generateFrameNames('alien', { prefix: '02_Turn_to_walk_', end: 3, zeroPad: 3 }), frameRate: 12 });
        this.anims.create({ key: 'walk', frames: this.anims.generateFrameNames('alien', { prefix: '03_Walk_', end: 12, zeroPad: 3 }), repeat: -1, frameRate: 18 });

        const ripley = this.add.sprite(400, 300, 'alien').play('idle');

        this.input.on('pointerdown', function () {

            if (ripley.anims.getName() === 'idle')
            {
                //  When the current animation repeat ends, we'll play the 'turn' animation
                ripley.anims.playAfterRepeat('turn');

                //  And after that, the 'walk' look
                ripley.anims.chain('walk');
            }
            else
            {
                ripley.anims.play('idle');
            }

        });
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

### Chained Animation

> 複数のアニメーションをチェーンで連結して順番に再生する

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
        this.load.atlas('knight', 'assets/animations/knight.png', 'assets/animations/knight.json');
        this.load.image('bg', 'assets/skies/clouds.png');
        this.load.spritesheet('tiles', 'assets/tilemaps/tiles/fantasy-tiles.png', { frameWidth: 64, frameHeight: 64 });
    }

    create ()
    {
        //  The background and floor
        this.add.image(400, 16, 'bg').setOrigin(0.5, 0);

        for (var i = 0; i < 13; i++)
        {
            this.add.image(64 * i, 536, 'tiles', 1).setOrigin(0);
        }

        var text = this.add.text(400, 8, 'Click to play animation chain', { color: '#ffffff' }).setOrigin(0.5, 0);

        //  Our animations
        this.anims.create({
            key: 'guardStart',
            frames: this.anims.generateFrameNames('knight', { prefix: 'guard_start/frame', start: 0, end: 3, zeroPad: 4 }),
            frameRate: 8
        });

        this.anims.create({
            key: 'guard',
            frames: this.anims.generateFrameNames('knight', { prefix: 'guard/frame', start: 0, end: 5, zeroPad: 4 }),
            frameRate: 8,
            repeat: 2
        });

        this.anims.create({
            key: 'guardEnd',
            frames: this.anims.generateFrameNames('knight', { prefix: 'guard_end/frame', start: 0, end: 3, zeroPad: 4 }),
            frameRate: 8
        });

        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNames('knight', { prefix: 'idle/frame', start: 0, end: 5, zeroPad: 4 }),
            frameRate: 8,
            repeat: -1
        });

        var lancelot = this.add.sprite(500, 536)

        lancelot.setOrigin(0.5, 1);
        lancelot.setScale(8);
        lancelot.play('idle');

        lancelot.on(Phaser.Animations.Events.ANIMATION_START, function (anim) {

            text.setText('Playing ' + anim.key);

        });

        this.input.on('pointerdown', function () {

            if (lancelot.anims.getName() === 'idle')
            {
                lancelot.playAfterRepeat('guardStart');
                lancelot.chain([ 'guard', 'guardEnd', 'idle' ]);
            }

        }, this);
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    backgroundColor: '#026bc6',
    pixelArt: true,
    scene: Example
};

const game = new Phaser.Game(config);
```

### Mixed Animation

> アニメーション間のミックス（遷移時間）を設定してスムーズに切り替える

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
        this.load.atlas('knight', 'assets/animations/knight.png', 'assets/animations/knight.json');
        this.load.image('bg', 'assets/skies/clouds.png');
        this.load.spritesheet('tiles', 'assets/tilemaps/tiles/fantasy-tiles.png', { frameWidth: 64, frameHeight: 64 });
    }

    create ()
    {
        //  The background and floor
        this.add.image(400, 48, 'bg').setOrigin(0.5, 0);

        for (var i = 0; i < 13; i++)
        {
            this.add.image(64 * i, 536, 'tiles', 1).setOrigin(0);
        }

        var text = this.add.text(400, 8, 'Click to play\nIdle to Run mix: 1500ms\nRun to Idle mix: 500ms', { color: '#ffffff', align: 'center' }).setOrigin(0.5, 0);

        //  Our animations

        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNames('knight', { prefix: 'idle/frame', start: 0, end: 5, zeroPad: 4 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNames('knight', { prefix: 'run/frame', start: 0, end: 7, zeroPad: 4 }),
            frameRate: 12,
            repeat: -1
        });

        //  Set a mix between 'idle' and 'run'.

        //  When transitioning from idle to run it will wait 1500ms before starting the run animation
        this.anims.addMix('idle', 'run', 1500);

        //  When transitioning from run to idle it will wait 500ms before starting the idle animation
        this.anims.addMix('run', 'idle', 500);

        var lancelot = this.add.sprite(500, 536)

        lancelot.setOrigin(0.5, 1);
        lancelot.setScale(8);
        lancelot.play('idle');

        this.input.on('pointerdown', function () {

            if (lancelot.anims.getName() === 'idle')
            {
                lancelot.play('run');
            }
            else if (lancelot.anims.getName() === 'run')
            {
                lancelot.play('idle');
            }

        });
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    backgroundColor: '#026bc6',
    pixelArt: true,
    scene: Example
};

const game = new Phaser.Game(config);
```

### Tween Timescale

> Tweenでアニメーションの timeScale を動的に変更して速度を変化させる

```javascript
class Example extends Phaser.Scene {
    constructor() {
        super();
    }

    preload() {
        this.load.atlas('knight', 'assets/animations/knight.png', 'assets/animations/knight.json');
        this.load.image('bg', 'assets/skies/clouds.png');
        this.load.spritesheet('tiles', 'assets/tilemaps/tiles/fantasy-tiles.png', { frameWidth: 64, frameHeight: 64 });
    }

    create() {
        //  The background and floor
        this.bg = this.add.tileSprite(0, 16, 800, 600, 'bg').setOrigin(0);
        this.ground = this.add.tileSprite(0, 536, 800, 64, 'tiles', 1).setOrigin(0);

        this.add.text(400, 8, 'Tweening the Animation.timeScale', { color: '#ffffff' }).setOrigin(0.5, 0);

        const runConfig = {
            key: 'run',
            frames: this.anims.generateFrameNames('knight', { prefix: 'run/frame', start: 0, end: 7, zeroPad: 4 }),
            frameRate: 12,
            repeat: -1
        };

        this.anims.create(runConfig);

        this.lancelot = this.add.sprite(480, 536, 'knight');

        this.lancelot.setOrigin(0.5, 1);
        this.lancelot.setScale(8);
        this.lancelot.play('run');

        this.tweens.add({
            targets: this.lancelot.anims,
            timeScale: { from: 0.5, to: 2 },
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1,
            repeatDelay: 1000,
            hold: 1000,
            duraton: 3000
        });
    }

    update() {
        this.bg.tilePositionX += 3 * this.lancelot.anims.timeScale;
        this.ground.tilePositionX += 6 * this.lancelot.anims.timeScale;
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    backgroundColor: '#026bc6',
    pixelArt: true,
    scene: Example
};

const game = new Phaser.Game(config);
```

### Yoyo

> アニメーションのヨーヨー（往復再生）をランタイムで切り替える

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
        this.load.atlas('ryu', 'assets/animations/sf2ryu.png', 'assets/animations/sf2ryu.json');
        this.load.image('sea', 'assets/skies/sf2boat.png');
        this.load.image('ground', 'assets/skies/sf2floor.png');
    }

    create ()
    {
        this.add.image(100, 130, 'sea').setScale(3);
        this.add.image(400, 500, 'ground').setScale(3);

        var info = [ 'Click to toggle Animation.yoyo', 'yoyo: true' ];
        var text = this.add.text(400, 32, info, { color: '#113355', align: 'center' }).setOrigin(0.5, 0);

        this.anims.create({
            key: 'hadoken',
            frames: this.anims.generateFrameNames('ryu', { prefix: 'frame_', end: 15, zeroPad: 2 }),
            yoyo: true,
            repeat: -1
        });

        var ryu = this.add.sprite(400, 350).play('hadoken').setScale(3);

        this.input.on('pointerup', function () {

            //  Toggle 'yoyo' at runtime
            ryu.anims.yoyo = !ryu.anims.yoyo;

            info[1] = 'yoyo: ' + ryu.anims.yoyo;

            text.setText(info);

        });
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    pixelArt: true,
    width: 800,
    height: 600,
    scene: Example
};

const game = new Phaser.Game(config);
```

### Start From Random Frame

> ランダムなフレームからアニメーションを開始する

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
        this.load.image('bg', 'assets/skies/sky5.png')
        this.load.spritesheet('mummy', 'assets/animations/mummy37x45.png', { frameWidth: 37, frameHeight: 45 });
    }

    create ()
    {
        this.add.image(400, 300, 'bg');

        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('mummy'),
            frameRate: 12,
            repeat: -1
        });

        const sprite1 = this.add.sprite(50, 100, 'mummy').setScale(4);
        const sprite2 = this.add.sprite(50, 300, 'mummy').setScale(4);
        const sprite3 = this.add.sprite(50, 500, 'mummy').setScale(4);

        sprite1.play({ key: 'walk', randomFrame: true, delay: 2000, showBeforeDelay: true });
        sprite2.play({ key: 'walk', randomFrame: true, delay: 2000, showBeforeDelay: true });
        sprite3.play({ key: 'walk', randomFrame: true, delay: 2000, showBeforeDelay: true });

        this.tweens.add({
            targets: [ sprite1, sprite2, sprite3 ],
            x: 750,
            flipX: true,
            yoyo: true,
            repeat: -1,
            duration: 8000,
            delay: 2000
        });
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    pixelArt: true,
    scene: Example
};

const game = new Phaser.Game(config);
```

## イベント (Events)

### Add Animation Event

> アニメーションマネージャーにアニメーションが追加されたときのイベントを検知する

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
        this.load.atlas('gems', 'assets/tests/columns/gems.png', 'assets/tests/columns/gems.json');
        // Local variable
        this.y = 160;
    }

    create ()
    {
        this.add.text(400, 32, 'Click to create animations', { color: '#00ff00' })
            .setOrigin(0.5, 0);

        //  Each time a new animation is added to the Animation Manager we'll call this function
        this.anims.on(Phaser.Animations.Events.ADD_ANIMATION, this.addAnimation, this);

        this.i = 0;

        //  Click to add an animation
        this.input.on('pointerup', function () {
            switch (this.i)
            {
                case 0:
                    this.anims.create({ key: 'diamond', frames: this.anims.generateFrameNames('gems', { prefix: 'diamond_', end: 15, zeroPad: 4 }), repeat: -1 });
                    break;

                case 1:
                    this.anims.create({ key: 'prism', frames: this.anims.generateFrameNames('gems', { prefix: 'prism_', end: 6, zeroPad: 4 }), repeat: -1 });
                    break;

                case 2:
                    this.anims.create({ key: 'ruby', frames: this.anims.generateFrameNames('gems', { prefix: 'ruby_', end: 6, zeroPad: 4 }), repeat: -1 });
                    break;

                case 3:
                    this.anims.create({ key: 'square', frames: this.anims.generateFrameNames('gems', { prefix: 'square_', end: 14, zeroPad: 4 }), repeat: -1 });
                    break;
            }
            this.i++;
        }, this);
    }

    addAnimation (key)
    {
        this.add.sprite(400, this.y, 'gems')
            .play(key);
        this.y += 100;
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

### Animation Repeat Event

> アニメーションのリピートイベントを検知してエフェクトを生成する

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
        this.load.image('poo', 'assets/sprites/poo.png');
        this.load.spritesheet('mummy', 'assets/animations/mummy37x45.png', { frameWidth: 37, frameHeight: 45 });
    }

    create ()
    {
        const mummyAnimation = this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('mummy'),
            frameRate: 16
        });

        const sprite = this.add.sprite(50, 300, 'mummy').setScale(4);

        sprite.play({ key: 'walk', repeat: 7 });

        this.tweens.add({
            targets: sprite,
            x: 750,
            duration: 8800,
            ease: 'Linear'
        });

        sprite.on('animationrepeat', function () {

            const poop = this.add.image(sprite.x - 32, 300, 'poo').setScale(0.5);

            this.tweens.add({
                targets: poop,
                props: {
                    x: {
                        value: '-=64', ease: 'Power1'
                    },
                    y: {
                        value: '+=50', ease: 'Bounce.easeOut'
                    }
                },
                duration: 750
            });

        }, this);
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    pixelArt: true,
    scene: Example
};

const game = new Phaser.Game(config);
```

### On Complete Event

> アニメーション完了イベントでアイテムを放出する

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
        this.load.atlas('knight', 'assets/animations/knight.png', 'assets/animations/knight.json');
        this.load.image('bg', 'assets/skies/clouds.png');
        this.load.spritesheet('tiles', 'assets/tilemaps/tiles/fantasy-tiles.png', { frameWidth: 64, frameHeight: 64 });
    }

    create ()
    {
        //  The background and floor
        this.add.image(400, 16, 'bg').setOrigin(0.5, 0);

        for (var i = 0; i < 13; i++)
        {
            this.add.image(64 * i, 536, 'tiles', 1).setOrigin(0);
        }

        this.add.text(400, 8, 'Click to play animation', { color: '#ffffff' }).setOrigin(0.5, 0);

        //  Our attack animation
        const animConfig = {
            key: 'attack',
            frames: this.anims.generateFrameNames('knight', { prefix: 'attack_A/frame', start: 0, end: 13, zeroPad: 4 }),
            frameRate: 12
        };

        this.anims.create(animConfig);

        const lancelot = this.add.sprite(400, 536, 'knight', 'attack_A/frame0000')

        lancelot.setOrigin(0.5, 1);
        lancelot.setScale(8);

        // Event handler for when the animation completes on our sprite
        lancelot.on(Phaser.Animations.Events.ANIMATION_COMPLETE, function () {
            this.releaseItem();
        }, this);

        //  And a click handler to start the animation playing
        this.input.on('pointerdown', function () {
            lancelot.play('attack', true);
        });
    }

    releaseItem() {
        const item = this.add.image(500, 500, 'tiles', 54);

        this.tweens.add({
            targets: item,
            props: {
                y: {
                    value: -64,
                    ease: 'Linear',
                    duration: 3000,
                },
                x: {
                    value: '+=128',
                    ease: 'Sine.inOut',
                    duration: 500,
                    yoyo: true,
                    repeat: 4
                }
            },
            onComplete: function () {
                item.destroy();
            }
        });
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    backgroundColor: '#026bc6',
    pixelArt: true,
    scene: Example
};

const game = new Phaser.Game(config);
```

### On Repeat Event

> アニメーションのリピートイベントでコインを生成する

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
        this.load.atlas('knight', 'assets/animations/knight.png', 'assets/animations/knight.json');
        this.load.image('bg', 'assets/skies/clouds.png');
        this.load.spritesheet('tiles', 'assets/tilemaps/tiles/fantasy-tiles.png', { frameWidth: 64, frameHeight: 64 });
    }

    create ()
    {
        this.add.image(400, 16, 'bg').setOrigin(0.5, 0);

        for (var i = 0; i < 13; i++)
        {
            this.add.image(64 * i, 536, 'tiles', 1).setOrigin(0);
        }

        this.add.image(576, 472, 'tiles', 27).setOrigin(0);
        this.add.image(576, 408, 'tiles', 27).setOrigin(0);
        this.add.image(576, 344, 'tiles', 57).setOrigin(0);

        this.add.text(400, 8, 'Click to repeat animation', { color: '#ffffff' }).setOrigin(0.5, 0);

        const attackConfig = {
            key: 'attack',
            frames: this.anims.generateFrameNames('knight', { prefix: 'attack_C/frame', start: 0, end: 13, zeroPad: 4 }),
            frameRate: 16,
            repeat: -1
        };

        this.anims.create(attackConfig);

        const coinConfig = {
            key: 'coin',
            frames: this.anims.generateFrameNumbers('tiles', { start: 42, end: 47 }),
            frameRate: 12,
            repeat: -1
        };

        this.anims.create(coinConfig);

        const lancelot = this.add.sprite(300, 536, 'knight', 'attack_C/frame0000')

        lancelot.setOrigin(0.5, 1);
        lancelot.setScale(8);

        lancelot.on(Phaser.Animations.Events.ANIMATION_REPEAT, function () {
            this.releaseItem();
        }, this);

        this.input.once('pointerdown', function () {
            lancelot.play('attack');
        });
    }

    releaseItem ()
    {
        const item = this.add.sprite(600, 370).play('coin');

        this.tweens.add({
            targets: item,
            props: {
                y: {
                    value: -64,
                    ease: 'Linear',
                    duration: 3000,
                },
                x: {
                    value: '+=128',
                    ease: 'Sine.inOut',
                    duration: 500,
                    yoyo: true,
                    repeat: 4
                }
            },
            onComplete: function () {
                item.destroy();
            }
        });
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    backgroundColor: '#026bc6',
    pixelArt: true,
    scene: Example
};

const game = new Phaser.Game(config);
```

### On Update Event

> アニメーションの特定フレーム更新時にエフェクトを発動する

```javascript
class Example extends Phaser.Scene
{
    constructor ()
    {
        super();
        this.flowers = [];
    }

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.atlas('knight', 'assets/animations/knight.png', 'assets/animations/knight.json');
        this.load.image('bg', 'assets/skies/clouds.png');
        this.load.spritesheet('tiles', 'assets/tilemaps/tiles/fantasy-tiles.png', { frameWidth: 64, frameHeight: 64 });
    }

    create ()
    {
        //  The background and floor
        this.add.image(400, 16, 'bg').setOrigin(0.5, 0);

        for (let i = 0; i < 13; i++)
        {
            this.add.image(64 * i, 536, 'tiles', 1)
                .setOrigin(0);
        }

        //  Our flowers
        for (let i = 0; i < 8; i++)
        {
            const flower = this.add.image(500, 472 - (i * 52), 'tiles', 31).setOrigin(0);
            this.flowers.push(flower);
        }

        this.add.text(400, 8, 'Click to play. Update Event on frame0004', { color: '#ffffff' })
            .setOrigin(0.5, 0);

        //  Our attack animation
        const attackConfig = {
            key: 'attack',
            frames: this.anims.generateFrameNames('knight', { prefix: 'attack_B/frame', start: 0, end: 12, zeroPad: 4 }),
            frameRate: 16
        };

        this.anims.create(attackConfig);

        //  Our coin animation
        const coinConfig = {
            key: 'coin',
            frames: this.anims.generateFrameNumbers('tiles', { start: 42, end: 47 }),
            frameRate: 12,
            repeat: -1
        };
        this.anims.create(coinConfig);

        const lancelot = this.add.sprite(300, 536, 'knight', 'attack_C/frame0000')

        lancelot.setOrigin(0.5, 1);
        lancelot.setScale(8);

        //  Event handler for when the animation updates on our sprite
        lancelot.on(Phaser.Animations.Events.ANIMATION_UPDATE, function (anim, frame, sprite, frameKey) {
            //  We can run our effect when we get frame0004:
            if (frameKey === 'attack_B/frame0004')
            {
                this.releaseItem();
            }

        }, this);

        //  And a click handler to start the animation playing
        this.input.on('pointerdown', function () {
            lancelot.play('attack', true);
        });
    }

    releaseItem ()
    {
        if (this.flowers.length === 0)
        {
            return;
        }

        const flower = this.flowers.pop();
        this.tweens.add({
            targets: flower,
            x: 864,
            ease: 'Quad.out',
            duration: 500
        });
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    backgroundColor: '#026bc6',
    pixelArt: true,
    scene: Example
};

const game = new Phaser.Game(config);
```

### Sprite Animation Events

> スプライトのアニメーションイベント（開始・更新・リピート・完了・停止）を全て検知してログ表示する

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
        this.load.atlas('sf2', 'assets/animations/sf2.png', 'assets/animations/sf2.json');
    }

    create ()
    {
        var animConfig = {
            key: 'ryu',
            frames: this.anims.generateFrameNames('sf2', { prefix: 'frame_', end: 22 }),
            frameRate: 20,
            repeat: 3
        };

        this.anims.create(animConfig);

        const sprite = this.add.sprite(550, 600, 'sf2', 'frame_0')
            .setOrigin(0.5, 1)
            .setScale(2);

        const text = this.add.text(32, 32, 'Click to Start Animation', { color: '#00ff00' });

        let log = [];
        let u = 0;
        let ui = 0;

        sprite.on(Phaser.Animations.Events.ANIMATION_START, function (anim, frame, gameObject) {
            log.push('ANIMATION_START');
            text.setText(log);
            u = 0;
            ui = 0;
        });

        sprite.on(Phaser.Animations.Events.ANIMATION_STOP, function (anim, frame, gameObject) {
            log.push('ANIMATION_STOP');
            text.setText(log);
            u = 0;
            ui = 0;
        });

        sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, function (anim, frame, gameObject) {
            if (u === 0)
            {
                log.push('ANIMATION_UPDATE x0');
                u++;
                ui = log.length - 1;
            }
            else
            {
                log[ui] = 'ANIMATION_UPDATE x' + u.toString();
                u++;
            }
            text.setText(log);
        });

        sprite.on(Phaser.Animations.Events.ANIMATION_REPEAT, function (anim, frame, gameObject) {
            u = 0;
            log.push('ANIMATION_REPEAT');
            text.setText(log);
        });

        sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, function (anim, frame, gameObject) {
            log.push('ANIMATION_COMPLETE');
            text.setText(log);
        });

        this.input.on('pointerdown', function () {
            if (sprite.anims.isPlaying)
            {
                sprite.stop();
            }
            else
            {
                log = [];
                sprite.play('ryu');
            }
        });
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    pixelArt: true,
    scene: Example
};

const game = new Phaser.Game(config);
```

### Animation Get Progress

> アニメーションの再生進捗をプログレスバーで可視化する

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
        this.load.atlas('gems', 'assets/animations/diamond.png', 'assets/animations/diamond.json');
    }

    create ()
    {
        this.anims.create({
            key: 'diamond',
            frames: this.anims.generateFrameNames('gems', { prefix: 'diamond_', end: 15, zeroPad: 4 }),
            frameRate: 16,
            yoyo: true,
            repeat: -1,
            repeatDelay: 300
        });

        this.gem = this.add.sprite(400, 480, 'gems')
            .play('diamond').setScale(4);

        this.debug = this.add.graphics();
    }

    update ()
    {
        this.debug.clear();

        const size = 672;

        this.debug.fillStyle(0x2d2d2d);
        this.debug.fillRect(64, 64, size, 48);

        this.debug.fillStyle(0x2dff2d);
        this.debug.fillRect(64, 64, size * this.gem.anims.getProgress(), 48);
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    pixelArt: true,
    width: 800,
    height: 600,
    scene: Example
};

const game = new Phaser.Game(config);
```

## 表示制御 (Display)

### Hide On Complete

> アニメーション完了時にスプライトを自動で非表示にする

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
        this.load.spritesheet('invader', 'assets/tests/invaders/invader1.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('boom', 'assets/sprites/explosion.png', { frameWidth: 64, frameHeight: 64, endFrame: 23 });
    }

    create ()
    {
        this.add.text(400, 32, 'Click the invaders to destroy them', { color: '#00ff00' }).setOrigin(0.5, 0);

        var config1 = {
            key: 'move',
            frames: 'invader',
            frameRate: 4,
            repeat: -1
        };

        var config2 = {
            key: 'explode',
            frames: 'boom',
            hideOnComplete: true
        };

        this.anims.create(config1);
        this.anims.create(config2);

        var colors = [ 0xef658c, 0xff9a52, 0xffdf00, 0x31ef8c, 0x21dfff, 0x31aade, 0x5275de, 0x9c55ad, 0xbd208c ];

        for (var i = 0; i < 128; i++)
        {
            var x = Phaser.Math.Between(50, 750);
            var y = Phaser.Math.Between(100, 550);

            var ship = this.add.sprite(x, y, 'invader');

            ship.play('move');

            ship.setTint(Phaser.Utils.Array.GetRandom(colors));

            ship.setInteractive();

            ship.once('pointerdown', function () {

                this.clearTint();

                this.play('explode');

            });
        }
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

### Show On Start

> アニメーション再生開始時にスプライトを自動で表示する

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
        this.load.atlas('bird', 'assets/animations/bird.png', 'assets/animations/bird.json');
    }

    create ()
    {
        this.add.text(400, 32, 'Click to get the next sprite', { color: '#00ff00' }).setOrigin(0.5, 0);

        var animConfig = {
            key: 'walk',
            frames: this.anims.generateFrameNames('bird', { prefix: 'frame', end: 9 }),
            repeat: -1,
            showOnStart: true
        };

        this.anims.create(animConfig);

        //  Create a bunch of random sprites
        const rect = new Phaser.Geom.Rectangle(64, 64, 672, 472);

        const group = this.add.group();
        group.createMultiple({ key: 'bird', frame: 0, quantity: 64, visible: false, active: false });

        //  Randomly position the sprites within the rectangle
        Phaser.Actions.RandomRectangle(group.getChildren(), rect);

        this.input.on('pointerdown', function () {

            const bird = group.getFirstDead();

            if (bird)
            {
                bird.active = true;
                bird.setDepth(bird.y);

                //  As soon as we play the animation, the Sprite will be made visible
                bird.play('walk');
            }

        });
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    pixelArt: true,
    scene: Example
};

const game = new Phaser.Game(config);
```

### 60Fps Animation Test

> 60fpsのテクスチャアトラスアニメーションをタイルスプライト背景と組み合わせる

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
        this.load.atlas('walker', 'assets/animations/walker.png', 'assets/animations/walker.json');
        this.load.image('sky', 'assets/skies/ms3-sky.png');
        this.load.image('trees', 'assets/skies/ms3-trees.png');
    }

    create ()
    {
        this.bg = this.add.tileSprite(0, 38, 800, 296, 'sky').setOrigin(0, 0);
        this.trees = this.add.tileSprite(0, 280, 800, 320, 'trees').setOrigin(0, 0);

        const animConfig = {
            key: 'walk',
            frames: 'walker',
            frameRate: 60,
            repeat: -1
        };

        this.anims.create(animConfig);

        const sprite = this.add.sprite(400, 484, 'walker', 'frame_0000');

        sprite.play('walk');
    }

    update ()
    {
        this.bg.tilePositionX -= 2;
        this.trees.tilePositionX -= 6;
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    backgroundColor: '#304858',
    scene: Example
};

const game = new Phaser.Game(config);
```

## 演出 (Effects)

### Stagger Play 1

> グリッド配置したスプライト群にアニメーションを時間差で再生する

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
        this.load.spritesheet('diamonds', 'assets/sprites/diamonds32x24x5.png', { frameWidth: 32, frameHeight: 24 });
    }

    create ()
    {
        const config = {
            key: 'flash',
            frames: this.anims.generateFrameNumbers('diamonds', { start: 0, end: 4 }),
            frameRate: 1,
            repeat: -1
        };

        this.anims.create(config);

        const group = this.add.group();

        group.createMultiple({ key: 'diamonds', frame: 0, repeat: 279 });

        Phaser.Actions.GridAlign(group.getChildren(), {
            width: 20,
            height: 20,
            cellWidth: 38,
            x: 19,
            y: 25
        });

        this.anims.staggerPlay('flash', group.getChildren(), 60);
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

### Stagger Play 2

> レーザーアニメーションを時間差で再生して波状エフェクトを作る

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
        this.load.atlas('lazer', 'assets/animations/lazer/lazer.png', 'assets/animations/lazer/lazer.json');
    }

    create ()
    {
        this.anims.create({ key: 'blast', frames: this.anims.generateFrameNames('lazer', { prefix: 'lazer_', start: 0, end: 22, zeroPad: 2 }), repeat: -1 });

        var group = this.add.group();

        group.createMultiple({ key: 'lazer', frame: 'lazer_22', repeat: 39, setScale: { x: 0.25, y: 0.25 } });

        Phaser.Actions.GridAlign(group.getChildren(), {
            width: 20,
            height: 2,
            cellWidth: 32,
            cellHeight: 280,
            x: -100,
            y: -350
        });

        this.anims.staggerPlay('blast', group.getChildren(), 20);
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    pixelArt: true,
    width: 800,
    height: 600,
    scene: Example
};

const game = new Phaser.Game(config);
```

### Cubes

> 大量のキューブスプライトに時間差アニメーションとカメラTweenを組み合わせる

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
        this.load.atlas('cube', 'assets/animations/cube.png', 'assets/animations/cube.json');
    }

    create ()
    {
        this.anims.create({
            key: 'spin',
            frames: this.anims.generateFrameNames('cube', { prefix: 'frame', start: 1, end: 23 }),
            frameRate: 50,
            repeat: -1
        });

        const group = this.add.group({ key: 'cube', frame: 'frame1', repeat: 107, setScale: { x: 0.55, y: 0.55 } });

        Phaser.Actions.GridAlign(group.getChildren(), { width: 12, cellWidth: 70, cellHeight: 70, x: -20, y: 0 });

        let i = 1;
        let ci = 0;
        let colors = [ 0xef658c, 0xff9a52, 0xffdf00, 0x31ef8c, 0x21dfff, 0x31aade, 0x5275de, 0x9c55ad, 0xbd208c ];

        group.children.iterate(function (child) {

            child.tint = colors[ci];

            if (i % 12 === 0)
            {
                i = 1;
                ci++;
            }
            else
            {
                i++;
            }

        });

        this.anims.staggerPlay('spin', group.getChildren(), 0.03);

        this.cameras.main.zoom = 0.8;

        this.tweens.add({
            targets: this.cameras.main,
            props: {
                zoom: { value: 2.5, duration: 4000, ease: 'Sine.easeInOut' },
                rotation: { value: 2.3, duration: 8000, ease: 'Cubic.easeInOut' }
            },
            delay: 2000,
            yoyo: true,
            repeat: -1
        });
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

### Muybridge

> マイブリッジの連続写真風にスプライトを並べて時間差アニメーションする

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
        this.load.spritesheet('muybridge', 'assets/animations/muybridge01.png', { frameWidth: 119, frameHeight: 228 });
    }

    create ()
    {
        const config = {
            key: 'run',
            frames: 'muybridge',
            frameRate: 15,
            repeat: -1
        };

        this.anims.create(config);

        //  Each frame is 119px wide

        const group = this.add.group();

        group.createMultiple({
            key: 'muybridge',
            frame: 10,
            repeat: 7,
            setOrigin: { x: 0, y: 0.5 },
            setXY: { x: 0, y: 300, stepX: 119 }
        });

        this.anims.staggerPlay('run', group.getChildren(), -100, false);
    }
}

const config = {
    type: Phaser.WEBGL,
    parent: 'phaser-example',
    width: 952,
    height: 600,
    backgroundColor: '#efefef',
    scene: Example
};

const game = new Phaser.Game(config);
```

### Multi Atlas Animation

> マルチアトラス（複数テクスチャにまたがるアトラス）からアニメーションを作成する

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
        this.load.path = 'assets/animations/cybercity/';
        this.load.multiatlas('cybercity', 'cybercity-multi.json');
    }

    create ()
    {
        this.anims.create({ key: 'fly', frames: this.anims.generateFrameNames('cybercity', { start: 0, end: 98 }), repeat: -1 });
        this.add.sprite(400, 300).setScale(2.7).play('fly');
    }
}

const config = {
    type: Phaser.WEBGL,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    pixelArt: true,
    scene: Example
};

const game = new Phaser.Game(config);
```
