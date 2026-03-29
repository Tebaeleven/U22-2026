# Input

Phaser 3.85.0 の入力系サンプルコード集。

## Keyboard

### Cursor Keys
> カーソルキーでスプライトを移動する基本パターン

```javascript
class Example extends Phaser.Scene
{
    player;
    cursors;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('block', 'assets/sprites/block.png');
    }

    create ()
    {
        this.cursors = this.input.keyboard.createCursorKeys();

        this.player = this.physics.add.image(400, 300, 'block');

        this.player.setCollideWorldBounds(true);
    }

    update ()
    {
        this.player.setVelocity(0);

        if (this.cursors.left.isDown)
        {
            this.player.setVelocityX(-300);
        }
        else if (this.cursors.right.isDown)
        {
            this.player.setVelocityX(300);
        }

        if (this.cursors.up.isDown)
        {
            this.player.setVelocityY(-300);
        }
        else if (this.cursors.down.isDown)
        {
            this.player.setVelocityY(300);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    backgroundColor: '#0072bc',
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

### Add Key
> 特定のキーを個別に登録して検出する

```javascript
class Example extends Phaser.Scene
{
    highlight1;
    keySpace;
    key5;
    keyA;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('keyboard', 'assets/input/keyboard-opreem.png');
        this.load.image('highlight', 'assets/input/key1.png');
    }

    create ()
    {
        this.drawKeyboard();

        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);

        this.key5 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE);

        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    }

    update ()
    {

        if (this.keyA.isDown)
        {
            console.log('A');
        }

        if (this.key5.isDown)
        {
            console.log('5');
        }

        if (this.keySpace.isDown)
        {
            console.log('spacebar');
        }

    }

    drawKeyboard ()
    {
        this.add.image(0, 0, 'keyboard').setOrigin(0);

        this.highlight1 = this.add.image(108, 112, 'highlight').setOrigin(0);
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    backgroundColor: '#0072bc',
    scene: Example
};

