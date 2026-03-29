# Tilemap Collision

Phaser 3.85.0 のタイルマップ衝突判定サンプルコード集。

## Arcade Physics

### Csv Map

> CSVタイルマップとArcade Physicsによる衝突判定。キャラクターの4方向移動、カメラ追従、デバッグ表示の切り替え。

```javascript
class Example extends Phaser.Scene
{
    showDebug = false;
    player;
    helpText;
    debugGraphics;
    cursors;
    map;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('tiles', 'assets/tilemaps/tiles/catastrophi_tiles_16.png');
        this.load.tilemapCSV('map', 'assets/tilemaps/csv/catastrophi_level2.csv');
        this.load.spritesheet('player', 'assets/sprites/spaceman.png', { frameWidth: 16, frameHeight: 16 });
    }

    create ()
    {
        this.map = this.make.tilemap({ key: 'map', tileWidth: 16, tileHeight: 16 });
        const tileset = this.map.addTilesetImage('tiles');
        const layer = this.map.createLayer(0, tileset, 0, 0);

        this.map.setCollisionBetween(54, 83);

        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('player', { start: 8, end: 9 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('player', { start: 1, end: 2 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'up',
            frames: this.anims.generateFrameNumbers('player', { start: 11, end: 13 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'down',
            frames: this.anims.generateFrameNumbers('player', { start: 4, end: 6 }),
            frameRate: 10,
            repeat: -1
        });

        this.player = this.physics.add.sprite(50, 100, 'player', 1);

        this.physics.add.collider(this.player, layer);

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player);

        this.debugGraphics = this.add.graphics();

        this.input.keyboard.on('keydown-C', event =>
        {
            this.showDebug = !this.showDebug;
            this.drawDebug();
        });

        this.cursors = this.input.keyboard.createCursorKeys();

        this.helpText = this.add.text(16, 16, this.getHelpMessage(), {
            fontSize: '18px',
            fill: '#ffffff'
        });

        this.helpText.setScrollFactor(0);
    }

    update (time, delta)
    {
        this.player.body.setVelocity(0);

        if (this.cursors.left.isDown)
        {
            this.player.body.setVelocityX(-100);
        }
        else if (this.cursors.right.isDown)
        {
            this.player.body.setVelocityX(100);
        }

        if (this.cursors.up.isDown)
        {
            this.player.body.setVelocityY(-100);
        }
        else if (this.cursors.down.isDown)
        {
            this.player.body.setVelocityY(100);
        }

        if (this.cursors.left.isDown)
        {
            this.player.anims.play('left', true);
        }
        else if (this.cursors.right.isDown)
        {
            this.player.anims.play('right', true);
        }
        else if (this.cursors.up.isDown)
        {
            this.player.anims.play('up', true);
        }
        else if (this.cursors.down.isDown)
        {
            this.player.anims.play('down', true);
        }
        else
        {
            this.player.anims.stop();
        }
    }

    drawDebug ()
    {
        this.debugGraphics.clear();

        if (this.showDebug)
        {
            this.map.renderDebug(this.debugGraphics, {
                tileColor: null,
                collidingTileColor: new Phaser.Display.Color(243, 134, 48, 200),
                faceColor: new Phaser.Display.Color(40, 39, 37, 255)
            });
        }

        this.helpText.setText(this.getHelpMessage());
    }

    getHelpMessage ()
    {
        return `Arrow keys to move.\nPress "C" to toggle debug visuals: ${this.showDebug ? 'on' : 'off'}`;
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#2d2d2d',
    parent: 'phaser-example',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Custom Collide Call

> カスタム衝突判定コールバックの使用。タイルマップのピックアップアイテム収集と衝突状態のリアルタイム表示。

```javascript
class Example extends Phaser.Scene
{
    cursors;
    pickups;
    player;
    layer;
    tileset;
    map;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('tiles', 'assets/tilemaps/tiles/gridtiles.png');
        this.load.tilemapTiledJSON('map', 'assets/tilemaps/maps/simple-map.json');
        this.load.image('player', 'assets/sprites/phaser-dude.png');
    }

    create ()
    {
        this.map = this.make.tilemap({ key: 'map', tileWidth: 32, tileHeight: 32 });
        this.tileset = this.map.addTilesetImage('tiles');
        this.layer = this.map.createLayer('Level1', this.tileset);

        this.map.setCollision([ 20, 48 ]);

        this.pickups = this.map.filterTiles(tile => tile.index === 82);

        this.player = this.add.rectangle(96, 96, 24, 38, 0xffff00);

        this.physics.add.existing(this.player);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.cursors.up.on('down', () =>
        {
            if (this.player.body.blocked.down)
            {
                this.player.body.setVelocityY(-360);
            }
        }, this);

        this.info = this.add.text(10, 10, 'Player');
    }

    update ()
    {
        this.player.body.setVelocityX(0);

        if (this.cursors.left.isDown)
        {
            this.player.body.setVelocityX(-200);
        }
        else if (this.cursors.right.isDown)
        {
            this.player.body.setVelocityX(200);
        }

        this.physics.collide(this.player, this.layer);

        this.physics.world.overlapTiles(this.player, this.pickups, this.hitPickup, null, this);

        const blocked = this.player.body.blocked;

        this.info.setText(`left: ${blocked.left} right: ${blocked.right} down: ${blocked.down}`);
    }

    hitPickup (player, tile)
    {
        this.map.removeTile(tile, 29, false);

        this.pickups = this.map.filterTiles(tile => tile.index === 82);
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
            gravity: { y: 600 }
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Multiple Tile Sizes

> 異なるサイズのタイル（32x32、64x64、32x64）を持つ複数レイヤーでの衝突判定。各レイヤーごとにデバッグ色を変えて表示。

```javascript
class Example extends Phaser.Scene
{
    showDebug;
    player;
    debugGraphics;
    cursors;
    text;
    kenny64x64Layer;
    ground32x32Layer;
    tree32x64Layer;
    map;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.tilemapTiledJSON('map', 'assets/tilemaps/maps/multiple-tile-sizes-collision.json');
        this.load.image('ground_1x1', 'assets/tilemaps/tiles/ground_1x1.png');
        this.load.image('walls_1x2', 'assets/tilemaps/tiles/walls_1x2.png');
        this.load.image('kenny_platformer_64x64', 'assets/tilemaps/tiles/kenny_platformer_64x64.png');
        this.load.image('dangerous-kiss', 'assets/tilemaps/tiles/dangerous-kiss.png');
        this.load.image('player', 'assets/sprites/phaser-dude.png');
    }

    create ()
    {
        this.map = this.add.tilemap('map');
        const groundTiles = this.map.addTilesetImage('ground_1x1', 'ground_1x1', 32, 32);
        const kennyTiles = this.map.addTilesetImage('kenny_platformer_64x64', 'kenny_platformer_64x64', 64, 64);
        const treeTiles = this.map.addTilesetImage('walls_1x2', 'walls_1x2', 32, 64);

        this.kenny64x64Layer = this.map.createLayer('Kenny 64x64 Layer', kennyTiles);
        this.ground32x32Layer = this.map.createLayer('Ground 32x32 Layer', groundTiles);
        this.tree32x64Layer = this.map.createLayer('Tree 32x64 Layer', treeTiles);

        this.ground32x32Layer.setCollisionByExclusion([ -1 ]);
        this.tree32x64Layer.setCollisionByExclusion([ -1 ]);
        this.kenny64x64Layer.setCollision([ 73 ]);

        this.player = this.physics.add.sprite(700, 100, 'player').setBounce(0.1);

        this.physics.add.collider(this.player, this.tree32x64Layer);
        this.physics.add.collider(this.player, this.ground32x32Layer);
        this.physics.add.collider(this.player, this.kenny64x64Layer);

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player);

        this.debugGraphics = this.add.graphics();
        this.input.keyboard.on('keydown-C', event => { this.showDebug = !this.showDebug; this.drawDebug(); });
        this.cursors = this.input.keyboard.createCursorKeys();
        this.text = this.add.text(16, 16, '', { fontSize: '20px', fill: '#ffffff' });
        this.text.setScrollFactor(0);
        this.updateText();
    }

    update (time, delta)
    {
        this.player.body.setVelocityX(0);
        if (this.cursors.left.isDown) { this.player.body.setVelocityX(-200); }
        else if (this.cursors.right.isDown) { this.player.body.setVelocityX(200); }
        if ((this.cursors.space.isDown || this.cursors.up.isDown) && this.player.body.onFloor()) { this.player.body.setVelocityY(-300); }
    }

    drawDebug ()
    {
        this.debugGraphics.clear();
        if (this.showDebug) {
            this.ground32x32Layer.renderDebug(this.debugGraphics, { tileColor: null, collidingTileColor: new Phaser.Display.Color(211, 36, 255, 100), faceColor: new Phaser.Display.Color(211, 36, 255, 255) });
            this.kenny64x64Layer.renderDebug(this.debugGraphics, { tileColor: null, collidingTileColor: new Phaser.Display.Color(244, 255, 36, 100), faceColor: new Phaser.Display.Color(244, 255, 36, 255) });
            this.tree32x64Layer.renderDebug(this.debugGraphics, { tileColor: null, collidingTileColor: new Phaser.Display.Color(36, 255, 237, 100), faceColor: new Phaser.Display.Color(36, 255, 237, 255) });
        }
        this.updateText();
    }

    updateText () { this.text.setText(`Arrow keys to move. Space to jump\nPress "C" to toggle debug visuals: ${this.showDebug ? 'on' : 'off'}`); }
}

const config = {
    type: Phaser.AUTO, width: 800, height: 576, backgroundColor: '#00000', parent: 'phaser-example',
    physics: { default: 'arcade', arcade: { gravity: { y: 400 }, debug: true } },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Simple Map

> シンプルなタイルマップでのArcade Physics衝突判定。プラットフォーマー操作とピックアップアイテムの収集。

```javascript
class Example extends Phaser.Scene
{
    cursors;
    pickups;
    player;
    layer;
    tileset;
    map;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('tiles', 'assets/tilemaps/tiles/gridtiles.png');
        this.load.tilemapTiledJSON('map', 'assets/tilemaps/maps/simple-map.json');
        this.load.image('player', 'assets/sprites/phaser-dude.png');
    }

    create ()
    {
        this.map = this.make.tilemap({ key: 'map', tileWidth: 32, tileHeight: 32 });
        this.tileset = this.map.addTilesetImage('tiles');
        this.layer = this.map.createLayer('Level1', this.tileset);

        this.map.setCollision([ 20, 48 ]);

        this.pickups = this.map.filterTiles(tile => tile.index === 82);

        this.player = this.add.rectangle(96, 96, 24, 38, 0xffff00);

        this.physics.add.existing(this.player);

        this.physics.add.collider(this.player, this.layer);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.cursors.up.on('down', () =>
        {
            if (this.player.body.blocked.down)
            {
                this.player.body.setVelocityY(-360);
            }
        }, this);
    }

    update ()
    {
        this.player.body.setVelocityX(0);

        if (this.cursors.left.isDown)
        {
            this.player.body.setVelocityX(-200);
        }
        else if (this.cursors.right.isDown)
        {
            this.player.body.setVelocityX(200);
        }

        this.physics.world.overlapTiles(this.player, this.pickups, this.hitPickup, null, this);
    }

    hitPickup (player, tile)
    {
        this.map.removeTile(tile, 29, false);

        this.pickups = this.map.filterTiles(tile => tile.index === 82);
    }
}

