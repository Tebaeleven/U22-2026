import Phaser from "phaser"
import type { SpriteRuntime, PhysicsMode, GameSceneProxy } from "../engine/types"
import { STAGE_WIDTH, STAGE_HEIGHT } from "../engine/types"
import type { SpriteDef, ColliderDef } from "../constants"
import { shouldReloadTexture } from "./texture-sync"

/**
 * GameScene — Phaser のメインシーン
 * コスチューム画像ベースのスプライト描画 + Arcade Physics 当たり判定
 */
export class GameScene extends Phaser.Scene implements GameSceneProxy {
  /** スプライトの Phaser Image オブジェクト */
  private spriteMap = new Map<string, Phaser.GameObjects.Image>()
  /** 吹き出しテキスト */
  private speechMap = new Map<string, Phaser.GameObjects.Text>()
  /** スプライトに紐づく当たり判定設定 */
  private colliderMap = new Map<string, ColliderDef>()
  /** 現在のコスチュームテクスチャキー (sprite.id → textureKey) */
  private currentTextureMap = new Map<string, string>()
  /** 最後に適用した dataUrl (textureKey → dataUrl) */
  private textureDataUrlMap = new Map<string, string>()
  private gridGraphics: Phaser.GameObjects.Graphics | null = null
  /** 各スプライトの物理モード */
  private physicsModeMap = new Map<string, PhysicsMode>()
  /** Phaser の collider オブジェクト（再構成時にクリアする） */
  private activeColliders: Phaser.Physics.Arcade.Collider[] = []
  /** スプライトIDごとのコライダー管理（差分追加/削除用） */
  private perSpriteColliders: Map<string, Phaser.Physics.Arcade.Collider[]> = new Map()

  private static readonly SPEECH_FONT_SIZE = 120
  private static readonly SPEECH_PADDING_X = 16
  private static readonly SPEECH_PADDING_Y = 10
  private static readonly SPEECH_WRAP_WIDTH = 560

  /** ステージ上のスプライトがクリックされたときのコールバック */
  onSpriteClicked: ((spriteId: string) => void) | null = null
  /** ステージ背景（スプライト外）がクリックされたときのコールバック */
  onBackgroundClicked: (() => void) | null = null

  constructor() {
    super({ key: "GameScene" })
  }

  create() {
    this.cameras.main.setBackgroundColor("#ffffff")
    this.gridGraphics = this.add.graphics()
    this.drawGrid()

    // ステージ背景クリック検出（スプライト上でなければ背景クリック扱い）
    this.input.on("pointerdown", (_pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
      if (currentlyOver.length === 0) {
        this.onBackgroundClicked?.()
      }
    })

    this.initWheelListener()
  }

  private drawGrid() {
    const g = this.gridGraphics
    if (!g) return

    g.clear()
    g.lineStyle(1, 0xf0f0f0)
    for (let x = 0; x <= STAGE_WIDTH; x += 40) {
      g.moveTo(x, 0)
      g.lineTo(x, STAGE_HEIGHT)
    }
    for (let y = 0; y <= STAGE_HEIGHT; y += 40) {
      g.moveTo(0, y)
      g.lineTo(STAGE_WIDTH, y)
    }
    g.strokePath()

    g.lineStyle(1, 0xdddddd)
    g.moveTo(STAGE_WIDTH / 2, 0)
    g.lineTo(STAGE_WIDTH / 2, STAGE_HEIGHT)
    g.moveTo(0, STAGE_HEIGHT / 2)
    g.lineTo(STAGE_WIDTH, STAGE_HEIGHT / 2)
    g.strokePath()
  }

  private loadTextureInternal(
    key: string,
    dataUrl: string,
    forceReload: boolean,
    callback?: () => void
  ) {
    if (!dataUrl) {
      callback?.()
      return
    }
    if (
      this.textures.exists(key) &&
      !forceReload &&
      this.textureDataUrlMap.get(key) === dataUrl
    ) {
      callback?.()
      return
    }
    const img = new Image()
    img.onload = () => {
      if (
        this.textures.exists(key) &&
        !forceReload &&
        this.textureDataUrlMap.get(key) === dataUrl
      ) {
        callback?.()
        return
      }
      this.replaceTextureSafely(key, img, dataUrl)
      callback?.()
    }
    img.src = dataUrl
  }