const game = new Phaser.Game(config);
```

### Just Down
> スペースキーの「押した瞬間」だけ検出して弾を発射する

```javascript
class Example extends Phaser.Scene
{
    bullets;
    ship;
    spacebar;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('space', 'assets/tests/space/nebula.jpg');
        this.load.image('bullet', 'assets/sprites/bullets/bullet10.png');
        this.load.image('ship', 'assets/sprites/shmup-ship2.png');
    }

    create ()
    {
        class Bullet extends Phaser.GameObjects.Image
        {
            constructor (scene)
            {
                super(scene, 0, 0, 'bullet');

                this.speed = Phaser.Math.GetSpeed(600, 1);
            }

            fire (x, y)
            {
                this.setPosition(x, y);

                this.setActive(true);
                this.setVisible(true);
            }

            update (time, delta)
            {
                this.x += this.speed * delta;

                if (this.x > 820)
                {
                    this.setActive(false);
                    this.setVisible(false);
                }
            }
        }

        this.bullets = this.add.group({
            classType: Bullet,
            maxSize: 30,
            runChildUpdate: true
        });

        this.add.image(400, 300, 'space');

        this.ship = this.add.image(100, 300, 'ship').setDepth(1000);

        this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    update ()
    {
        if (Phaser.Input.Keyboard.JustDown(this.spacebar))
        {
            const bullet = this.bullets.get();

            if (bullet)
            {
                bullet.fire(this.ship.x, this.ship.y);
            }
        }
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    backgroundColor: '#000000',
    width: 800,
    height: 600,
    scene: Example
};

const game = new Phaser.Game(config);
```

### Key Modifier
> Ctrl/Alt/Shift との組み合わせを検出する

```javascript
class Example extends Phaser.Scene
{
    create ()
    {
        this.input.keyboard.on('keydown_A', event =>
        {

            if (event.ctrlKey)
            {
                console.log('A + CTRL');
            }
            else if (event.altKey)
            {
                console.log('A + ALT');
            }
            else if (event.shiftKey)
            {
                console.log('A + Shift');
            }
            else
            {
                console.log('A without modifier');
            }

        });
    }
}

const config = {
    type: Phaser.CANVAS,
    parent: 'phaser-example',
    scene: Example
};

const game = new Phaser.Game(config);
```

### Keydown
> 各種キーダウンイベントの登録方法

```javascript
class Example extends Phaser.Scene
{
    BKey;

    create ()
    {
        this.input.keyboard.on('keydown', event =>
        {

            console.dir(event);

        });

        this.input.keyboard.on('keydown-A', event =>
        {

            console.log('Hello from the A Key!');

        });

        this.input.keyboard.on('keyup-RIGHT', event =>
        {

            console.log('right up!');

        });

        this.input.keyboard.on('keyup-S', function (event)
        {

            console.log('Keyboard Events Stopped');

            this.input.keyboard.stopListeners();

        }, this);

        this.BKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    }

    update ()
    {
        if (this.BKey.isDown)
        {
            console.log('B!');
        }
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    input: {
        queue: true
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Single Keydown Event
> 特定キーのイベントリスナー登録

```javascript
class Example extends Phaser.Scene
{
    create ()
    {
        this.input.keyboard.on('keydown-A', event =>
        {
            console.log('Hello from the A Key!');
        });

        this.input.keyboard.on('keydown-SPACE', event =>
        {
            console.log('Hello from the Space Bar!');
        });

        this.input.keyboard.addCapture('SPACE');
        this.add.text(10, 10, 'Press any button and see the console', {fontSize: '20px'});
    }
}

const config = {
    type: Phaser.CANVAS,
    parent: 'phaser-example',
    scene: Example
};

const game = new Phaser.Game(config);
```

### Text Entry
> キーボード入力でテキストを入力する

```javascript
class Example extends Phaser.Scene
{
    create ()
    {
        this.add.text(10, 10, 'Enter your name:', { font: '32px Courier', fill: '#ffffff' });

        const textEntry = this.add.text(10, 50, '', { font: '32px Courier', fill: '#ffff00' });

        this.input.keyboard.on('keydown', event =>
        {
            if (event.keyCode === 8 && textEntry.text.length > 0)
            {
                textEntry.text = textEntry.text.substr(0, textEntry.text.length - 1);
            }
            else if (event.keyCode === 32 || (event.keyCode >= 48 && event.keyCode <= 90))
            {
                textEntry.text += event.key;
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

### Enter Name
> アーケード風の名前入力UI

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('block', 'assets/input/block.png');
        this.load.image('rub', 'assets/input/rub.png');
        this.load.image('end', 'assets/input/end.png');
        this.load.bitmapFont('arcade', 'assets/fonts/bitmap/arcade.png', 'assets/fonts/bitmap/arcade.xml');
    }

    create ()
    {
        const chars = [
            [ 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J' ],
            [ 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T' ],
            [ 'U', 'V', 'W', 'X', 'Y', 'Z', '.', '-', '<', '>' ]
        ];
        const cursor = { x: 0, y: 0 };
        let name = '';

        const input = this.add.bitmapText(130, 50, 'arcade', 'ABCDEFGHIJ\n\nKLMNOPQRST\n\nUVWXYZ.-').setLetterSpacing(20);

        input.setInteractive();

        const rub = this.add.image(input.x + 430, input.y + 148, 'rub');
        const end = this.add.image(input.x + 482, input.y + 148, 'end');

        const block = this.add.image(input.x - 10, input.y - 2, 'block').setOrigin(0);

        const legend = this.add.bitmapText(80, 260, 'arcade', 'RANK  SCORE   NAME').setTint(0xff00ff);

        this.add.bitmapText(80, 310, 'arcade', '1ST   50000    ').setTint(0xff0000);
        this.add.bitmapText(80, 360, 'arcade', '2ND   40000    ICE').setTint(0xff8200);
        this.add.bitmapText(80, 410, 'arcade', '3RD   30000    GOS').setTint(0xffff00);
        this.add.bitmapText(80, 460, 'arcade', '4TH   20000    HRE').setTint(0x00ff00);
        this.add.bitmapText(80, 510, 'arcade', '5TH   10000    ETE').setTint(0x00bfff);

        const playerText = this.add.bitmapText(560, 310, 'arcade', name).setTint(0xff0000);

        this.input.keyboard.on('keyup', event =>
        {
            if (event.keyCode === 37)
            {
                if (cursor.x > 0)
                {
                    cursor.x--;
                    block.x -= 52;
                }
            }
            else if (event.keyCode === 39)
            {
                if (cursor.x < 9)
                {
                    cursor.x++;
                    block.x += 52;
                }
            }
            else if (event.keyCode === 38)
            {
                if (cursor.y > 0)
                {
                    cursor.y--;
                    block.y -= 64;
                }
            }
            else if (event.keyCode === 40)
            {
                if (cursor.y < 2)
                {
                    cursor.y++;
                    block.y += 64;
                }
            }
            else if (event.keyCode === 13 || event.keyCode === 32)
            {
                if (cursor.x === 9 && cursor.y === 2 && name.length > 0)
                {
                    // Submit
                }
                else if (cursor.x === 8 && cursor.y === 2 && name.length > 0)
                {
                    name = name.substr(0, name.length - 1);
                    playerText.text = name;
                }
                else if (name.length < 3)
                {
                    name = name.concat(chars[cursor.y][cursor.x]);
                    playerText.text = name;
                }
            }
        });

        input.on('pointermove', (pointer, x, y) =>
        {
            const cx = Phaser.Math.Snap.Floor(x, 52, 0, true);
            const cy = Phaser.Math.Snap.Floor(y, 64, 0, true);
            const char = chars[cy][cx];

            cursor.x = cx;
            cursor.y = cy;

            block.x = input.x - 10 + (cx * 52);
            block.y = input.y - 2 + (cy * 64);
        }, this);

        input.on('pointerup', (pointer, x, y) =>
        {
            const cx = Phaser.Math.Snap.Floor(x, 52, 0, true);
            const cy = Phaser.Math.Snap.Floor(y, 64, 0, true);
            const char = chars[cy][cx];

            cursor.x = cx;
            cursor.y = cy;

            block.x = input.x - 10 + (cx * 52);
            block.y = input.y - 2 + (cy * 64);

            if (char === '<' && name.length > 0)
            {
                name = name.substr(0, name.length - 1);
                playerText.text = name;
            }
            else if (char === '>' && name.length > 0)
            {
                // Submit
            }
            else if (name.length < 3)
            {
                name = name.concat(char);
                playerText.text = name;
            }
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

### Global Keydown Event
> 全キーのダウンイベントを一括監視

```javascript
class Example extends Phaser.Scene
{
    create ()
    {
        this.input.keyboard.on('keydown', event =>
        {

            console.dir(event);

        });
    }
}

const config = {
    type: Phaser.CANVAS,
    parent: 'phaser-example',
    scene: Example
};

const game = new Phaser.Game(config);
```

### Create Key Combo
> 文字列のキーコンボを検出する

```javascript
class Example extends Phaser.Scene
{
    create ()
    {
        const combo = this.input.keyboard.createCombo('ABCD');

        this.input.keyboard.on('keycombomatch', event =>
        {

            console.log('Key Combo matched!');

        });
    }
}

const config = {
    type: Phaser.CANVAS,
    parent: 'phaser-example',
    scene: Example
};

const game = new Phaser.Game(config);
```

### Konami Code Key Combo
> コナミコマンドの入力検出

```javascript
class Example extends Phaser.Scene
{
    create ()
    {
        const combo = this.input.keyboard.createCombo([ 38, 38, 38, 40, 40, 40, 37, 37, 37, 39, 39, 39 ], { resetOnMatch: true });

        this.input.keyboard.on('keycombomatch', event =>
        {

            console.log('Konami Code entered!');

        });
    }
}

const config = {
    type: Phaser.CANVAS,
    parent: 'phaser-example',
    scene: Example
};

const game = new Phaser.Game(config);
```

### Key Down Duration
> キーの押下時間を取得する

```javascript
class Example extends Phaser.Scene
{
    text;
    key;

    create ()
    {
        this.key = this.input.keyboard.addKey('A');

        this.add.text(10, 10, 'Hold down the A Key', { font: '16px Courier', fill: '#00ff00' });

        this.text = this.add.text(10, 30, '', { font: '16px Courier', fill: '#00ff00' });
    }

    update ()
    {
        this.text.setText(`Duration: ${this.key.getDuration()}ms`);
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

---

## Mouse

### Click Sprite
> スプライトのクリック検出とティント変更

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('eye', 'assets/pics/lance-overdose-loader-eye.png');
    }

    create ()
    {
        const sprite = this.add.sprite(400, 300, 'eye').setInteractive();

        sprite.on('pointerdown', function (pointer)
        {
            this.setTint(0xff0000);
        });

        sprite.on('pointerout', function (pointer)
        {
            this.clearTint();
        });

        sprite.on('pointerup', function (pointer)
        {
            this.clearTint();
        });
    }
}

const config = {
    type: Phaser.WEBGL,
    parent: 'phaser-example',
    scene: Example
};

const game = new Phaser.Game(config);
```

### Mouse Down
> クリック位置に画像を配置する

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');

        this.load.image('logo', 'assets/sprites/phaser.png');

    }

    create ()
    {

        this.input.on('pointerdown', function (pointer)
        {

            console.log('down');

            this.add.image(pointer.x, pointer.y, 'logo');

        }, this);

    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    scene: Example
};

const game = new Phaser.Game(config);
```

### Mouse Wheel
> マウスホイールでタイルスプライトをスクロールする

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('soil', 'assets/textures/soil.png');
    }

    create ()
    {
        const soil = this.add.tileSprite(400, 300, 800, 600, 'soil');

        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) =>
        {

            soil.tilePositionX += deltaX * 0.5;
            soil.tilePositionY += deltaY * 0.5;

        });

        this.add.text(10, 10, 'Scroll your mouse-wheel', { font: '16px Courier', fill: '#00ff00' });
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

### Move Event
> マウス移動位置にスプライトを配置する

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.spritesheet('balls', 'assets/sprites/balls.png', { frameWidth: 17, frameHeight: 17 });
    }

    create ()
    {
        this.input.on('pointermove', function (pointer)
        {

            this.add.image(pointer.x, pointer.y, 'balls', Phaser.Math.Between(0, 5));

        }, this);
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

### Over And Out Events
> マウスオーバー/アウトでティント変更

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('eye', 'assets/pics/lance-overdose-loader-eye.png');
    }

    create ()
    {
        const sprite = this.add.sprite(400, 300, 'eye').setInteractive();

        sprite.on('pointerover', function (event)
        {
            this.setTint(0xff0000);
        });

        sprite.on('pointerout', function (event)
        {
            this.clearTint();
        });
    }
}