const config = {
    type: Phaser.AUTO, width: 800, height: 600, parent: 'phaser-example',
    physics: { default: 'arcade', arcade: { gravity: { y: 600 } } },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Tile Callbacks

> タイルコールバックを使ったコイン収集と隠し扉の実装。setTileIndexCallbackとsetTileLocationCallbackの使用例。

```javascript
class Example extends Phaser.Scene
{
    coinsCollected = 0;
    coinLayer;
    groundLayer;
    showDebug = false;
    player;
    text;
    debugGraphics;
    cursors;
    map;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('ground_1x1', 'assets/tilemaps/tiles/ground_1x1.png');
        this.load.spritesheet('coin', 'assets/sprites/coin.png', { frameWidth: 32, frameHeight: 32 });
        this.load.tilemapTiledJSON('map', 'assets/tilemaps/maps/tile-collision-test.json');
        this.load.image('player', 'assets/sprites/phaser-dude.png');
    }

    create ()
    {
        this.map = this.make.tilemap({ key: 'map' });
        const groundTiles = this.map.addTilesetImage('ground_1x1');
        const coinTiles = this.map.addTilesetImage('coin');

        this.map.createLayer('Background Layer', groundTiles, 0, 0);
        this.groundLayer = this.map.createLayer('Ground Layer', groundTiles, 0, 0);
        this.coinLayer = this.map.createLayer('Coin Layer', coinTiles, 0, 0);

        this.groundLayer.setCollisionBetween(1, 25);

        this.coinLayer.setTileIndexCallback(26, this.hitCoin, this);

        this.groundLayer.setTileLocationCallback(2, 0, 1, 1, this.hitSecretDoor, this);

        this.player = this.physics.add.sprite(80, 70, 'player').setBounce(0.1);

        this.physics.add.collider(this.player, this.groundLayer);
        this.physics.add.overlap(this.player, this.coinLayer);

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player);

        this.debugGraphics = this.add.graphics();
        this.input.keyboard.on('keydown-C', event => { this.showDebug = !this.showDebug; this.drawDebug(); });
        this.cursors = this.input.keyboard.createCursorKeys();
        this.text = this.add.text(16, 16, '', { fontSize: '20px', fill: '#ffffff' });
        this.text.setScrollFactor(0);
        this.updateText();
    }

    update (time, delta)
    {
        this.player.body.setVelocityX(0);
        if (this.cursors.left.isDown) { this.player.body.setVelocityX(-200); }
        else if (this.cursors.right.isDown) { this.player.body.setVelocityX(200); }
        if ((this.cursors.space.isDown || this.cursors.up.isDown) && this.player.body.onFloor()) { this.player.body.setVelocityY(-300); }
    }

    hitCoin (sprite, tile)
    {
        this.coinLayer.removeTileAt(tile.x, tile.y);
        this.coinsCollected += 1;
        this.updateText();
        return false;
    }

    hitSecretDoor (sprite, tile)
    {
        tile.alpha = 0.25;
        return true;
    }

    drawDebug ()
    {
        this.debugGraphics.clear();
        if (this.showDebug) {
            this.groundLayer.renderDebug(this.debugGraphics, {
                tileColor: null,
                collidingTileColor: new Phaser.Display.Color(243, 134, 48, 200),
                faceColor: new Phaser.Display.Color(40, 39, 37, 255)
            });
        }
        this.updateText();
    }

    updateText ()
    {
        this.text.setText(`Arrow keys to move. Space to jump\nPress "C" to toggle debug visuals: ${this.showDebug ? 'on' : 'off'}\nCoins collected: ${this.coinsCollected}`);
    }
}

const config = {
    type: Phaser.WEBGL, width: 800, height: 576, backgroundColor: '#2d2d2d', parent: 'phaser-example', pixelArt: true,
    physics: { default: 'arcade', arcade: { gravity: { y: 300 } } },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Tilemap Spotlight

> RenderTextureを使ったスポットライト効果。プレイヤーの周囲のみ明るく表示し、残りを暗くするマスク処理。

```javascript
class Example extends Phaser.Scene
{
    constructor ()
    {
        super('example');
    }

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('ground_1x1', 'assets/tilemaps/tiles/ground_1x1.png');
        this.load.spritesheet('coin', 'assets/sprites/coin.png', { frameWidth: 32, frameHeight: 32 });
        this.load.tilemapTiledJSON('map', 'assets/tilemaps/maps/tile-collision-test.json');
        this.load.image('player', 'assets/sprites/phaser-dude.png');
        this.load.image('mask', 'assets/sprites/mask1.png');
    }

    create ()
    {
        const map = this.make.tilemap({ key: 'map' });

        const groundTiles = map.addTilesetImage('ground_1x1');
        const coinTiles = map.addTilesetImage('coin');

        const backgroundLayer = map.createLayer('Background Layer', groundTiles, 0, 0);
        const groundLayer = map.createLayer('Ground Layer', groundTiles, 0, 0);
        const coinLayer = map.createLayer('Coin Layer').setVisible(false);

        this.rt = this.add.renderTexture(0, 0, this.scale.width, this.scale.height);
        this.rt.setOrigin(0, 0);
        this.rt.setScrollFactor(0, 0);

        const coins = [];

        coinLayer.forEachTile(tile => {
            if (tile.index === 26) {
                const coin = this.physics.add.image(tile.pixelX + 16, tile.pixelY + 16, 'coin');
                coin.body.allowGravity = false;
                coins.push(coin);
            }
        });

        groundLayer.setCollisionBetween(1, 25);

        this.player = this.physics.add.sprite(80, 70, 'player').setBounce(0.1);

        this.physics.add.collider(this.player, groundLayer);
        this.physics.add.overlap(this.player, coins, (p, c) => { c.visible = false; });

        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player);

        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update ()
    {
        this.player.body.setVelocityX(0);

        if (this.cursors.left.isDown) { this.player.body.setVelocityX(-200); }
        else if (this.cursors.right.isDown) { this.player.body.setVelocityX(200); }

        if ((this.cursors.space.isDown || this.cursors.up.isDown) && this.player.body.onFloor()) { this.player.body.setVelocityY(-300); }

        const cam = this.cameras.main;

        this.rt.clear();
        this.rt.fill(0x000000);
        this.rt.erase('mask', (this.player.x - 107) - cam.scrollX, (this.player.y - 107) - cam.scrollY);
    }
}

