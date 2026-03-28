// ブロックレイアウト管理
import {
  BlockStackController,
  collectConnectedChain,
  findBodyLayoutForBlock,
  findCBlockOwner,
  findCBlockRefForBodyLayout,
  findConnectorInsertHit,
  isCBlockBodyLayout,
} from "headless-vpl/blocks"
import type { AutoLayout, Connector, Container } from "headless-vpl"
import type { BodyLayoutHit, CBlockRef, CreatedBlock } from "./types"
import {
  C_HEADER_H,
  C_BODY_MIN_H,
  C_W,
  INLINE_GAP,
  INLINE_HEIGHT_PADDING,
  INLINE_PADDING_X,
  getHeaderReporterCopies,
  getHeaderReporterCopyLabel,
  getInputValue,
  hatReporterChipWidth,
  inputWidth,
  estimateTextWidth,
  resolveBlockBehavior,
} from "./blocks"

const blockStack = new BlockStackController()

// ライブラリ関数を re-export
export {
  findBodyLayoutForBlock,
  findCBlockOwner,
  findCBlockRefForBodyLayout,
  isCBlockBodyLayout,
}

export function detachFromBodyLayoutChain(
  layout: AutoLayout,
  container: Container
) {
  blockStack.detachFromLayout(layout, container)
}

export function syncBodyLayoutChain(layout: AutoLayout) {
  blockStack.syncLayout(layout)
}

export function pullFollowerChainOutOfBodyLayout(
  root: Container,
  layout: AutoLayout
) {
  blockStack.pullFollowerChainOutOfLayout(root, layout)
}

export function findBodyLayoutHit(
  dragged: Container,
  bodyLayout: AutoLayout | undefined,
  bodyEntryConnector: Connector | null | undefined,
  createdMap: Map<string, CreatedBlock>
): BodyLayoutHit | null {
  const draggedBlock = createdMap.get(dragged.id)
  if (!draggedBlock || !bodyLayout) return null

  const sourceConnectors = getBodyNestingSourceConnectors(draggedBlock)
  for (const sourceConnector of sourceConnectors) {
    const hit = findConnectorInsertHit({
      dragged,
      layout: bodyLayout,
      entryConnector: bodyEntryConnector ?? undefined,
      getDraggedConnector: () => sourceConnector,
      getChildConnector: (child) => createdMap.get(child.id)?.bottomConn,
    })

    if (!hit) {
      if (bodyEntryConnector) {
        const dx = sourceConnector.position.x - bodyEntryConnector.position.x
        const dy = sourceConnector.position.y - bodyEntryConnector.position.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const threshold = sourceConnector.hitRadius + bodyEntryConnector.hitRadius
        if (dist < threshold * 3) {
          console.debug("[findBodyLayoutHit] miss:", {
            source: sourceConnector.name,
            dist: Math.round(dist),
            threshold,
            sourcePos: { x: Math.round(sourceConnector.position.x), y: Math.round(sourceConnector.position.y) },
            targetPos: { x: Math.round(bodyEntryConnector.position.x), y: Math.round(bodyEntryConnector.position.y) },
          })
        }
      }
      continue
    }

    return {
      insertIndex: hit.insertIndex,
      sourceConnector,
      targetConnector: hit.targetConnector,
      draggedBlock,
    }
  }

  return null
}

function getBodyNestingSourceConnectors(block: CreatedBlock): Connector[] {
  const connectors: Connector[] = []
  const seen = new Set<string>()

  const pushConnector = (connector: Connector | null | undefined) => {
    if (!connector || seen.has(connector.id)) return
    seen.add(connector.id)
    connectors.push(connector)
  }

  const behavior = resolveBlockBehavior(block.state.def)
  if (behavior.bodies.length > 0) {
    pushConnector(block.cBlockRef?.bodyEntryConnectors[0])
  }
  pushConnector(block.topConn)

  return connectors
}

export function hasPriorityCBlockBodyHit(
  sourceBlock: CreatedBlock,
  targetBlock: CreatedBlock,
  createdMap: Map<string, CreatedBlock>
): boolean {
  const targetBehavior = resolveBlockBehavior(targetBlock.state.def)
  if (
    getBodyNestingSourceConnectors(sourceBlock).length === 0 ||
    !targetBlock.cBlockRef ||
    targetBehavior.bodies.length === 0
  ) {
    return false
  }

  for (let i = 0; i < targetBehavior.bodies.length; i += 1) {
    const layout = targetBlock.cBlockRef.bodyLayouts[i]
    const bodyEntryConnector = targetBlock.cBlockRef.bodyEntryConnectors[i]
    if (
      findBodyLayoutHit(
        sourceBlock.container,
        layout,
        bodyEntryConnector,
        createdMap
      )
    ) {
      return true
    }
  }

  return false
}

export function alignCBlockBodyEntryConnectors(cBlockRef: CBlockRef): void {
  cBlockRef.container.refreshAnchoredChildren()
}

function syncDetachedStackFollowers(root: Container): void {
  const chain = collectConnectedChain(root)
  if (chain.length < 2) return

  let anchor = chain[0]
  for (let i = 1; i < chain.length; i += 1) {
    const follower = chain[i]
    if (follower.parentAutoLayout) break
    follower.move(anchor.position.x, anchor.position.y + anchor.height)
    anchor = follower
  }
}

