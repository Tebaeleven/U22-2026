import type { CompiledProgram, ScriptBlock } from "./types"

export interface PseudocodeSection {
  header: string
  lines: string[]
  kind: "event" | "procedure"
  spriteName?: string
}

// ネストされた reporter を優先し、なければ args の文字列値を返す
function resolveArg(argName: string, block: ScriptBlock): string {
  const nested = block.inputBlocks[argName]
  if (nested) return reporterToInline(nested)
  return String(block.args[argName] ?? "")
}

// reporter/boolean ブロックをインライン式文字列に変換（再帰）
export function reporterToInline(block: ScriptBlock): string {
  const r = (name: string) => resolveArg(name, block)

  switch (block.opcode) {
    case "data_variable":
      return r("VARIABLE")
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
      return `touching(${r("TOUCHINGOBJECTMENU")})`
    case "sensing_keypressed":
      return `isKeyPressed("${r("KEY_OPTION")}")`
    case "sensing_mousex":
      return "mouseX"
    case "sensing_mousey":
      return "mouseY"
    case "sensing_timer":
      return "timer"
    case "motion_xposition":
      return "x"
    case "motion_yposition":
      return "y"
    case "motion_direction":
      return "direction"
    case "physics_velocityX":
      return "velocity.x"
    case "physics_velocityY":
      return "velocity.y"
    case "physics_onground":
      return "isOnGround()"
    case "physics_collisiontarget":
      return "collisionTarget"
    case "looks_costumenumber":
      return "costumeNumber"
    case "observer_newvalue":
      return "newValue"
    case "observer_oldvalue":
      return "oldValue"
    case "observer_eventdata":
      return "eventData"
    case "data_itemoflist":
      return `${r("LIST")}[${r("INDEX")}]`
    case "data_lengthoflist":
      return `${r("LIST")}.length`
    case "custom-argument": {
      const paramId = String(block.args["PARAM_ID"] ?? "")
      return paramId
    }
    default: {
      const procedureId = String(block.args["PROCEDURE_ID"] ?? "")
      if (procedureId) {
        const params = Object.entries(block.args)
          .filter(([k]) => k !== "PROCEDURE_ID")
          .map(([k, v]) => {
            const nested = block.inputBlocks[k]
            return nested ? reporterToInline(nested) : String(v ?? "")
          })
        return `${procedureId}(${params.join(", ")})`
      }
      const args = Object.values(block.args).map((v) => String(v ?? ""))
      return `${block.opcode}(${args.join(", ")})`
    }
  }
}

