// AST → SerializedBlockNode[] 変換（メインのブロック生成ロジック）

import type { BlockProjectData, SerializedBlockNode } from "../block-editor/types"
import { BUILTIN_BLOCK_DEFS } from "../block-editor/blocks"
import type {
  ProgramAST,
  SpriteAST,
  ScriptAST,
  HatNode,
  StatementNode,
  ExprNode,
} from "./ast-types"

// ── opcode → defId 逆引きマップ（モジュールロード時に構築） ──

const opcodeToDefId = new Map<string, string>()
for (const def of BUILTIN_BLOCK_DEFS) {
  if (def.opcode) {
    opcodeToDefId.set(def.opcode, def.id)
  }
}

// ── 関数名 → opcode マッピング（要件書 §3-3 準拠） ──

const FUNC_TO_OPCODE: Record<string, string> = {
  // motion
  move: "motion_movesteps",
  turnRight: "motion_turnright",
  turnLeft: "motion_turnleft",
  goto: "motion_gotoxy",
  setPosition: "motion_gotoxy",
  glide: "motion_glidesecstoxy",
  tweenTo: "motion_tweento",
  setX: "motion_setx",
  setY: "motion_sety",
  changeXBy: "motion_changexby",
  changeYBy: "motion_changeyby",
  ifOnEdgeBounce: "motion_ifonedgebounce",
  setAngle: "motion_setangle",
  // physics
  setVelocityX: "physics_setvelocityX",
  setVelocityY: "physics_setvelocityY",
  setVelocity: "physics_setvelocity",
  setPhysics: "physics_setmode",
  setGravity: "physics_setgravity",
  setBounce: "physics_setbounce",
  setCollideWorldBounds: "physics_setcollideworldbounds",
  setAllowGravity: "physics_setallowgravity",
  disableBody: "physics_disablebody",
  enableBody: "physics_enablebody",
  onCollide: "physics_oncollide",
  // Phase 1-2: 物理プロパティ拡張
  setAcceleration: "physics_setacceleration",
  setAccelerationX: "physics_setaccelerationx",
  setAccelerationY: "physics_setaccelerationy",
  setDrag: "physics_setdrag",
  setDamping: "physics_setdamping",
  setMaxVelocity: "physics_setmaxvelocity",
  setAngularVelocity: "physics_setangularvelocity",
  setImmovable: "physics_setimmovable",
  setMass: "physics_setmass",
  setPushable: "physics_setpushable",
  worldWrap: "physics_worldwrap",
  moveTo: "physics_moveto",
  accelerateTo: "physics_accelerateto",
  velocityFromAngle: "physics_velocityfromangle",
  // looks
  show: "looks_show",
  hide: "looks_hide",
  say: "looks_sayforsecs",
  think: "looks_think",
  setSize: "looks_setsizeto",
  setCostume: "looks_switchcostumeto",
  nextCostume: "looks_nextcostume",
  setTint: "looks_settint",
  clearTint: "looks_cleartint",
  setAlpha: "looks_setopacity",
  setFlipX: "looks_setflipx",
  addText: "looks_addtext",
  setText: "looks_updatetext",
  removeText: "looks_removetext",
  floatingText: "looks_floatingtext",
  // tween 拡張
  tweenScale: "tween_scale",
  tweenAlpha: "tween_alpha",
  tweenAngle: "tween_angle",
  // テキスト拡張
  addTextAt: "text_addat",
  updateTextAt: "text_updateat",
  removeTextAt: "text_removeat",
  // パーティクル
  emitParticles: "particle_emit",
  // graphics
  "graphics.fillRect": "graphics_fillrect",
  "graphics.clear": "graphics_clear",
  // control
  wait: "control_wait",
  waitUntil: "control_wait_until",
  stop: "control_stop",
  restart: "control_restart",
  // タイマー
  setInterval: "timer_setinterval",
  clearInterval: "timer_clearinterval",
  setTimeout: "timer_settimeout",
  // clone
  createClone: "clone_create",
  deleteClone: "clone_delete",
  // events
  emit: "observer_sendevent",
  unwatch: "observer_stopwatching",
  // sensing (ブーリアン/レポーター)
  touching: "sensing_touchingobject",
  isKeyPressed: "sensing_keypressed",
  isKeyJustDown: "sensing_keyjustdown",
  isOnGround: "physics_onground",
  // Phase 3: 入力拡張
  enableDrag: "sensing_enabledrag",
  // Phase 4: アニメーション拡張
  createAnim: "anim_create",
  playAnim: "anim_play",
  stopAnim: "anim_stop",
  onAnimComplete: "anim_oncomplete",
  // Phase 5: オーディオ
  playSound: "sound_play",
  playSoundLoop: "sound_playloop",
  stopSound: "sound_stop",
  setSoundVolume: "sound_setvolume",
  // カメラ
  cameraFollow: "camera_follow",
  cameraStopFollow: "camera_stopfollow",
  cameraShake: "camera_shake",
  cameraZoom: "camera_zoom",
  cameraFade: "camera_fade",
  // 数学（関数呼び出し型）
  angleTo: "math_angleto",
  distanceTo: "math_distanceto",
  // variables (表示)
  showVariable: "data_showvariable",
  hideVariable: "data_hidevariable",
  // operators
  join: "operator_join",
  random: "operator_random",
  round: "operator_round",
  resetTimer: "sensing_resettimer",
  // 数学（グローバル関数型）
  randomInt: "math_randomint",
  abs: "math_abs",
  min: "math_min",
  max: "math_max",
  sin: "math_sin",
  cos: "math_cos",
  // procedures
  "return": "procedures_return",
  // ── モダン言語拡張 ──
  // 数学
  lerp: "math_lerp",
  clamp: "math_clamp",
  floor: "math_floor",
  ceil: "math_ceil",
  sqrt: "math_sqrt",
  pow: "math_pow",
  atan2: "math_atan2",
  tan: "math_tan",
  sign: "math_sign",
  remap: "math_remap",
  // 文字列操作
  letterOf: "operator_letter_of",
  contains: "operator_contains",
  substring: "operator_substring",
  split: "operator_split",
  replace: "operator_replace",
  toNumber: "operator_tonum",
  toText: "operator_tostr",
  // 状態マシン
  setState: "state_set",
  // シーン管理
  switchScene: "scene_switch",
  setTimeScale: "scene_timescale",
  save: "scene_save",
  load: "scene_load",
  // スプライト操作
  propertyOf: "sprite_getprop",
  setLayer: "sprite_setlayer",
  addTag: "sprite_addtag",
  removeTag: "sprite_removetag",
  // スプライト操作（ブーリアン）
  hasTag: "sprite_hastag",
  stateIs: "state_is",
  // 辞書操作
  dictSet: "data_dictset",
  dictGet: "data_dictget",
  dictDelete: "data_dictdelete",
  dictHas: "data_dicthas",
  dictKeys: "data_dictkeys",
  dictLength: "data_dictlength",
  // リスト操作拡充
  listInsert: "data_insertatlist",
  listReplace: "data_replaceitemoflist",
  listContains: "data_listcontainsitem",
  // イージング付き Tween
  tweenToEase: "motion_tweento_ease",
  tweenScaleEase: "tween_scale_ease",
  tweenAlphaEase: "tween_alpha_ease",
  tweenAngleEase: "tween_angle_ease",
  // Phase 4: Phaser API 拡張
  setBodySize: "physics_setbodysize",
  setBodyOffset: "physics_setbodyoffset",
  setCircle: "physics_setcircle",
  setOrigin: "looks_setorigin",
  setScrollFactor: "looks_setscrollfactor",
  setBackground: "scene_setbackground",
}

