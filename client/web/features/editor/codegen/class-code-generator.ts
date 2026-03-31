// CompiledProgram → クラスベース疑似コード文字列の逆変換

import type { CompiledProgram, CompiledEventScript, ScriptBlock } from "../engine/types"

// ── レポーター → インライン式文字列 ──

function resolveArg(argName: string, block: ScriptBlock): string {
  const nested = block.inputBlocks[argName]
  if (nested) return reporterToInline(nested)
  return String(block.args[argName] ?? "")
}

/** 文字列引数を引用符付きで解決する（ネストされた reporter の場合はそのまま） */
function resolveStringArg(argName: string, block: ScriptBlock): string {
  const nested = block.inputBlocks[argName]
  if (nested) return reporterToInline(nested)
  const val = String(block.args[argName] ?? "")
  return `"${val}"`
}

function reporterToInline(block: ScriptBlock): string {
  const r = (name: string) => resolveArg(name, block)
  const rs = (name: string) => resolveStringArg(name, block)

  switch (block.opcode) {
    case "data_variable":
      return `this.${r("VARIABLE")}`
    case "operator_add":
      return `(${r("NUM1")} + ${r("NUM2")})`
    case "operator_subtract":
      return `(${r("NUM1")} - ${r("NUM2")})`
    case "operator_multiply":
      return `(${r("NUM1")} * ${r("NUM2")})`
    case "operator_divide":
      return `(${r("NUM1")} / ${r("NUM2")})`
    case "operator_mod":
      return `(${r("NUM1")} % ${r("NUM2")})`
    case "operator_round":
      return `Math.round(${r("NUM")})`
    case "operator_random":
      return `Math.random(${r("FROM")}, ${r("TO")})`
    case "operator_gt":
      return `(${r("OPERAND1")} > ${r("OPERAND2")})`
    case "operator_lt":
      return `(${r("OPERAND1")} < ${r("OPERAND2")})`
    case "operator_equals":
      return `(${r("OPERAND1")} == ${r("OPERAND2")})`
    case "operator_and":
      return `(${r("OPERAND1")} && ${r("OPERAND2")})`
    case "operator_or":
      return `(${r("OPERAND1")} || ${r("OPERAND2")})`
    case "operator_not":
      return `!(${r("OPERAND")})`
    case "operator_join":
      return `(${r("STRING1")} + ${r("STRING2")})`
    case "operator_length":
      return `${r("STRING")}.length`
    case "sensing_touchingobject":
      return `this.touching(${r("TOUCHINGOBJECTMENU")})`
    case "sensing_keypressed":
      return `this.isKeyPressed(${rs("KEY_OPTION")})`
    case "sensing_mousex":
      return "this.mouseX"
    case "sensing_mousey":
      return "this.mouseY"
    case "sensing_timer":
      return "this.timer"
    case "motion_xposition":
      return "this.x"
    case "motion_yposition":
      return "this.y"
    case "motion_direction":
      return "this.direction"
    case "motion_angle":
      return "this.angle"
    case "physics_velocityX":
      return "this.velocityX"
    case "physics_velocityY":
      return "this.velocityY"
    case "physics_onground":
      return "this.isOnGround()"
    case "physics_collisiontarget":
      return "this.collisionTarget"
    case "looks_costumenumber":
      return "this.costumeNumber"
    case "observer_newvalue":
      return "this.newValue"
    case "observer_oldvalue":
      return "this.oldValue"
    case "observer_eventdata":
      return "this.eventData"
    case "data_itemoflist":
      return `this.${r("LIST")}[${r("INDEX")}]`
    case "data_lengthoflist":
      return `this.${r("LIST")}.length`
    case "math_randomint":
      return `randomInt(${r("FROM")}, ${r("TO")})`
    case "math_angleto":
      return `this.angleTo(${rs("TARGET")})`
    case "math_distanceto":
      return `this.distanceTo(${rs("TARGET")})`
    case "math_abs":
      return `abs(${r("NUM")})`
    case "math_min":
      return `min(${r("A")}, ${r("B")})`
    case "math_max":
      return `max(${r("A")}, ${r("B")})`
    case "math_sin":
      return `sin(${r("DEG")})`
    case "math_cos":
      return `cos(${r("DEG")})`
    case "sprite_getprop":
      return `${r("SPRITE")}.${r("PROP")}`
    case "sprite_getvariable":
      return `${r("SPRITE")}.${r("VARIABLE")}`
    default: {
      const args = Object.values(block.args).map((v) => String(v ?? ""))
      return `this.${block.opcode}(${args.join(", ")})`
    }
  }
}

