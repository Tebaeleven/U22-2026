// 永続化管理マネージャー
import type { Container, Workspace } from "headless-vpl"
import { connectStackPairs } from "headless-vpl/blocks"
import type {
  BlockProjectData,
  CreatedBlock,
  SerializedBlockNode,
} from "./types"
import {
  getBlockDefById,
  getInputIndexBySerializationKey,
  getInputSerializationKey,
} from "./blocks"
import {
  alignCBlockBodyEntryConnectors,
  relayoutCreatedBlocks,
  syncBodyLayoutChain,
} from "./layout"
import { createBlock } from "./factory"
import type { SnapConnection } from "headless-vpl"

/** デシリアライズ時の不整合情報 */
export type DeserializeWarning = {
  type: "missing-def" | "missing-next" | "missing-body-child" | "missing-slot-child" | "shape-mismatch"
  blockId: string
  detail: string
}

/** 接続が切れたチェーンをオフセットして分離表示する */
function offsetDetachedTopLevelChain(
  rootId: string,
  nodeMap: ReadonlyMap<string, SerializedBlockNode>,
  idMap: ReadonlyMap<string, CreatedBlock>,
  bodyMembers: ReadonlySet<string>,
  slotMembers: ReadonlySet<string>
): void {
  let currentId: string | null = rootId
  while (currentId) {
    const created = idMap.get(currentId)
    if (created) {
      created.container.move(
        created.container.position.x + 32,
        created.container.position.y + 32
      )
    }
    const node = nodeMap.get(currentId)
    const nextId = node?.nextId ?? null
    if (!nextId || bodyMembers.has(nextId) || slotMembers.has(nextId)) {
      break
    }
    currentId = nextId
  }
}

/** シリアライズデータからブロックを生成する */
function deserializeBlocks(
  workspace: Workspace,
  projectData: BlockProjectData,
): { createdList: CreatedBlock[]; idMap: Map<string, CreatedBlock>; containers: Container[]; warnings: DeserializeWarning[] } {
  const createdList: CreatedBlock[] = []
  const idMap = new Map<string, CreatedBlock>()
  const containers: Container[] = []
  const warnings: DeserializeWarning[] = []

  for (const node of projectData.workspace.blocks) {
    const def = getBlockDefById(node.defId, projectData.customProcedures)
    if (!def) {
      warnings.push({ type: "missing-def", blockId: node.instanceId, detail: `ブロック定義 "${node.defId}" が見つかりません` })
      continue
    }
    const created = createBlock(workspace, def, node.position.x, node.position.y)
    for (const [key, value] of Object.entries(node.inputValues)) {
      const inputIndex = getInputIndexBySerializationKey(def, key)
      if (inputIndex >= 0) {
        created.state.inputValues[inputIndex] = value
      }
    }
    createdList.push(created)
    containers.push(created.container)
    idMap.set(node.instanceId, created)
  }

  return { createdList, idMap, containers, warnings }
}

/** スタック接続を復元する */
function restoreStackConnections(
  workspace: Workspace,
  projectData: BlockProjectData,
  idMap: ReadonlyMap<string, CreatedBlock>,
  snapConnections: SnapConnection[],
  bodyMembers: ReadonlySet<string>,
  slotMembers: ReadonlySet<string>,
  nodeMap: ReadonlyMap<string, SerializedBlockNode>,
): { warnings: DeserializeWarning[] } {
  const warnings: DeserializeWarning[] = []
  const topLevelPairs: Array<[CreatedBlock, CreatedBlock]> = []
  const detachedChainRoots = new Set<string>()

  for (const node of projectData.workspace.blocks) {
    if (!node.nextId) continue
    if (bodyMembers.has(node.nextId) || slotMembers.has(node.nextId)) continue
    const parent = idMap.get(node.instanceId)
    const child = idMap.get(node.nextId)
    if (!parent || !child) {
      if (!idMap.has(node.nextId)) {
        warnings.push({ type: "missing-next", blockId: node.instanceId, detail: `nextId "${node.nextId}" が存在しません` })
      }
      continue
    }
    if (!parent.bottomConn || !child.topConn) {
      detachedChainRoots.add(node.nextId)
      continue
    }
    topLevelPairs.push([child, parent])
  }

  if (topLevelPairs.length > 0) {
    connectStackPairs({ workspace, snapConnections, pairs: topLevelPairs })
  }

  for (const rootId of detachedChainRoots) {
    offsetDetachedTopLevelChain(rootId, nodeMap, idMap, bodyMembers, slotMembers)
  }

  return { warnings }
}

/** Cブロックのボディネスティングを復元する */
function restoreBodyNesting(
  projectData: BlockProjectData,
  idMap: ReadonlyMap<string, CreatedBlock>,
): { warnings: DeserializeWarning[] } {
  const warnings: DeserializeWarning[] = []

  for (const node of projectData.workspace.blocks) {
    const owner = idMap.get(node.instanceId)
    if (!owner?.cBlockRef) continue
    node.bodyChildren.forEach((body, bodyIndex) => {
      const layout = owner.cBlockRef?.bodyLayouts[bodyIndex]
      if (!layout) return
      body.forEach((childId, index) => {
        const child = idMap.get(childId)
        if (!child) {
          warnings.push({ type: "missing-body-child", blockId: node.instanceId, detail: `ボディ子ブロック "${childId}" が存在しません` })
          return
        }
        layout.insertElement(child.container, index)
      })
      syncBodyLayoutChain(layout)
      layout.update()
    })
    alignCBlockBodyEntryConnectors(owner.cBlockRef)
  }

  return { warnings }
}