// ── レポーター名 → opcode マッピング（式中の変数/レポーター） ──

const REPORTER_MAP: Record<string, string> = {
  x: "motion_xposition",
  y: "motion_yposition",
  direction: "motion_direction",
  angle: "motion_angle",
  mouseX: "sensing_mousex",
  mouseY: "sensing_mousey",
  timer: "sensing_timer",
  costumeNumber: "looks_costumenumber",
  velocityX: "physics_velocityX",
  velocityY: "physics_velocityY",
  physicsSpeed: "physics_speed",
  mouseDown: "sensing_mousedown",
  mouseWheel: "sensing_mousewheel",
  collisionTarget: "physics_collisiontarget",
  newValue: "observer_newvalue",
  oldValue: "observer_oldvalue",
  eventData: "observer_eventdata",
  // ── モダン言語拡張 ──
  state: "state_get",
  currentScene: "scene_current",
  layer: "sprite_getlayer",
  pi: "math_pi",
  tagLoopTarget: "sprite_taglooptarget",
}

// プロパティアクセス形式のレポーター（velocity.x 等）
const PROPERTY_REPORTER_MAP: Record<string, Record<string, string>> = {
  velocity: {
    x: "physics_velocityX",
    y: "physics_velocityY",
  },
}

// 二項演算子 → opcode
const BINARY_OP_MAP: Record<string, string> = {
  "+": "operator_add",
  "-": "operator_subtract",
  "*": "operator_multiply",
  "/": "operator_divide",
  "%": "operator_mod",
  ">": "operator_gt",
  "<": "operator_lt",
  ">=": "operator_gte",
  "<=": "operator_lte",
  "==": "operator_equals",
  "!=": "operator_neq",
  "&&": "operator_and",
  "||": "operator_or",
}