const config = {
    type: Phaser.AUTO, width: 800, height: 600, backgroundColor: '#2d2d2d', parent: 'phaser-example',
    physics: { default: 'arcade', arcade: { gravity: { y: 300 } } },
    scene: Example
};

const game = new Phaser.Game(config);
```

## Matter Physics

### Matter

> Matter.jsによるタイルマップ衝突。クリックでボールを落とし、タイルの衝突形状（Tiledで設定）に沿って物理演算。

```javascript
class Example extends Phaser.Scene
{
    controls;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.spritesheet('balls', 'assets/sprites/balls.png', { frameWidth: 17, frameHeight: 17 });
        this.load.tilemapTiledJSON('map', 'assets/tilemaps/maps/tileset-collision-shapes.json');
        this.load.image('kenny_platformer_64x64', 'assets/tilemaps/tiles/kenny_platformer_64x64.png');
    }

    create ()
    {
        const map = this.make.tilemap({ key: 'map' });
        const tileset = map.addTilesetImage('kenny_platformer_64x64');
        const layer = map.createLayer(0, tileset, 0, 0);

        map.setCollisionByExclusion([ -1, 0 ]);

        this.matter.world.convertTilemapLayer(layer);

        this.matter.world.setBounds(map.widthInPixels, map.heightInPixels);

        this.input.on('pointerdown', function ()
        {
            const worldPoint = this.input.activePointer.positionToCamera(this.cameras.main);
            for (let i = 0; i < 4; i++)
            {
                const x = worldPoint.x + Phaser.Math.RND.integerInRange(-5, 5);
                const y = worldPoint.y + Phaser.Math.RND.integerInRange(-5, 5);
                const frame = Phaser.Math.RND.integerInRange(0, 5);
                this.matter.add.image(x, y, 'balls', frame, { restitution: 1 });
            }
        }, this);

        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setScroll(95, 0);

        const cursors = this.input.keyboard.createCursorKeys();
        const controlConfig = {
            camera: this.cameras.main,
            left: cursors.left,
            right: cursors.right,
            up: cursors.up,
            down: cursors.down,
            speed: 0.5
        };
        this.controls = new Phaser.Cameras.Controls.FixedKeyControl(controlConfig);

        const help = this.add.text(16, 16, 'Left-click to drop balls.\nArrows to scroll.', {
            fontSize: '18px',
            padding: { x: 10, y: 5 },
            backgroundColor: '#000000',
            fill: '#ffffff'
        });
        help.setScrollFactor(0);
    }

    update (time, delta)
    {
        this.controls.update(delta);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    parent: 'phaser-example',
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1 },
            enableSleep: true
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Matter Destroy Tile Bodies

> Matter.jsタイルの動的破壊。プレイヤーが接触したタイルをフェードアウトさせて物理ボディごと削除。コンパウンドボディとセンサーによるプレイヤー制御。

