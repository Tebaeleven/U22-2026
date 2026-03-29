/**
 * ブロックエディタの BlockState チェーンから実行可能な ScriptBlock ツリーを構築する
 */
import type { Container } from "headless-vpl"
import { collectConnectedChain } from "headless-vpl/blocks"
import type { BlockEditorController } from "../block-editor/controller"
import type { BlockDef, CreatedBlock, InputDef } from "../block-editor/types"
import type {
  CompiledEventScript,
  CompiledProcedure,
  CompiledProgram,
  ScriptBlock,
} from "./types"

type BuildContext = {
  inProcedure: boolean
}

/** ブロック定義の入力名とプリミティブの引数名のマッピング（外部から最新値を取得するために export） */
export function buildArgs(created: CreatedBlock): Record<string, unknown> {
  const { def, inputValues } = created.state

  if (def.source.kind === "custom-call") {
    const args: Record<string, unknown> = {
      PROCEDURE_ID: def.source.procedureId,
    }
    for (let index = 0; index < def.inputs.length; index += 1) {
      const input = def.inputs[index]
      if (
        (input.type === "number" || input.type === "text") &&
        input.paramId
      ) {
        args[input.paramId] =
          inputValues[index] ?? String(input.default)
      }
    }
    return args
  }

  if (def.source.kind === "custom-argument") {
    return {
      PROCEDURE_ID: def.source.procedureId,
      PARAM_ID: def.source.paramId,
    }
  }

  if (def.source.kind === "custom-define") {
    return {
      PROCEDURE_ID: def.source.procedureId,
    }
  }

  if (def.opcode === "procedures_return") {
    const input = def.inputs.find((item) => item.type !== "label")
    const inputIndex = input ? def.inputs.indexOf(input) : -1
    return {
      VALUE:
        inputIndex >= 0 && input && "default" in input
          ? inputValues[inputIndex] ?? String(input.default)
          : "",
    }
  }

  const args: Record<string, unknown> = {}
  const opcode = resolveOpcode(def)

  let argIndex = 0
  for (let originalIndex = 0; originalIndex < def.inputs.length; originalIndex += 1) {
    const input = def.inputs[originalIndex]
    if (input.type === "label" || input.type === "param-chip") continue

    const value =
      inputValues[originalIndex] ??
      getInputDefault(input)
    const argName = getArgName(opcode, input, originalIndex, argIndex)
    args[argName] = value
    argIndex += 1
  }

  return args
}

/** label テキストから演算 opcode を推定 */
const OPERATOR_LABEL_TO_OPCODE: Record<string, string> = {
  "+": "operator_add",
  "-": "operator_subtract",
  "*": "operator_multiply",
  "/": "operator_divide",
  "%": "operator_mod",
  ">": "operator_gt",
  "<": "operator_lt",
  "=": "operator_equals",
  and: "operator_and",
  or: "operator_or",
}

function resolveOpcode(def: Pick<BlockDef, "name" | "shape" | "inputs" | "opcode">): string {
  const { name, shape, inputs, opcode } = def
  if (opcode) return opcode
  if (name === "If" && shape === "c-block-else") return "control_if_else"

  if (!name && inputs) {
    const label = inputs.find((input) => input.type === "label")
    if (label?.type === "label") {
      const op = OPERATOR_LABEL_TO_OPCODE[label.text]
      if (op) return op
    }
  }

  return `unknown_${name.toLowerCase().replace(/\s+/g, "_")}`
}

function getInputDefault(input: InputDef): string | boolean {
  switch (input.type) {
    case "number":
    case "text":
    case "variable-name":
    case "dropdown":
      return String(input.default)
    case "boolean-slot":
      return false
    case "param-chip":
    case "label":
      return ""
  }
}