export function relayoutSlotsAndFitBlock(block: CreatedBlock): void {
  const { def, inputValues } = block.state
  const behavior = resolveBlockBehavior(def)
  const isCBlock = behavior.bodies.length > 0
  const baseSize = behavior.size
  const slotByIndex = new Map(
    block.slotLayouts.map((slot) => [slot.info.inputIndex, slot])
  )

  let maxInlineHeight = 0
  for (const slot of block.slotLayouts) {
    const input = def.inputs[slot.info.inputIndex]
    const baseWidth = inputWidth(
      input,
      getInputValue(input, block.state, slot.info.inputIndex)
    )
    slot.info.w = baseWidth
    slot.layout.minWidth = baseWidth
    slot.layout.minHeight = slot.info.h
    slot.layout.update()
    maxInlineHeight = Math.max(
      maxInlineHeight,
      Math.max(slot.info.h, slot.layout.height)
    )
  }

  const baseHeaderHeight = isCBlock ? C_HEADER_H : baseSize.h
  const headerHeight = Math.ceil(
    Math.max(
      baseHeaderHeight,
      maxInlineHeight > 0 ? maxInlineHeight + INLINE_HEIGHT_PADDING : 0
    )
  )

  let cursor =
    INLINE_PADDING_X +
    estimateTextWidth(def.name) +
    (def.name ? INLINE_GAP : 0)

  for (let i = 0; i < def.inputs.length; i += 1) {
    const input = def.inputs[i]
    const baseWidth = inputWidth(input, inputValues[i])

    if (input.type === "label") {
      cursor += baseWidth + INLINE_GAP
      continue
    }

    const slot = slotByIndex.get(i)
    if (!slot) {
      cursor += baseWidth + INLINE_GAP
      continue
    }

    const usedWidth = Math.max(baseWidth, slot.layout.width)
    const usedHeight = Math.max(slot.info.h, slot.layout.height)
    slot.layout.position.x = cursor
    slot.layout.position.y = (headerHeight - usedHeight) / 2
    slot.layout.relayout()
    cursor += usedWidth + INLINE_GAP
  }

  const headerReporterCopies = getHeaderReporterCopies(def)
  for (const copy of headerReporterCopies) {
    cursor +=
      hatReporterChipWidth(getHeaderReporterCopyLabel(copy, block.state)) +
      INLINE_GAP
  }

  const hasInlineTokens =
    def.inputs.length > 0 || headerReporterCopies.length > 0

  const requiredWidth = Math.max(
    baseSize.w,
    Math.ceil(
      cursor + INLINE_PADDING_X - (hasInlineTokens ? INLINE_GAP : 0)
    )
  )
  const requiredHeight = Math.max(baseSize.h, headerHeight)

  if (isCBlock) {
    const container = block.container
    container.minWidth = C_W
    container.padding.top = headerHeight

    const innerMinWidth = Math.max(
      C_W - container.padding.left - container.padding.right,
      requiredWidth - container.padding.left - container.padding.right
    )

    if (block.cBlockRef) {
      const minimumBodyHeight =
        block.cBlockRef.bodyLayouts.length * C_BODY_MIN_H +
        (behavior.contentGap ?? container.contentGap) *
          Math.max(0, block.cBlockRef.bodyLayouts.length - 1)
      container.minHeight = Math.max(
        baseSize.h,
        container.padding.top + minimumBodyHeight + container.padding.bottom
      )

      for (let i = 0; i < block.cBlockRef.bodyLayouts.length; i += 1) {
        const layout = block.cBlockRef.bodyLayouts[i]
        layout.position.x = container.padding.left
        if (i === 0) layout.position.y = container.padding.top
        layout.minWidth = innerMinWidth
        layout.minHeight = C_BODY_MIN_H
      }

      let contentWidth = innerMinWidth
      for (const layout of block.cBlockRef.bodyLayouts) {
        layout.update()
        contentWidth = Math.max(contentWidth, layout.width)
      }
      container.applyContentSize(contentWidth, minimumBodyHeight)
      alignCBlockBodyEntryConnectors(block.cBlockRef)
    } else {
      container.minHeight = Math.max(
        baseSize.h,
        container.padding.top + C_BODY_MIN_H + container.padding.bottom
      )
      const changed =
        container.width !== requiredWidth ||
        container.height !== requiredHeight
      container.width = requiredWidth
      container.height = requiredHeight
      if (changed) {
        container.update()
        container.parentAutoLayout?.update()
      }
    }
  } else {
    const container = block.container
    container.minWidth = baseSize.w
    container.minHeight = baseSize.h
    const changed =
      container.width !== requiredWidth || container.height !== requiredHeight
    container.width = requiredWidth
    container.height = requiredHeight
    if (changed) {
      container.update()
      container.parentAutoLayout?.update()
    }
  }

  if (!block.container.parentAutoLayout) {
    syncDetachedStackFollowers(block.container)
  }
}

export function relayoutCreatedBlocks(created: CreatedBlock[]) {
  // ボトムアップ順で処理（深いネストの子ブロックを先に relayout し、
  // 親 C ブロックの幅計算が正しくなるようにする）
  const sorted = [...created].sort((a, b) => {
    return autoLayoutDepth(b.container) - autoLayoutDepth(a.container)
  })
  for (const block of sorted) {
    relayoutSlotsAndFitBlock(block)
  }
}

function autoLayoutDepth(container: { parentAutoLayout?: { parentContainer?: { parentAutoLayout?: unknown } | null } | null }): number {
  let depth = 0
  let current = container.parentAutoLayout
  while (current) {
    depth++
    const parent = current.parentContainer
    current = parent?.parentAutoLayout ?? null
  }
  return depth
}

export function relayoutBlockAndAncestors(
  startBlockId: string,
  createdMap: Map<string, CreatedBlock>
): void {
  const visited = new Set<string>()
  let current = createdMap.get(startBlockId) ?? null

  while (current && !visited.has(current.container.id)) {
    visited.add(current.container.id)
    relayoutSlotsAndFitBlock(current)
    const parentContainer = current.container.parentAutoLayout?.parentContainer
    current = parentContainer
      ? (createdMap.get(parentContainer.id) ?? null)
      : null
  }
}