```javascript
class Example extends Phaser.Scene
{
    map;
    cam;
    smoothedControls;
    cursors;
    playerController;
    mapScale = 2.5;

    constructor ()
    {
        super({key: "main"});
    }

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.tilemapTiledJSON('this.map', 'assets/tilemaps/maps/matter-destroy-tile-bodies.json');
        this.load.image('platformer_tiles', 'assets/tilemaps/tiles/platformer_tiles.png');
        this.load.spritesheet('player', 'assets/sprites/dude-cropped.png', { frameWidth: 32, frameHeight: 42 });
    }

    create ()
    {
        this.map = this.make.tilemap({ key: 'this.map' });
        const tileset = this.map.addTilesetImage('platformer_tiles');
        const bgLayer = this.map.createLayer('Background Layer', tileset, 0, 0).setScale(this.mapScale);
        const groundLayer = this.map.createLayer('Ground Layer', tileset, 0, 0).setScale(this.mapScale);
        const fgLayer = this.map.createLayer('Foreground Layer', tileset, 0, 0).setScale(this.mapScale).setDepth(1);

        groundLayer.setCollisionByProperty({ collides: true });
        this.matter.world.convertTilemapLayer(groundLayer);

        groundLayer.forEachTile((tile) => {
            if (tile.properties.fallOnContact)
            {
                tile.physics.matterBody.body.label = 'disappearingPlatform';
            }
        });

        this.playerController = {
            matterSprite: this.matter.add.sprite(0, 0, 'player', 4),
            blocked: { left: false, right: false, bottom: false },
            numTouching: { left: 0, right: 0, bottom: 0 },
            sensors: { bottom: null, left: null, right: null },
            time: { leftDown: 0, rightDown: 0 },
            lastJumpedAt: 0,
            speed: { run: 5, jump: 12 }
        };

        const M = Phaser.Physics.Matter.Matter;
        const w = this.playerController.matterSprite.width;
        const h = this.playerController.matterSprite.height;
        const sx = w / 2;
        const sy = h / 2;

        const playerBody = M.Bodies.rectangle(sx, sy, w * 0.75, h, { chamfer: { radius: 10 } });
        this.playerController.sensors.bottom = M.Bodies.rectangle(sx, h, sx, 5, { isSensor: true });
        this.playerController.sensors.left = M.Bodies.rectangle(sx - w * 0.45, sy, 5, h * 0.25, { isSensor: true });
        this.playerController.sensors.right = M.Bodies.rectangle(sx + w * 0.45, sy, 5, h * 0.25, { isSensor: true });
        const compoundBody = M.Body.create({
            parts: [playerBody, this.playerController.sensors.bottom, this.playerController.sensors.left, this.playerController.sensors.right],
            restitution: 0.05
        });

        this.playerController.matterSprite.setExistingBody(compoundBody).setFixedRotation().setPosition(32, 500);

        this.cam = this.cameras.main;
        this.cam.setBounds(0, 0, this.map.widthInPixels * this.mapScale, this.map.heightInPixels * this.mapScale);
        this.smoothMoveCameraTowards(this.playerController.matterSprite);

        this.matter.world.setBounds(this.map.widthInPixels * this.mapScale, this.map.heightInPixels * this.mapScale);
        this.matter.world.drawDebug = false;

        this.anims.create({ key: 'left', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'right', frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('player', { start: 4, end: 4 }), frameRate: 10, repeat: -1 });

        this.matter.world.on('collisionstart', (event) => {
            for (let i = 0; i < event.pairs.length; i++) {
                const bodyA = event.pairs[i].bodyA;
                const bodyB = event.pairs[i].bodyB;
                if ((bodyA === playerBody && bodyB.label === 'disappearingPlatform') ||
                    (bodyB === playerBody && bodyA.label === 'disappearingPlatform')) {
                    const tileBody = bodyA.label === 'disappearingPlatform' ? bodyA : bodyB;
                    const tileWrapper = tileBody.gameObject;
                    const tile = tileWrapper.tile;
                    if (tile.properties.isBeingDestroyed) { continue; }
                    tile.properties.isBeingDestroyed = true;
                    this.tweens.add({
                        targets: tile,
                        alpha: { value: 0, duration: 500, ease: 'Power1' },
                        onComplete: this.destroyTile.bind(this, tile)
                    });
                }
            }
        });

        this.matter.world.on('beforeupdate', (event) => {
            this.playerController.numTouching.left = 0;
            this.playerController.numTouching.right = 0;
            this.playerController.numTouching.bottom = 0;
        });

        this.matter.world.on('collisionactive', (event) => {
            const left = this.playerController.sensors.left;
            const right = this.playerController.sensors.right;
            const bottom = this.playerController.sensors.bottom;
            for (let i = 0; i < event.pairs.length; i++) {
                const bodyA = event.pairs[i].bodyA;
                const bodyB = event.pairs[i].bodyB;
                if (bodyA === bottom || bodyB === bottom) { this.playerController.numTouching.bottom += 1; }
                else if ((bodyA === left && bodyB.isStatic) || (bodyB === left && bodyA.isStatic)) { this.playerController.numTouching.left += 1; }
                else if ((bodyA === right && bodyB.isStatic) || (bodyB === right && bodyA.isStatic)) { this.playerController.numTouching.right += 1; }
            }
        });

        this.matter.world.on('afterupdate', (event) => {
            this.playerController.blocked.right = this.playerController.numTouching.right > 0;
            this.playerController.blocked.left = this.playerController.numTouching.left > 0;
            this.playerController.blocked.bottom = this.playerController.numTouching.bottom > 0;
        });

        this.input.on('pointerdown', () => {
            this.matter.world.drawDebug = !this.matter.world.drawDebug;
            this.matter.world.debugGraphic.visible = this.matter.world.drawDebug;
        });

        this.cursors = this.input.keyboard.createCursorKeys();
        this.smoothedControls = new SmoothedHorionztalControl(0.001);

        const text = this.add.text(16, 16, ['Arrow keys to move.', 'Press "Up" to jump.', 'Don\'t look back :)', 'Click to toggle rendering Matter debug.'], {
            fontSize: '20px', padding: { x: 20, y: 10 }, backgroundColor: '#000000', fill: '#ffffff'
        });
        text.setScrollFactor(0);
    }

    update (time, delta)
    {
        const matterSprite = this.playerController.matterSprite;
        if (!matterSprite) { return; }
        if (matterSprite.y > this.map.heightInPixels * this.mapScale) {
            matterSprite.destroy();
            this.playerController.matterSprite = null;
            this.restart();
            return;
        }

        let oldVelocityX, targetVelocityX, newVelocityX;
        if (this.cursors.left.isDown && !this.playerController.blocked.left) {
            this.smoothedControls.moveLeft(delta, this.playerController);
            matterSprite.anims.play('left', true);
            oldVelocityX = matterSprite.body.velocity.x;
            targetVelocityX = -this.playerController.speed.run;
            newVelocityX = Phaser.Math.Linear(oldVelocityX, targetVelocityX, -this.smoothedControls.value);
            matterSprite.setVelocityX(newVelocityX);
        } else if (this.cursors.right.isDown && !this.playerController.blocked.right) {
            this.smoothedControls.moveRight(delta);
            matterSprite.anims.play('right', true);
            oldVelocityX = matterSprite.body.velocity.x;
            targetVelocityX = this.playerController.speed.run;
            newVelocityX = Phaser.Math.Linear(oldVelocityX, targetVelocityX, this.smoothedControls.value);
            matterSprite.setVelocityX(newVelocityX);
        } else {
            this.smoothedControls.reset();
            matterSprite.anims.play('idle', true);
        }

        const canJump = (time - this.playerController.lastJumpedAt) > 250;
        if (this.cursors.up.isDown && canJump && this.playerController.blocked.bottom) {
            matterSprite.setVelocityY(-this.playerController.speed.jump);
            this.playerController.lastJumpedAt = time;
        }
        this.smoothMoveCameraTowards(matterSprite, 0.9);
    }

    smoothMoveCameraTowards (target, smoothFactor) {
        if (smoothFactor === undefined) { smoothFactor = 0; }
        this.cam.scrollX = smoothFactor * this.cam.scrollX + (1 - smoothFactor) * (target.x - this.cam.width * 0.5);
        this.cam.scrollY = smoothFactor * this.cam.scrollY + (1 - smoothFactor) * (target.y - this.cam.height * 0.5);
    }

    destroyTile (tile) {
        const layer = tile.tilemapLayer;
        layer.removeTileAt(tile.x, tile.y);
        tile.physics.matterBody.destroy();
    }

    restart () {
        this.cam.fade(500, 0, 0, 0);
        this.cam.shake(250, 0.01);
        this.time.addEvent({ delay: 600, callback: () => { this.cam.resetFX(); this.scene.stop(); this.scene.start('main'); } });
    }
}

class SmoothedHorionztalControl {
    constructor (speed) { this.msSpeed = speed; this.value = 0; }
    moveLeft (delta, playerController) { if (this.value > 0) { this.reset(); } this.value -= this.msSpeed * delta; if (this.value < -1) { this.value = -1; } playerController.time.rightDown += delta; }
    moveRight (delta) { if (this.value < 0) { this.reset(); } this.value += this.msSpeed * delta; if (this.value > 1) { this.value = 1; } }
    reset () { this.value = 0; }
}

const config = {
    type: Phaser.AUTO, width: 800, height: 600, backgroundColor: '#000000', parent: 'phaser-example', pixelArt: true,
    physics: { default: 'matter', matter: { gravity: { y: 1 }, enableSleep: false, debug: true } },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Matter Detect Collision With Tile

> 特定のタイル（溶岩・トゲ）との衝突検出。ボールが危険タイルに触れるとフェードアウトして破壊される。

```javascript
class Example extends Phaser.Scene
{
    controls;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.spritesheet('balls', 'assets/sprites/balls.png', { frameWidth: 17, frameHeight: 17 });
        this.load.tilemapTiledJSON('map', 'assets/tilemaps/maps/tileset-collision-shapes.json');
        this.load.image('kenny_platformer_64x64', 'assets/tilemaps/tiles/kenny_platformer_64x64.png');
    }

    create ()
    {
        const map = this.make.tilemap({ key: 'map' });
        const tileset = map.addTilesetImage('kenny_platformer_64x64');
        const layer = map.createLayer(0, tileset, 0, 0);

        layer.setCollisionByProperty({ collides: true });
        this.matter.world.convertTilemapLayer(layer);
        this.matter.world.setBounds(map.widthInPixels, map.heightInPixels);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setScroll(95, 100);

        layer.forEachTile(tile => {
            if (tile.properties.type === 'lava' || tile.properties.type === 'spike') {
                tile.physics.matterBody.body.label = 'dangerousTile';
            }
        });

        this.input.on('pointerdown', function () {
            const worldPoint = this.input.activePointer.positionToCamera(this.cameras.main);
            for (let i = 0; i < 5; i++) {
                const x = worldPoint.x + Phaser.Math.RND.integerInRange(-5, 5);
                const y = worldPoint.y + Phaser.Math.RND.integerInRange(-5, 5);
                const frame = Phaser.Math.RND.integerInRange(0, 5);
                this.matter.add.image(x, y, 'balls', frame, { restitution: 1, label: 'ball' });
            }
        }, this);

        this.matter.world.on('collisionstart', function (event) {
            for (let i = 0; i < event.pairs.length; i++) {
                const bodyA = this.getRootBody(event.pairs[i].bodyA);
                const bodyB = this.getRootBody(event.pairs[i].bodyB);
                if ((bodyA.label === 'ball' && bodyB.label === 'dangerousTile') ||
                    (bodyB.label === 'ball' && bodyA.label === 'dangerousTile')) {
                    const ballBody = bodyA.label === 'ball' ? bodyA : bodyB;
                    const ball = ballBody.gameObject;
                    if (ball.isBeingDestroyed) { continue; }
                    ball.isBeingDestroyed = true;
                    this.matter.world.remove(ballBody);
                    this.tweens.add({
                        targets: ball,
                        alpha: { value: 0, duration: 150, ease: 'Power1' },
                        onComplete: (ball => { ball.destroy(); }).bind(this, ball)
                    });
                }
            }
        }, this);

        const cursors = this.input.keyboard.createCursorKeys();
        const controlConfig = { camera: this.cameras.main, left: cursors.left, right: cursors.right, up: cursors.up, down: cursors.down, speed: 0.5 };
        this.controls = new Phaser.Cameras.Controls.FixedKeyControl(controlConfig);

        const help = this.add.text(16, 16, 'Left-click to drop balls.\nTry dropping the balls on the spikes or lava.', {
            fontSize: '18px', padding: { x: 10, y: 5 }, backgroundColor: '#ffffff', fill: '#000000'
        });
        help.setScrollFactor(0);
    }

    update (time, delta) { this.controls.update(delta); }

    getRootBody (body) {
        if (body.parent === body) { return body; }
        while (body.parent !== body) { body = body.parent; }
        return body;
    }
}

