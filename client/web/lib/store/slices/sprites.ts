import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import {
  DEFAULT_SPRITES,
  DEFAULT_COLLIDER,
  createDefaultCostume,
  resolveSpriteEmoji,
  type SpriteDef,
  type Costume,
  type ColliderDef,
} from "@/features/editor/constants"
import type { BlockProjectData, SerializedBlockNode } from "@/features/editor/block-editor/types"

// ─── プラットフォーマーデモ用ブロックデータ生成 ──────────

type B = SerializedBlockNode
let _bid = 0
function id(prefix: string) { return `demo-${prefix}-${++_bid}` }

function block(
  instanceId: string,
  defId: string,
  inputValues: Record<string, string> = {},
  extra: Partial<Pick<B, "nextId" | "bodyChildren" | "slotChildren">> = {},
): B {
  return {
    instanceId,
    defId,
    inputValues,
    position: { x: 0, y: 0 },
    nextId: extra.nextId ?? null,
    bodyChildren: extra.bodyChildren ?? [],
    slotChildren: extra.slotChildren ?? {},
  }
}

function hatAt(instanceId: string, defId: string, x: number, y: number, inputValues: Record<string, string> = {}, extra: Partial<Pick<B, "nextId">> = {}): B {
  return { ...block(instanceId, defId, inputValues, extra), position: { x, y } }
}

// ── Phaser サンプル準拠のプラットフォーマー ──────────────
// 対応表: Phaser create() の各セクションをスプライトごとのブロックに分解