// ── 引数インデックスマップのキャッシュ ──
// opcode → (位置引数インデックス → ブロック定義の inputs 配列インデックス)
const argIndexMapCache = new Map<string, number[]>()

function buildArgIndexMap(opcode: string): number[] {
  const cached = argIndexMapCache.get(opcode)
  if (cached) return cached

  const defId = opcodeToDefId.get(opcode)
  if (!defId) return []

  const def = BUILTIN_BLOCK_DEFS.find((d) => d.id === defId)
  if (!def) return []

  const indices: number[] = []
  for (let i = 0; i < def.inputs.length; i++) {
    if (def.inputs[i].type !== "label") {
      indices.push(i)
    }
  }

  argIndexMapCache.set(opcode, indices)
  return indices
}

// ── ハットの opcode マッピング ──

function hatToOpcode(hat: HatNode): { opcode: string; inputValues: Record<string, string> } {
  switch (hat.type) {
    case "flagClicked":
      return { opcode: "event_whenflagclicked", inputValues: {} }
    case "keyPress": {
      const argIdx = buildArgIndexMap("event_whenkeypressed")
      return { opcode: "event_whenkeypressed", inputValues: { [String(argIdx[0])]: hat.key } }
    }
    case "clone":
      return { opcode: "clone_whencloned", inputValues: {} }
    case "touched": {
      const argIdx = buildArgIndexMap("event_whentouched")
      return { opcode: "event_whentouched", inputValues: { [String(argIdx[0])]: hat.target } }
    }
    case "event": {
      const argIdx = buildArgIndexMap("observer_wheneventreceived")
      return { opcode: "observer_wheneventreceived", inputValues: { [String(argIdx[0])]: hat.name } }
    }
    case "varChange": {
      const argIdx = buildArgIndexMap("observer_whenvarchanges")
      return { opcode: "observer_whenvarchanges", inputValues: { [String(argIdx[0])]: hat.variable } }
    }
    case "liveWhen": {
      const argIdx = buildArgIndexMap("live_when")
      return { opcode: "live_when", inputValues: { [String(argIdx[0])]: hat.variable } }
    }
    case "liveUpon": {
      const argIdx = buildArgIndexMap("live_upon")
      return { opcode: "live_upon", inputValues: { [String(argIdx[0])]: hat.variable } }
    }
  }
}

// ── ブロックジェネレーター ──

class BlockGenerator {
  private blocks: SerializedBlockNode[] = []
  private idCounter = 0
  private prefix: string
  private customVariables = new Set<string>()

  constructor(prefix: string) {
    this.prefix = prefix
  }

  // ── メインエントリ ──

  generateSprite(sprite: SpriteAST): BlockProjectData {
    for (let i = 0; i < sprite.scripts.length; i++) {
      const col = Math.floor(i / 2)
      const row = i % 2
      const x = 20 + col * 480
      const y = 20 + row * 480
      this.generateScript(sprite.scripts[i], x, y)
    }

    return {
      customProcedures: [],
      customVariables: this.customVariables.size > 0
        ? Array.from(this.customVariables)
        : undefined,
      workspace: { blocks: this.blocks },
    }
  }

  // ── スクリプト ──

  private generateScript(script: ScriptAST, x: number, y: number): void {
    const { opcode, inputValues } = hatToOpcode(script.hat)
    const defId = opcodeToDefId.get(opcode)!
    const hatId = this.addBlock(defId, inputValues, { position: { x, y } })

    const firstBodyId = this.generateStatements(script.body)
    if (firstBodyId) {
      this.setNextId(hatId, firstBodyId)
    }
  }

  // ── 文チェーン生成 ──

