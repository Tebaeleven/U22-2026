// カスタム手続き関連ヘルパー
import type {
  BlockDef,
  CustomProcedure,
  CustomProcedureParam,
  InputDef,
  ProcedureParamType,
} from "../types"
import { CUSTOM_ARGUMENT_PREFIX, CUSTOM_CALL_PREFIX, CUSTOM_DEFINE_PREFIX } from "./constants"
import { createEditorId } from "./input-helpers"

/** デフォルトのカスタム手続きを生成する */
export function createDefaultProcedure(): CustomProcedure {
  const param = createDefaultProcedureParam("text")
  return {
    id: createEditorId("procedure"),
    name: "my block",
    tokens: [
      { id: createEditorId("token"), type: "label", text: "my block" },
      { id: createEditorId("token"), type: "param", paramId: param.id },
    ],
    params: [param],
    returnsValue: false,
  }
}

/** デフォルトの手続きパラメータを生成する */
export function createDefaultProcedureParam(
  valueType: ProcedureParamType
): CustomProcedureParam {
  return {
    id: createEditorId("param"),
    name: valueType === "number" ? "number" : "text",
    valueType,
  }
}

/** 手続きのトークン列から表示名を生成する */
export function getProcedureDisplayName(procedure: CustomProcedure): string {
  const parts: string[] = []
  for (const token of procedure.tokens) {
    if (token.type === "label") {
      if (token.text.trim()) parts.push(token.text.trim())
      continue
    }
    const param = procedure.params.find((item) => item.id === token.paramId)
    if (param) parts.push(param.name.trim())
  }
  return parts.join(" ").trim() || "my block"
}

/** 手続きの name フィールドをトークン列から再計算する */
export function normalizeProcedure(
  procedure: CustomProcedure
): CustomProcedure {
  return {
    ...procedure,
    name: getProcedureDisplayName(procedure),
  }
}

/** パラメータIDから手続きのパラメータ定義を取得する */
export function getProcedureParam(
  procedure: CustomProcedure,
  paramId: string
): CustomProcedureParam | undefined {
  return procedure.params.find((param) => param.id === paramId)
}

function createProcedureDefineDef(procedure: CustomProcedure): BlockDef {
  return {
    id: `${CUSTOM_DEFINE_PREFIX}${procedure.id}`,
    name: "define",
    opcode: "procedures_definition",
    shape: "hat",
    color: "#FF6680",
    category: "myblocks",
    source: { kind: "custom-define", procedureId: procedure.id },
    paletteHidden: true,
    inputs: procedure.tokens.flatMap((token): InputDef[] => {
      if (token.type === "label") {
        return [{ type: "label", text: token.text }]
      }
      const param = getProcedureParam(procedure, token.paramId)
      if (!param) return []
      return [{
        type: "param-chip",
        paramId: param.id,
        label: param.name,
        valueType: param.valueType,
      }]
    }),
  }
}

function createProcedureCallDef(procedure: CustomProcedure): BlockDef {
  return {
    id: `${CUSTOM_CALL_PREFIX}${procedure.id}`,
    name: "",
    opcode: procedure.returnsValue
      ? "procedures_call_reporter"
      : "procedures_call_stack",
    shape: procedure.returnsValue ? "reporter" : "stack",
    color: "#FF6680",
    category: "myblocks",
    source: { kind: "custom-call", procedureId: procedure.id },
    inputs: procedure.tokens.flatMap((token): InputDef[] => {
      if (token.type === "label") {
        return [{ type: "label", text: token.text }]
      }
      const param = getProcedureParam(procedure, token.paramId)
      if (!param) return []
      if (param.valueType === "number") {
        return [{
          type: "number",
          default: 0,
          placeholder: param.name,
          paramId: param.id,
        }]
      }
      return [{
        type: "text",
        default: "",
        placeholder: param.name,
        paramId: param.id,
      }]
    }),
  }
}

function createProcedureArgumentDef(
  procedure: CustomProcedure,
  param: CustomProcedureParam
): BlockDef {
  return {
    id: `${CUSTOM_ARGUMENT_PREFIX}${procedure.id}:${param.id}`,
    name: param.name,
    opcode: "procedures_argument",
    shape: "reporter",
    color: "#FF6680",
    category: "myblocks",
    source: {
      kind: "custom-argument",
      procedureId: procedure.id,
      paramId: param.id,
    },
    inputs: [],
    paletteHidden: true,
  }
}

/** 手続きからディファイン・コール・引数のブロック定義を一括生成する */
export function buildProcedureBlockDefs(procedure: CustomProcedure): BlockDef[] {
  return [
    createProcedureDefineDef(procedure),
    createProcedureCallDef(procedure),
    ...procedure.params.map((param) =>
      createProcedureArgumentDef(procedure, param)
    ),
  ]
}