// ── ブロック → コード行 ──

function blockToLines(block: ScriptBlock, indent: number): string[] {
  const pad = "  ".repeat(indent)
  const r = (name: string) => resolveArg(name, block)
  const rs = (name: string) => resolveStringArg(name, block)

  const body = (branchIndex: number): string[] =>
    chainToLines(block.branches[branchIndex] ?? null, indent + 1)

  switch (block.opcode) {
    // ── Motion ──
    case "motion_movesteps":
      return [`${pad}this.move(${r("STEPS")})`]
    case "motion_turnright":
      return [`${pad}this.turnRight(${r("DEGREES")})`]
    case "motion_turnleft":
      return [`${pad}this.turnLeft(${r("DEGREES")})`]
    case "motion_gotoxy":
      return [`${pad}this.setPosition(${r("X")}, ${r("Y")})`]
    case "motion_glidesecstoxy":
      return [`${pad}this.glide(${r("SECS")}, ${r("X")}, ${r("Y")})`]
    case "motion_changexby":
      return [`${pad}this.x += ${r("DX")}`]
    case "motion_changeyby":
      return [`${pad}this.y += ${r("DY")}`]
    case "motion_setx":
      return [`${pad}this.x = ${r("X")}`]
    case "motion_sety":
      return [`${pad}this.y = ${r("Y")}`]
    case "motion_ifonedgebounce":
      return [`${pad}this.ifOnEdgeBounce()`]
    case "motion_tweento":
      return [`${pad}this.tweenTo(${r("X")}, ${r("Y")}, ${r("SECS")})`]
    case "motion_setangle":
      return [`${pad}this.setAngle(${r("ANGLE")})`]

    // ── Camera ──
    case "camera_follow":
      return [`${pad}this.cameraFollow()`]
    case "camera_stopfollow":
      return [`${pad}this.cameraStopFollow()`]
    case "camera_shake":
      return [`${pad}this.cameraShake(${r("DURATION")}, ${r("INTENSITY")})`]
    case "camera_zoom":
      return [`${pad}this.cameraZoom(${r("SCALE")})`]
    case "camera_fade":
      return [`${pad}this.cameraFade(${r("DURATION")})`]

    // ── Looks ──
    case "looks_sayforsecs":
      return [`${pad}this.say(${rs("MESSAGE")}, ${r("SECS")})`]
    case "looks_think":
      return [`${pad}this.think(${rs("MESSAGE")})`]
    case "looks_setsizeto":
      return [`${pad}this.size = ${r("SIZE")}`]
    case "looks_changesizeby":
      return [`${pad}this.size += ${r("CHANGE")}`]
    case "looks_switchcostumeto":
      return [`${pad}this.costume = ${rs("COSTUME")}`]
    case "looks_show":
      return [`${pad}this.show()`]
    case "looks_hide":
      return [`${pad}this.hide()`]
    case "looks_nextcostume":
      return [`${pad}this.nextCostume()`]
    case "looks_settint":
      return [`${pad}this.setTint(${rs("COLOR")})`]
    case "looks_cleartint":
      return [`${pad}this.clearTint()`]
    case "looks_setopacity":
      return [`${pad}this.setAlpha(${r("OPACITY")})`]
    case "looks_setflipx":
      return [`${pad}this.setFlipX(${rs("ENABLED")})`]
    case "looks_addtext":
      return [`${pad}this.addText(${rs("TEXT")}, ${r("X")}, ${r("Y")})`]
    case "looks_updatetext":
      return [`${pad}this.setText(${rs("TEXT")})`]
    case "looks_removetext":
      return [`${pad}this.removeText()`]
    case "looks_floatingtext":
      return [`${pad}this.floatingText(${rs("TEXT")})`]

    // ── Graphics ──
    case "graphics_fillrect":
      return [`${pad}this.graphics.fillRect(${r("X")}, ${r("Y")}, ${r("W")}, ${r("H")}, ${rs("COLOR")})`]
    case "graphics_clear":
      return [`${pad}this.graphics.clear()`]

    // ── Control (stack) ──
    case "control_wait":
      return [`${pad}this.wait(${r("DURATION")})`]
    case "control_wait_until":
      return [`${pad}this.waitUntil(() => ${r("CONDITION")})`]
    case "control_stop":
      return [`${pad}this.stop()`]
    case "control_restart":
      return [`${pad}this.restart()`]

    // ── Control (C-block) ──
    case "control_repeat":
      return [
        `${pad}repeat (${r("TIMES")}) {`,
        ...body(0),
        `${pad}}`,
      ]
    case "control_if":
      return [
        `${pad}if (${r("CONDITION")}) {`,
        ...body(0),
        `${pad}}`,
      ]
    case "control_if_else": {
      // else if パターン検出: else body が if 1つだけならフラット化
      const elseLines = body(1)
      const elseBlock = block.branches[1]
      if (elseBlock && !elseBlock.next && (elseBlock.opcode === "control_if" || elseBlock.opcode === "control_if_else")) {
        const innerLines = blockToLines(elseBlock, indent)
        // 先頭の "  if (" を "} else if (" に置換
        if (innerLines.length > 0) {
          const firstLine = innerLines[0].trimStart()
          return [
            `${pad}if (${r("CONDITION")}) {`,
            ...body(0),
            `${pad}} else ${firstLine}`,
            ...innerLines.slice(1),
          ]
        }
      }
      return [
        `${pad}if (${r("CONDITION")}) {`,
        ...body(0),
        `${pad}} else {`,
        ...elseLines,
        `${pad}}`,
      ]
    }
    case "control_repeat_until":
      return [
        `${pad}while (!(${r("CONDITION")})) {`,
        ...body(0),
        `${pad}}`,
      ]
    case "control_forever":
      return [
        `${pad}while (true) {`,
        ...body(0),
        `${pad}}`,
      ]
    case "control_for_range":
      return [
        `${pad}for (${r("NAME")} in ${r("FROM")}..${r("TO")}) {`,
        ...body(0),
        `${pad}}`,
      ]
    case "control_spawn":
      return [
        `${pad}spawn {`,
        ...body(0),
        `${pad}}`,
      ]
    case "control_batch":
      return [
        `${pad}batch {`,
        ...body(0),
        `${pad}}`,
      ]
    case "control_break":
      return [`${pad}break`]
    case "control_continue":
      return [`${pad}continue`]

    // ── Physics ──
    case "physics_setmode":
      return [`${pad}this.setPhysics(${rs("MODE")})`]
    case "physics_setgravity":
      return [`${pad}this.setGravity(${r("GRAVITY")})`]
    case "physics_setvelocity":
      return [`${pad}this.setVelocity(${r("VX")}, ${r("VY")})`]
    case "physics_setvelocityX":
      return [`${pad}this.setVelocityX(${r("VX")})`]
    case "physics_setvelocityY":
      return [`${pad}this.setVelocityY(${r("VY")})`]
    case "physics_setbounce":
      return [`${pad}this.setBounce(${r("BOUNCE")})`]
    case "physics_setcollideworldbounds":
      return [`${pad}this.setCollideWorldBounds(${rs("ENABLED")})`]
    case "physics_setallowgravity":
      return [`${pad}this.setAllowGravity(${rs("ENABLED")})`]
    case "physics_disablebody":
      return [`${pad}this.disableBody()`]
    case "physics_enablebody":
      return [`${pad}this.enableBody()`]
    case "physics_oncollide":
      return [`${pad}this.onCollide(${rs("TARGET")}, ${rs("EVENT_NAME")})`]

    // ── Clone ──
    case "clone_create":
      return [`${pad}this.createClone(${rs("TARGET")})`]
    case "clone_delete":
      return [`${pad}this.deleteClone()`]

    // ── Events ──
    case "observer_sendevent":
      return [`${pad}this.emit(${rs("EVENT_NAME")})`]
    case "observer_stopwatching":
      return [`${pad}this.unwatch(${r("VARIABLE")})`]

    // ── Variables ──
    case "data_setvariableto":
      return [`${pad}this.${r("VARIABLE")} = ${r("VALUE")}`]
    case "data_setlivevariable":
      return [`${pad}var live ${r("VARIABLE")} = ${r("VALUE")}`]
    case "data_changevariableby":
      return [`${pad}this.${r("VARIABLE")} += ${r("VALUE")}`]
    case "sprite_setvariableto":
      return [`${pad}${r("SPRITE")}.${r("VARIABLE")} = ${r("VALUE")}`]
    case "sprite_changevariableby":
      return [`${pad}${r("SPRITE")}.${r("VARIABLE")} += ${r("VALUE")}`]
    case "data_showvariable":
      return [`${pad}this.showVariable(${r("VARIABLE")})`]
    case "data_hidevariable":
      return [`${pad}this.hideVariable(${r("VARIABLE")})`]
    case "data_addtolist":
      return [`${pad}this.${r("LIST")}.push(${r("ITEM")})`]
    case "data_deleteoflist":
      return [`${pad}this.${r("LIST")}.removeAt(${r("INDEX")})`]

    // ── Sensing ──
    case "sensing_resettimer":
      return [`${pad}this.resetTimer()`]

    // ── Tween 拡張 ──
    case "tween_scale":
      return [`${pad}this.tweenScale(${r("SCALE")}, ${r("SECS")})`]
    case "tween_alpha":
      return [`${pad}this.tweenAlpha(${r("ALPHA")}, ${r("SECS")})`]
    case "tween_angle":
      return [`${pad}this.tweenAngle(${r("ANGLE")}, ${r("SECS")})`]

    // ── テキスト拡張 ──
    case "text_addat":
      return [`${pad}this.addTextAt(${rs("ID")}, ${rs("TEXT")}, ${r("X")}, ${r("Y")}, ${r("SIZE")}, ${rs("COLOR")})`]
    case "text_updateat":
      return [`${pad}this.updateTextAt(${rs("ID")}, ${rs("TEXT")})`]
    case "text_removeat":
      return [`${pad}this.removeTextAt(${rs("ID")})`]

    // ── パーティクル ──
    case "particle_emit":
      return [`${pad}this.emitParticles(${r("X")}, ${r("Y")}, ${r("COUNT")}, ${rs("COLOR")}, ${r("SPEED")})`]

    // ── タイマー ──
    case "timer_setinterval":
      return [`${pad}this.setInterval(${rs("EVENT")}, ${r("MS")})`]
    case "timer_clearinterval":
      return [`${pad}this.clearInterval(${rs("EVENT")})`]
    case "timer_settimeout":
      return [`${pad}this.setTimeout(${rs("EVENT")}, ${r("MS")})`]

    // ── Procedures ──
    case "procedures_return":
      return [`${pad}return ${r("VALUE")}`]

    default: {
      const args = Object.entries(block.args)
        .map(([k, v]) => `${k}: ${String(v ?? "")}`)
        .join(", ")
      return [`${pad}// ${block.opcode}(${args})`]
    }
  }
}