  private generateStatements(stmts: StatementNode[]): string | null {
    if (stmts.length === 0) return null

    let firstId: string | null = null
    let prevId: string | null = null

    for (const stmt of stmts) {
      const id = this.generateStatement(stmt)
      if (!firstId) firstId = id
      if (prevId) this.setNextId(prevId, id)
      prevId = id
    }

    return firstId
  }

  // ── 文ディスパッチ ──

  private generateStatement(stmt: StatementNode): string {
    switch (stmt.type) {
      case "call": return this.generateCallStatement(stmt.name, stmt.args)
      case "assign": return this.generateAssign(stmt.variable, stmt.value)
      case "changeBy": return this.generateChangeBy(stmt.variable, stmt.value)
      case "if": return this.generateIf(stmt)
      case "ifElse": return this.generateIfElse(stmt)
      case "forever": return this.generateForever(stmt)
      case "while": return this.generateWhileUntil(stmt)
      case "repeat": return this.generateRepeat(stmt)
      case "for": return this.generateForRange(stmt)
      case "forEach": return this.generateForEach(stmt)
      case "spawn": return this.generateSpawn(stmt)
      case "batch": return this.generateBatch(stmt)
      case "varDecl": return this.generateAssign(stmt.name, stmt.value)
      case "liveAssign": return this.generateLiveAssign(stmt.variable, stmt.value)
      case "break": return this.generateSimpleBlock("control_break")
      case "continue": return this.generateSimpleBlock("control_continue")
      case "return": return this.generateReturn(stmt)
    }
  }

  // ── 関数呼び出し（文） ──

  private generateCallStatement(name: string, args: ExprNode[]): string {
    const opcode = FUNC_TO_OPCODE[name]
    if (!opcode) {
      throw new Error(`Unknown function: ${name}`)
    }

    const defId = opcodeToDefId.get(opcode)
    if (!defId) {
      throw new Error(`No block def found for opcode: ${opcode}`)
    }

    const argIdxMap = buildArgIndexMap(opcode)
    const inputValues: Record<string, string> = {}
    const slotChildren: Record<string, string> = {}

    for (let i = 0; i < args.length; i++) {
      if (i >= argIdxMap.length) break
      const inputIdx = String(argIdxMap[i])
      this.resolveExprToSlot(args[i], inputIdx, inputValues, slotChildren)
    }

    return this.addBlock(defId, inputValues, { slotChildren })
  }

  // ── 代入 ──

  private generateAssign(variable: string, value: ExprNode): string {
    this.customVariables.add(variable)
    const opcode = "data_setvariableto"
    const defId = opcodeToDefId.get(opcode)!
    const argIdxMap = buildArgIndexMap(opcode)

    const inputValues: Record<string, string> = {
      [String(argIdxMap[0])]: variable,
    }
    const slotChildren: Record<string, string> = {}
    this.resolveExprToSlot(value, String(argIdxMap[1]), inputValues, slotChildren)

    return this.addBlock(defId, inputValues, { slotChildren })
  }

  // ── Live 変数設定 ──

  private generateLiveAssign(variable: string, value: ExprNode): string {
    this.customVariables.add(variable)
    const opcode = "data_setlivevariable"
    const defId = opcodeToDefId.get(opcode)!
    const argIdxMap = buildArgIndexMap(opcode)

    const inputValues: Record<string, string> = {
      [String(argIdxMap[0])]: variable,
    }
    const slotChildren: Record<string, string> = {}
    this.resolveExprToSlot(value, String(argIdxMap[1]), inputValues, slotChildren)

    return this.addBlock(defId, inputValues, { slotChildren })
  }

  // ── 変数変更 ──

  private generateChangeBy(variable: string, value: ExprNode): string {
    this.customVariables.add(variable)
    const opcode = "data_changevariableby"
    const defId = opcodeToDefId.get(opcode)!
    const argIdxMap = buildArgIndexMap(opcode)

    const inputValues: Record<string, string> = {
      [String(argIdxMap[0])]: variable,
    }
    const slotChildren: Record<string, string> = {}
    this.resolveExprToSlot(value, String(argIdxMap[1]), inputValues, slotChildren)

    return this.addBlock(defId, inputValues, { slotChildren })
  }

  // ── if 文 ──

