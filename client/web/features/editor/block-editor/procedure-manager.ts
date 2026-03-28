// 手続き管理マネージャー
import type {
  BlockProjectData,
  CustomProcedure,
} from "./types"
import type { BlockEditorSnapshot } from "./controller"
import {
  buildProcedureBlockDefs,
  createDefaultProcedure,
  createDefaultProcedureParam,
  createEditorId,
  normalizeProcedure,
} from "./blocks"

/** ProcedureManager がコントローラーに要求する操作のインターフェース */
export type ProcedureManagerHost = {
  getSnapshot(): BlockEditorSnapshot
  /** 手続き定義の変更を適用し、ワークスペースを再構築する */
  applyProcedureChange(updater: (data: BlockProjectData) => BlockProjectData): void
  setCustomProcedures(procedures: CustomProcedure[]): void
  addBlock(defId: string, x: number, y: number): string | null
  insertBlockByDef(defId: string, procedures: CustomProcedure[], x: number, y: number): string | null
}

/** オブジェクトのディープコピーを作成する（JSON経由） */
function cloneProcedure<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/** カスタム手続きの追加・編集・削除を管理する */
export class ProcedureManager {
  constructor(private readonly host: ProcedureManagerHost) {}

  /** 手続き定義を更新する（export→rebuild の重いパスを通る） */
  update(
    procedureId: string,
    updater: (procedure: CustomProcedure) => CustomProcedure
  ): void {
    this.host.applyProcedureChange((data) => ({
      ...data,
      customProcedures: data.customProcedures.map((procedure) =>
        procedure.id === procedureId
          ? normalizeProcedure(updater(cloneProcedure(procedure)))
          : procedure
      ),
    }))
  }

  /** 手続きにラベルトークンを追加する */
  createLabel(procedureId: string): void {
    this.update(procedureId, (procedure) => ({
      ...procedure,
      tokens: [
        ...procedure.tokens,
        { id: createEditorId("token"), type: "label", text: "label" },
      ],
    }))
  }

  /** 手続きにパラメータトークンを追加する */
  createParam(procedureId: string, valueType: "text" | "number"): void {
    this.update(procedureId, (procedure) => {
      const param = createDefaultProcedureParam(valueType)
      return {
        ...procedure,
        params: [...procedure.params, param],
        tokens: [
          ...procedure.tokens,
          { id: createEditorId("token"), type: "param", paramId: param.id },
        ],
      }
    })
  }

