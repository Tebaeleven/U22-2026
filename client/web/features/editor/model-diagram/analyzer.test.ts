import { describe, test, expect } from "vitest"
import type { BlockProjectData, SerializedBlockNode } from "../block-editor/types"
import { BUILTIN_BLOCK_DEFS } from "../block-editor/blocks/block-defs"
import { analyzeRelations, extractSpriteNode, markWatchedVariables } from "./analyzer"

// ─── ヘルパー ───

/** opcode から defId を取得 */
function defIdByOpcode(opcode: string): string {
  const def = BUILTIN_BLOCK_DEFS.find((d) => d.opcode === opcode)
  if (!def) throw new Error(`opcode not found: ${opcode}`)
  return def.id
}

/** テスト用ブロックノードを生成 */
function block(opcode: string, inputValues: Record<string, string> = {}): SerializedBlockNode {
  return {
    instanceId: `inst-${Math.random().toString(36).slice(2, 8)}`,
    defId: defIdByOpcode(opcode),
    inputValues,
    position: { x: 0, y: 0 },
    nextId: null,
    bodyChildren: [],
    slotChildren: {},
  }
}

/** テスト用 BlockProjectData を生成 */
function projectData(
  blocks: SerializedBlockNode[],
  customVariables: string[] = []
): BlockProjectData {
  return {
    customProcedures: [],
    customVariables,
    workspace: { blocks },
  }
}

// ─── テスト ───

describe("extractSpriteNode", () => {
  test("変数と手続きを正しく抽出する", () => {
    const data: BlockProjectData = {
      customProcedures: [
        {
          id: "proc-1",
          name: "攻撃する",
          tokens: [],
          params: [{ id: "p1", name: "ダメージ量", valueType: "number" }],
          returnsValue: false,
        },
      ],
      customVariables: ["hp", "score"],
      workspace: { blocks: [] },
    }

    const node = extractSpriteNode("sprite-1", "Player", data)

    expect(node.spriteId).toBe("sprite-1")
    expect(node.spriteName).toBe("Player")
    expect(node.variables).toEqual([
      { name: "hp", isWatched: false, isLive: false },
      { name: "score", isWatched: false, isLive: false },
    ])
    expect(node.procedures).toEqual([
      { id: "proc-1", name: "攻撃する", params: [{ name: "ダメージ量" }], returnsValue: false },
    ])
  })

  test("変数・手続きが空の場合", () => {
    const data = projectData([])
    const node = extractSpriteNode("sprite-1", "Empty", data)

    expect(node.variables).toEqual([])
    expect(node.procedures).toEqual([])
  })
})