  private generateIf(stmt: { condition: ExprNode; body: StatementNode[] }): string {
    const opcode = "control_if"
    const defId = opcodeToDefId.get(opcode)!

    const slotChildren: Record<string, string> = {}
    const condId = this.generateExpression(stmt.condition)
    // control_if の入力: [boolean-slot(0), label(1)]
    slotChildren["0"] = condId

    const bodyIds = this.generateStatementsAsList(stmt.body)

    return this.addBlock(defId, {}, { slotChildren, bodyChildren: [bodyIds] })
  }

  // ── if-else 文 ──

  private generateIfElse(stmt: { condition: ExprNode; ifBody: StatementNode[]; elseBody: StatementNode[] }): string {
    const opcode = "control_if_else"
    const defId = opcodeToDefId.get(opcode)!

    const slotChildren: Record<string, string> = {}
    const condId = this.generateExpression(stmt.condition)
    slotChildren["0"] = condId

    const ifBodyIds = this.generateStatementsAsList(stmt.ifBody)
    const elseBodyIds = this.generateStatementsAsList(stmt.elseBody)

    return this.addBlock(defId, {}, { slotChildren, bodyChildren: [ifBodyIds, elseBodyIds] })
  }

  // ── forever 文 ──

  private generateForever(stmt: { body: StatementNode[] }): string {
    const opcode = "control_forever"
    const defId = opcodeToDefId.get(opcode)!
    const bodyIds = this.generateStatementsAsList(stmt.body)
    return this.addBlock(defId, {}, { bodyChildren: [bodyIds] })
  }

  // ── while 文（repeat_until に変換） ──

  private generateWhileUntil(stmt: { condition: ExprNode; body: StatementNode[] }): string {
    // while(cond) → repeat_until(!cond) に変換
    const opcode = "control_repeat_until"
    const defId = opcodeToDefId.get(opcode)!

    // 条件を反転: !(condition)
    const notOpcode = "operator_not"
    const notDefId = opcodeToDefId.get(notOpcode)!
    const condId = this.generateExpression(stmt.condition)
    const notCondId = this.addBlock(notDefId, {}, { slotChildren: { "0": condId } })

    const bodyIds = this.generateStatementsAsList(stmt.body)
    return this.addBlock(defId, {}, { slotChildren: { "0": notCondId }, bodyChildren: [bodyIds] })
  }

  // ── repeat 文 ──

  private generateRepeat(stmt: { times: ExprNode; body: StatementNode[] }): string {
    const opcode = "control_repeat"
    const defId = opcodeToDefId.get(opcode)!
    const argIdxMap = buildArgIndexMap(opcode)

    const inputValues: Record<string, string> = {}
    const slotChildren: Record<string, string> = {}
    this.resolveExprToSlot(stmt.times, String(argIdxMap[0]), inputValues, slotChildren)

    const bodyIds = this.generateStatementsAsList(stmt.body)
    return this.addBlock(defId, inputValues, { slotChildren, bodyChildren: [bodyIds] })
  }

  // ── for 文 ──

  private generateForRange(stmt: { variable: string; from: ExprNode; to: ExprNode; body: StatementNode[] }): string {
    const opcode = "control_for_range"
    const defId = opcodeToDefId.get(opcode)!
    const argIdxMap = buildArgIndexMap(opcode)

    const inputValues: Record<string, string> = {
      [String(argIdxMap[0])]: stmt.variable,
    }
    const slotChildren: Record<string, string> = {}
    this.resolveExprToSlot(stmt.from, String(argIdxMap[1]), inputValues, slotChildren)
    this.resolveExprToSlot(stmt.to, String(argIdxMap[2]), inputValues, slotChildren)

    const bodyIds = this.generateStatementsAsList(stmt.body)
    return this.addBlock(defId, inputValues, { slotChildren, bodyChildren: [bodyIds] })
  }

  // ── forEach 文 ──

  private generateForEach(stmt: { variable: string; list: string; body: StatementNode[] }): string {
    const opcode = "control_for_each"
    const defId = opcodeToDefId.get(opcode)!
    const argIdxMap = buildArgIndexMap(opcode)

    const inputValues: Record<string, string> = {
      [String(argIdxMap[0])]: stmt.variable,
      [String(argIdxMap[1])]: stmt.list,
    }

    const bodyIds = this.generateStatementsAsList(stmt.body)
    return this.addBlock(defId, inputValues, { bodyChildren: [bodyIds] })
  }

  // ── spawn 文 ──

