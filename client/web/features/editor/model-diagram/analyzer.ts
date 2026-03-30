// ブロックデータから依存関係を自動解析する純粋関数群
import type { BlockProjectData, SerializedBlockNode } from "../block-editor/types"
import { BUILTIN_BLOCK_DEFS } from "../block-editor/blocks/block-defs"
import type { DiagramRelation, SpriteNode, VariableInfo, ProcedureInfo } from "./types"

// ─── opcode → defId マッピング（起動時に1回構築） ───

const OPCODE_TO_DEF_ID = new Map<string, string>()
for (const def of BUILTIN_BLOCK_DEFS) {
  if (def.opcode) {
    OPCODE_TO_DEF_ID.set(def.opcode, def.id)
  }
}

/** defId から opcode を逆引き */
const DEF_ID_TO_OPCODE = new Map<string, string>()
for (const def of BUILTIN_BLOCK_DEFS) {
  if (def.opcode) {
    DEF_ID_TO_OPCODE.set(def.id, def.opcode)
  }
}

/** SerializedBlockNode から opcode を取得 */
function getOpcode(block: SerializedBlockNode): string | undefined {
  return DEF_ID_TO_OPCODE.get(block.defId)
}

/** inputValues から指定インデックスの値を取得（キーは文字列の数値） */
function getInputValue(block: SerializedBlockNode, index: number): string | undefined {
  return block.inputValues[String(index)]
}

// ─── ノード情報抽出 ───

/** 1スプライト分のノード情報を抽出 */
export function extractSpriteNode(
  spriteId: string,
  spriteName: string,
  blockData: BlockProjectData
): SpriteNode {
  // Live Variable の変数名を収集（data_setlivevariable ブロックの第1引数）
  const liveVarNames = new Set<string>()
  for (const block of blockData.workspace.blocks) {
    const opcode = getOpcode(block)
    if (opcode === "data_setlivevariable") {
      const varName = getInputValue(block, 0)
      if (varName) liveVarNames.add(varName)
    }
  }

  const variables: VariableInfo[] = (blockData.customVariables ?? []).map((name) => ({
    name,
    isWatched: false,
    isLive: liveVarNames.has(name),
  }))

  const procedures: ProcedureInfo[] = blockData.customProcedures.map((proc) => ({
    id: proc.id,
    name: proc.name,
    params: proc.params.map((p) => ({ name: p.name })),
    returnsValue: proc.returnsValue,
  }))

  return { spriteId, spriteName, variables, procedures }
}

// ─── 関係解析 ───

/** 関係IDを生成 */
function relationId(type: string, from: string, to: string, detail: string): string {
  return `auto:${type}:${from}:${to}:${detail}`
}

/** 全スプライトのブロックデータを走査して関係を抽出 */
export function analyzeRelations(
  allSpriteData: Map<string, BlockProjectData>,
  spriteNames: Map<string, string> // spriteId → spriteName
): DiagramRelation[] {
  const relations: DiagramRelation[] = []

  // イベント送受信の解析
  relations.push(...analyzeEventRelations(allSpriteData, spriteNames))

  // 変数監視の解析
  relations.push(...analyzeVariableWatchRelations(allSpriteData, spriteNames))

  // クローン生成の解析
  relations.push(...analyzeCloneRelations(allSpriteData, spriteNames))

  // 衝突検知の解析
  relations.push(...analyzeCollisionRelations(allSpriteData, spriteNames))

  return mergeRelations(deduplicateRelations(relations))
}

/** イベント送受信（observer_sendevent → observer_wheneventreceived） */
function analyzeEventRelations(
  allSpriteData: Map<string, BlockProjectData>,
  spriteNames: Map<string, string>
): DiagramRelation[] {
  const relations: DiagramRelation[] = []

  // 受信側を収集: spriteId → Set<eventName>
  const receivers = new Map<string, Set<string>>()
  for (const [spriteId, data] of allSpriteData) {
    for (const block of data.workspace.blocks) {
      if (getOpcode(block) === "observer_wheneventreceived") {
        const eventName = getInputValue(block, 0)
        if (eventName) {
          if (!receivers.has(spriteId)) receivers.set(spriteId, new Set())
          receivers.get(spriteId)!.add(eventName)
        }
      }
    }
  }

  // 送信側を走査してマッチング
  for (const [senderSpriteId, data] of allSpriteData) {
    for (const block of data.workspace.blocks) {
      if (getOpcode(block) === "observer_sendevent") {
        const eventName = getInputValue(block, 0)
        if (!eventName) continue

        for (const [receiverSpriteId, events] of receivers) {
          if (receiverSpriteId === senderSpriteId) continue
          if (events.has(eventName)) {
            relations.push({
              id: relationId("event-send", senderSpriteId, receiverSpriteId, eventName),
              fromSpriteId: senderSpriteId,
              toSpriteId: receiverSpriteId,
              type: "event-send",
              label: eventName,
              source: "auto",
            })
          }
        }
      }
    }
  }

  return relations
}