describe("analyzeRelations", () => {
  test("イベント送受信を検出する", () => {
    const allData = new Map<string, BlockProjectData>([
      ["sprite-a", projectData([block("observer_sendevent", { "0": "game-over" })])],
      ["sprite-b", projectData([block("observer_wheneventreceived", { "0": "game-over" })])],
    ])
    const names = new Map([["sprite-a", "Player"], ["sprite-b", "Enemy"]])

    const relations = analyzeRelations(allData, names)

    expect(relations).toHaveLength(1)
    expect(relations[0]).toMatchObject({
      fromSpriteId: "sprite-a",
      toSpriteId: "sprite-b",
      type: "event-send",
      label: "game-over",
      source: "auto",
    })
  })

  test("同一スプライト内のイベント送受信は除外する", () => {
    const allData = new Map<string, BlockProjectData>([
      [
        "sprite-a",
        projectData([
          block("observer_sendevent", { "0": "self-msg" }),
          block("observer_wheneventreceived", { "0": "self-msg" }),
        ]),
      ],
    ])
    const names = new Map([["sprite-a", "Player"]])

    const relations = analyzeRelations(allData, names)
    expect(relations).toHaveLength(0)
  })

  test("変数監視を検出する", () => {
    const allData = new Map<string, BlockProjectData>([
      ["sprite-a", projectData([], ["hp"])],
      ["sprite-b", projectData([block("observer_whenvarchanges", { "0": "hp" })])],
    ])
    const names = new Map([["sprite-a", "Player"], ["sprite-b", "UI"]])

    const relations = analyzeRelations(allData, names)

    expect(relations).toHaveLength(1)
    expect(relations[0]).toMatchObject({
      fromSpriteId: "sprite-a",
      toSpriteId: "sprite-b",
      type: "variable-watch",
      label: "hp",
    })
  })

  test("クローン生成を検出する", () => {
    const allData = new Map<string, BlockProjectData>([
      ["sprite-a", projectData([block("clone_create", { "0": "Bullet" })])],
      ["sprite-b", projectData([])],
    ])
    const names = new Map([["sprite-a", "Player"], ["sprite-b", "Bullet"]])

    const relations = analyzeRelations(allData, names)

    expect(relations).toHaveLength(1)
    expect(relations[0]).toMatchObject({
      fromSpriteId: "sprite-a",
      toSpriteId: "sprite-b",
      type: "clone-create",
      label: "clone",
    })
  })

  test("clone_create の myself は除外する", () => {
    const allData = new Map<string, BlockProjectData>([
      ["sprite-a", projectData([block("clone_create", { "0": "myself" })])],
    ])
    const names = new Map([["sprite-a", "Player"]])

    const relations = analyzeRelations(allData, names)
    expect(relations).toHaveLength(0)
  })

  test("衝突検知を検出する", () => {
    const allData = new Map<string, BlockProjectData>([
      ["sprite-a", projectData([block("event_whentouched", { "0": "Enemy" })])],
      ["sprite-b", projectData([])],
    ])
    const names = new Map([["sprite-a", "Player"], ["sprite-b", "Enemy"]])

    const relations = analyzeRelations(allData, names)

    expect(relations).toHaveLength(1)
    expect(relations[0]).toMatchObject({
      fromSpriteId: "sprite-a",
      toSpriteId: "sprite-b",
      type: "collision-detect",
      label: "touched",
    })
  })

  test("衝突検知 any は全スプライトへのエッジを生成する", () => {
    const allData = new Map<string, BlockProjectData>([
      ["sprite-a", projectData([block("event_whentouched", { "0": "any" })])],
      ["sprite-b", projectData([])],
      ["sprite-c", projectData([])],
    ])
    const names = new Map([["sprite-a", "Player"], ["sprite-b", "Enemy"], ["sprite-c", "Coin"]])

    const relations = analyzeRelations(allData, names)
    expect(relations).toHaveLength(2)
    expect(relations.every((r) => r.fromSpriteId === "sprite-a")).toBe(true)
  })

  test("複数の関係を同時に検出する", () => {
    const allData = new Map<string, BlockProjectData>([
      [
        "sprite-a",
        projectData([
          block("observer_sendevent", { "0": "hit" }),
          block("clone_create", { "0": "Bullet" }),
        ]),
      ],
      [
        "sprite-b",
        projectData([
          block("observer_wheneventreceived", { "0": "hit" }),
          block("event_whentouched", { "0": "Player" }),
        ]),
      ],
      ["sprite-c", projectData([])],
    ])
    const names = new Map([
      ["sprite-a", "Player"],
      ["sprite-b", "Enemy"],
      ["sprite-c", "Bullet"],
    ])

    const relations = analyzeRelations(allData, names)

    const types = relations.map((r) => r.type).sort()
    expect(types).toEqual(["clone-create", "collision-detect", "event-send"])
  })

  test("ブロックが空の場合は空配列を返す", () => {
    const allData = new Map<string, BlockProjectData>([
      ["sprite-a", projectData([])],
      ["sprite-b", projectData([])],
    ])
    const names = new Map([["sprite-a", "A"], ["sprite-b", "B"]])

    const relations = analyzeRelations(allData, names)
    expect(relations).toHaveLength(0)
  })
})

describe("markWatchedVariables", () => {
  test("監視されている変数に isWatched を設定する", () => {
    const nodes = [
      {
        spriteId: "sprite-a",
        spriteName: "Player",
        variables: [
          { name: "hp", isWatched: false, isLive: false },
          { name: "score", isWatched: false, isLive: false },
        ],
        procedures: [],
      },
    ]
    const relations = [
      {
        id: "auto:variable-watch:sprite-a:sprite-b:hp",
        fromSpriteId: "sprite-a",
        toSpriteId: "sprite-b",
        type: "variable-watch" as const,
        label: "hp",
        source: "auto" as const,
      },
    ]

    const result = markWatchedVariables(nodes, relations)

    expect(result[0].variables[0].isWatched).toBe(true)
    expect(result[0].variables[1].isWatched).toBe(false)
  })
})