const config = {
    type: Phaser.AUTO, width: 800, height: 600, backgroundColor: '#000000', parent: 'phaser-example',
    physics: { default: 'matter', matter: { gravity: { y: 1 }, enableSleep: true } },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Matter Ghost Collisions

> ゴーストコリジョンのデモ。個別タイルボディ（草地）と単一凸ボディ（石プラットフォーム）の衝突挙動の違いを比較。

```javascript
class Example extends Phaser.Scene
{
    map;
    cam;
    text;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.tilemapTiledJSON('map', 'assets/tilemaps/maps/matter-ghost-vertices.json');
        this.load.image('kenney_redux_64x64', 'assets/tilemaps/tiles/kenney_redux_64x64.png');
        this.load.image('ball', 'assets/sprites/mushroom-32x32.png');
    }

    create ()
    {
        this.map = this.make.tilemap({ key: 'map' });
        const tileset = this.map.addTilesetImage('kenney_redux_64x64');
        const layer = this.map.createLayer(0, tileset, 0, 0);

        layer.setCollisionByProperty({ type: 'grass' });
        this.matter.world.convertTilemapLayer(layer);

        const rect = this.map.findObject('Collision', obj => obj.name === 'Stone Platform');
        this.matter.add.rectangle(rect.x + (rect.width / 2), rect.y + (rect.height / 2), rect.width, rect.height, { isStatic: true });

        this.cam = this.cameras.main;
        this.cam.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cam.setScroll(0, 700);

        this.time.addEvent({
            delay: 500,
            callback: function () {
                const shroom1 = this.matter.add.image(10, 1200, 'ball');
                shroom1.setRectangle();
                shroom1.setFriction(0);
                shroom1.body.force.x = 0.05;
                this.time.addEvent({ delay: 2000, callback: this.destroyShroom.bind(this, shroom1) });

                const shroom2 = this.matter.add.image(10, 880, 'ball');
                shroom2.setRectangle();
                shroom2.setFriction(0);
                shroom2.body.force.x = 0.05;
                this.time.addEvent({ delay: 2000, callback: this.destroyShroom.bind(this, shroom2) });
            },
            callbackScope: this,
            loop: true
        });

        this.matter.world.setBounds(this.map.widthInPixels, this.map.heightInPixels);

        this.text = this.add.text(16, 16, 'Ghost Collisions Demo\nGrass: Individual Tile Bodies\nStone: A Single Convex Body', {
            fontSize: '20px', padding: { x: 20, y: 10 }, backgroundColor: '#ffffff', fill: '#000000'
        });
        this.text.setScrollFactor(0);
    }

    destroyShroom (shroom) {
        this.matter.world.remove(shroom);
        shroom.destroy();
    }
}

const config = {
    type: Phaser.AUTO, width: 800, height: 600, backgroundColor: '#000000', parent: 'phaser-example', pixelArt: true,
    physics: { default: 'matter', matter: { gravity: { y: 1 }, debug: true } },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Matter Platformer Modify Map

> ランタイムでのマップ動的変更。ボタンセンサーを踏むと橋が架かるギミック。コンパウンドボディによるプレイヤー制御とカメラ追従。

```javascript
class Example extends Phaser.Scene
{
    playerController;
    cursors;
    cam;
    smoothedControls;
    map;

    constructor () {
        super({ key: "main" });
    }

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.tilemapTiledJSON('map', 'assets/tilemaps/maps/matter-platformer-dynamic-example.json');
        this.load.image('kenney_redux_64x64', 'assets/tilemaps/tiles/kenney_redux_64x64.png');
        this.load.spritesheet('player', 'assets/sprites/dude-cropped.png', { frameWidth: 32, frameHeight: 42 });
        this.load.image('box', 'assets/sprites/box-item-boxed.png');
    }

    create ()
    {
        this.map = this.make.tilemap({ key: 'map' });
        const tileset = this.map.addTilesetImage('kenney_redux_64x64');
        const bgLayer = this.map.createLayer('Background Layer', tileset, 0, 0);
        const groundLayer = this.map.createLayer('Ground Layer', tileset, 0, 0);
        const fgLayer = this.map.createLayer('Foreground Layer', tileset, 0, 0).setDepth(1);

        groundLayer.setCollisionByProperty({ collides: true });
        this.matter.world.convertTilemapLayer(groundLayer);

        this.matter.world.setBounds(this.map.widthInPixels, this.map.heightInPixels);
        this.matter.world.drawDebug = false;

        this.cursors = this.input.keyboard.createCursorKeys();
        this.smoothedControls = new SmoothedHorionztalControl(0.001);

        this.playerController = {
            matterSprite: this.matter.add.sprite(0, 0, 'player', 4),
            blocked: {
                left: false,
                right: false,
                bottom: false
            },
            numTouching: {
                left: 0,
                right: 0,
                bottom: 0
            },
            sensors: {
                bottom: null,
                left: null,
                right: null
            },
            time: {
                leftDown: 0,
                rightDown: 0
            },
            lastJumpedAt: 0,
            speed: {
                run: 5,
                jump: 7
            }
        };

        const M = Phaser.Physics.Matter.Matter;
        const w = this.playerController.matterSprite.width;
        const h = this.playerController.matterSprite.height;

        const sx = w / 2;
        const sy = h / 2;

        const height_fix = 0;
        const playerBody = M.Bodies.rectangle(sx, sy, w * 0.75, h, { chamfer: { radius: 10 } });
        this.playerController.sensors.bottom = M.Bodies.rectangle(sx, h, sx, 5, { isSensor: true });
        this.playerController.sensors.left = M.Bodies.rectangle(sx - w * 0.45, sy, 5, h * 0.25, { isSensor: true });
        this.playerController.sensors.right = M.Bodies.rectangle(sx + w * 0.45, sy, 5, h * 0.25, { isSensor: true });
        const compoundBody = M.Body.create({
            parts: [
                playerBody, this.playerController.sensors.bottom, this.playerController.sensors.left,
                this.playerController.sensors.right
            ],
            restitution: 0.05
        });

        const sensor = this.map.findObject('Sensors', function (obj)
        {
            return obj.name === 'Button Press Sensor';
        });
        const center = M.Vertices.centre(sensor.polygon);
        const sensorBody = this.matter.add.fromVertices(
            sensor.x + center.x, sensor.y + center.y,
            sensor.polygon,
            { isStatic: true, isSensor: true }
        );

        this.playerController.matterSprite
            .setExistingBody(compoundBody)
            .setFixedRotation()
            .setPosition(32, 1000);

        this.cam = this.cameras.main;
        this.cam.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.smoothMoveCameraTowards(this.playerController.matterSprite);

        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('player', { start: 4, end: 4 }),
            frameRate: 10,
            repeat: -1
        });

        this.matter.world.on('collisionstart', function (event)
        {
            for (let i = 0; i < event.pairs.length; i++)
            {
                const bodyA = event.pairs[i].bodyA;
                const bodyB = event.pairs[i].bodyB;
                if ((bodyA === playerBody && bodyB === sensorBody) ||
                    (bodyA === sensorBody && bodyB === playerBody))
                {
                    this.matter.world.remove(sensorBody);

                    const buttonTile = groundLayer.getTileAt(4, 18);

                    buttonTile.index = 93;
                    buttonTile.physics.matterBody.setFromTileCollision();

                    for (let j = 5; j <= 14; j++)
                    {
                        this.time.addEvent({
                            delay: (j - 5) * 50,
                            callback: function (x)
                            {
                                const bridgeTile = groundLayer.putTileAt(12, x, 19);

                                this.matter.add.tileBody(bridgeTile);
                            }.bind(this, j)
                        });
                    }
                }
            }
        }, this);

        this.matter.world.on('beforeupdate', function (event)
        {
            this.playerController.numTouching.left = 0;
            this.playerController.numTouching.right = 0;
            this.playerController.numTouching.bottom = 0;
        }, this);

        this.matter.world.on('collisionactive', function (event)
        {
            const playerBody = this.playerController.body;
            const left = this.playerController.sensors.left;
            const right = this.playerController.sensors.right;
            const bottom = this.playerController.sensors.bottom;

            for (let i = 0; i < event.pairs.length; i++)
            {
                const bodyA = event.pairs[i].bodyA;
                const bodyB = event.pairs[i].bodyB;

                if (bodyA === playerBody || bodyB === playerBody)
                {
                    continue;
                }
                else if (bodyA === bottom || bodyB === bottom)
                {
                    this.playerController.numTouching.bottom += 1;
                }
                else if ((bodyA === left && bodyB.isStatic) || (bodyB === left && bodyA.isStatic))
                {
                    this.playerController.numTouching.left += 1;
                }
                else if ((bodyA === right && bodyB.isStatic) || (bodyB === right && bodyA.isStatic))
                {
                    this.playerController.numTouching.right += 1;
                }
            }
        }, this);

        this.matter.world.on('afterupdate', function (event)
        {
            this.playerController.blocked.right = this.playerController.numTouching.right > 0 ? true : false;
            this.playerController.blocked.left = this.playerController.numTouching.left > 0 ? true : false;
            this.playerController.blocked.bottom = this.playerController.numTouching.bottom > 0 ? true : false;
        }, this);

        this.input.on('pointerdown', function ()
        {
            this.matter.world.drawDebug = !this.matter.world.drawDebug;
            this.matter.world.debugGraphic.visible = this.matter.world.drawDebug;
        }, this);

        const lines = [
            'Arrow keys to move. Press "Up" to jump.',
            'Press the button!',
            'Click to toggle rendering Matter debug.'
        ];

        const text = this.add.text(16, 16, lines, {
            fontSize: '20px',
            padding: { x: 20, y: 10 },
            backgroundColor: '#ffffff',
            fill: '#000000'
        });
        text.setScrollFactor(0);
    }

    update (time, delta)
    {
        const matterSprite = this.playerController.matterSprite;
        if (!matterSprite) { return; }

        if (matterSprite.y > this.map.heightInPixels)
        {
            matterSprite.destroy();
            this.playerController.matterSprite = null;
            this.restart();
            return;
        }

        let oldVelocityX;
        let targetVelocityX;
        let newVelocityX;

        if (this.cursors.left.isDown && !this.playerController.blocked.left)
        {
            this.smoothedControls.moveLeft(delta);
            matterSprite.anims.play('left', true);

            oldVelocityX = matterSprite.body.velocity.x;
            targetVelocityX = -this.playerController.speed.run;
            newVelocityX = Phaser.Math.Linear(oldVelocityX, targetVelocityX, -this.smoothedControls.value);

            matterSprite.setVelocityX(newVelocityX);
        }
        else if (this.cursors.right.isDown && !this.playerController.blocked.right)
        {
            this.smoothedControls.moveRight(delta);
            matterSprite.anims.play('right', true);

            oldVelocityX = matterSprite.body.velocity.x;
            targetVelocityX = this.playerController.speed.run;
            newVelocityX = Phaser.Math.Linear(oldVelocityX, targetVelocityX, this.smoothedControls.value);

            matterSprite.setVelocityX(newVelocityX);
        }
        else
        {
            this.smoothedControls.reset();
            matterSprite.anims.play('idle', true);
        }

        const canJump = (time - this.playerController.lastJumpedAt) > 250;
        if (this.cursors.up.isDown & canJump && this.playerController.blocked.bottom)
        {
            matterSprite.setVelocityY(-this.playerController.speed.jump);
            this.playerController.lastJumpedAt = time;
        }

        this.smoothMoveCameraTowards(matterSprite, 0.9);
    }

    smoothMoveCameraTowards (target, smoothFactor)
    {
        if (smoothFactor === undefined) { smoothFactor = 0; }
        this.cam.scrollX = smoothFactor * this.cam.scrollX + (1 - smoothFactor) * (target.x - this.cam.width * 0.5);
        this.cam.scrollY = smoothFactor * this.cam.scrollY + (1 - smoothFactor) * (target.y - this.cam.height * 0.5);
    }

    restart ()
    {
        this.cam.fade(500, 0, 0, 0);
        this.cam.shake(250, 0.01);

        this.time.addEvent({
            delay: 500,
            callback: function ()
            {
                this.cam.resetFX();
                this.scene.stop();
                this.scene.start('main');
            },
            callbackScope: this
        });
    }
}