const config = {
    type: Phaser.WEBGL,
    parent: 'phaser-example',
    scene: Example
};

const game = new Phaser.Game(config);
```

### Pointer Lock
> ポインターロックでFPS風のマウス操作

```javascript
class Example extends Phaser.Scene
{
    lockText;
    sprite;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('ship', 'assets/sprites/ship.png');
    }

    create ()
    {
        this.sprite = this.add.sprite(400, 300, 'ship');

        this.input.on('pointerdown', function (pointer)
        {
            this.input.mouse.requestPointerLock();
        }, this);

        this.input.on('pointermove', function (pointer)
        {
            if (this.input.mouse.locked)
            {
                this.sprite.x += pointer.movementX;
                this.sprite.y += pointer.movementY;

                this.sprite.x = Phaser.Math.Wrap(this.sprite.x, 0, game.renderer.width);
                this.sprite.y = Phaser.Math.Wrap(this.sprite.y, 0, game.renderer.height);

                if (pointer.movementX > 0) { this.sprite.setRotation(0.1); }
                else if (pointer.movementX < 0) { this.sprite.setRotation(-0.1); }
                else { this.sprite.setRotation(0); }

                this.updateLockText(true);
            }
        }, this);

        this.input.keyboard.on('keydown-Q', function (event)
        {
            if (this.input.mouse.locked)
            {
                this.input.mouse.releasePointerLock();
            }
        }, this);

        this.input.manager.events.on('pointerlockchange', event =>
        {
            this.updateLockText(event.isPointerLocked, this.sprite.x, this.sprite.y);
        });

        this.lockText = this.add.text(16, 16, '', {
            fontSize: '20px',
            fill: '#ffffff'
        });

        this.updateLockText(false);
    }

    updateLockText (isLocked)
    {
        this.lockText.setText([
            isLocked ? 'The pointer is now locked!' : 'The pointer is now unlocked.',
            `Sprite is at: (${this.sprite.x},${this.sprite.y})`,
            'Press Q to release pointer lock.'
        ]);
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

### Right Mouse Button
> 右クリックの検出とコンテキストメニュー無効化

```javascript
class Example extends Phaser.Scene
{
    text;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('logo', 'assets/sprites/phaser.png');
        this.load.image('asuna', 'assets/sprites/asuna_by_vali233.png');
        this.load.image('disk', 'assets/sprites/oz_pov_melting_disk.png');
        this.load.image('tree', 'assets/sprites/palm-tree-left.png');
    }

    create ()
    {
        this.text = this.add.text(10, 10, '', { fill: '#00ff00' }).setDepth(1);

        this.input.mouse.disableContextMenu();

        this.input.on('pointerdown', function (pointer)
        {

            if (pointer.rightButtonDown())
            {
                if (pointer.getDuration() > 500)
                {
                    this.add.image(pointer.x, pointer.y, 'disk');
                }
                else
                {
                    this.add.image(pointer.x, pointer.y, 'asuna');
                }
            }
            else
            if (pointer.getDuration() > 500)
            {
                this.add.image(pointer.x, pointer.y, 'tree');
            }
            else
            {
                this.add.image(pointer.x, pointer.y, 'logo');
            }

        }, this);
    }

    update ()
    {
        const pointer = this.input.activePointer;

        this.text.setText([
            `x: ${pointer.worldX}`,
            `y: ${pointer.worldY}`,
            `isDown: ${pointer.isDown}`,
            `rightButtonDown: ${pointer.rightButtonDown()}`
        ]);
    }
}

const config = {
    width: 800,
    height: 600,
    type: Phaser.AUTO,
    parent: 'phaser-example',
    scene: Example
};

const game = new Phaser.Game(config);
```

### Single Sprite
> スプライトのインタラクティブ設定と回転

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

### Top Only
> 最前面のスプライトのみイベントを受け取る

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('eye', 'assets/pics/lance-overdose-loader-eye.png');
    }

    create ()
    {
        const sprite1 = this.add.sprite(400, 300, 'eye').setInteractive();
        const sprite2 = this.add.sprite(450, 350, 'eye').setInteractive();

        sprite1.name = 'bob';
        sprite2.name = 'ben';

        this.input.topOnly = true;

        this.input.on('gameobjectover', (pointer, gameObject) =>
        {
            gameObject.setTint(0x00ff00);
        });

        this.input.on('gameobjectout', (pointer, gameObject) =>
        {
            if (gameObject.input.isDown)
            {
                gameObject.setTint(0xff0000);
            }
            else
            {
                gameObject.clearTint();
            }
        });

        this.input.on('gameobjectdown', (pointer, gameObject) =>
        {
            gameObject.setTint(0xff0000);
        });

        this.input.on('gameobjectup', (pointer, gameObject) =>
        {
            if (gameObject.input.isOver)
            {
                gameObject.setTint(0x00ff00);
            }
            else
            {
                gameObject.clearTint();
            }
        });
    }
}