function chainToLines(block: ScriptBlock | null, indent: number): string[] {
  const lines: string[] = []
  let current: ScriptBlock | null = block
  while (current) {
    lines.push(...blockToLines(current, indent))
    current = current.next
  }
  return lines
}

// ── hat → メソッドヘッダー ──

function hatToMethodHeader(es: CompiledEventScript): string {
  const hatArgs = es.hatArgs

  switch (es.opcode) {
    case "event_whenflagclicked":
      return "onCreate()"
    case "event_whenkeypressed":
      return `onKeyPress("${String(hatArgs["KEY_OPTION"] ?? "")}")`
    case "clone_whencloned":
      return "onClone()"
    case "event_whentouched":
      return `onTouched("${String(hatArgs["TARGET"] ?? "")}")`
    case "observer_wheneventreceived":
      return `onEvent("${String(hatArgs["EVENT_NAME"] ?? "")}")`
    case "observer_whenvarchanges":
      return `onVarChange("${String(hatArgs["VARIABLE"] ?? "")}")`
    case "live_when":
      return `when (this.${String(hatArgs["VARIABLE"] ?? "")})`
    case "live_upon":
      return `upon (this.${String(hatArgs["VARIABLE"] ?? "")})`
    default:
      return `on_${es.opcode}()`
  }
}

/** flagClicked + forever 1つだけのパターンか判定 */
function isOnUpdatePattern(es: CompiledEventScript): boolean {
  if (es.opcode !== "event_whenflagclicked") return false
  const script = es.script
  if (!script) return false
  // body が forever 1ブロックのみで、next がない
  return script.opcode === "control_forever" && script.next === null
}

// ── 公開 API ──

/** CompiledProgram → クラスベース疑似コード文字列 */
export function programToClassCode(
  program: CompiledProgram,
  spriteName: string,
): string {
  const lines: string[] = []
  lines.push(`class ${spriteName} {`)

  for (const es of program.eventScripts) {
    if (!es.script) continue

    lines.push("")

    if (isOnUpdatePattern(es)) {
      // onUpdate パターン: forever の中身を直接展開
      lines.push("  onUpdate() {")
      const bodyLines = chainToLines(es.script.branches[0] ?? null, 2)
      lines.push(...bodyLines)
      lines.push("  }")
    } else {
      const header = hatToMethodHeader(es)
      lines.push(`  ${header} {`)
      const bodyLines = chainToLines(es.script, 2)
      lines.push(...bodyLines)
      lines.push("  }")
    }
  }

  lines.push("}")
  return lines.join("\n")
}