  private replaceTextureSafely(key: string, img: HTMLImageElement, dataUrl: string) {
    const textureUsers: Array<[string, Phaser.GameObjects.Image]> = []

    for (const [spriteId, spriteObj] of this.spriteMap) {
      if (!spriteObj.active) continue
      if (this.currentTextureMap.get(spriteId) !== key) continue
      textureUsers.push([spriteId, spriteObj])
      if (spriteObj.texture.key === key && this.textures.exists("__DEFAULT")) {
        spriteObj.setTexture("__DEFAULT")
      }
    }

    if (this.textures.exists(key)) {
      this.textures.remove(key)
    }
    this.textures.addImage(key, img)
    this.textureDataUrlMap.set(key, dataUrl)

    for (const [spriteId, spriteObj] of textureUsers) {
      if (!spriteObj.active) continue
      if (this.currentTextureMap.get(spriteId) !== key) continue
      if (!this.textures.exists(key)) continue
      spriteObj.setTexture(key)
    }
  }

  private syncSpriteTexture(
    spriteId: string,
    imageObj: Phaser.GameObjects.Image,
    texKey: string,
    dataUrl?: string
  ) {
    this.currentTextureMap.set(spriteId, texKey)

    const needsReload = shouldReloadTexture({
      textureExists: this.textures.exists(texKey),
      currentDataUrl: this.textureDataUrlMap.get(texKey),
      nextDataUrl: dataUrl,
    })

    if (needsReload && dataUrl) {
      this.loadTextureInternal(texKey, dataUrl, true, () => {
        const liveImageObj = this.spriteMap.get(spriteId)
        if (!liveImageObj?.active) return
        if (this.currentTextureMap.get(spriteId) !== texKey) return
        if (!this.textures.exists(texKey)) return
        liveImageObj.setTexture(texKey)
      })
      return
    }

    if (this.textures.exists(texKey)) {
      if (imageObj.texture.key !== texKey) {
        imageObj.setTexture(texKey)
      }
      return
    }

    if (imageObj.texture.key !== "__DEFAULT" && this.textures.exists("__DEFAULT")) {
      imageObj.setTexture("__DEFAULT")
    }
  }

  private getScaledSize(
    costumeWidth: number | undefined,
    costumeHeight: number | undefined,
    size: number
  ) {
    const scale = size / 100
    return {
      scale,
      width: (costumeWidth ?? 48) * scale,
      height: (costumeHeight ?? 48) * scale,
    }
  }

  /**
   * Arcade Physics のボディを設定
   */
  private applyCollider(
    gameObj: Phaser.GameObjects.Image,
    collider: ColliderDef,
    width: number,
    height: number
  ) {
    const body = gameObj.body as Phaser.Physics.Arcade.Body | null
    if (!body) return

    if (collider.type === "circle") {
      const radius = collider.radius ?? Math.min(width, height) / 2
      body.setCircle(
        radius,
        collider.offsetX ?? (width / 2 - radius),
        collider.offsetY ?? (height / 2 - radius)
      )
    } else {
      // bbox
      const w = collider.width ?? width
      const h = collider.height ?? height
      body.setSize(w, h)
      body.setOffset(
        collider.offsetX ?? (width - w) / 2,
        collider.offsetY ?? (height - h) / 2
      )
    }
  }

  /**
   * スプライト用のテクスチャキーを生成
   */
  private textureKey(spriteId: string, costumeIndex: number): string {
    return `costume_${spriteId}_${costumeIndex}`
  }