  /** 手続きトークンを前後に移動する */
  moveToken(procedureId: string, tokenId: string, direction: -1 | 1): void {
    this.update(procedureId, (procedure) => {
      const index = procedure.tokens.findIndex((token) => token.id === tokenId)
      if (index === -1) return procedure
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= procedure.tokens.length) return procedure
      const tokens = procedure.tokens.slice()
      const [token] = tokens.splice(index, 1)
      tokens.splice(nextIndex, 0, token)
      return { ...procedure, tokens }
    })
  }

  /** 手続きからトークンを削除する。パラメータトークンの場合はパラメータも削除 */
  removeToken(procedureId: string, tokenId: string): void {
    this.update(procedureId, (procedure) => {
      const token = procedure.tokens.find((item) => item.id === tokenId)
      if (!token) return procedure
      const tokens = procedure.tokens.filter((item) => item.id !== tokenId)
      if (token.type === "param") {
        return {
          ...procedure,
          tokens,
          params: procedure.params.filter((param) => param.id !== token.paramId),
        }
      }
      return { ...procedure, tokens }
    })
  }

  /** 手続きのラベルトークンのテキストを設定する */
  setLabelText(procedureId: string, tokenId: string, text: string): void {
    this.update(procedureId, (procedure) => ({
      ...procedure,
      tokens: procedure.tokens.map((token) =>
        token.id === tokenId && token.type === "label"
          ? { ...token, text }
          : token
      ),
    }))
  }

  /** 手続きパラメータの名前を設定する */
  setParamName(procedureId: string, paramId: string, name: string): void {
    this.update(procedureId, (procedure) => ({
      ...procedure,
      params: procedure.params.map((param) =>
        param.id === paramId ? { ...param, name } : param
      ),
    }))
  }

  /** 手続きトークンの順序を変更する */
  reorderToken(procedureId: string, fromIndex: number, toIndex: number): void {
    this.update(procedureId, (procedure) => {
      if (fromIndex < 0 || fromIndex >= procedure.tokens.length) return procedure
      if (toIndex < 0 || toIndex >= procedure.tokens.length) return procedure
      const tokens = procedure.tokens.slice()
      const [token] = tokens.splice(fromIndex, 1)
      tokens.splice(toIndex, 0, token)
      return { ...procedure, tokens }
    })
  }

  /** 手続きトークンの型を変更する（ラベル↔パラメータ） */
  changeTokenType(
    procedureId: string,
    tokenId: string,
    newType: "label" | "text" | "number"
  ): void {
    this.update(procedureId, (procedure) => {
      const tokenIndex = procedure.tokens.findIndex((t) => t.id === tokenId)
      if (tokenIndex === -1) return procedure
      const token = procedure.tokens[tokenIndex]

      const currentType = token.type === "label"
        ? "label"
        : (procedure.params.find((p) => p.id === token.paramId)?.valueType ?? "text")
      if (currentType === newType) return procedure

      let params = [...procedure.params]
      if (token.type === "param") {
        params = params.filter((p) => p.id !== token.paramId)
      }

      let newToken: typeof token
      if (newType === "label") {
        const oldText = token.type === "label"
          ? token.text
          : (procedure.params.find((p) => p.id === token.paramId)?.name ?? "label")
        newToken = { id: token.id, type: "label", text: oldText }
      } else {
        const param = createDefaultProcedureParam(newType)
        const oldName = token.type === "label"
          ? token.text
          : (procedure.params.find((p) => p.id === token.paramId)?.name ?? param.name)
        param.name = oldName
        params = [...params, param]
        newToken = { id: token.id, type: "param", paramId: param.id }
      }

      const tokens = procedure.tokens.slice()
      tokens[tokenIndex] = newToken
      return { ...procedure, tokens, params }
    })
  }

  /** 手続きの戻り値有無を設定する */
  setReturnsValue(procedureId: string, returnsValue: boolean): void {
    this.update(procedureId, (procedure) => ({
      ...procedure,
      returnsValue,
    }))
  }

  /** 新規カスタム手続きを作成してディファインブロックを配置する */
  createBlock(x: number, y: number): string | null {
    const procedure = normalizeProcedure(createDefaultProcedure())
    const nextProcedures = [...this.host.getSnapshot().customProcedures, procedure]
    this.host.setCustomProcedures(nextProcedures)
    return this.host.addBlock(`${buildProcedureBlockDefs(procedure)[0].id}`, x, y)
  }

  /** 指定した procedure 定義からブロックを作成してワークスペースに追加 */
  createFromSpec(procedure: CustomProcedure, x: number, y: number): string | null {
    const normalized = normalizeProcedure(procedure)
    const nextProcedures = [...this.host.getSnapshot().customProcedures, normalized]
    this.host.setCustomProcedures(nextProcedures)
    const defId = buildProcedureBlockDefs(normalized)[0].id
    return this.host.insertBlockByDef(defId, nextProcedures, x, y)
  }

  /** 手続き定義を複製する（新しいID体系で再生成） */
  cloneDefinition(procedure: CustomProcedure): CustomProcedure {
    const paramIdMap = new Map<string, string>()
    const params = procedure.params.map((param) => {
      const nextId = createDefaultProcedureParam(param.valueType).id
      paramIdMap.set(param.id, nextId)
      return { ...param, id: nextId }
    })
    const tokens = procedure.tokens.map((token) =>
      token.type === "label"
        ? { ...token, id: createEditorId("token") }
        : {
            ...token,
            id: createEditorId("token"),
            paramId: paramIdMap.get(token.paramId) ?? token.paramId,
          }
    )
    return normalizeProcedure({
      ...procedure,
      id: createEditorId("procedure"),
      params,
      tokens,
    })
  }

  /** 手続きと関連ブロック（ディファイン・コール・引数）を全て削除する */
  remove(procedureId: string): void {
    this.host.applyProcedureChange((data) => {
      const procedure = data.customProcedures.find((item) => item.id === procedureId)
      if (!procedure) return data
      const defIds = new Set(buildProcedureBlockDefs(procedure).map((def) => def.id))
      const removedIds = new Set(
        data.workspace.blocks
          .filter((block) => defIds.has(block.defId))
          .map((block) => block.instanceId)
      )
      const workspaceBlocks = data.workspace.blocks
        .filter((block) => !removedIds.has(block.instanceId))
        .map((block) => ({
          ...block,
          nextId: block.nextId && removedIds.has(block.nextId) ? null : block.nextId,
          bodyChildren: block.bodyChildren.map((body) =>
            body.filter((id) => !removedIds.has(id))
          ),
          slotChildren: Object.fromEntries(
            Object.entries(block.slotChildren).filter(
              ([, childId]) => !removedIds.has(childId)
            )
          ),
        }))

      return {
        customProcedures: data.customProcedures.filter(
          (item) => item.id !== procedureId
        ),
        workspace: { blocks: workspaceBlocks },
      }
    })
  }
}