function buildPlayerBlocks(): B[] {
  _bid = 0
  const b: B[] = []

  // ── create(): プレイヤー初期化 ──
  // player = physics.add.sprite(100, 400, "player")
  // player.setBounce(0.1); player.setCollideWorldBounds(true)
  // score = 0; hp = 100
  // scoreText = add.text(16, 16, "SCORE: 0")
  const i = ids("p", 10)
  b.push(hatAt(i[0], "builtin:0", 20, 20, {}, { nextId: i[1] }))
  b.push(block(i[1], "builtin:77", { "0": "dynamic" }, { nextId: i[2] }))   // setmode dynamic
  b.push(block(i[2], "builtin:78", { "0": "1000" }, { nextId: i[3] }))      // setgravity 1000
  b.push(block(i[3], "builtin:11", { "0": "-600", "2": "-204" }, { nextId: i[4] })) // gotoxy
  b.push(block(i[4], "builtin:85", { "0": "0.1" }, { nextId: i[5] }))       // setbounce 0.1
  b.push(block(i[5], "builtin:86", { "0": "on" }, { nextId: i[6] }))        // collideWorldBounds on
  b.push(block(i[6], "builtin:59", { "0": "score", "2": "0" }, { nextId: i[7] })) // set score 0
  b.push(block(i[7], "builtin:59", { "0": "hp", "2": "100" }, { nextId: i[8] }))  // set hp 100
  b.push(block(i[8], "builtin:74", { "0": "SCORE: 0", "2": "-800", "4": "480" })) // addtext

  // ── update(): 左右移動 + ジャンプ ──
  // if (left) vx=-250; else if (right) vx=250; else vx=0
  // if (up && blocked.down) vy=-550
  const m = ids("pm", 14)
  b.push(hatAt(m[0], "builtin:0", 20, 500, {}, { nextId: m[1] }))
  b.push(block(m[1], "builtin:30", {}, { bodyChildren: [[m[2], m[9]]] }))     // forever
  // if-else left
  b.push(block(m[2], "builtin:32", {}, { nextId: m[9], slotChildren: { "0": m[3] }, bodyChildren: [[m[4]], [m[5]]] }))
  b.push(block(m[3], "builtin:38", { "0": "left arrow" }))                    // key left
  b.push(block(m[4], "builtin:80", { "0": "-250" }))                          // setvx -250
  // else → if-else right
  b.push(block(m[5], "builtin:32", {}, { slotChildren: { "0": m[6] }, bodyChildren: [[m[7]], [m[8]]] }))
  b.push(block(m[6], "builtin:38", { "0": "right arrow" }))                   // key right
  b.push(block(m[7], "builtin:80", { "0": "250" }))                           // setvx 250
  b.push(block(m[8], "builtin:80", { "0": "0" }))                             // setvx 0
  // if (up AND onground) → jump
  b.push(block(m[9], "builtin:31", {}, { slotChildren: { "0": m[10] }, bodyChildren: [[m[13]]] }))
  b.push(block(m[10], "builtin:51", {}, { slotChildren: { "0": m[11], "2": m[12] } })) // and
  b.push(block(m[11], "builtin:38", { "0": "up arrow" }))
  b.push(block(m[12], "builtin:84"))                                           // onground
  b.push(block(m[13], "builtin:81", { "0": "-550" }))                         // setvy -550

  // ── overlap(player, coins) → collectCoin ──
  // coin.disableBody(); score+=10; scoreText.setText("SCORE: "+score)
  // floatingText("+10")
  const c = ids("pc", 10)
  b.push(hatAt(c[0], "builtin:0", 500, 20, {}, { nextId: c[1] }))
  b.push(block(c[1], "builtin:30", {}, { bodyChildren: [[c[2]]] }))           // forever
  b.push(block(c[2], "builtin:31", {}, { slotChildren: { "0": c[3] }, bodyChildren: [[c[4], c[5], c[6], c[9]]] }))
  b.push(block(c[3], "builtin:37", { "0": "コイン" }))                         // touching コイン
  b.push(block(c[4], "builtin:60", { "0": "score", "2": "10" }, { nextId: c[5] }))  // change score +10
  b.push(block(c[5], "builtin:6", { "0": "coin-hit", "2": "" }, { nextId: c[6] }))   // send event coin-hit
  // updatetext → join("SCORE: ", score)
  b.push(block(c[6], "builtin:75", {}, { nextId: c[9], slotChildren: { "0": c[7] } }))
  b.push(block(c[7], "builtin:54", { "0": "SCORE: " }, { slotChildren: { "1": c[8] } }))
  b.push(block(c[8], "builtin:58", { "0": "score" }))
  b.push(block(c[9], "builtin:27", { "0": "0.5" }))                           // wait 0.5 (debounce)

  // ── overlap(player, enemies) → hitEnemy ──
  // if (vy>0 && player.y < enemy.y) → 踏みつけ: enemy.disable, vy=-350, score+=50
  // else → ダメージ: hp-=20, tint red, opacity 50%, knockback, wait, clear
  const e = ids("pe", 16)
  b.push(hatAt(e[0], "builtin:0", 500, 500, {}, { nextId: e[1] }))
  b.push(block(e[1], "builtin:30", {}, { bodyChildren: [[e[2]]] }))           // forever
  b.push(block(e[2], "builtin:31", {}, { slotChildren: { "0": e[3] }, bodyChildren: [[e[4], e[5], e[6], e[7], e[8], e[9], e[10], e[11], e[12]]] }))
  b.push(block(e[3], "builtin:37", { "0": "敵" }))                             // touching 敵
  // ダメージ処理: tint → hp -= 20 → updatetext → opacity 50% → knockback → wait → cleartint → wait → restore
  b.push(block(e[4], "builtin:92", { "0": "#ff0000" }, { nextId: e[5] }))      // settint red
  b.push(block(e[5], "builtin:60", { "0": "hp", "2": "-20" }, { nextId: e[6] })) // change hp -20
  b.push(block(e[6], "builtin:75", {}, { nextId: e[7], slotChildren: { "0": e[13] } })) // updatetext
  b.push(block(e[7], "builtin:94", { "0": "50" }, { nextId: e[8] }))           // setopacity 50
  b.push(block(e[8], "builtin:81", { "0": "-400" }, { nextId: e[9] }))         // knockback (setvy -400)
  b.push(block(e[9], "builtin:27", { "0": "0.2" }, { nextId: e[10] }))         // wait 0.2
  b.push(block(e[10], "builtin:93", {}, { nextId: e[11] }))                    // cleartint
  b.push(block(e[11], "builtin:27", { "0": "0.8" }, { nextId: e[12] }))        // wait 0.8
  b.push(block(e[12], "builtin:94", { "0": "100" }))                           // setopacity 100
  // join("SCORE: ", score, "  HP: ", hp) — 簡略化: join 2段
  b.push(block(e[13], "builtin:54", { "0": "HP: " }, { slotChildren: { "1": e[14] } }))
  b.push(block(e[14], "builtin:58", { "0": "hp" }))

  // ── update(): 弾丸発射 (スペースキー) ──
  // Phaser: if (fireKey.isDown) fireBullet()
  const f = ids("pf", 2)
  b.push(hatAt(f[0], "builtin:1", 1000, 20, { "0": "space" }, { nextId: f[1] }))
  b.push(block(f[1], "builtin:69", { "0": "弾" }))                            // clone_create 弾

  // ── HPバー描画 ──
  // Phaser: drawHpBar() { hpBar.clear(); fillRect(16, 46, 200 * (hp/maxHp), 16) }
  // ブロック: forever { clear → fillRect(背景) → fillRect(ゲージ, w = hp * 4) }
  const h = ids("ph", 8)
  b.push(hatAt(h[0], "builtin:0", 1000, 300, {}, { nextId: h[1] }))
  b.push(block(h[1], "builtin:30", {}, { bodyChildren: [[h[2], h[3], h[4]]] }))  // forever
  // graphics_clear: builtin:98
  b.push(block(h[2], "builtin:98", {}, { nextId: h[3] }))
  // fillRect 背景 (x:-800 y:440 w:400 h:32 color:#333333)
  b.push(block(h[3], "builtin:97", { "0": "-800", "2": "440", "4": "400", "6": "32", "8": "#333333" }, { nextId: h[4] }))
  // fillRect ゲージ — W 入力(index 4)に hp*4 レポーターをネスト
  // graphics_fillrect inputs: [0:X, 1:label, 2:Y, 3:label, 4:W, 5:label, 6:H, 7:label, 8:COLOR]
  b.push(block(h[4], "builtin:97", { "0": "-800", "2": "440", "6": "32", "8": "#00ff00" }, {
    slotChildren: { "4": h[5] },  // W = hp * 4
  }))
  // operator_multiply: builtin:45, inputs: [0:NUM1, 1:label"*", 2:NUM2]
  // NUM1 = 変数 hp, NUM2 = 4
  b.push(block(h[5], "builtin:45", { "2": "4" }, {
    slotChildren: { "0": h[6] },  // NUM1 = variable hp
  }))
  b.push(block(h[6], "builtin:58", { "0": "hp" }))  // data_variable hp

  return b
}