  /**
   * VM からスプライト状態を受け取って描画を更新
   */
  updateSprites(
    sprites: SpriteRuntime[],
    spriteDefs?: SpriteDef[]
  ) {
    const activeIds = new Set<string>()

    for (const sprite of sprites) {
      activeIds.add(sprite.id)

      const px = STAGE_WIDTH / 2 + sprite.x
      const py = STAGE_HEIGHT / 2 - sprite.y

      // 対応する SpriteDef からコスチューム dataUrl を取得（クローンは親の定義を使う）
      const def = spriteDefs?.find((d) => d.id === sprite.id)
        ?? (sprite.parentId ? spriteDefs?.find((d) => d.id === sprite.parentId) : undefined)
      const costumeIdx = sprite.costumeIndex
      const costume = def?.costumes[costumeIdx]
      // クローンは親のテクスチャを再利用
      const texOwnerId = sprite.parentId ?? sprite.id
      const texKey = this.textureKey(texOwnerId, costumeIdx)
      const { scale, width, height } = this.getScaledSize(
        costume?.width,
        costume?.height,
        sprite.size
      )

      let imageObj = this.spriteMap.get(sprite.id)

      if (!imageObj) {
        // 新しいスプライトの作成
        const hasTexture = this.textures.exists(texKey)
        imageObj = this.physics.add.image(
          px,
          py,
          hasTexture ? texKey : "__DEFAULT"
        )
        imageObj.setOrigin(0.5, 0.5)
        // 物理モードに応じてボディを設定
        const physMode = sprite.physicsMode ?? "none"
        this.applyPhysicsMode(imageObj, physMode)
        this.physicsModeMap.set(sprite.id, physMode)
        this.spriteMap.set(sprite.id, imageObj)
        this.addCollidersForSprite(sprite.id, physMode)
      }

      this.syncSpriteTexture(sprite.id, imageObj, texKey, costume?.dataUrl)

      // 物理モードが変わったら再適用
      const currentPhysMode = sprite.physicsMode ?? "none"
      const prevPhysMode = this.physicsModeMap.get(sprite.id) ?? "none"
      if (currentPhysMode !== prevPhysMode) {
        this.removeCollidersForSprite(sprite.id)
        this.applyPhysicsMode(imageObj, currentPhysMode)
        this.physicsModeMap.set(sprite.id, currentPhysMode)
        this.addCollidersForSprite(sprite.id, currentPhysMode)
      }

      // サイズ・可視性・透明度・反転・色を適用
      imageObj.setScale(scale)
      imageObj.setVisible(sprite.visible)
      imageObj.setAlpha((sprite.opacity ?? 100) / 100)
      imageObj.setFlipX(sprite.flipX ?? false)
      imageObj.setAngle(sprite.angle ?? 0)
      if (sprite.tint != null) {
        imageObj.setTint(sprite.tint)
      }

      // 物理プロパティを毎フレーム同期（クローン生成直後にも確実に適用される）
      const body = imageObj.body as Phaser.Physics.Arcade.Body
      if (body) {
        if (sprite.allowGravity !== null && sprite.allowGravity !== undefined) {
          body.setAllowGravity(sprite.allowGravity)
        }
        if (sprite.collideWorldBounds) {
          body.setCollideWorldBounds(true)
        }
        if (sprite.bounce > 0) {
          body.setBounce(sprite.bounce, sprite.bounce)
        }
        // velocity を同期（クローン直後に Phaser オブジェクトがなかった場合のフォールバック）
        if (currentPhysMode === "dynamic" && (sprite.velocityX !== 0 || sprite.velocityY !== 0)) {
          const bv = body.velocity
          if (bv.x === 0 && bv.y === 0) {
            body.setVelocity(sprite.velocityX, sprite.velocityY)
          }
        }
      }

      // dynamic スプライトは Phaser が位置を管理するので VM からの位置更新をスキップ
      if (currentPhysMode !== "dynamic") {
        imageObj.setPosition(px, py)
      }

      // 当たり判定を適用
      const colliderDef = def?.collider ?? this.colliderMap.get(sprite.id)
      if (colliderDef) {
        this.applyCollider(imageObj, colliderDef, width, height)
        this.colliderMap.set(sprite.id, colliderDef)
      }

      // 吹き出し
      if (sprite.sayText) {
        let speech = this.speechMap.get(sprite.id)
        if (!speech) {
          speech = this.add.text(0, 0, "", {
            fontFamily: "Arial, sans-serif",
            fontSize: `${GameScene.SPEECH_FONT_SIZE}px`,
            color: "#000000",
            backgroundColor: "#ffffff",
            padding: {
              x: GameScene.SPEECH_PADDING_X,
              y: GameScene.SPEECH_PADDING_Y,
            },
            wordWrap: {
              width: GameScene.SPEECH_WRAP_WIDTH,
              useAdvancedWrap: true,
            },
          })
          speech.setOrigin(0.5, 1)
          this.speechMap.set(sprite.id, speech)
        }
        speech.setText(sprite.sayText)
        const textPx = STAGE_WIDTH / 2 + sprite.sayTextX
        const textPy = STAGE_HEIGHT / 2 - sprite.sayTextY
        speech.setPosition(textPx, textPy)
        speech.setVisible(true)
      } else {
        const speech = this.speechMap.get(sprite.id)
        if (speech) speech.setVisible(false)
      }

    }

    // 削除されたスプライトをクリーンアップ
    for (const [id, imageObj] of this.spriteMap) {
      if (!activeIds.has(id)) {
        imageObj.destroy()
        this.spriteMap.delete(id)
        this.colliderMap.delete(id)
        this.currentTextureMap.delete(id)
        this.physicsModeMap.delete(id)
        const speech = this.speechMap.get(id)
        if (speech) {
          speech.destroy()
          this.speechMap.delete(id)
        }
      }
    }
  }