function getArgName(
  opcode: string,
  input: InputDef,
  originalIndex: number,
  index: number
): string {
  if ((input.type === "text" || input.type === "number") && input.paramId) {
    return input.paramId
  }

  const argMaps: Record<string, string[]> = {
    motion_movesteps: ["STEPS"],
    motion_turnright: ["DEGREES"],
    motion_turnleft: ["DEGREES"],
    motion_gotoxy: ["X", "Y"],
    motion_glidesecstoxy: ["SECS", "X", "Y"],
    motion_changexby: ["DX"],
    motion_changeyby: ["DY"],
    motion_setx: ["X"],
    motion_sety: ["Y"],
    looks_sayforsecs: ["MESSAGE", "SECS"],
    looks_think: ["MESSAGE"],
    looks_setsizeto: ["SIZE"],
    looks_changesizeby: ["CHANGE"],
    looks_switchcostumeto: ["COSTUME"],
    control_wait: ["DURATION"],
    control_repeat: ["TIMES"],
    control_for_range: ["NAME", "FROM", "TO"],
    control_loop_variable: ["NAME"],
    control_if: ["CONDITION"],
    control_if_else: ["CONDITION"],
    control_repeat_until: ["CONDITION"],
    control_wait_until: ["CONDITION"],
    event_whenkeypressed: ["KEY_OPTION"],
    observer_whenvarchanges: ["VARIABLE"],
    observer_stopwatching: ["VARIABLE"],
    observer_sendevent: ["EVENT_NAME", "DATA"],
    observer_wheneventreceived: ["EVENT_NAME"],
    sensing_touchingobject: ["TOUCHINGOBJECTMENU"],
    sensing_keypressed: ["KEY_OPTION"],
    operator_add: ["NUM1", "NUM2"],
    operator_subtract: ["NUM1", "NUM2"],
    operator_multiply: ["NUM1", "NUM2"],
    operator_divide: ["NUM1", "NUM2"],
    operator_random: ["FROM", "TO"],
    operator_gt: ["OPERAND1", "OPERAND2"],
    operator_lt: ["OPERAND1", "OPERAND2"],
    operator_equals: ["OPERAND1", "OPERAND2"],
    operator_and: ["OPERAND1", "OPERAND2"],
    operator_or: ["OPERAND1", "OPERAND2"],
    operator_not: ["OPERAND"],
    operator_join: ["STRING1", "STRING2"],
    operator_length: ["STRING"],
    operator_mod: ["NUM1", "NUM2"],
    operator_round: ["NUM"],
    data_variable: ["VARIABLE"],
    data_setvariableto: ["VARIABLE", "VALUE"],
    data_changevariableby: ["VARIABLE", "VALUE"],
    data_showvariable: ["VARIABLE"],
    data_hidevariable: ["VARIABLE"],
    data_addtolist: ["ITEM", "LIST"],
    data_deleteoflist: ["INDEX", "LIST"],
    data_itemoflist: ["INDEX", "LIST"],
    data_lengthoflist: ["LIST"],
    physics_setmode: ["MODE"],
    physics_setgravity: ["GRAVITY"],
    physics_setvelocity: ["VX", "VY"],
    physics_setvelocityX: ["VX"],
    physics_setvelocityY: ["VY"],
    physics_setbounce: ["BOUNCE"],
    physics_setcollideworldbounds: ["ENABLED"],
    physics_oncollide: ["TARGET", "EVENT_NAME"],
    clone_create: ["TARGET"],
    looks_addtext: ["TEXT", "X", "Y"],
    looks_updatetext: ["TEXT"],
    looks_settint: ["COLOR"],
    looks_setopacity: ["OPACITY"],
    looks_setflipx: ["ENABLED"],
    looks_floatingtext: ["TEXT"],
    graphics_fillrect: ["X", "Y", "W", "H", "COLOR"],
    physics_setallowgravity: ["ENABLED"],
    event_whentouched: ["TARGET"],
    motion_tweento: ["X", "Y", "SECS"],
    procedures_return: ["VALUE"],
    // 回転
    motion_setangle: ["ANGLE"],
    // カメラ
    camera_shake: ["DURATION", "INTENSITY"],
    camera_zoom: ["SCALE"],
    camera_fade: ["DURATION"],
    // Tween
    tween_scale: ["SCALE", "SECS"],
    tween_alpha: ["ALPHA", "SECS"],
    tween_angle: ["ANGLE", "SECS"],
    // 数学
    math_randomint: ["FROM", "TO"],
    math_angleto: ["TARGET"],
    math_distanceto: ["TARGET"],
    math_abs: ["NUM"],
    math_min: ["A", "B"],
    math_max: ["A", "B"],
    math_sin: ["DEG"],
    math_cos: ["DEG"],
    // タイマー
    timer_setinterval: ["EVENT", "MS"],
    timer_clearinterval: ["EVENT"],
    timer_settimeout: ["EVENT", "MS"],
    // テキスト拡張
    text_addat: ["ID", "TEXT", "X", "Y", "SIZE", "COLOR"],
    text_updateat: ["ID", "TEXT"],
    text_removeat: ["ID"],
    // パーティクル
    particle_emit: ["X", "Y", "COUNT", "COLOR", "SPEED"],
    // Phase 1-2: 物理プロパティ拡張
    physics_setacceleration: ["AX", "AY"],
    physics_setaccelerationx: ["AX"],
    physics_setaccelerationy: ["AY"],
    physics_setdrag: ["DX", "DY"],
    physics_setdamping: ["ENABLED"],
    physics_setmaxvelocity: ["VX", "VY"],
    physics_setangularvelocity: ["DEG"],
    physics_setimmovable: ["ENABLED"],
    physics_setmass: ["MASS"],
    physics_setpushable: ["ENABLED"],
    physics_worldwrap: ["PADDING"],
    physics_moveto: ["TARGET", "SPEED"],
    physics_accelerateto: ["TARGET", "SPEED"],
    physics_velocityfromangle: ["ANGLE", "SPEED"],
    // Phase 3: 入力拡張
    sensing_keyjustdown: ["KEY_OPTION"],
    // Phase 4: アニメーション拡張
    anim_create: ["NAME", "START", "END", "RATE", "LOOP"],
    anim_play: ["NAME"],
    anim_oncomplete: ["EVENT"],
    // Phase 5: オーディオ
    sound_play: ["SOUND"],
    sound_playloop: ["SOUND"],
    sound_stop: ["SOUND"],
    sound_setvolume: ["SOUND", "VOL"],
  }

  const map = argMaps[opcode]
  if (map && index < map.length) return map[index]
  return `ARG${originalIndex}`
}