/** ID を一括生成するヘルパー */
function ids(prefix: string, count: number): string[] {
  return Array.from({ length: count }, () => id(prefix))
}

function buildStaticBlocks(x: string, y: string): B[] {
  const i = ids("s", 3)
  return [
    hatAt(i[0], "builtin:0", 20, 20, {}, { nextId: i[1] }),
    block(i[1], "builtin:77", { "0": "static" }, { nextId: i[2] }),
    block(i[2], "builtin:11", { "0": x, "2": y }),
  ]
}

function buildGroundBlocks(): B[] { _bid = 100; return buildStaticBlocks("0", "-380") }
function buildPlatform1Blocks(): B[] { _bid = 200; return buildStaticBlocks("-400", "-40") }
function buildPlatform2Blocks(): B[] { _bid = 250; return buildStaticBlocks("400", "200") }

function buildCoinBlocks(): B[] {
  _bid = 300
  const i = ids("c", 7)
  return [
    // 初期化: dynamic → 重力なし → 位置設定（浮遊コイン）
    hatAt(i[0], "builtin:0", 20, 20, {}, { nextId: i[1] }),
    block(i[1], "builtin:77", { "0": "dynamic" }, { nextId: i[2] }),
    block(i[2], "builtin:91", { "0": "off" }, { nextId: i[3] }),  // allowGravity off
    block(i[3], "builtin:11", { "0": "400", "2": "280" }),        // gotoxy (浮島2の上)
    // coin-hit イベント受信 → disableBody (Phaser: c.disableBody(true,true))
    hatAt(i[4], "builtin:7", 20, 280, { "0": "coin-hit" }, { nextId: i[5] }),
    block(i[5], "builtin:87", {}, { nextId: i[6] }),               // disablebody
    block(i[6], "builtin:96", { "0": "+10" }),                     // floatingtext "+10"
  ]
}