  /**
   * 初期スプライト（停止状態）を表示
   */
  showInitialSprites(sprites: SpriteDef[]) {
    const activeIds = new Set<string>()

    // カメラ状態をリセット
    this.cameras.main.resetFX()
    this.cameras.main.setZoom(1)
    this.cameras.main.setScroll(0, 0)
    this.cameras.main.stopFollow()
    this.cameras.main.setAlpha(1)

    // ID付きテキストをクリア
    for (const [, t] of this.textAtMap) t.destroy()
    this.textAtMap.clear()

    for (const [, speech] of this.speechMap) speech.destroy()
    this.speechMap.clear()
    this.clearColliders()

    for (const sprite of sprites) {
      activeIds.add(sprite.id)
      const px = STAGE_WIDTH / 2 + sprite.x
      const py = STAGE_HEIGHT / 2 - sprite.y
      const costume = sprite.costumes[sprite.currentCostumeIndex]
      const texKey = this.textureKey(sprite.id, sprite.currentCostumeIndex)
      const { scale, width, height } = this.getScaledSize(
        costume?.width,
        costume?.height,
        sprite.size
      )

      let imageObj = this.spriteMap.get(sprite.id)
      if (!imageObj) {
        const hasTexture = this.textures.exists(texKey)
        imageObj = this.physics.add.image(
          px,
          py,
          hasTexture ? texKey : "__DEFAULT"
        )
        imageObj.setOrigin(0.5, 0.5)

        // クリック検出（停止中にスプライトをクリック → Gizmo 表示）
        imageObj.setInteractive({ useHandCursor: true })
        imageObj.on("pointerdown", () => {
          this.onSpriteClicked?.(sprite.id)
        })

        this.spriteMap.set(sprite.id, imageObj)
      }

      this.applyPhysicsMode(imageObj, "none")
      this.physicsModeMap.set(sprite.id, "none")
      this.syncSpriteTexture(sprite.id, imageObj, texKey, costume?.dataUrl)
      imageObj.setPosition(px, py)
      imageObj.setScale(scale)
      imageObj.setVisible(sprite.visible)

      this.colliderMap.set(sprite.id, sprite.collider)
      this.applyCollider(imageObj, sprite.collider, width, height)
    }

    for (const [id, imageObj] of this.spriteMap) {
      if (activeIds.has(id)) continue
      imageObj.destroy()
      this.spriteMap.delete(id)
      this.colliderMap.delete(id)
      this.currentTextureMap.delete(id)
      this.physicsModeMap.delete(id)
    }
  }

  /**
   * 2つのスプライトが接触しているか判定（ボディの AABB 交差で直接判定）
   */
  checkOverlap(spriteIdA: string, spriteIdB: string): boolean {
    const a = this.spriteMap.get(spriteIdA)
    const b = this.spriteMap.get(spriteIdB)
    if (!a || !b) return false
    const bodyA = a.body as Phaser.Physics.Arcade.Body
    const bodyB = b.body as Phaser.Physics.Arcade.Body
    if (!bodyA || !bodyB) return false
    if (!bodyA.enable || !bodyB.enable) return false
    return Phaser.Geom.Intersects.RectangleToRectangle(
      new Phaser.Geom.Rectangle(bodyA.x, bodyA.y, bodyA.width, bodyA.height),
      new Phaser.Geom.Rectangle(bodyB.x, bodyB.y, bodyB.width, bodyB.height),
    )
  }

  // ─── GameSceneProxy 実装 ─────────────────────────────

  /** スプライトが地面に接地しているか */
  isOnGround(spriteId: string): boolean {
    const img = this.spriteMap.get(spriteId)
    if (!img) return false
    const body = img.body as Phaser.Physics.Arcade.Body
    if (!body) return false
    return body.blocked.down || body.touching.down
  }

  /** マウス座標をステージ座標系で返す */
  getMousePosition(): { x: number; y: number } {
    const pointer = this.input.activePointer
    return {
      x: pointer.x - STAGE_WIDTH / 2,
      y: STAGE_HEIGHT / 2 - pointer.y,
    }
  }

  /** ステージ全体の重力を設定 */
  setGravity(y: number) {
    this.physics.world.gravity.y = y
  }

  /** スプライトの速度を設定 */
  setSpriteVelocity(id: string, vx: number, vy: number) {
    const img = this.spriteMap.get(id)
    if (!img) return
    const body = img.body as Phaser.Physics.Arcade.Body
    if (!body) return
    body.setVelocity(vx, vy)
  }

  /** スプライトの物理モードを動的に切り替え */
  setSpritePhysicsMode(id: string, mode: PhysicsMode) {
    const img = this.spriteMap.get(id)
    if (!img) return
    const prevMode = this.physicsModeMap.get(id) ?? "none"
    if (prevMode === mode) return
    this.removeCollidersForSprite(id)
    this.applyPhysicsMode(img, mode)
    this.physicsModeMap.set(id, mode)
    this.addCollidersForSprite(id, mode)
  }