  private generateSpawn(stmt: { body: StatementNode[] }): string {
    const opcode = "control_spawn"
    const defId = opcodeToDefId.get(opcode)!
    const bodyIds = this.generateStatementsAsList(stmt.body)
    return this.addBlock(defId, {}, { bodyChildren: [bodyIds] })
  }

  // ── batch 文 ──

  private generateBatch(stmt: { body: StatementNode[] }): string {
    const opcode = "control_batch"
    const defId = opcodeToDefId.get(opcode)!
    const bodyIds = this.generateStatementsAsList(stmt.body)
    return this.addBlock(defId, {}, { bodyChildren: [bodyIds] })
  }

  // ── 引数なしブロック ──

  private generateSimpleBlock(opcode: string): string {
    const defId = opcodeToDefId.get(opcode)!
    return this.addBlock(defId, {})
  }

  // ── return 文 ──

  private generateReturn(stmt: { value: ExprNode }): string {
    const opcode = "procedures_return"
    const defId = opcodeToDefId.get(opcode)!
    const argIdxMap = buildArgIndexMap(opcode)

    const inputValues: Record<string, string> = {}
    const slotChildren: Record<string, string> = {}
    this.resolveExprToSlot(stmt.value, String(argIdxMap[0]), inputValues, slotChildren)

    return this.addBlock(defId, inputValues, { slotChildren })
  }

  // ── 式 → ブロック生成 ──

  generateExpression(expr: ExprNode): string {
    switch (expr.type) {
      case "number":
      case "string":
      case "boolean":
        // リテラルは呼び出し側で inputValues に直接格納すべき
        // ここに来た場合はダミーの変数ブロックとして扱う（条件式等のスロット用）
        // number/string リテラルがスロットに入る場合、変数ブロック等は不要 — 呼び出し側が resolveExprToSlot で対応
        // ただし boolean スロットに true/false を入れる必要がある場合は特別
        throw new Error(`Literal ${expr.type} should be handled by resolveExprToSlot, not generateExpression`)

      case "variable":
        return this.generateVariableExpr(expr.name)

      case "call":
        return this.generateCallExpr(expr.name, expr.args)

      case "binary":
        return this.generateBinaryExpr(expr)

      case "unary":
        return this.generateUnaryExpr(expr)

      case "property":
        return this.generatePropertyExpr(expr.object, expr.property)
    }
  }

  // ── 変数式 ──

  private generateVariableExpr(name: string): string {
    // 組み込みレポーター
    const reporterOpcode = REPORTER_MAP[name]
    if (reporterOpcode) {
      const defId = opcodeToDefId.get(reporterOpcode)!
      return this.addBlock(defId, {})
    }

    // カスタム変数
    const defId = opcodeToDefId.get("data_variable")!
    const argIdxMap = buildArgIndexMap("data_variable")
    return this.addBlock(defId, { [String(argIdxMap[0])]: name })
  }

  // ── 関数呼び出し式（レポーター/ブーリアン） ──

  private generateCallExpr(name: string, args: ExprNode[]): string {
    let opcode = FUNC_TO_OPCODE[name]
    // 引数なし関数はレポーターマップにフォールバック
    if (!opcode && args.length === 0) {
      opcode = REPORTER_MAP[name]
    }
    if (!opcode) {
      throw new Error(`Unknown function in expression: ${name}`)
    }

    const defId = opcodeToDefId.get(opcode)
    if (!defId) {
      throw new Error(`No block def found for opcode: ${opcode}`)
    }

    const argIdxMap = buildArgIndexMap(opcode)
    const inputValues: Record<string, string> = {}
    const slotChildren: Record<string, string> = {}

    for (let i = 0; i < args.length; i++) {
      if (i >= argIdxMap.length) break
      const inputIdx = String(argIdxMap[i])
      this.resolveExprToSlot(args[i], inputIdx, inputValues, slotChildren)
    }

    return this.addBlock(defId, inputValues, { slotChildren })
  }

  // ── 二項演算式 ──

  private generateBinaryExpr(expr: { op: string; left: ExprNode; right: ExprNode }): string {
    const opcode = BINARY_OP_MAP[expr.op]
    if (!opcode) {
      throw new Error(`Unknown binary operator: ${expr.op}`)
    }

    const defId = opcodeToDefId.get(opcode)!
    const argIdxMap = buildArgIndexMap(opcode)

    const inputValues: Record<string, string> = {}
    const slotChildren: Record<string, string> = {}

    this.resolveExprToSlot(expr.left, String(argIdxMap[0]), inputValues, slotChildren)
    this.resolveExprToSlot(expr.right, String(argIdxMap[1]), inputValues, slotChildren)

    return this.addBlock(defId, inputValues, { slotChildren })
  }