function buildEnemyBlocks(): B[] {
  _bid = 400
  // Phaser: enemy.setCollideWorldBounds(true); enemy.setBounce(1,0); enemy.setVelocityX(80)
  const i = ids("e", 14)
  return [
    // 初期化
    hatAt(i[0], "builtin:0", 20, 20, {}, { nextId: i[1] }),
    block(i[1], "builtin:77", { "0": "dynamic" }, { nextId: i[2] }),
    block(i[2], "builtin:78", { "0": "1000" }, { nextId: i[3] }),   // gravity 1000
    block(i[3], "builtin:11", { "0": "200", "2": "-236" }, { nextId: i[4] }),
    block(i[4], "builtin:80", { "0": "80" }, { nextId: i[5] }),     // setvx 80
    block(i[5], "builtin:85", { "0": "1" }, { nextId: i[6] }),      // bounce 1
    block(i[6], "builtin:86", { "0": "on" }),                       // collideWorldBounds on

    // Phaser: overlap(bullets, enemies, bulletHitEnemy)
    // → 弾に触れたら: disableBody + score+=30 + floatingText
    // event_whentouched: builtin:99
    hatAt(i[7], "builtin:99", 20, 400, { "0": "弾" }, { nextId: i[8] }),
    block(i[8], "builtin:87", {}, { nextId: i[9] }),                 // disablebody (敵を消す)
    block(i[9], "builtin:60", { "0": "score", "2": "30" }, { nextId: i[10] }), // change score +30
    // updatetext → join("SCORE: ", score)
    block(i[10], "builtin:75", {}, { nextId: i[13], slotChildren: { "0": i[11] } }),
    block(i[11], "builtin:54", { "0": "SCORE: " }, { slotChildren: { "1": i[12] } }),
    block(i[12], "builtin:58", { "0": "score" }),
    block(i[13], "builtin:96", { "0": "+30" }),                      // floatingtext "+30"
  ]
}

function buildBulletBlocks(): B[] {
  _bid = 500
  // Phaser: bullet pool → enableBody → allowGravity=false → vx=500 → delayedCall(2000, disable)
  const i = ids("b", 9)
  return [
    hatAt(i[0], "builtin:0", 20, 20, {}, { nextId: i[1] }),
    block(i[1], "builtin:25"),                                      // hide (初期は非表示)

    hatAt(i[2], "builtin:70", 20, 160, {}, { nextId: i[3] }),       // when cloned
    block(i[3], "builtin:24", {}, { nextId: i[4] }),                // show
    block(i[4], "builtin:77", { "0": "dynamic" }, { nextId: i[5] }),// setmode dynamic
    block(i[5], "builtin:91", { "0": "off" }, { nextId: i[6] }),    // allowGravity off
    block(i[6], "builtin:80", { "0": "500" }, { nextId: i[7] }),    // setvx 500
    block(i[7], "builtin:27", { "0": "2" }, { nextId: i[8] }),      // wait 2
    block(i[8], "builtin:71"),                                      // delete clone
  ]
}