  /** dynamic スプライトの Phaser 位置を読み取り、VM 側に逆同期するためのデータを返す */
  readPhysicsPositions(): { id: string; x: number; y: number; vx: number; vy: number }[] {
    const result: { id: string; x: number; y: number; vx: number; vy: number }[] = []
    for (const [id, img] of this.spriteMap) {
      if (this.physicsModeMap.get(id) !== "dynamic") continue
      const body = img.body as Phaser.Physics.Arcade.Body
      if (!body) continue
      // Phaser 座標 → ステージ座標（中央基準）に変換
      result.push({
        id,
        x: img.x - STAGE_WIDTH / 2,
        y: STAGE_HEIGHT / 2 - img.y,
        vx: body.velocity.x,
        vy: body.velocity.y,
      })
    }
    return result
  }

  /** ワールドバウンズを設定 */
  setWorldBounds(width: number, height: number) {
    this.physics.world.setBounds(0, 0, width, height)
  }

  /** スプライトのバウンス(反発係数)を設定 */
  setSpriteBounce(id: string, bounceX: number, bounceY: number) {
    const img = this.spriteMap.get(id)
    if (!img) return
    const body = img.body as Phaser.Physics.Arcade.Body
    if (!body) return
    body.setBounce(bounceX, bounceY)
  }

  /** スプライトのワールド境界衝突を設定 */
  setSpriteCollideWorldBounds(id: string, enabled: boolean) {
    const img = this.spriteMap.get(id)
    if (!img) return
    const body = img.body as Phaser.Physics.Arcade.Body
    if (!body) return
    body.setCollideWorldBounds(enabled)
  }

  /** スプライトの物理ボディの有効/無効を切り替え */
  setSpriteBodyEnabled(id: string, enabled: boolean) {
    const img = this.spriteMap.get(id)
    if (!img) return
    const body = img.body as Phaser.Physics.Arcade.Body
    if (!body) return
    body.enable = enabled
    img.setVisible(enabled)
  }

  /** 衝突コールバックを登録 */
  registerCollisionCallback(idA: string, idB: string, callback: () => void) {
    const a = this.spriteMap.get(idA)
    const b = this.spriteMap.get(idB)
    if (!a || !b) return
    const collider = this.physics.add.overlap(a, b, () => callback())
    this.activeColliders.push(collider)
  }

  /** スプライトの位置を直接設定（物理ボディも含む） */
  setSpritePosition(id: string, x: number, y: number) {
    const img = this.spriteMap.get(id)
    if (!img) return
    const px = STAGE_WIDTH / 2 + x
    const py = STAGE_HEIGHT / 2 - y
    img.setPosition(px, py)
    const body = img.body as Phaser.Physics.Arcade.Body
    if (body) {
      body.reset(px, py)
    }
  }

  /** 個別の重力有効/無効 */
  setSpriteAllowGravity(id: string, enabled: boolean) {
    const img = this.spriteMap.get(id)
    if (!img) return
    const body = img.body as Phaser.Physics.Arcade.Body
    if (!body) return
    body.setAllowGravity(enabled)
  }

  /** 色かぶせ */
  setSpriteTint(id: string, color: number) {
    const img = this.spriteMap.get(id)
    if (img) img.setTint(color)
  }

  /** 色かぶせ解除 */
  clearSpriteTint(id: string) {
    const img = this.spriteMap.get(id)
    if (img) img.clearTint()
  }

  /** 透明度 (0〜1) */
  setSpriteOpacity(id: string, alpha: number) {
    const img = this.spriteMap.get(id)
    if (img) img.setAlpha(alpha)
  }

  /** 左右反転 */
  setSpriteFlipX(id: string, flip: boolean) {
    const img = this.spriteMap.get(id)
    if (img) img.setFlipX(flip)
  }

  // ─── スプライトごとの Graphics レイヤー ──────────────
  private graphicsMap = new Map<string, Phaser.GameObjects.Graphics>()

  private getOrCreateGraphics(spriteId: string): Phaser.GameObjects.Graphics {
    let g = this.graphicsMap.get(spriteId)
    if (!g) {
      g = this.add.graphics()
      this.graphicsMap.set(spriteId, g)
    }
    return g
  }

  /** 矩形を描画（ステージ座標系） */
  graphicsFillRect(spriteId: string, stageX: number, stageY: number, w: number, h: number, color: number) {
    const g = this.getOrCreateGraphics(spriteId)
    const px = STAGE_WIDTH / 2 + stageX
    const py = STAGE_HEIGHT / 2 - stageY
    g.fillStyle(color)
    g.fillRect(px, py, w, h)
  }

  /** Graphics レイヤーをクリア */
  graphicsClear(spriteId: string) {
    const g = this.graphicsMap.get(spriteId)
    if (g) g.clear()
  }