class SmoothedHorionztalControl
{
    constructor (speed)
    {
        this.msSpeed = speed;
        this.value = 0;
    }

    moveLeft (delta)
    {
        if (this.value > 0) { this.reset(); }
        this.value -= this.msSpeed * delta;
        if (this.value < -1) { this.value = -1; }
    }

    moveRight (delta)
    {
        if (this.value < 0) { this.reset(); }
        this.value += this.msSpeed * delta;
        if (this.value > 1) { this.value = 1; }
    }

    reset ()
    {
        this.value = 0;
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    parent: 'phaser-example',
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1 },
            enableSleep: false,
            debug: true
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
```

### Matter Platformer With Wall Jumping

> 壁ジャンプ機能付きMatter.jsプラットフォーマー。左右の壁に接触中にジャンプすると反対方向に跳ね返る。

```javascript
class SmoothedHorionztalControl {
    constructor(speed) { this.msSpeed = speed; this.value = 0; }
    moveLeft(delta) { if (this.value > 0) { this.reset(); } this.value -= this.msSpeed * delta; if (this.value < -1) { this.value = -1; } }
    moveRight(delta) { if (this.value < 0) { this.reset(); } this.value += this.msSpeed * delta; if (this.value > 1) { this.value = 1; } }
    reset() { this.value = 0; }
}

class Example extends Phaser.Scene
{
    playerController;
    cursors;
    text;
    cam;
    smoothedControls;

    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.tilemapTiledJSON('map', 'assets/tilemaps/maps/matter-platformer.json');
        this.load.image('kenney_redux_64x64', 'assets/tilemaps/tiles/kenney_redux_64x64.png');
        this.load.spritesheet('player', 'assets/sprites/dude-cropped.png', { frameWidth: 32, frameHeight: 42 });
        this.load.image('box', 'assets/sprites/box-item-boxed.png');
    }

