// @ts-expect-error Bun のテストランナー上でのみ解決される
import { describe, expect, test } from "bun:test"
import {
  NestingZone,
  Workspace,
  type Connector,
  type SnapConnection,
} from "headless-vpl"
import { createBlock } from "./factory"
import { getBlockDefs, findBuiltinBlockDefId, getBlockDefById } from "./blocks"
import {
  rebuildStackSnapConnections,
  registerCBlockBodyZones,
  registerSnapConnections,
} from "./connections"
import { relayoutCreatedBlocks } from "./layout"
import type { BodyZoneMeta, CBlockRef, CreatedBlock } from "./types"

function createStackBlock(workspace: Workspace, name: string, x: number, y: number): CreatedBlock {
  const def = getBlockDefById(findBuiltinBlockDefId(name, "stack"), [])
  if (!def) {
    throw new Error(`missing block def: ${name}`)
  }
  return createBlock(workspace, def, x, y)
}

function createHatBlock(workspace: Workspace, name: string, x: number, y: number): CreatedBlock {
  const def = getBlockDefById(findBuiltinBlockDefId(name, "hat"), [])
  if (!def) {
    throw new Error(`missing block def: ${name}`)
  }
  return createBlock(workspace, def, x, y)
}

function createBlockByOpcode(
  workspace: Workspace,
  opcode: string,
  x: number,
  y: number
): CreatedBlock {
  const def = getBlockDefs([]).find((item) => item.opcode === opcode)
  if (!def) {
    throw new Error(`missing block def: ${opcode}`)
  }
  return createBlock(workspace, def, x, y)
}

function moveTopConnectorTo(block: CreatedBlock, x: number, y: number): void {
  if (!block.topConn) {
    throw new Error(`block ${block.state.def.opcode ?? block.state.def.name} has no top connector`)
  }
  moveConnectorTo(block, block.topConn, x, y)
}

function moveConnectorTo(
  block: CreatedBlock,
  connector: Connector,
  x: number,
  y: number
): void {
  const deltaX = x - connector.position.x
  const deltaY = y - connector.position.y
  block.container.move(
    block.container.position.x + deltaX,
    block.container.position.y + deltaY
  )
}

function getBodyEntryConnector(block: CreatedBlock): Connector {
  const connector = block.cBlockRef?.bodyEntryConnectors[0]
  if (!connector) {
    throw new Error(
      `missing body entry connector: ${block.state.def.opcode ?? block.state.def.name}`
    )
  }
  return connector
}

function getBodyZone(
  workspace: Workspace,
  created: CreatedBlock[],
  owner: CreatedBlock,
  createdMap: Map<string, CreatedBlock>
): NestingZone {
  const cBlockRefs: CBlockRef[] = []
  const nestingZones: NestingZone[] = []
  const bodyZoneMap = new Map<NestingZone, BodyZoneMeta>()

  registerCBlockBodyZones(
    workspace,
    created,
    createdMap,
    cBlockRefs,
    nestingZones,
    bodyZoneMap
  )

  const zone = nestingZones.find(
    (item) => item.target === owner.container && item.layout === owner.cBlockRef?.bodyLayouts[0]
  )
  if (!zone) {
    throw new Error(`missing body zone for ${owner.state.def.opcode}`)
  }
  return zone
}