  /** 浮遊テキスト表示 */
  showFloatingText(text: string, stageX: number, stageY: number) {
    const px = STAGE_WIDTH / 2 + stageX
    const py = STAGE_HEIGHT / 2 - stageY
    const t = this.add.text(px, py, text, {
      fontFamily: "monospace",
      fontSize: "48px",
      color: "#ffcc00",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5)

    this.tweens.add({
      targets: t,
      y: py - 80,
      alpha: 0,
      duration: 1000,
      onComplete: () => t.destroy(),
    })
  }

  /** Tween でスプライトを移動 */
  tweenSprite(id: string, stageX: number, stageY: number, duration: number): Promise<void> {
    const img = this.spriteMap.get(id)
    if (!img) return Promise.resolve()

    const px = STAGE_WIDTH / 2 + stageX
    const py = STAGE_HEIGHT / 2 - stageY

    return new Promise((resolve) => {
      this.tweens.add({
        targets: img,
        x: px,
        y: py,
        duration,
        ease: "Sine.easeInOut",
        onComplete: () => resolve(),
      })
    })
  }

  /** スプライトを削除（クローン用） */
  removeSprite(id: string) {
    const img = this.spriteMap.get(id)
    if (img) {
      img.destroy()
      this.spriteMap.delete(id)
    }
    const speech = this.speechMap.get(id)
    if (speech) {
      speech.destroy()
      this.speechMap.delete(id)
    }
    const gfx = this.graphicsMap.get(id)
    if (gfx) { gfx.destroy(); this.graphicsMap.delete(id) }
    this.colliderMap.delete(id)
    this.currentTextureMap.delete(id)
    this.removeCollidersForSprite(id)
    this.physicsModeMap.delete(id)
  }

  /**
   * スプライトの位置をステージ座標で直接更新（テクスチャ操作なし）
   * ドラッグ中のリアルタイム更新用
   */
  moveSpritePosition(id: string, stageX: number, stageY: number) {
    const img = this.spriteMap.get(id)
    if (!img) return
    img.setPosition(STAGE_WIDTH / 2 + stageX, STAGE_HEIGHT / 2 - stageY)
  }

  // ─── 物理ヘルパー ────────────────────────────────────

  /** ボディの物理モードを適用 */
  private applyPhysicsMode(gameObj: Phaser.GameObjects.Image, mode: PhysicsMode) {
    const body = gameObj.body as Phaser.Physics.Arcade.Body
    if (!body) return

    switch (mode) {
      case "dynamic":
        body.setImmovable(false)
        body.setAllowGravity(true)
        // collideWorldBounds は physics_setcollideworldbounds ブロックで制御
        break
      case "static":
        body.setImmovable(true)
        body.setAllowGravity(false)
        body.setCollideWorldBounds(false)
        body.setVelocity(0, 0)
        break
      case "none":
      default:
        body.setImmovable(true)
        body.setAllowGravity(false)
        body.setCollideWorldBounds(false)
        body.setVelocity(0, 0)
        break
    }
  }

  /** 既存の collider を全クリア */
  private clearColliders() {
    for (const c of this.activeColliders) {
      c.destroy()
    }
    this.activeColliders = []
    this.perSpriteColliders.clear()
  }

  /** 1つのスプライトに関連するコライダーだけを追加（差分方式） */
  private addCollidersForSprite(id: string, mode: PhysicsMode) {
    if (mode === "none") return
    const img = this.spriteMap.get(id)
    if (!img) return

    const newColliders: Phaser.Physics.Arcade.Collider[] = []

    for (const [otherId, otherImg] of this.spriteMap) {
      if (otherId === id) continue
      const otherMode = this.physicsModeMap.get(otherId) ?? "none"
      if (otherMode === "none") continue

      // dynamic × static, dynamic × dynamic のペアのみ
      const shouldCollide =
        (mode === "dynamic" && (otherMode === "static" || otherMode === "dynamic")) ||
        (mode === "static" && otherMode === "dynamic")

      if (shouldCollide) {
        const collider = this.physics.add.collider(img, otherImg)
        this.activeColliders.push(collider)
        newColliders.push(collider)

        // 相手側にもこのコライダーを記録
        const otherList = this.perSpriteColliders.get(otherId) ?? []
        otherList.push(collider)
        this.perSpriteColliders.set(otherId, otherList)
      }
    }

    this.perSpriteColliders.set(id, newColliders)
  }

  /** 1つのスプライトに関連するコライダーだけを削除（差分方式） */
  private removeCollidersForSprite(id: string) {
    const colliders = this.perSpriteColliders.get(id)
    if (!colliders) return

    for (const c of colliders) {
      c.destroy()
      // activeColliders からも除去
      const idx = this.activeColliders.indexOf(c)
      if (idx >= 0) this.activeColliders.splice(idx, 1)
    }
    this.perSpriteColliders.delete(id)

    // 他スプライトの perSpriteColliders からもこのコライダーを除去
    for (const [, list] of this.perSpriteColliders) {
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i].active === false) {
          list.splice(i, 1)
        }
      }
    }
  }

  /** dynamic × static/dynamic 間の collider を全再構築（初期化用） */
  private rebuildColliders() {
    this.clearColliders()
    for (const [id] of this.spriteMap) {
      const mode = this.physicsModeMap.get(id) ?? "none"
      if (mode !== "none") {
        this.addCollidersForSprite(id, mode)
      }
    }
  }

  // ─── カメラ ──────────────────────────────────────────

  cameraFollow(spriteId: string) {
    const img = this.spriteMap.get(spriteId)
    if (img) this.cameras.main.startFollow(img, true, 0.1, 0.1)
  }

  cameraStopFollow() {
    this.cameras.main.stopFollow()
  }

  cameraShake(duration: number, intensity: number) {
    this.cameras.main.shake(duration, intensity)
  }

  cameraZoom(scale: number) {
    this.cameras.main.setZoom(scale)
  }

  cameraFade(duration: number): Promise<void> {
    return new Promise((resolve) => {
      this.cameras.main.fadeOut(duration, 0, 0, 0, (_cam: unknown, progress: number) => {
        if (progress >= 1) resolve()
      })
    })
  }

  // ─── Tween 拡張 ─────────────────────────────────────

  tweenSpriteScale(id: string, scale: number, duration: number): Promise<void> {
    const img = this.spriteMap.get(id)
    if (!img) return Promise.resolve()
    return new Promise((resolve) => {
      this.tweens.add({
        targets: img,
        scaleX: scale,
        scaleY: scale,
        duration,
        ease: "Sine.easeInOut",
        onComplete: () => resolve(),
      })
    })
  }

  tweenSpriteAlpha(id: string, alpha: number, duration: number): Promise<void> {
    const img = this.spriteMap.get(id)
    if (!img) return Promise.resolve()
    return new Promise((resolve) => {
      this.tweens.add({
        targets: img,
        alpha,
        duration,
        ease: "Sine.easeInOut",
        onComplete: () => resolve(),
      })
    })
  }

  tweenSpriteAngle(id: string, angle: number, duration: number): Promise<void> {
    const img = this.spriteMap.get(id)
    if (!img) return Promise.resolve()
    return new Promise((resolve) => {
      this.tweens.add({
        targets: img,
        angle,
        duration,
        ease: "Sine.easeInOut",
        onComplete: () => resolve(),
      })
    })
  }

  // ─── 回転 ────────────────────────────────────────────

  setSpriteAngle(id: string, angle: number) {
    const img = this.spriteMap.get(id)
    if (img) img.setAngle(angle)
  }

  // ─── テキスト拡張 ────────────────────────────────────

  private textAtMap = new Map<string, Phaser.GameObjects.Text>()

  addTextAt(spriteId: string, textId: string, text: string, stageX: number, stageY: number, size: number, color: string) {
    const key = `${spriteId}:${textId}`
    const existing = this.textAtMap.get(key)
    if (existing) existing.destroy()

    const px = STAGE_WIDTH / 2 + stageX
    const py = STAGE_HEIGHT / 2 - stageY
    const t = this.add.text(px, py, text, {
      fontFamily: "monospace",
      fontSize: `${size}px`,
      color,
    }).setOrigin(0, 0).setDepth(100)

    this.textAtMap.set(key, t)
  }

  updateTextAt(_spriteId: string, textId: string, text: string) {
    // テキストIDで直接検索（spriteId付きキー）
    for (const [key, t] of this.textAtMap) {
      if (key.endsWith(`:${textId}`)) {
        t.setText(text)
        return
      }
    }
  }

  removeTextAt(spriteId: string, textId: string) {
    const key = `${spriteId}:${textId}`
    const t = this.textAtMap.get(key)
    if (t) {
      t.destroy()
      this.textAtMap.delete(key)
    }
  }

  // ─── パーティクル ────────────────────────────────────

  emitParticles(stageX: number, stageY: number, count: number, color: number, speed: number) {
    const px = STAGE_WIDTH / 2 + stageX
    const py = STAGE_HEIGHT / 2 - stageY

    // 小さな矩形テクスチャを動的生成
    const key = `particle_${color}`
    if (!this.textures.exists(key)) {
      const gfx = this.add.graphics()
      gfx.fillStyle(color, 1)
      gfx.fillRect(0, 0, 6, 6)
      gfx.generateTexture(key, 6, 6)
      gfx.destroy()
    }

    const emitter = this.add.particles(px, py, key, {
      speed: { min: speed * 0.5, max: speed },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      quantity: count,
      emitting: false,
    })
    emitter.setDepth(90)
    emitter.explode(count)

    // 自動クリーンアップ
    this.time.delayedCall(1000, () => {
      emitter.destroy()
    })
  }

  // ─── シーン制御 ─────────────────────────────────────

  /** カメラ・テキスト等をリセット（実行開始時） */
  resetEffects() {
    this.cameras.main.resetFX()
    this.cameras.main.setZoom(1)
    this.cameras.main.setScroll(0, 0)
    this.cameras.main.stopFollow()
    this.cameras.main.setAlpha(1)

    for (const [, t] of this.textAtMap) t.destroy()
    this.textAtMap.clear()
  }

  /** シーンを一時停止（物理・Tween含む） */
  pauseScene() {
    this.scene.pause()
  }

  /** シーンを再開 */
  resumeScene() {
    this.scene.resume()
  }

  // ── Phase 1-2: 物理プロパティ拡張 ──────────────────────

  private getBody(id: string): Phaser.Physics.Arcade.Body | null {
    const img = this.spriteMap.get(id)
    if (!img) return null
    return (img.body as Phaser.Physics.Arcade.Body) ?? null
  }

  setSpriteAcceleration(id: string, ax: number, ay: number) {
    const body = this.getBody(id)
    if (body) body.setAcceleration(ax, ay)
  }

  setSpriteDrag(id: string, dx: number, dy: number) {
    const body = this.getBody(id)
    if (body) body.setDrag(dx, dy)
  }

  setSpriteDamping(id: string, enabled: boolean) {
    const body = this.getBody(id)
    if (body) body.useDamping = enabled
  }

  setSpriteMaxVelocity(id: string, vx: number, vy: number) {
    const body = this.getBody(id)
    if (body) body.setMaxVelocity(vx, vy)
  }

  setSpriteAngularVelocity(id: string, deg: number) {
    const body = this.getBody(id)
    if (body) body.setAngularVelocity(deg)
  }

  setSpriteImmovable(id: string, enabled: boolean) {
    const body = this.getBody(id)
    if (body) body.setImmovable(enabled)
  }

  setSpriteMass(id: string, mass: number) {
    const body = this.getBody(id)
    if (body) body.setMass(mass)
  }

  setSpritePushable(id: string, enabled: boolean) {
    const body = this.getBody(id)
    if (body) (body as unknown as { pushable: boolean }).pushable = enabled
  }

  worldWrap(id: string, padding: number) {
    const img = this.spriteMap.get(id)
    if (img && this.physics?.world) this.physics.world.wrap(img, padding)
  }

  getSpriteSpeed(id: string): number {
    const body = this.getBody(id)
    if (!body) return 0
    return body.speed
  }

  moveToObject(id: string, targetX: number, targetY: number, speed: number) {
    const img = this.spriteMap.get(id)
    if (!img) return
    const px = STAGE_WIDTH / 2 + targetX
    const py = STAGE_HEIGHT / 2 - targetY
    this.physics.moveTo(img, px, py, speed)
  }

  accelerateToObject(id: string, targetX: number, targetY: number, acceleration: number) {
    const img = this.spriteMap.get(id)
    if (!img) return
    const px = STAGE_WIDTH / 2 + targetX
    const py = STAGE_HEIGHT / 2 - targetY
    this.physics.accelerateTo(img, px, py, acceleration)
  }

  velocityFromAngle(id: string, angle: number, speed: number) {
    const body = this.getBody(id)
    if (!body) return
    const rad = Phaser.Math.DegToRad(angle)
    this.physics.velocityFromRotation(rad, speed, body.velocity)
  }

  // ── Phase 3: 入力拡張 ──────────────────────────────────

  private wheelDelta = 0
  private dragPositions = new Map<string, { x: number; y: number }>()

  isMouseDown(): boolean {
    return this.input.activePointer.isDown
  }

  getMouseWheelDelta(): number {
    const d = this.wheelDelta
    this.wheelDelta = 0
    return d
  }

  enableSpriteDrag(id: string) {
    const img = this.spriteMap.get(id)
    if (!img) return
    if (img.input?.draggable) return
    img.setInteractive({ draggable: true })
    img.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      img.setPosition(dragX, dragY)
      this.dragPositions.set(id, {
        x: dragX - STAGE_WIDTH / 2,
        y: STAGE_HEIGHT / 2 - dragY,
      })
    })
  }

  getSpriteDragPosition(id: string): { x: number; y: number } | null {
    return this.dragPositions.get(id) ?? null
  }

  /** ホイールイベントの初期化（create() から呼ばれる） */
  private initWheelListener() {
    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
      this.wheelDelta = deltaY
    })
  }
}