/** スロットネスティングを復元する */
function restoreSlotNesting(
  projectData: BlockProjectData,
  idMap: ReadonlyMap<string, CreatedBlock>,
  setNestedSlot: (blockId: string, inputIndex: number, containerId: string) => void,
): { warnings: DeserializeWarning[] } {
  const warnings: DeserializeWarning[] = []

  for (const node of projectData.workspace.blocks) {
    const owner = idMap.get(node.instanceId)
    if (!owner) continue
    for (const [key, childId] of Object.entries(node.slotChildren)) {
      const child = idMap.get(childId)
      if (!child) {
        warnings.push({ type: "missing-slot-child", blockId: node.instanceId, detail: `スロット子ブロック "${childId}" が存在しません` })
        continue
      }
      const inputIndex = getInputIndexBySerializationKey(owner.state.def, key)
      if (inputIndex === -1) continue
      const slot = owner.slotLayouts.find(
        (item) => item.info.inputIndex === inputIndex
      )
      if (!slot) continue
      if (!slot.info.acceptedShapes.includes(child.state.def.shape as never)) {
        warnings.push({ type: "shape-mismatch", blockId: node.instanceId, detail: `スロット ${inputIndex} が形状 "${child.state.def.shape}" を受け入れません` })
        child.container.move(
          child.container.position.x + 24,
          child.container.position.y + 24
        )
        continue
      }
      slot.layout.insertElement(child.container, 0)
      setNestedSlot(owner.state.id, inputIndex, child.state.id)
    }
  }

  return { warnings }
}

/** ボディ・スロットに含まれるブロックIDのセットを収集する */
function collectNestedMembers(
  projectData: BlockProjectData
): { bodyMembers: Set<string>; slotMembers: Set<string> } {
  const bodyMembers = new Set<string>()
  const slotMembers = new Set<string>()
  for (const node of projectData.workspace.blocks) {
    for (const body of node.bodyChildren) {
      for (const childId of body) {
        bodyMembers.add(childId)
      }
    }
    for (const childId of Object.values(node.slotChildren)) {
      slotMembers.add(childId)
    }
  }
  return { bodyMembers, slotMembers }
}

/** プロジェクトデータからブロックを再構築する */
export function rebuildBlocks(
  workspace: Workspace,
  projectData: BlockProjectData,
  snapConnections: SnapConnection[],
  registerCreatedBlocks: (created: CreatedBlock[]) => void,
  addContainers: (containers: Container[]) => void,
  setNestedSlot: (blockId: string, inputIndex: number, containerId: string) => void,
): { createdList: CreatedBlock[]; warnings: DeserializeWarning[] } {
  const allWarnings: DeserializeWarning[] = []

  // ブロック生成
  const { createdList, idMap, containers, warnings: deserializeWarnings } =
    deserializeBlocks(workspace, projectData)
  allWarnings.push(...deserializeWarnings)

  addContainers(containers)
  registerCreatedBlocks(createdList)

  // ネストメンバー収集
  const { bodyMembers, slotMembers } = collectNestedMembers(projectData)
  const nodeMap = new Map(
    projectData.workspace.blocks.map((node) => [node.instanceId, node] as const)
  )

  // スタック接続復元
  const { warnings: stackWarnings } = restoreStackConnections(
    workspace, projectData, idMap, snapConnections, bodyMembers, slotMembers, nodeMap
  )
  allWarnings.push(...stackWarnings)

  // ボディネスティング復元
  const { warnings: bodyWarnings } = restoreBodyNesting(projectData, idMap)
  allWarnings.push(...bodyWarnings)

  // スロットネスティング復元
  const { warnings: slotWarnings } = restoreSlotNesting(projectData, idMap, setNestedSlot)
  allWarnings.push(...slotWarnings)

  relayoutCreatedBlocks(createdList)

  if (allWarnings.length > 0) {
    console.warn("[PersistenceManager] デシリアライズ時の不整合:", allWarnings)
  }

  return { createdList, warnings: allWarnings }
}

/** ワークスペースの状態をシリアライズする */
export function exportWorkspaceBlocks(
  createdMap: ReadonlyMap<string, CreatedBlock>,
  nestedSlots: Record<string, string>,
): { blocks: SerializedBlockNode[] } {
  const blocks: SerializedBlockNode[] = Array.from(createdMap.values()).map(
    (created) => {
      const inputValues = Object.fromEntries(
        Object.entries(created.state.inputValues).map(([index, value]) => {
          const inputIndex = Number(index)
          const input = created.state.def.inputs[inputIndex]
          return [
            getInputSerializationKey(created.state.def, input, inputIndex),
            value,
          ]
        })
      )

      const slotChildren = Object.fromEntries(
        Object.entries(nestedSlots)
          .filter(([key]) => key.startsWith(`${created.state.id}-`))
          .map(([key, childId]) => {
            const inputIndex = Number(key.split("-").at(-1) ?? -1)
            const input = created.state.def.inputs[inputIndex]
            return [
              getInputSerializationKey(created.state.def, input, inputIndex),
              childId,
            ]
          })
      )

      const bodyChildren = created.cBlockRef
        ? created.cBlockRef.bodyLayouts.map((layout) =>
            layout.Children.map((child) => child.id)
          )
        : []

      const nextId =
        Array.from(created.container.Children).find(
          (child) => child.Parent === created.container
        )?.id ?? null

      return {
        instanceId: created.state.id,
        defId: created.state.def.id,
        inputValues,
        position: {
          x: created.container.position.x,
          y: created.container.position.y,
        },
        nextId,
        bodyChildren,
        slotChildren,
      }
    }
  )

  return { blocks }
}
