// ブロック接続・ゾーン登録・近接判定
import {
  either,
  createSlotZone,
  createStackSnapConnections,
} from "headless-vpl/helpers"
import { isConnectorColliding } from "headless-vpl/blocks"
import { NestingZone } from "headless-vpl"
import type {
  SnapConnection,
  Workspace,
} from "headless-vpl"
import type { ProximityHit } from "headless-vpl/blocks"
import type {
  BodyZoneMeta,
  CBlockRef,
  CreatedBlock,
  SlotZoneMeta,
} from "./types"
import { isValueBlockShape, resolveBlockBehavior } from "./blocks"
import { findBodyLayoutHit, hasPriorityCBlockBodyHit } from "./layout"

export function canNestInCBlockBody(block: CreatedBlock | undefined): boolean {
  const shape = block?.state.def.shape
  return Boolean(shape && !isValueBlockShape(shape))
}

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
    priority: 150,
    padding: 0,
    validator: (dragged) => {
      if (slot.layout.Children.length > 0) return false
      return createdMap.get(dragged.id)?.state.def.shape === "boolean"
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
      priority: 100,
      strategy: () => either,
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

function getStackConnectionKey(sourceId: string, targetId: string): string {
  return `${sourceId}->${targetId}`
}

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

export function registerCBlockBodyZones(
  ws: Workspace,
  created: CreatedBlock[],
  createdMap: Map<string, CreatedBlock>,
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
      const zone = new NestingZone({
        target: block.container,
        layout,
        workspace: ws,
        priority: 200,
        padding: 10,
        validator: (dragged) => {
          const draggedBlock = createdMap.get(dragged.id)
          if (!canNestInCBlockBody(draggedBlock)) {
            console.debug("[bodyZone validator] rejected: canNestInCBlockBody false", {
              id: dragged.id,
              shape: draggedBlock?.state.def.shape,
            })
            return false
          }
          const hit = findBodyLayoutHit(dragged, layout, bodyEntryConnector, createdMap)
          if (!hit) {
            console.debug("[bodyZone validator] rejected: findBodyLayoutHit null", {
              id: dragged.id,
              shape: draggedBlock?.state.def.shape,
            })
          }
          return hit !== null
        },
        connectorHit: (dragged, currentLayout) =>
          findBodyLayoutHit(
            dragged,
            currentLayout,
            bodyEntryConnector,
            createdMap
          )?.insertIndex ?? null,
      })

      nestingZones.push(zone)
      bodyZoneMap.set(zone, { bodyEntryConnector })
    })
  }
}

export function registerSlotZones(
  ws: Workspace,
  created: CreatedBlock[],
  createdMap: Map<string, CreatedBlock>,
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
        ? createBooleanSlotZone(ws, block, createdMap, slot)
        : createSlotZone({
            target: block.container,
            layout,
            workspace: ws,
            priority: 150,
            occupancy: "single",
            accepts: (dragged) => {
              const shape = createdMap.get(dragged.id)?.state.def.shape
              if (!shape || !isValueBlockShape(shape)) return false
              return info.acceptedShapes.includes(shape)
            },
            centerTolerance: { x: 30, y: 20 },
            padding: 0,
          })

      nestingZones.push(zone)
      slotZoneMap.set(zone, {
        blockId: block.container.id,
        inputIndex: info.inputIndex,
      })
    }
  }
}

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
    if (!hit) continue

    const sourceConnector = hit.sourceConnector
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