const config = {
    type: Phaser.WEBGL,
    parent: 'phaser-example',
    scene: Example
};

const game = new Phaser.Game(config);
```

---

## Dragging

### Enable For Drag
> スプライトのドラッグを有効にする基本パターン

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('bg', 'assets/skies/gradient29.png');
        this.load.image('char', 'assets/pics/nayuki.png');
    }

    create ()
    {
        this.add.image(400, 300, 'bg');

        this.add.text(16, 16, 'Drag the Sprite').setFontSize(24).setShadow(1, 1);

        const sprite = this.add.sprite(400, 300, 'char');

        sprite.setInteractive({ draggable: true });

        sprite.on('drag', (pointer, dragX, dragY) => sprite.setPosition(dragX, dragY));
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

### Drag Horizontally
> 水平方向のみにドラッグを制限する

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('bg', 'assets/skies/gradient8.png');
        this.load.atlas('blocks', 'assets/sprites/blocks.png', 'assets/sprites/blocks.json');
    }

    create ()
    {
        this.add.image(400, 300, 'bg');

        this.add.text(16, 16, 'Drag the Sprites horizontally').setFontSize(24).setShadow(1, 1);

        const block1 = this.add.sprite(400, 150, 'blocks', 'metal');
        const block2 = this.add.sprite(400, 300, 'blocks', 'platform');
        const block3 = this.add.sprite(400, 450, 'blocks', 'wooden');

        block1.setInteractive({ draggable: true });
        block2.setInteractive({ draggable: true });
        block3.setInteractive({ draggable: true });

        this.input.on('drag', (pointer, gameObject, dragX) => {

            dragX = Phaser.Math.Clamp(dragX, 100, 700);

            gameObject.x = dragX;

        });
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

### Drag Vertically
> 垂直方向のみにドラッグを制限する

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('bg', 'assets/skies/gradient8.png');
        this.load.atlas('blocks', 'assets/sprites/blocks.png', 'assets/sprites/blocks.json');
    }

    create ()
    {
        this.add.image(400, 300, 'bg');

        this.add.text(16, 16, 'Drag the Sprites vertically').setFontSize(24).setShadow(1, 1);

        const block1 = this.add.sprite(200, 300, 'blocks', 'redmonster');
        const block2 = this.add.sprite(400, 300, 'blocks', 'bomb');
        const block3 = this.add.sprite(600, 300, 'blocks', 'tallspikes');

        block1.setInteractive({ draggable: true });
        block2.setInteractive({ draggable: true });
        block3.setInteractive({ draggable: true });

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {

            dragY = Phaser.Math.Clamp(dragY, 100, 500);

            gameObject.y = dragY;

        });
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

### Snap To Grid On Drag
> ドラッグ時にグリッドにスナップする

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('bg', 'assets/skies/deepblue.png');
        this.load.image('target', 'assets/sprites/brush1.png');
        this.load.spritesheet('blocks', 'assets/sprites/heartstar.png', { frameWidth: 64, frameHeight: 64 });
    }

    create ()
    {
        this.add.image(400, 300, 'bg');

        this.add.text(16, 16, 'Snap to Grid on Drag').setFontSize(24).setShadow(1, 1);

        this.add.image(640, 192, 'target').setOrigin(0, 0);
        this.add.image(640, 320, 'target').setOrigin(0, 0);
        this.add.image(640, 448, 'target').setOrigin(0, 0);

        const block1 = this.add.sprite(64, 192, 'blocks', 1).setOrigin(0, 0);
        const block2 = this.add.sprite(64, 320, 'blocks', 1).setOrigin(0, 0);
        const block3 = this.add.sprite(64, 448, 'blocks', 1).setOrigin(0, 0);

        block1.setInteractive({ draggable: true });
        block2.setInteractive({ draggable: true });
        block3.setInteractive({ draggable: true });

        let over1 = false;
        let over2 = false;
        let over3 = false;

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {

            dragX = Phaser.Math.Snap.To(dragX, 64);
            dragY = Phaser.Math.Snap.To(dragY, 64);

            gameObject.setPosition(dragX, dragY);

        });

        this.input.on('dragend', (pointer, gameObject) => {

            const x = gameObject.x;
            const y = gameObject.y;

            if (x === 640 && y === 192 && !over1)
            {
                over1 = true;
                gameObject.setFrame(0);
                gameObject.disableInteractive();
            }
            else if (x === 640 && y === 320 && !over2)
            {
                over2 = true;
                gameObject.setFrame(0);
                gameObject.disableInteractive();
            }
            else if (x === 640 && y === 448 && !over3)
            {
                over3 = true;
                gameObject.setFrame(0);
                gameObject.disableInteractive();
            }

        });
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

### Bring Dragged Item To Top
> ドラッグ開始時にオブジェクトを最前面に移動する

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('bg', 'assets/skies/casinotable.png');
        this.load.atlas('cards', 'assets/atlas/cards.png', 'assets/atlas/cards.json');
    }

    create ()
    {
        this.add.image(400, 300, 'bg');

        this.add.text(16, 16, 'Bring to Top on Drag').setFontSize(24).setShadow(1, 1);

        const frames = this.textures.get('cards').getFrameNames();

        Phaser.Utils.Array.Shuffle(frames);

        let x = 140;
        let y = 180;

        for (let i = 0; i < 22; i++)
        {
            const image = this.add.image(x, y, 'cards', frames[i]);

            image.setInteractive({ draggable: true });

            x += 14;
            y += 12;
        }

        this.input.on('dragstart', function (pointer, gameObject) {

            this.children.bringToTop(gameObject);

        }, this);

        this.input.on('drag', function (pointer, gameObject, dragX, dragY) {

            gameObject.x = dragX;
            gameObject.y = dragY;

        });
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

### Multiple Draggables
> 複数オブジェクトの同時ドラッグ（topOnly: false）

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.atlas('cards', 'assets/atlas/cards.png', 'assets/atlas/cards.json');
    }

    create ()
    {
        const frames = this.textures.get('cards').getFrameNames();

        let x = 100;
        let y = 100;

        for (let i = 0; i < 64; i++)
        {
            const image = this.add.image(x, y, 'cards', Phaser.Math.RND.pick(frames)).setInteractive();

            this.input.setDraggable(image);

            x += 4;
            y += 4;
        }

        this.input.topOnly = false;

        this.input.on('drag', (pointer, gameObject, dragX, dragY) =>
        {

            gameObject.x = dragX;
            gameObject.y = dragY;

        });

    }
}

const config = {
    type: Phaser.WEBGL,
    parent: 'phaser-example',
    width: 1024,
    height: 600,
    scene: Example
};

const game = new Phaser.Game(config);
```