// 1つのブロックを疑似コード行配列に変換（C-block は再帰でインデント）
export function blockToPseudoLines(block: ScriptBlock, indent: number): string[] {
  const pad = "  ".repeat(indent)
  const r = (name: string) => resolveArg(name, block)

  const body = (branchIndex: number): string[] =>
    chainToPseudo(block.branches[branchIndex] ?? null, indent + 1)

  switch (block.opcode) {
    // ── Motion ──
    case "motion_movesteps":
      return [`${pad}move(${r("STEPS")})`]
    case "motion_turnright":
      return [`${pad}turnRight(${r("DEGREES")})`]
    case "motion_turnleft":
      return [`${pad}turnLeft(${r("DEGREES")})`]
    case "motion_gotoxy":
      return [`${pad}goto(${r("X")}, ${r("Y")})`]
    case "motion_glidesecstoxy":
      return [`${pad}glide(${r("SECS")}, ${r("X")}, ${r("Y")})`]
    case "motion_changexby":
      return [`${pad}x += ${r("DX")}`]
    case "motion_changeyby":
      return [`${pad}y += ${r("DY")}`]
    case "motion_setx":
      return [`${pad}x = ${r("X")}`]
    case "motion_sety":
      return [`${pad}y = ${r("Y")}`]

    // ── Looks ──
    case "looks_sayforsecs":
      return [`${pad}say(${r("MESSAGE")}, ${r("SECS")})`]
    case "looks_think":
      return [`${pad}think(${r("MESSAGE")})`]
    case "looks_setsizeto":
      return [`${pad}size = ${r("SIZE")}`]
    case "looks_changesizeby":
      return [`${pad}size += ${r("CHANGE")}`]
    case "looks_switchcostumeto":
      return [`${pad}costume = "${r("COSTUME")}"`]

    // ── Control (stack) ──
    case "control_wait":
      return [`${pad}wait(${r("DURATION")})`]
    case "control_wait_until":
      return [`${pad}waitUntil(() => ${r("CONDITION")})`]
    case "control_stop":
      return [`${pad}stop()`]

    // ── Control (C-block) ──
    case "control_repeat":
      return [
        `${pad}repeat(${r("TIMES")}) {`,
        ...body(0),
        `${pad}}`,
      ]
    case "control_if":
      return [
        `${pad}if (${r("CONDITION")}) {`,
        ...body(0),
        `${pad}}`,
      ]
    case "control_if_else":
      return [
        `${pad}if (${r("CONDITION")}) {`,
        ...body(0),
        `${pad}} else {`,
        ...body(1),
        `${pad}}`,
      ]
    case "control_repeat_until":
      return [
        `${pad}until (${r("CONDITION")}) {`,
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
    case "control_loop_variable":
      return [
        `${pad}loop (${r("NAME")}) {`,
        ...body(0),
        `${pad}}`,
      ]

    // ── Events ──
    case "observer_sendevent":
      return [`${pad}emit("${r("EVENT_NAME")}")`]
    case "observer_stopwatching":
      return [`${pad}unwatch(${r("VARIABLE")})`]

    // ── Variables ──
    case "data_setvariableto":
      return [`${pad}${r("VARIABLE")} = ${r("VALUE")}`]
    case "data_changevariableby":
      return [`${pad}${r("VARIABLE")} += ${r("VALUE")}`]
    case "data_showvariable":
      return [`${pad}show(${r("VARIABLE")})`]
    case "data_hidevariable":
      return [`${pad}hide(${r("VARIABLE")})`]
    case "data_addtolist":
      return [`${pad}${r("LIST")}.push(${r("ITEM")})`]
    case "data_deleteoflist":
      return [`${pad}${r("LIST")}.removeAt(${r("INDEX")})`]

    // ── Looks 拡張 ──
    case "looks_show":
      return [`${pad}show()`]
    case "looks_hide":
      return [`${pad}hide()`]
    case "looks_nextcostume":
      return [`${pad}nextCostume()`]
    case "looks_settint":
      return [`${pad}setTint(${r("COLOR")})`]
    case "looks_cleartint":
      return [`${pad}clearTint()`]
    case "looks_setopacity":
      return [`${pad}setAlpha(${r("OPACITY")} / 100)`]
    case "looks_setflipx":
      return [`${pad}setFlipX(${r("ENABLED")})`]
    case "looks_addtext":
      return [`${pad}addText("${r("TEXT")}", ${r("X")}, ${r("Y")})`]
    case "looks_updatetext":
      return [`${pad}setText(${r("TEXT")})`]
    case "looks_removetext":
      return [`${pad}removeText()`]
    case "looks_floatingtext":
      return [`${pad}floatingText("${r("TEXT")}")`]

    // ── Graphics ──
    case "graphics_fillrect":
      return [`${pad}graphics.fillRect(${r("X")}, ${r("Y")}, ${r("W")}, ${r("H")}, ${r("COLOR")})`]
    case "graphics_clear":
      return [`${pad}graphics.clear()`]

    // ── Physics ──
    case "physics_setmode":
      return [`${pad}setPhysics("${r("MODE")}")`]
    case "physics_setgravity":
      return [`${pad}setGravity(${r("GRAVITY")})`]
    case "physics_setvelocity":
      return [`${pad}setVelocity(${r("VX")}, ${r("VY")})`]
    case "physics_setvelocityX":
      return [`${pad}setVelocityX(${r("VX")})`]
    case "physics_setvelocityY":
      return [`${pad}setVelocityY(${r("VY")})`]
    case "physics_setbounce":
      return [`${pad}setBounce(${r("BOUNCE")})`]
    case "physics_setcollideworldbounds":
      return [`${pad}setCollideWorldBounds(${r("ENABLED")})`]
    case "physics_setallowgravity":
      return [`${pad}setAllowGravity(${r("ENABLED")})`]
    case "physics_disablebody":
      return [`${pad}disableBody()`]
    case "physics_enablebody":
      return [`${pad}enableBody()`]
    case "physics_oncollide":
      return [`${pad}onCollide("${r("TARGET")}", "${r("EVENT_NAME")}")`]

    // ── Clone ──
    case "clone_create":
      return [`${pad}createClone("${r("TARGET")}")`]
    case "clone_delete":
      return [`${pad}deleteClone()`]

    // ── Control 拡張 ──
    case "control_restart":
      return [`${pad}restart()`]

    // ── Motion 拡張 ──
    case "motion_ifonedgebounce":
      return [`${pad}ifOnEdgeBounce()`]
    case "motion_tweento":
      return [`${pad}tweenTo(${r("X")}, ${r("Y")}, ${r("SECS")})`]

    // ── Sensing 拡張 ──
    case "sensing_resettimer":
      return [`${pad}resetTimer()`]

    // ── Procedures ──
    case "procedures_return":
      return [`${pad}return ${r("VALUE")}`]

    default: {
      const procedureId = String(block.args["PROCEDURE_ID"] ?? "")
      if (procedureId) {
        const params = Object.entries(block.args)
          .filter(([k]) => k !== "PROCEDURE_ID")
          .map(([k, v]) => {
            const nested = block.inputBlocks[k]
            return nested ? reporterToInline(nested) : String(v ?? "")
          })
        return [`${pad}${procedureId}(${params.join(", ")})`]
      }
      const args = Object.entries(block.args)
        .map(([k, v]) => `${k}: ${String(v ?? "")}`)
        .join(", ")
      return [`${pad}/* ${block.opcode}(${args}) */`]
    }
  }
}

// ブロックチェーン全体を疑似コード行配列に変換
export function chainToPseudo(block: ScriptBlock | null, indent: number): string[] {
  const lines: string[] = []
  let current: ScriptBlock | null = block
  while (current) {
    lines.push(...blockToPseudoLines(current, indent))
    current = current.next
  }
  return lines
}

// hat ブロックの opcode をイベントヘッダー文字列に変換
function hatToHeader(opcode: string, hatArgs: Record<string, unknown>): string {
  switch (opcode) {
    case "event_whenflagclicked":
      return "on 🚩 click"
    case "event_whenkeypressed":
      return `on keyPress("${String(hatArgs["KEY_OPTION"] ?? "")}")`
    case "observer_whenvarchanges":
      return `on varChange(${String(hatArgs["VARIABLE"] ?? "")})`
    case "observer_wheneventreceived":
      return `on event("${String(hatArgs["EVENT_NAME"] ?? "")}")`
    case "clone_whencloned":
      return "on clone()"
    case "event_whentouched":
      return `on touched("${String(hatArgs["TARGET"] ?? "")}")`
    default:
      return `on ${opcode}`
  }
}

// CompiledProgram 全体を PseudocodeSection 配列に変換
export function programToPseudo(program: CompiledProgram): PseudocodeSection[] {
  const sections: PseudocodeSection[] = []

  for (const es of program.eventScripts) {
    sections.push({
      header: hatToHeader(es.opcode, es.hatArgs),
      lines: chainToPseudo(es.script, 0),
      kind: "event",
    })
  }

  for (const proc of Object.values(program.procedures)) {
    const retType = proc.returnsValue ? ": value" : ""
    sections.push({
      header: `fun ${proc.procedureId}()${retType}`,
      lines: proc.script ? chainToPseudo(proc.script, 0) : [],
      kind: "procedure",
    })
  }

  return sections
}
