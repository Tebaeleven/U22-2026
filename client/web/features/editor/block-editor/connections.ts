// ブロック接続・ゾーン登録・近接判定
import {
  createSlotZone,
  createStackSnapConnections,
} from "headless-vpl/helpers"
import { createConnectorInsertZone, isConnectorColliding } from "headless-vpl/blocks"
import { NestingZone } from "headless-vpl"
import type {
  SnapConnection,
  Workspace,
} from "headless-vpl"
import type { ProximityHit } from "headless-vpl/blocks"
import type {
  BlockState,
  BodyZoneMeta,
  CBlockRef,
  CreatedBlock,
  SlotZoneMeta,
} from "./types"
import { isValueBlockShape, resolveBlockBehavior } from "./blocks"
import { findBodyLayoutHit, hasPriorityCBlockBodyHit } from "./layout"

/** ドラッグ判定のゾーン優先度（値が大きいほど優先） */
const ZONE_PRIORITY = {
  BODY: 200,    // Cブロック内部（最優先）
  SLOT: 150,    // スロットはめ込み
  SNAP: 100,    // スタック接続
} as const

const SLOT_ZONE_PADDING = 0
const BODY_ZONE_PADDING = 10
const SLOT_CENTER_TOLERANCE = { x: 30, y: 20 }

/** ドラッグされたブロックの形状を検証するバリデーターを生成する */
function createShapeValidator(
  createdMap: Map<string, CreatedBlock>,
  acceptedShapes: readonly string[]
): (dragged: { id: string }) => boolean {
  return (dragged) => {
    const shape = createdMap.get(dragged.id)?.state.def.shape
    if (!shape || !isValueBlockShape(shape)) return false
    return acceptedShapes.includes(shape)
  }
}

/** ブーリアンスロット用のネスティングゾーンを生成する */
function createBooleanSlotZone(
  ws: Workspace,
  block: CreatedBlock,
  createdMap: Map<string, CreatedBlock>,
  slot: CreatedBlock["slotLayouts"][number]
) {
  return new NestingZone({
    target: block.container,
    layout: slot.layout,
    workspace: ws,
    priority: ZONE_PRIORITY.SLOT,
    padding: SLOT_ZONE_PADDING,
    validator: (dragged) => {
      if (slot.layout.Children.length > 0) return false
      return createShapeValidator(createdMap, ["boolean"])(dragged)
    },
    connectorHit: (dragged) => {
      const draggedBlock = createdMap.get(dragged.id)
      if (!draggedBlock?.valueConnector || !slot.connector) {
        return null
      }
      return isConnectorColliding(draggedBlock.valueConnector, slot.connector)
        ? 0
        : null
    },
  })
}

/** スタックブロック同士のスナップ接続を登録する */
export function registerSnapConnections(
  ws: Workspace,
  created: CreatedBlock[],
  snapConnections: SnapConnection[],
  createdMap: Map<string, CreatedBlock>
) {
  const connectable = created.filter(
    (block) => block.topConn !== null || block.bottomConn !== null
  )

  snapConnections.push(
    ...createStackSnapConnections({
      workspace: ws,
      items: connectable,
      getContainer: (block) => block.container,
      getTopConnector: (block) => block.topConn,
      getBottomConnector: (block) => block.bottomConn,
      priority: ZONE_PRIORITY.SNAP,
      validator: ({ source, target }) => () => {
        if (hasPriorityCBlockBodyHit(source, target, createdMap)) {
          return false
        }
        return (
          target.container.Children.size === 0 ||
          target.container.Children.has(source.container)
        )
      },
    })
  )
}

/** スナップ接続のロック状態を追跡するためのキーを生成する */
function getStackConnectionKey(sourceId: string, targetId: string): string {
  return `${sourceId}->${targetId}`
}

/** 全スナップ接続を破棄して再構築する。ロック状態は維持する */
export function rebuildStackSnapConnections(
  ws: Workspace,
  snapConnections: SnapConnection[],
  createdMap: Map<string, CreatedBlock>
) {
  const lockedPairs = new Set(
    snapConnections
      .filter((connection) => connection.locked)
      .map((connection) =>
        getStackConnectionKey(connection.source.id, connection.target.id)
      )
  )

  for (const connection of snapConnections) {
    connection.destroy()
  }
  snapConnections.length = 0

  registerSnapConnections(
    ws,
    Array.from(createdMap.values()),
    snapConnections,
    createdMap
  )

  for (const connection of snapConnections) {
    if (
      lockedPairs.has(
        getStackConnectionKey(connection.source.id, connection.target.id)
      )
    ) {
      connection.lock()
    }
  }
}