function buildHpBarBlocks(): B[] {
  // HPバースプライト — 非表示（プレイヤーが graphics_fillrect で描画するため自身は不要）
  _bid = 600
  return []
}

function makeBlockData(blocks: B[], customVars?: string[]): BlockProjectData {
  return {
    customProcedures: [],
    customVariables: customVars,
    workspace: { blocks },
  }
}

const DEFAULT_BLOCK_DATA: Record<string, BlockProjectData> = {
  "sprite-player": makeBlockData(buildPlayerBlocks(), ["score", "hp"]),
  "sprite-ground": makeBlockData(buildGroundBlocks()),
  "sprite-platform1": makeBlockData(buildPlatform1Blocks()),
  "sprite-platform2": makeBlockData(buildPlatform2Blocks()),
  "sprite-coin": makeBlockData(buildCoinBlocks()),
  "sprite-enemy": makeBlockData(buildEnemyBlocks()),
  "sprite-bullet": makeBlockData(buildBulletBlocks()),
  "sprite-hpbar": makeBlockData(buildHpBarBlocks()),
}

// ─── Redux Slice ──────────────────────────────────────

interface SpritesState {
  list: SpriteDef[]
  selectedId: string
  /** 実行前のスナップショット（停止時に復元用） */
  snapshotBeforeRun: SpriteDef[] | null
  /** スプライトごとのブロックデータ（spriteId → BlockProjectData） */
  blockDataMap: Record<string, BlockProjectData>
}

const initialState: SpritesState = {
  list: DEFAULT_SPRITES,
  selectedId: DEFAULT_SPRITES[0].id,
  snapshotBeforeRun: null,
  blockDataMap: DEFAULT_BLOCK_DATA,
}