/** 変数監視（observer_whenvarchanges） */
function analyzeVariableWatchRelations(
  allSpriteData: Map<string, BlockProjectData>,
  spriteNames: Map<string, string>
): DiagramRelation[] {
  const relations: DiagramRelation[] = []

  // 各スプライトが持つ変数名のマップ: variableName → spriteId
  const variableOwners = new Map<string, string>()
  for (const [spriteId, data] of allSpriteData) {
    for (const varName of data.customVariables ?? []) {
      variableOwners.set(varName, spriteId)
    }
  }

  // 監視側を走査
  for (const [watcherSpriteId, data] of allSpriteData) {
    for (const block of data.workspace.blocks) {
      if (getOpcode(block) === "observer_whenvarchanges") {
        const varName = getInputValue(block, 0)
        if (!varName) continue

        const ownerSpriteId = variableOwners.get(varName)
        if (ownerSpriteId && ownerSpriteId !== watcherSpriteId) {
          relations.push({
            id: relationId("variable-watch", ownerSpriteId, watcherSpriteId, varName),
            fromSpriteId: ownerSpriteId,
            toSpriteId: watcherSpriteId,
            type: "variable-watch",
            label: varName,
            source: "auto",
          })
        }
      }
    }
  }

  return relations
}

/** クローン生成（clone_create） */
function analyzeCloneRelations(
  allSpriteData: Map<string, BlockProjectData>,
  spriteNames: Map<string, string>
): DiagramRelation[] {
  const relations: DiagramRelation[] = []

  // spriteName → spriteId の逆引き
  const nameToId = new Map<string, string>()
  for (const [id, name] of spriteNames) {
    nameToId.set(name, id)
  }

  for (const [creatorSpriteId, data] of allSpriteData) {
    for (const block of data.workspace.blocks) {
      if (getOpcode(block) === "clone_create") {
        const targetName = getInputValue(block, 0)
        if (!targetName || targetName === "myself") continue

        const targetSpriteId = nameToId.get(targetName)
        if (targetSpriteId && targetSpriteId !== creatorSpriteId) {
          relations.push({
            id: relationId("clone-create", creatorSpriteId, targetSpriteId, "clone"),
            fromSpriteId: creatorSpriteId,
            toSpriteId: targetSpriteId,
            type: "clone-create",
            label: "clone",
            source: "auto",
          })
        }
      }
    }
  }

  return relations
}

/** 衝突検知（event_whentouched） */
function analyzeCollisionRelations(
  allSpriteData: Map<string, BlockProjectData>,
  spriteNames: Map<string, string>
): DiagramRelation[] {
  const relations: DiagramRelation[] = []

  // spriteName → spriteId の逆引き
  const nameToId = new Map<string, string>()
  for (const [id, name] of spriteNames) {
    nameToId.set(name, id)
  }

  for (const [detectorSpriteId, data] of allSpriteData) {
    for (const block of data.workspace.blocks) {
      if (getOpcode(block) === "event_whentouched") {
        const targetName = getInputValue(block, 0)
        if (!targetName) continue

        if (targetName === "any") {
          // "any" は全スプライトとの衝突
          for (const [otherSpriteId] of allSpriteData) {
            if (otherSpriteId === detectorSpriteId) continue
            relations.push({
              id: relationId("collision-detect", detectorSpriteId, otherSpriteId, "any"),
              fromSpriteId: detectorSpriteId,
              toSpriteId: otherSpriteId,
              type: "collision-detect",
              label: "touched (any)",
              source: "auto",
            })
          }
        } else {
          const targetSpriteId = nameToId.get(targetName)
          if (targetSpriteId && targetSpriteId !== detectorSpriteId) {
            relations.push({
              id: relationId("collision-detect", detectorSpriteId, targetSpriteId, "touched"),
              fromSpriteId: detectorSpriteId,
              toSpriteId: targetSpriteId,
              type: "collision-detect",
              label: "touched",
              source: "auto",
            })
          }
        }
      }
    }
  }

  return relations
}

