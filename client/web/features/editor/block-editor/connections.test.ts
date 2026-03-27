// @ts-expect-error Bun のテストランナー上でのみ解決される
import { describe, expect, test } from "bun:test"
import { Workspace, type SnapConnection } from "headless-vpl"
import { createBlock } from "./factory"
import { findBuiltinBlockDefId, getBlockDefById } from "./blocks"
import { rebuildStackSnapConnections, registerSnapConnections } from "./connections"
import type { CreatedBlock } from "./types"

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
})