    create ()
    {
        const map = this.make.tilemap({ key: 'map' });
        const tileset = map.addTilesetImage('kenney_redux_64x64');
        const layer = map.createLayer(0, tileset, 0, 0);

        map.setCollisionByProperty({ collides: true });
        this.matter.world.convertTilemapLayer(layer);
        this.matter.world.setBounds(map.widthInPixels, map.heightInPixels);
        this.matter.world.createDebugGraphic();
        this.matter.world.drawDebug = false;

        this.cursors = this.input.keyboard.createCursorKeys();
        this.smoothedControls = new SmoothedHorionztalControl(0.0005);

        this.playerController = {
            matterSprite: this.matter.add.sprite(0, 0, 'player', 4),
            blocked: { left: false, right: false, bottom: false },
            numTouching: { left: 0, right: 0, bottom: 0 },
            sensors: { bottom: null, left: null, right: null },
            time: { leftDown: 0, rightDown: 0 },
            lastJumpedAt: 0,
            speed: { run: 7, jump: 10 }
        };

        const M = Phaser.Physics.Matter.Matter;
        const w = this.playerController.matterSprite.width;
        const h = this.playerController.matterSprite.height;
        const sx = w / 2;
        const sy = h / 2;

        const playerBody = M.Bodies.rectangle(sx, sy, w * 0.75, h, { chamfer: { radius: 10 } });
        this.playerController.sensors.bottom = M.Bodies.rectangle(sx, h, sx, 5, { isSensor: true });
        this.playerController.sensors.left = M.Bodies.rectangle(sx - w * 0.45, sy, 5, h * 0.25, { isSensor: true });
        this.playerController.sensors.right = M.Bodies.rectangle(sx + w * 0.45, sy, 5, h * 0.25, { isSensor: true });
        const compoundBody = M.Body.create({
            parts: [playerBody, this.playerController.sensors.bottom, this.playerController.sensors.left, this.playerController.sensors.right],
            friction: 0.01,
            restitution: 0.05
        });

        this.playerController.matterSprite.setExistingBody(compoundBody).setFixedRotation().setPosition(630, 1000);

        this.matter.add.image(630, 750, 'box');
        this.matter.add.image(630, 650, 'box');
        this.matter.add.image(630, 550, 'box');

        this.cam = this.cameras.main;
        this.cam.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.smoothMoveCameraTowards(this.playerController.matterSprite);

        this.anims.create({ key: 'left', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'right', frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('player', { start: 4, end: 4 }), frameRate: 10, repeat: -1 });

        this.matter.world.on('beforeupdate', function (event) {
            this.playerController.numTouching.left = 0;
            this.playerController.numTouching.right = 0;
            this.playerController.numTouching.bottom = 0;
        }, this);

        this.matter.world.on('collisionactive', function (event) {
            const left = this.playerController.sensors.left;
            const right = this.playerController.sensors.right;
            const bottom = this.playerController.sensors.bottom;
            for (let i = 0; i < event.pairs.length; i++) {
                const bodyA = event.pairs[i].bodyA;
                const bodyB = event.pairs[i].bodyB;
                if (bodyA === bottom || bodyB === bottom) { this.playerController.numTouching.bottom += 1; }
                else if ((bodyA === left && bodyB.isStatic) || (bodyB === left && bodyA.isStatic)) { this.playerController.numTouching.left += 1; }
                else if ((bodyA === right && bodyB.isStatic) || (bodyB === right && bodyA.isStatic)) { this.playerController.numTouching.right += 1; }
            }
        }, this);

        this.matter.world.on('afterupdate', function (event) {
            this.playerController.blocked.right = this.playerController.numTouching.right > 0;
            this.playerController.blocked.left = this.playerController.numTouching.left > 0;
            this.playerController.blocked.bottom = this.playerController.numTouching.bottom > 0;
        }, this);

        this.input.on('pointerdown', function () {
            this.matter.world.drawDebug = !this.matter.world.drawDebug;
            this.matter.world.debugGraphic.visible = this.matter.world.drawDebug;
        }, this);

        this.text = this.add.text(16, 16, '', { fontSize: '20px', padding: { x: 20, y: 10 }, backgroundColor: '#ffffff', fill: '#000000' });
        this.text.setScrollFactor(0);
        this.updateText();
    }