/** 重複する関係を除去 */
function deduplicateRelations(relations: DiagramRelation[]): DiagramRelation[] {
  const seen = new Set<string>()
  return relations.filter((r) => {
    if (seen.has(r.id)) return false
    seen.add(r.id)
    return true
  })
}

/**
 * 同一ノードペア間の同一タイプの関係を1本にまとめる。
 *
 * 1. 同方向の重複（A→B が複数）→ 1本にまとめてラベル集約
 * 2. 逆方向の重複（A→B と B→A）→ 双方向1本にまとめる
 *
 * 例: A→B に event-send が3本 → 1本 "enemy-killed 他2件"
 * 例: A→B touched + B→A touched → 双方向1本 "touched"
 */
function mergeRelations(relations: DiagramRelation[]): DiagramRelation[] {
  // Phase 1: 同方向の同タイプをまとめる (from:to:type → 1本)
  const directedGroups = new Map<string, DiagramRelation[]>()
  for (const r of relations) {
    const key = `${r.fromSpriteId}:${r.toSpriteId}:${r.type}`
    if (!directedGroups.has(key)) directedGroups.set(key, [])
    directedGroups.get(key)!.push(r)
  }

  const directedMerged: DiagramRelation[] = []
  for (const members of directedGroups.values()) {
    const first = members[0]
    if (members.length === 1) {
      directedMerged.push(first)
      continue
    }
    const labels = [...new Set(members.map((m) => m.label).filter(Boolean))]
    directedMerged.push({
      ...first,
      label: labels.length <= 1
        ? (labels[0] ?? "")
        : `${labels[0]} 他${labels.length - 1}件`,
    })
  }

  // Phase 2: 逆方向ペアを双方向1本にまとめる（正規化キー = ソート済みID:type）
  const pairGroups = new Map<string, DiagramRelation[]>()
  for (const r of directedMerged) {
    const [a, b] = [r.fromSpriteId, r.toSpriteId].sort()
    const key = `${a}:${b}:${r.type}`
    if (!pairGroups.has(key)) pairGroups.set(key, [])
    pairGroups.get(key)!.push(r)
  }

  const result: DiagramRelation[] = []
  for (const members of pairGroups.values()) {
    if (members.length === 1) {
      result.push(members[0])
      continue
    }

    // 2本（A→B と B→A）を双方向1本にまとめる
    const first = members[0]
    const allLabels = [...new Set(members.flatMap((m) => m.label ? [m.label] : []))]
    const mergedLabel = allLabels.length <= 1
      ? (allLabels[0] ?? "")
      : `${allLabels[0]} 他${allLabels.length - 1}件`

    result.push({
      ...first,
      label: mergedLabel,
      // 双方向フラグ: collision-detect は元から双方向なのでそのまま、他は bidirectional に
      _bidirectional: true,
    } as DiagramRelation)
  }

  return result
}

// ─── コードコメント抽出 ───

/** 装飾行（═══, ---, ~~~, ***）を判定 */
function isDecorativeLine(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length === 0) return true
  return /^[═=\-~*─]+$/.test(trimmed)
}

/**
 * 疑似コードからクラス定義直前のコメントブロックを抽出する。
 * 返り値: クラス名 → コメント行配列 のマッピング
 */
export function extractClassComments(pseudocode: string): Map<string, string[]> {
  const result = new Map<string, string[]>()
  const lines = pseudocode.split("\n")

  let pendingComments: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    // コメント行を蓄積
    if (trimmed.startsWith("//")) {
      const commentText = trimmed.slice(2).trim()
      if (!isDecorativeLine(commentText)) {
        pendingComments.push(commentText)
      }
      continue
    }

    // クラス定義を検出
    const classMatch = trimmed.match(/^class\s+(\S+)/)
    if (classMatch && pendingComments.length > 0) {
      const className = classMatch[1].replace(/\s*\{.*$/, "")
      result.set(className, [...pendingComments])
    }

    // コメント行以外が来たらリセット（class行自体もリセット対象）
    pendingComments = []
  }

  return result
}

/** 変数の isWatched フラグを更新 */
export function markWatchedVariables(
  nodes: SpriteNode[],
  relations: DiagramRelation[]
): SpriteNode[] {
  const watchedVars = new Set<string>()
  for (const r of relations) {
    if (r.type === "variable-watch") {
      watchedVars.add(`${r.fromSpriteId}:${r.label}`)
    }
  }

  return nodes.map((node) => ({
    ...node,
    variables: node.variables.map((v) => ({
      ...v,
      isWatched: watchedVars.has(`${node.spriteId}:${v.name}`),
    })),
  }))
}
