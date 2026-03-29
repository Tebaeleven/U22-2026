// ブロック接続・ゾーン登録・近接判定
import {
  createStackSnapConnections,
} from "headless-vpl/helpers"
import { findConnectorInsertHit, isConnectorColliding } from "headless-vpl/blocks"
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

/** コネクタベースのスロットネスティングゾーンを生成する */
function createConnectorSlotZone(
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
    skipNearLayoutCheck: true,
    validator: (dragged) => {
      if (slot.layout.Children.length > 0) return false
      return createShapeValidator(createdMap, slot.info.acceptedShapes)(dragged)
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
      const entry = bodyEntryConnector ?? undefined
      const getDraggedConnector = (dragged: { id: string }) =>
        registry.createdMap.get(dragged.id)?.topConn
      const getChildConnector = (child: { id: string }) =>
        registry.createdMap.get(child.id)?.bottomConn

      // createConnectorInsertZone と同等だが skipNearLayoutCheck を有効にする。
      // デフォルトの isNearLayout はドラッグブロックの「中心」で判定するため、
      // If など背の高い C ブロックで topConn を bodyEntry に合わせたときでも
      // 中心がボディ矩形外になりホバーが棄却され、ネストできなくなる。
      const zone = new NestingZone({
        target: block.container,
        layout,
        workspace: ws,
        priority: ZONE_PRIORITY.BODY,
        padding: BODY_ZONE_PADDING,
        skipNearLayoutCheck: true,
        validator: (dragged) => {
          if (dragged === block.container) return false
          const draggedState = registry.blockMap.get(dragged.id)
          if (draggedState && isValueBlockShape(draggedState.def.shape)) {
            return false
          }
          return (
            findConnectorInsertHit({
              dragged,
              layout,
              entryConnector: entry,
              getDraggedConnector,
              getChildConnector,
            }) !== null
          )
        },
        connectorHit: (dragged, currentLayout) =>
          findConnectorInsertHit({
            dragged,
            layout: currentLayout,
            entryConnector: entry,
            getDraggedConnector,
            getChildConnector,
          })?.insertIndex ?? null,
      })

      nestingZones.push(zone)
      bodyZoneMap.set(zone, { bodyEntryConnector })
    })
  }
}

/** レポーター/ブーリアンスロットのネスティングゾーンを登録する（コネクタベース） */
export function registerSlotZones(
  ws: Workspace,
  created: CreatedBlock[],
  registry: { blockMap: Map<string, BlockState>; createdMap: Map<string, CreatedBlock> },
  nestingZones: NestingZone[],
  slotZoneMap: Map<NestingZone, SlotZoneMeta>
) {
  for (const block of created) {
    for (const slot of block.slotLayouts) {
      const { info } = slot
      if (info.acceptedShapes.length === 0) continue
      if (!slot.connector) continue

      // 全スロットでコネクタベースのネスティングゾーンを使用
      const zone = createConnectorSlotZone(ws, block, registry.createdMap, slot)

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

/** ドラッグ中のレポーターに対するスロットゾーンの近接ヒットを収集する（value ↔ slot コネクタ） */
export function collectSlotZoneProximityHits(
  slotZoneMap: Map<NestingZone, SlotZoneMeta>,
  createdMap: Map<string, CreatedBlock>
): Map<string, ProximityHit> {
  const hits = new Map<string, ProximityHit>()

  for (const [zone, meta] of slotZoneMap.entries()) {
    const dragged = zone.hovered
    if (!dragged) continue

    const draggedBlock = createdMap.get(dragged.id)
    const hostBlock = createdMap.get(meta.blockId)
    if (!draggedBlock?.valueConnector || !hostBlock) continue

    const slot = hostBlock.slotLayouts.find(
      (s) => s.info.inputIndex === meta.inputIndex
    )
    if (!slot?.connector) continue
    if (slot.layout.Children.length > 0) continue

    const shape = draggedBlock.state.def.shape
    if (!shape || !isValueBlockShape(shape)) continue
    if (!slot.info.acceptedShapes.includes(shape)) continue

    const sourceConnector = draggedBlock.valueConnector
    const targetConnector = slot.connector
    // 近接ハイライトは SvgRenderer が connector.hitRadius の円で描く（headless-vpl）。
    // collidesWith と同じ閾値に限ることで、赤表示のタイミングと円の見た目が一致する。
    // 別距離で緩めると、円より離れた位置で赤くなる。
    if (!isConnectorColliding(sourceConnector, targetConnector)) {
      continue
    }

    const connectionId = `slot-hit:${sourceConnector.id}:${targetConnector.id}`
    hits.set(connectionId, {
      source: dragged,
      sourcePosition: sourceConnector.position,
      targetPosition: targetConnector.position,
      snapDistance: sourceConnector.hitRadius + targetConnector.hitRadius,
    })
  }

  return hits
}
