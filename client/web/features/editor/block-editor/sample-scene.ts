import type { Container, NestingZone, SnapConnection, Workspace } from "headless-vpl"
import { connectStackPairs } from "headless-vpl/blocks"
import type {
  BlockRegistry,
  BodyZoneMeta,
  CBlockRef,
  CreatedBlock,
  SampleScene,
  SlotZoneMeta,
} from "./types"
import { findBuiltinBlockDefId, getBlockDefById } from "./blocks"
import { createBlock } from "./factory"
import { alignCBlockBodyEntryConnectors, syncBodyLayoutChain } from "./layout"

export function resetEditorWorkspace(
  ws: Workspace,
  containers: Container[],
  snapConnections: SnapConnection[],
  nestingZones: NestingZone[],
  cBlockRefs: CBlockRef[],
  createdMap: Map<string, CreatedBlock>,
  slotZoneMap: Map<NestingZone, SlotZoneMeta>,
  bodyZoneMap: Map<NestingZone, BodyZoneMeta>,
  clearNestedSlots: () => void
) {
  for (const edge of Array.from(ws.edges)) {
    ws.removeEdge(edge)
  }
  for (const element of Array.from(ws.elements)) {
    ws.removeElement(element)
  }

  containers.length = 0
  snapConnections.length = 0
  nestingZones.length = 0
  cBlockRefs.length = 0
  createdMap.clear()
  slotZoneMap.clear()
  bodyZoneMap.clear()
  clearNestedSlots()
}

export function buildSampleScene(
  ws: Workspace,
  containers: Container[]
): SampleScene {
  const created: CreatedBlock[] = []
  const definitions: Record<string, CreatedBlock> = {}

  const make = (defId: string, x: number, y: number, key: string): CreatedBlock => {
    const def = getBlockDefById(defId, [])
    if (!def) {
      throw new Error(`BlockDef not found: ${defId}`)
    }
    const block = createBlock(ws, def, x, y)
    created.push(block)
    containers.push(block.container)
    definitions[key] = block
    return block
  }

  make(findBuiltinBlockDefId("When 🏴 clicked"), 60, 30, "flag")
  make(findBuiltinBlockDefId("Move"), 60, 92, "move1")
  make(findBuiltinBlockDefId("Turn ↻"), 60, 134, "turn1")
  make(findBuiltinBlockDefId("Say"), 60, 176, "say1")
  make(findBuiltinBlockDefId("Repeat", "c-block"), 60, 228, "repeat1")

  make(findBuiltinBlockDefId("Move"), 76, 268, "moveInRepeat")
  make(findBuiltinBlockDefId("Turn ↻"), 76, 310, "turnInRepeat")

  make(findBuiltinBlockDefId("When", "hat"), 340, 30, "keyPress")
  make(findBuiltinBlockDefId("If", "c-block-else"), 340, 92, "if1")
  make(findBuiltinBlockDefId("Set", "stack"), 340, 222, "set1")

  return {
    created,
    definitions,
  }
}

export function buildBlockRegistry(created: CreatedBlock[]): BlockRegistry {
  const blockMap = new Map<string, CreatedBlock["state"]>()
  const createdMap = new Map<string, CreatedBlock>()
  const containerMap = new Map<string, Container>()

  for (const block of created) {
    blockMap.set(block.container.id, block.state)
    createdMap.set(block.container.id, block)
    containerMap.set(block.container.id, block.container)
  }

  return { blockMap, createdMap, containerMap }
}

export function connectInitialScene(
  ws: Workspace,
  snapConnections: SnapConnection[],
  pairs: Array<[CreatedBlock, CreatedBlock]>
) {
  connectStackPairs({ workspace: ws, snapConnections, pairs })
}

export function seedInitialCBlockNest(
  cBlock: CreatedBlock,
  nestedBlocks: CreatedBlock[]
) {
  if (!cBlock.cBlockRef) return

  const bodyLayout = cBlock.cBlockRef.bodyLayouts[0]
  nestedBlocks.forEach((block, index) => {
    bodyLayout.insertElement(block.container, index)
  })
  syncBodyLayoutChain(bodyLayout)
  bodyLayout.update()
  alignCBlockBodyEntryConnectors(cBlock.cBlockRef)
}