  // ── 単項演算式 ──

  private generateUnaryExpr(expr: { op: string; operand: ExprNode }): string {
    if (expr.op === "!") {
      const opcode = "operator_not"
      const defId = opcodeToDefId.get(opcode)!
      const argIdxMap = buildArgIndexMap(opcode)
      const slotChildren: Record<string, string> = {}
      const condId = this.generateExpression(expr.operand)
      slotChildren[String(argIdxMap[0])] = condId
      return this.addBlock(defId, {}, { slotChildren })
    }
    if (expr.op === "-") {
      // 0 - operand として生成
      const opcode = "operator_subtract"
      const defId = opcodeToDefId.get(opcode)!
      const argIdxMap = buildArgIndexMap(opcode)
      const inputValues: Record<string, string> = { [String(argIdxMap[0])]: "0" }
      const slotChildren: Record<string, string> = {}
      const operandId = this.generateExpression(expr.operand)
      slotChildren[String(argIdxMap[1])] = operandId
      return this.addBlock(defId, inputValues, { slotChildren })
    }
    throw new Error(`Unknown unary operator: ${expr.op}`)
  }

  // ── プロパティ式（velocity.x 等） ──

  private generatePropertyExpr(object: string, property: string): string {
    const propMap = PROPERTY_REPORTER_MAP[object]
    if (propMap) {
      const opcode = propMap[property]
      if (opcode) {
        const defId = opcodeToDefId.get(opcode)!
        return this.addBlock(defId, {})
      }
    }
    throw new Error(`Unknown property: ${object}.${property}`)
  }

  // ── ヘルパー: 式をスロットに解決 ──

  private resolveExprToSlot(
    expr: ExprNode,
    inputIdx: string,
    inputValues: Record<string, string>,
    slotChildren: Record<string, string>,
  ): void {
    if (expr.type === "number") {
      inputValues[inputIdx] = String(expr.value)
    } else if (expr.type === "string") {
      inputValues[inputIdx] = expr.value
    } else if (expr.type === "boolean") {
      inputValues[inputIdx] = String(expr.value)
    } else {
      slotChildren[inputIdx] = this.generateExpression(expr)
    }
  }

  // ── ヘルパー: 文リストを ID 配列として生成 ──

  private generateStatementsAsList(stmts: StatementNode[]): string[] {
    if (stmts.length === 0) return []

    const ids: string[] = []
    for (const stmt of stmts) {
      ids.push(this.generateStatement(stmt))
    }

    // nextId チェーンを構築
    for (let i = 0; i < ids.length - 1; i++) {
      this.setNextId(ids[i], ids[i + 1])
    }

    return ids
  }

  // ── ヘルパー: nextId 設定 ──

  private setNextId(blockId: string, nextId: string): void {
    const block = this.blocks.find((b) => b.instanceId === blockId)
    if (block) block.nextId = nextId
  }

  // ── ヘルパー: ブロック追加 ──

  private addBlock(
    defId: string,
    inputValues: Record<string, string>,
    extra?: {
      position?: { x: number; y: number }
      nextId?: string
      bodyChildren?: string[][]
      slotChildren?: Record<string, string>
    },
  ): string {
    const id = `gen-${this.prefix}-${++this.idCounter}`
    this.blocks.push({
      instanceId: id,
      defId,
      inputValues,
      position: extra?.position ?? { x: 0, y: 0 },
      nextId: extra?.nextId ?? null,
      bodyChildren: extra?.bodyChildren ?? [],
      slotChildren: extra?.slotChildren ?? {},
    })
    return id
  }
}

// ── 公開 API ──

export function generateBlockData(
  program: ProgramAST,
): Record<string, BlockProjectData> {
  const result: Record<string, BlockProjectData> = {}

  for (const sprite of program) {
    // スプライト名からプレフィックスを生成（英数字のみ、最大8文字）
    const prefix = sprite.name
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 8)
      .toLowerCase() || "s"

    const gen = new BlockGenerator(prefix)
    result[sprite.name] = gen.generateSprite(sprite)
  }

  return result
}