/** Cブロックのボディゾーン（ブロックをネストできる領域）を登録する */
export function registerCBlockBodyZones(
  ws: Workspace,
  created: CreatedBlock[],
  registry: { blockMap: Map<string, BlockState>; createdMap: Map<string, CreatedBlock> },
  cBlockRefs: CBlockRef[],
  nestingZones: NestingZone[],
  bodyZoneMap: Map<NestingZone, BodyZoneMeta>
) {
  for (const block of created) {
    const behavior = resolveBlockBehavior(block.state.def)
    if (!block.cBlockRef || behavior.bodies.length === 0) continue
    cBlockRefs.push(block.cBlockRef)

    block.cBlockRef.bodyLayouts.forEach((layout, index) => {
      const bodyEntryConnector = block.cBlockRef?.bodyEntryConnectors[index]
      const zone = createConnectorInsertZone({
        target: block.container,
        layout,
        workspace: ws,
        entryConnector: bodyEntryConnector ?? undefined,
        priority: ZONE_PRIORITY.BODY,
        padding: BODY_ZONE_PADDING,
        accepts: (dragged) => {
          const draggedState = registry.blockMap.get(dragged.id)
          return !(draggedState && isValueBlockShape(draggedState.def.shape))
        },
        getDraggedConnector: (dragged) =>
          registry.createdMap.get(dragged.id)?.topConn,
        getChildConnector: (child) =>
          registry.createdMap.get(child.id)?.bottomConn,
      })

      nestingZones.push(zone)
      bodyZoneMap.set(zone, { bodyEntryConnector })
    })
  }
}

/** レポーター/ブーリアンスロットのネスティングゾーンを登録する */
export function registerSlotZones(
  ws: Workspace,
  created: CreatedBlock[],
  registry: { blockMap: Map<string, BlockState>; createdMap: Map<string, CreatedBlock> },
  nestingZones: NestingZone[],
  slotZoneMap: Map<NestingZone, SlotZoneMeta>
) {
  for (const block of created) {
    for (const slot of block.slotLayouts) {
      const { info, layout } = slot
      if (info.acceptedShapes.length === 0) continue
      const isBooleanSlot =
        info.acceptedShapes.length === 1 &&
        info.acceptedShapes[0] === "boolean"
      const zone = isBooleanSlot
        ? createBooleanSlotZone(ws, block, registry.createdMap, slot)
        : createSlotZone({
            target: block.container,
            layout,
            workspace: ws,
            priority: ZONE_PRIORITY.SLOT,
            occupancy: "single",
            accepts: createShapeValidator(registry.createdMap, info.acceptedShapes),
            centerTolerance: SLOT_CENTER_TOLERANCE,
            padding: SLOT_ZONE_PADDING,
          })

      nestingZones.push(zone)
      slotZoneMap.set(zone, {
        blockId: block.container.id,
        inputIndex: info.inputIndex,
      })
    }
  }
}

/** ドラッグ中のブロックに対するボディゾーンの近接ヒットを収集する */
export function collectBodyZoneProximityHits(
  bodyZoneMap: Map<NestingZone, BodyZoneMeta>,
  createdMap: Map<string, CreatedBlock>
): Map<string, ProximityHit> {
  const hits = new Map<string, ProximityHit>()

  for (const [zone, meta] of bodyZoneMap.entries()) {
    const dragged = zone.hovered
    if (!dragged) continue

    const hit = findBodyLayoutHit(
      dragged,
      zone.layout,
      meta.bodyEntryConnector,
      createdMap
    )
    if (!hit?.draggedBlock.topConn) continue

    const sourceConnector = hit.draggedBlock.topConn
    const targetConnector = hit.targetConnector
    const connectionId = `body-hit:${sourceConnector.id}:${targetConnector.id}`
    hits.set(connectionId, {
      source: dragged,
      sourcePosition: sourceConnector.position,
      targetPosition: targetConnector.position,
      snapDistance: sourceConnector.hitRadius + targetConnector.hitRadius,
    })
  }

  return hits
}