describe("registerSnapConnections", () => {
  test("親側をドラッグした時も stack snap 候補になる", () => {
    const workspace = new Workspace()
    const parent = createStackBlock(workspace, "Move", 40, 40)
    const child = createStackBlock(workspace, "Wait", 40, 120)
    const createdMap = new Map<string, CreatedBlock>([
      [parent.container.id, parent],
      [child.container.id, child],
    ])
    const snapConnections: SnapConnection[] = []

    registerSnapConnections(workspace, [parent, child], snapConnections, createdMap)

    const connection = snapConnections.find(
      (item) => item.source === child.container && item.target === parent.container
    )

    expect(connection).toBeDefined()
    expect(connection?.strategy(child.container, parent.container, [child.container])).toBe(true)
    expect(connection?.strategy(child.container, parent.container, [parent.container])).toBe(true)
    expect(connection?.strategy(child.container, parent.container, [])).toBe(false)
  })

  test("後追加した physics と move も既存の旗ブロックへ接続候補を持つ", () => {
    const workspace = new Workspace()
    const flag = createHatBlock(workspace, "When 🏴 clicked", 40, 40)
    const createdMap = new Map<string, CreatedBlock>([[flag.container.id, flag]])
    const snapConnections: SnapConnection[] = []

    rebuildStackSnapConnections(workspace, snapConnections, createdMap)
    expect(snapConnections).toHaveLength(0)

    const move = createStackBlock(workspace, "Move", 40, 120)
    createdMap.set(move.container.id, move)
    rebuildStackSnapConnections(workspace, snapConnections, createdMap)

    expect(
      snapConnections.some(
        (item) => item.source === move.container && item.target === flag.container
      )
    ).toBe(true)

    const physics = createStackBlock(workspace, "Set physics", 40, 200)
    createdMap.set(physics.container.id, physics)
    rebuildStackSnapConnections(workspace, snapConnections, createdMap)

    expect(
      snapConnections.some(
        (item) => item.source === physics.container && item.target === flag.container
      )
    ).toBe(true)
    expect(
      snapConnections.some(
        (item) => item.source === physics.container && item.target === move.container
      )
    ).toBe(true)
  })

  test("再構築時に既存の locked 接続を引き継ぐ", () => {
    const workspace = new Workspace()
    const flag = createHatBlock(workspace, "When 🏴 clicked", 40, 40)
    const move = createStackBlock(workspace, "Move", 40, 120)
    const createdMap = new Map<string, CreatedBlock>([
      [flag.container.id, flag],
      [move.container.id, move],
    ])
    const snapConnections: SnapConnection[] = []

    rebuildStackSnapConnections(workspace, snapConnections, createdMap)
    const initialConnection = snapConnections.find(
      (item) => item.source === move.container && item.target === flag.container
    )
    expect(initialConnection).toBeDefined()
    initialConnection?.lock()
    expect(move.container.Parent).toBe(flag.container)

    const physics = createStackBlock(workspace, "Set physics", 40, 200)
    createdMap.set(physics.container.id, physics)
    rebuildStackSnapConnections(workspace, snapConnections, createdMap)

    const rebuiltConnection = snapConnections.find(
      (item) => item.source === move.container && item.target === flag.container
    )
    expect(rebuiltConnection?.locked).toBe(true)
    expect(move.container.Parent).toBe(flag.container)
  })

  test("control_forever と control_if は stack を body に受け入れ、value block を拒否する", () => {
    for (const opcode of ["control_forever", "control_if"] as const) {
      const workspace = new Workspace()
      const owner = createBlockByOpcode(workspace, opcode, 40, 40)
      const stackChild = createStackBlock(workspace, "Move", 200, 40)
      const booleanChild = createBlockByOpcode(workspace, "sensing_keypressed", 280, 40)
      const reporterChild = createBlockByOpcode(workspace, "motion_xposition", 360, 40)
      const created = [owner, stackChild, booleanChild, reporterChild]
      const createdMap = new Map(created.map((block) => [block.container.id, block] as const))

      relayoutCreatedBlocks(created)

      const bodyEntry = owner.cBlockRef?.bodyEntryConnectors[0]
      if (!bodyEntry) {
        throw new Error(`missing body entry connector: ${opcode}`)
      }
      moveTopConnectorTo(stackChild, bodyEntry.position.x, bodyEntry.position.y)

      const zone = getBodyZone(workspace, created, owner, createdMap)

      expect(zone.detectHover([stackChild.container])).toBe(stackChild.container)
      expect(zone.insertIndex).toBe(0)
      expect(zone.hovered).toBe(stackChild.container)

      expect(zone.detectHover([booleanChild.container])).toBeNull()
      expect(zone.hovered).toBeNull()

      expect(zone.detectHover([reporterChild.container])).toBeNull()
      expect(zone.hovered).toBeNull()
    }
  })

  test("control_forever（cap-c）は bottomConn を持たず snap 候補を生成しない", () => {
    const workspace = new Workspace()
    const owner = createBlockByOpcode(workspace, "control_forever", 40, 40)
    const child = createStackBlock(workspace, "Move", 200, 40)
    const created = [owner, child]
    const createdMap = new Map(created.map((block) => [block.container.id, block] as const))
    const snapConnections: SnapConnection[] = []

    relayoutCreatedBlocks(created)
    registerSnapConnections(workspace, created, snapConnections, createdMap)

    const connectionBelow = snapConnections.find(
      (item) => item.source === child.container && item.target === owner.container
    )
    expect(connectionBelow).toBeUndefined()
  })

  test("control_if は body hit 時に bottom snap より nesting を優先する", () => {
    const workspace = new Workspace()
    const owner = createBlockByOpcode(workspace, "control_if", 40, 40)
    const child = createStackBlock(workspace, "Move", 200, 40)
    const created = [owner, child]
    const createdMap = new Map(created.map((block) => [block.container.id, block] as const))
    const snapConnections: SnapConnection[] = []

    relayoutCreatedBlocks(created)

    const bodyEntry = owner.cBlockRef?.bodyEntryConnectors[0]
    if (!bodyEntry) {
      throw new Error(`missing body entry connector: control_if`)
    }
    moveTopConnectorTo(child, bodyEntry.position.x, bodyEntry.position.y)

    registerSnapConnections(workspace, created, snapConnections, createdMap)

    const connection = snapConnections.find(
      (item) => item.source === child.container && item.target === owner.container
    )

    expect(connection).toBeDefined()
    expect(connection?.validator?.()).toBe(false)
  })

  test("control_if は inner connector を Forever の body entry に合わせると body に入れられる", () => {
    const workspace = new Workspace()
    const forever = createBlockByOpcode(workspace, "control_forever", 40, 40)
    const ifChild = createBlockByOpcode(workspace, "control_if", 200, 40)
    const created = [forever, ifChild]
    const createdMap = new Map(created.map((block) => [block.container.id, block] as const))

    relayoutCreatedBlocks(created)

    const targetBodyEntry = getBodyEntryConnector(forever)
    const sourceBodyEntry = getBodyEntryConnector(ifChild)

    moveConnectorTo(
      ifChild,
      sourceBodyEntry,
      targetBodyEntry.position.x,
      targetBodyEntry.position.y
    )

    const zone = getBodyZone(workspace, created, forever, createdMap)

    expect(ifChild.topConn?.position.x).not.toBe(targetBodyEntry.position.x)
    expect(zone.detectHover([ifChild.container])).toBe(ifChild.container)
    expect(zone.insertIndex).toBe(0)
    expect(zone.hovered).toBe(ifChild.container)
  })

  test("control_forever（cap-c）は control_if との bottom snap を生成しない", () => {
    const workspace = new Workspace()
    const forever = createBlockByOpcode(workspace, "control_forever", 40, 40)
    const ifChild = createBlockByOpcode(workspace, "control_if", 200, 40)
    const created = [forever, ifChild]
    const createdMap = new Map(created.map((block) => [block.container.id, block] as const))
    const snapConnections: SnapConnection[] = []

    relayoutCreatedBlocks(created)

    moveConnectorTo(
      ifChild,
      getBodyEntryConnector(ifChild),
      getBodyEntryConnector(forever).position.x,
      getBodyEntryConnector(forever).position.y
    )

    registerSnapConnections(workspace, created, snapConnections, createdMap)

    // Forever は bottomConn を持たないため、if → forever の snap 候補は存在しない
    const connection = snapConnections.find(
      (item) => item.source === ifChild.container && item.target === forever.container
    )
    expect(connection).toBeUndefined()
  })

  test("control_if は topConn を Forever の body entry に合わせても body に入れられる", () => {
    const workspace = new Workspace()
    const forever = createBlockByOpcode(workspace, "control_forever", 40, 40)
    const ifChild = createBlockByOpcode(workspace, "control_if", 200, 40)
    const created = [forever, ifChild]
    const createdMap = new Map(created.map((block) => [block.container.id, block] as const))

    relayoutCreatedBlocks(created)

    const targetBodyEntry = getBodyEntryConnector(forever)
    moveTopConnectorTo(ifChild, targetBodyEntry.position.x, targetBodyEntry.position.y)

    const zone = getBodyZone(workspace, created, forever, createdMap)

    expect(zone.detectHover([ifChild.container])).toBe(ifChild.container)
    expect(zone.insertIndex).toBe(0)
    expect(zone.hovered).toBe(ifChild.container)
  })

  test("control_if をボディ内部の中心付近にドラッグしても body に入れられる", () => {
    const workspace = new Workspace()
    const forever = createBlockByOpcode(workspace, "control_forever", 40, 40)
    const ifChild = createBlockByOpcode(workspace, "control_if", 300, 40)
    const created = [forever, ifChild]
    const createdMap = new Map(created.map((block) => [block.container.id, block] as const))

    relayoutCreatedBlocks(created)

    const bodyLayout = forever.cBlockRef!.bodyLayouts[0]
    const bodyCenterX = bodyLayout.absolutePosition.x + bodyLayout.width / 2
    const bodyCenterY = bodyLayout.absolutePosition.y + bodyLayout.height / 2
    ifChild.container.move(
      bodyCenterX - ifChild.container.width / 2,
      bodyCenterY - ifChild.container.height / 2
    )

    const zone = getBodyZone(workspace, created, forever, createdMap)

    expect(zone.detectHover([ifChild.container])).toBe(ifChild.container)
    expect(zone.insertIndex).toBe(0)
  })

  test("control_repeat も inner connector を Forever の body entry に合わせると body に入れられる", () => {
    const workspace = new Workspace()
    const forever = createBlockByOpcode(workspace, "control_forever", 40, 40)
    const repeatChild = createBlockByOpcode(workspace, "control_repeat", 200, 40)
    const created = [forever, repeatChild]
    const createdMap = new Map(created.map((block) => [block.container.id, block] as const))

    relayoutCreatedBlocks(created)

    moveConnectorTo(
      repeatChild,
      getBodyEntryConnector(repeatChild),
      getBodyEntryConnector(forever).position.x,
      getBodyEntryConnector(forever).position.y
    )

    const zone = getBodyZone(workspace, created, forever, createdMap)

    expect(zone.detectHover([repeatChild.container])).toBe(repeatChild.container)
    expect(zone.insertIndex).toBe(0)
    expect(zone.hovered).toBe(repeatChild.container)
  })
})
