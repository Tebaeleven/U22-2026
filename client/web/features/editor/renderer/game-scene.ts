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

      // 対応する SpriteDef からコスチューム dataUrl を取得
      const def = spriteDefs?.find((d) => d.id === sprite.id)
      const costumeIdx = sprite.costumeIndex
      const costume = def?.costumes[costumeIdx]
      const texKey = this.textureKey(sprite.id, costumeIdx)
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
      }

      this.syncSpriteTexture(sprite.id, imageObj, texKey, costume?.dataUrl)

      // 物理モードが変わったら再適用
      const currentPhysMode = sprite.physicsMode ?? "none"
      const prevPhysMode = this.physicsModeMap.get(sprite.id) ?? "none"
      if (currentPhysMode !== prevPhysMode) {
        this.applyPhysicsMode(imageObj, currentPhysMode)
        this.physicsModeMap.set(sprite.id, currentPhysMode)
        this.rebuildColliders()
      }

      // サイズ・可視性を適用
      imageObj.setScale(scale)
      imageObj.setVisible(sprite.visible)

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
        speech.setPosition(px, py - height / 2 - 8)
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
   * 2つのスプライトが接触しているか判定
   */
  checkOverlap(spriteIdA: string, spriteIdB: string): boolean {
    const a = this.spriteMap.get(spriteIdA)
    const b = this.spriteMap.get(spriteIdB)
    if (!a || !b) return false
    const bodyA = a.body as Phaser.Physics.Arcade.Body
    const bodyB = b.body as Phaser.Physics.Arcade.Body
    if (!bodyA || !bodyB) return false
    return this.physics.overlap(a, b)
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
    this.applyPhysicsMode(img, mode)
    this.physicsModeMap.set(id, mode)
    this.rebuildColliders()
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
        body.setCollideWorldBounds(true)
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

  /** 既存の collider をクリア */
  private clearColliders() {
    for (const c of this.activeColliders) {
      c.destroy()
    }
    this.activeColliders = []
  }

  /** dynamic × static/dynamic 間の collider を再構築 */
  private rebuildColliders() {
    this.clearColliders()

    const dynamicSprites: Phaser.GameObjects.Image[] = []
    const staticSprites: Phaser.GameObjects.Image[] = []

    for (const [id, img] of this.spriteMap) {
      const mode = this.physicsModeMap.get(id) ?? "none"
      if (mode === "dynamic") dynamicSprites.push(img)
      else if (mode === "static") staticSprites.push(img)
    }

    // dynamic × static の衝突
    for (const dyn of dynamicSprites) {
      for (const stat of staticSprites) {
        const collider = this.physics.add.collider(dyn, stat)
        this.activeColliders.push(collider)
      }
    }

    // dynamic × dynamic の衝突
    for (let i = 0; i < dynamicSprites.length; i++) {
      for (let j = i + 1; j < dynamicSprites.length; j++) {
        const collider = this.physics.add.collider(dynamicSprites[i], dynamicSprites[j])
        this.activeColliders.push(collider)
      }
    }
  }
}