function buildScriptBlock(
  created: CreatedBlock,
  controller: BlockEditorController,
  context: BuildContext
): ScriptBlock | null {
  const { def } = created.state
  const opcode = resolveOpcode(def)

  if (opcode === "procedures_return" && !context.inProcedure) {
    return null
  }

  const args = buildArgs(created)

  const branches: (ScriptBlock | null)[] = []
  if (created.cBlockRef) {
    for (const bodyLayout of created.cBlockRef.bodyLayouts) {
      const firstChild = Array.from(bodyLayout.Children)[0] as Container | undefined
      if (!firstChild) {
        branches.push(null)
        continue
      }
      branches.push(buildChain(firstChild, controller, context))
    }
  }

  const inputBlocks: Record<string, ScriptBlock> = {}
  const snapshot = controller.getSnapshot()
  let argIndex = 0
  for (let index = 0; index < def.inputs.length; index += 1) {
    const input = def.inputs[index]
    if (input.type === "label" || input.type === "param-chip") continue

    const nestedContainerId = snapshot.nestedSlots[`${created.state.id}-${index}`]
    if (nestedContainerId) {
      const nestedCreated = controller.getCreatedBlock(nestedContainerId)
      const nestedBlock = nestedCreated
        ? buildScriptBlock(nestedCreated, controller, context)
        : null
      if (nestedBlock) {
        const argName = getArgName(opcode, input, index, argIndex)
        inputBlocks[argName] = nestedBlock
      }
    }
    argIndex += 1
  }

  return {
    id: created.state.id,
    opcode,
    args,
    next: null,
    branches,
    inputBlocks,
  }
}

function buildChain(
  rootContainer: Container,
  controller: BlockEditorController,
  context: BuildContext
): ScriptBlock | null {
  const chain = collectConnectedChain(rootContainer)
  let head: ScriptBlock | null = null
  let prev: ScriptBlock | null = null

  for (const container of chain) {
    const created = controller.getCreatedBlock(container.id)
    if (!created) continue

    const block = buildScriptBlock(created, controller, context)
    if (!block) continue

    if (!head) {
      head = block
    }
    if (prev) {
      prev.next = block
    }
    prev = block
  }

  return head
}

function buildProcedureDefinition(
  controller: BlockEditorController,
  created: CreatedBlock
): CompiledProcedure | null {
  if (created.state.def.source.kind !== "custom-define") {
    return null
  }

  const procedureId = created.state.def.source.procedureId
  const procedure = controller.getCustomProcedure(procedureId)
  if (!procedure) {
    return null
  }

  const chain = collectConnectedChain(created.container)
  const script =
    chain.length > 1
      ? buildChain(chain[1], controller, { inProcedure: true })
      : null

  return {
    procedureId,
    defineBlockId: created.state.id,
    returnsValue: procedure.returnsValue,
    parameterIds: procedure.params.map((param) => param.id),
    script,
  }
}

/**
 * Hat ブロック（イベントブロック）とカスタム手続きを収集して実行ツリーを構築する
 */
export function buildScripts(controller: BlockEditorController): CompiledProgram {
  const snapshot = controller.getSnapshot()
  const eventScripts: CompiledEventScript[] = []
  const procedures: Record<string, CompiledProcedure> = {}

  for (const blockState of snapshot.blocks) {
    if (blockState.def.shape !== "hat") continue

    const created = controller.getCreatedBlock(blockState.id)
    if (!created) continue

    if (blockState.def.source.kind === "custom-define") {
      const procedure = buildProcedureDefinition(controller, created)
      if (procedure) {
        procedures[procedure.procedureId] = procedure
      }
      continue
    }

    if (blockState.def.source.kind === "starter-define") {
      continue
    }

    const chain = collectConnectedChain(created.container)
    if (chain.length < 2) continue

    const opcode = resolveOpcode(blockState.def)
    const hatArgs = buildArgs(created)
    const script = buildChain(chain[1], controller, { inProcedure: false })

    if (script) {
      eventScripts.push({
        opcode,
        script,
        hatArgs,
        hatBlockId: blockState.id,
      })
    }
  }

  return {
    eventScripts,
    procedures,
  }
}