### Stack Of Cards
> カードの山をドラッグで並べ替える

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.atlas('cards', 'assets/atlas/cards.png', 'assets/atlas/cards.json');
    }

    create ()
    {
        const frames = this.textures.get('cards').getFrameNames();

        let x = 100;
        let y = 100;

        for (let i = 0; i < 64; i++)
        {
            const image = this.add.image(x, y, 'cards', Phaser.Math.RND.pick(frames)).setInteractive();

            this.input.setDraggable(image);

            x += 4;
            y += 4;
        }

        this.input.on('dragstart', function (pointer, gameObject)
        {

            this.children.bringToTop(gameObject);

        }, this);

        this.input.on('drag', (pointer, gameObject, dragX, dragY) =>
        {

            gameObject.x = dragX;
            gameObject.y = dragY;

        });

    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 1024,
    height: 600,
    scene: Example
};

const game = new Phaser.Game(config);
```

### Drag Container
> コンテナごとドラッグする

```javascript
class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('bg', 'assets/skies/gradient13.png');
        this.load.atlas('rocket', 'assets/animations/rocket.png', 'assets/animations/rocket.json');
    }

    create ()
    {
        this.add.image(400, 300, 'bg');
        this.add.text(16, 16, 'Drag the Rocket').setFontSize(24).setShadow(1, 1);

        this.anims.create({ key: 'trail', frames: this.anims.generateFrameNames('rocket', { prefix: 'trail_', start: 0, end: 12, zeroPad: 2 }), repeat: -1 });

        const container = this.add.container(400, 300);

        container.setSize(120, 80);
        container.setInteractive({ draggable: true });

        const trail = this.add.sprite(-125, 0).play('trail');
        const rocket = this.add.sprite(0, 0, 'rocket', 'rocket');

        container.add([ trail, rocket ]);

        container.on('drag', (pointer, dragX, dragY) => container.setPosition(dragX, dragY));
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

---

## Gamepad

### Move Sprite
> ゲームパッドのD-Padでスプライトを移動する

```javascript
class Example extends Phaser.Scene
{
    sprites = [];

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('sky', 'assets/skies/lightblue.png');
        this.load.image('elephant', 'assets/sprites/elephant.png');
    }

    create ()
    {
        this.add.image(0, 0, 'sky').setOrigin(0);

        let text;

        if (this.input.gamepad.total === 0)
        {
            text = this.add.text(10, 10, 'Press any button on a connected Gamepad', { font: '16px Courier', fill: '#00ff00' });

            this.input.gamepad.once('connected', function (pad)
            {

                console.log('connected', pad.id);

                for (let i = 0; i < this.input.gamepad.total; i++)
                {
                    this.sprites.push(this.add.sprite(Phaser.Math.Between(200, 600), Phaser.Math.Between(100, 500), 'elephant'));
                }

                text.destroy();

            }, this);
        }
        else
        {
            for (let i = 0; i < this.input.gamepad.total; i++)
            {
                this.sprites.push(this.add.sprite(Phaser.Math.Between(200, 600), Phaser.Math.Between(100, 500), 'elephant'));
            }
        }
    }

    update ()
    {
        const pads = this.input.gamepad.gamepads;

        for (let i = 0; i < pads.length; i++)
        {
            const gamepad = pads[i];

            if (!gamepad)
            {
                continue;
            }

            const sprite = this.sprites[i];

            if (gamepad.left)
            {
                sprite.x -= 4;
                sprite.flipX = false;
            }
            else if (gamepad.right)
            {
                sprite.x += 4;
                sprite.flipX = true;
            }

            if (gamepad.up)
            {
                sprite.y -= 4;
            }
            else if (gamepad.down)
            {
                sprite.y += 4;
            }
        }
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    input: {
        gamepad: true
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Axes
> ゲームパッドのアナログスティックでスプライトを移動する

```javascript
class Example extends Phaser.Scene
{
    sprite;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('sky', 'assets/skies/lightblue.png');
        this.load.image('elephant', 'assets/sprites/elephant.png');
    }

    create ()
    {
        this.add.image(0, 0, 'sky').setOrigin(0);

        this.sprite = this.add.sprite(400, 300, 'elephant');
    }

    update ()
    {
        if (this.input.gamepad.total === 0)
        {
            return;
        }

        const pad = this.input.gamepad.getPad(0);

        if (pad.axes.length)
        {
            const axisH = pad.axes[0].getValue();
            const axisV = pad.axes[1].getValue();

            this.sprite.x += 4 * axisH;
            this.sprite.y += 4 * axisV;

            this.sprite.flipX = (axisH > 0);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    input: {
        gamepad: true
    },
    scene: Example
};

const game = new Phaser.Game(config);
```