    update (time, delta)
    {
        const matterSprite = this.playerController.matterSprite;
        let oldVelocityX, targetVelocityX, newVelocityX;

        if (this.cursors.left.isDown && !this.playerController.blocked.left) {
            this.smoothedControls.moveLeft(delta);
            matterSprite.anims.play('left', true);
            oldVelocityX = matterSprite.body.velocity.x;
            targetVelocityX = -this.playerController.speed.run;
            newVelocityX = Phaser.Math.Linear(oldVelocityX, targetVelocityX, -this.smoothedControls.value);
            matterSprite.setVelocityX(newVelocityX);
        } else if (this.cursors.right.isDown && !this.playerController.blocked.right) {
            this.smoothedControls.moveRight(delta);
            matterSprite.anims.play('right', true);
            oldVelocityX = matterSprite.body.velocity.x;
            targetVelocityX = this.playerController.speed.run;
            newVelocityX = Phaser.Math.Linear(oldVelocityX, targetVelocityX, this.smoothedControls.value);
            matterSprite.setVelocityX(newVelocityX);
        } else {
            this.smoothedControls.reset();
            matterSprite.anims.play('idle', true);
        }

        const canJump = (time - this.playerController.lastJumpedAt) > 250;
        if (this.cursors.up.isDown & canJump) {
            if (this.playerController.blocked.bottom) {
                matterSprite.setVelocityY(-this.playerController.speed.jump);
                this.playerController.lastJumpedAt = time;
            } else if (this.playerController.blocked.left) {
                matterSprite.setVelocityY(-this.playerController.speed.jump);
                matterSprite.setVelocityX(this.playerController.speed.run);
                this.playerController.lastJumpedAt = time;
            } else if (this.playerController.blocked.right) {
                matterSprite.setVelocityY(-this.playerController.speed.jump);
                matterSprite.setVelocityX(-this.playerController.speed.run);
                this.playerController.lastJumpedAt = time;
            }
        }

        this.smoothMoveCameraTowards(matterSprite, 0.9);
        this.updateText();
    }

    updateText () {
        this.text.setText(['Arrow keys to move. Press "Up" to jump.', 'You can wall jump!', 'Click to toggle rendering Matter debug.']);
    }

    smoothMoveCameraTowards (target, smoothFactor) {
        if (smoothFactor === undefined) { smoothFactor = 0; }
        this.cam.scrollX = smoothFactor * this.cam.scrollX + (1 - smoothFactor) * (target.x - this.cam.width * 0.5);
        this.cam.scrollY = smoothFactor * this.cam.scrollY + (1 - smoothFactor) * (target.y - this.cam.height * 0.5);
    }
}

const config = {
    type: Phaser.AUTO, width: 800, height: 600, backgroundColor: '#000000', parent: 'phaser-example',
    physics: { default: 'matter', matter: { gravity: { y: 1 }, enableSleep: false, debug: true } },
    scene: Example
};

const game = new Phaser.Game(config);
```