const spritesSlice = createSlice({
  name: "sprites",
  initialState,
  reducers: {
    setSprites(state, action: PayloadAction<SpriteDef[]>) {
      state.list = action.payload
    },
    selectSprite(state, action: PayloadAction<string>) {
      state.selectedId = action.payload
    },
    addSprite(state) {
      const id = `sprite-${Date.now()}`
      const emoji = resolveSpriteEmoji(undefined, state.list.length)
      const newSprite: SpriteDef = {
        id,
        name: `スプライト${state.list.length + 1}`,
        emoji,
        costumes: [createDefaultCostume("コスチューム1", emoji)],
        currentCostumeIndex: 0,
        collider: { ...DEFAULT_COLLIDER },
        x: Math.random() * 200 - 100,
        y: Math.random() * 200 - 100,
        size: 100,
        direction: 90,
        visible: true,
      }
      state.list.push(newSprite)
      state.selectedId = id
    },
    deleteSprite(state, action: PayloadAction<string>) {
      if (state.list.length <= 1) return
      const id = action.payload
      state.list = state.list.filter((s) => s.id !== id)
      if (state.selectedId === id) {
        state.selectedId = state.list[0].id
      }
    },
    updateSprite(
      state,
      action: PayloadAction<{ id: string; changes: Partial<SpriteDef> }>
    ) {
      const sprite = state.list.find((s) => s.id === action.payload.id)
      if (sprite) {
        Object.assign(sprite, action.payload.changes)
      }
    },

    // ─── コスチューム操作 ──────────────────────────

    /** コスチュームを追加 */
    addCostume(
      state,
      action: PayloadAction<{ spriteId: string; costume: Costume }>
    ) {
      const sprite = state.list.find((s) => s.id === action.payload.spriteId)
      if (sprite) {
        sprite.costumes.push(action.payload.costume)
      }
    },
    /** コスチュームを更新（dataUrl 等） */
    updateCostume(
      state,
      action: PayloadAction<{
        spriteId: string
        costumeId: string
        changes: Partial<Costume>
      }>
    ) {
      const sprite = state.list.find((s) => s.id === action.payload.spriteId)
      if (!sprite) return
      const costume = sprite.costumes.find(
        (c) => c.id === action.payload.costumeId
      )
      if (costume) {
        Object.assign(costume, action.payload.changes)
      }
    },
    /** コスチュームを削除（最低1つは残す） */
    deleteCostume(
      state,
      action: PayloadAction<{ spriteId: string; costumeId: string }>
    ) {
      const sprite = state.list.find((s) => s.id === action.payload.spriteId)
      if (!sprite || sprite.costumes.length <= 1) return
      const idx = sprite.costumes.findIndex(
        (c) => c.id === action.payload.costumeId
      )
      if (idx === -1) return
      sprite.costumes.splice(idx, 1)
      // インデックスが範囲外にならないように調整
      if (sprite.currentCostumeIndex >= sprite.costumes.length) {
        sprite.currentCostumeIndex = sprite.costumes.length - 1
      }
    },
    /** 現在のコスチュームを切り替え */
    setCostumeIndex(
      state,
      action: PayloadAction<{ spriteId: string; index: number }>
    ) {
      const sprite = state.list.find((s) => s.id === action.payload.spriteId)
      if (sprite && action.payload.index >= 0 && action.payload.index < sprite.costumes.length) {
        sprite.currentCostumeIndex = action.payload.index
      }
    },

    // ─── 当たり判定設定 ─────────────────────────────

    /** 当たり判定の設定を更新 */
    setCollider(
      state,
      action: PayloadAction<{ spriteId: string; collider: ColliderDef }>
    ) {
      const sprite = state.list.find((s) => s.id === action.payload.spriteId)
      if (sprite) {
        sprite.collider = action.payload.collider
      }
    },

    // ─── スナップショット ───────────────────────────

    saveSnapshot(state) {
      state.snapshotBeforeRun = state.list.map((s) => ({
        ...s,
        costumes: s.costumes.map((c) => ({ ...c })),
        collider: { ...s.collider },
      }))
    },
    restoreSnapshot(state) {
      if (state.snapshotBeforeRun) {
        // 実行終了時の最終位置を保持
        const finalPositions = new Map(
          state.list.map((s) => [s.id, { x: s.x, y: s.y, direction: s.direction }])
        )
        state.list = state.snapshotBeforeRun
        // スナップショットに最終位置を適用
        for (const sprite of state.list) {
          const pos = finalPositions.get(sprite.id)
          if (pos) {
            sprite.x = pos.x
            sprite.y = pos.y
            sprite.direction = pos.direction
          }
        }
        state.snapshotBeforeRun = null
      }
    },
    // ─── スプライトごとのブロックデータ ────────────

    /** 指定スプライトのブロックデータを保存 */
    saveBlockData(
      state,
      action: PayloadAction<{ spriteId: string; data: BlockProjectData }>
    ) {
      state.blockDataMap[action.payload.spriteId] = action.payload.data
    },
    /** プロジェクト読み込み時に全スプライトのブロックデータを一括セット */
    loadAllBlockData(
      state,
      action: PayloadAction<Record<string, BlockProjectData>>
    ) {
      state.blockDataMap = action.payload
    },

    // VM から一括でスプライト位置を更新
    batchUpdatePositions(
      state,
      action: PayloadAction<
        Array<{ id: string; x: number; y: number; direction: number; costumeIndex?: number }>
      >
    ) {
      for (const update of action.payload) {
        const sprite = state.list.find((s) => s.id === update.id)
        if (sprite) {
          sprite.x = update.x
          sprite.y = update.y
          sprite.direction = update.direction
          if (update.costumeIndex !== undefined) {
            sprite.currentCostumeIndex = update.costumeIndex
          }
        }
      }
    },
  },
})

export const {
  setSprites,
  selectSprite,
  addSprite,
  deleteSprite,
  updateSprite,
  addCostume,
  updateCostume,
  deleteCostume,
  setCostumeIndex,
  setCollider,
  saveSnapshot,
  restoreSnapshot,
  batchUpdatePositions,
  saveBlockData,
  loadAllBlockData,
} = spritesSlice.actions
export default spritesSlice.reducer
