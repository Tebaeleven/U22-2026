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
  INLINE_HEIGHT_PADDING,
  INLINE_PADDING_X,
  getInputValue,
  inputWidth,
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

/** ボディレイアウトからコンテナを切り離す */
export function detachFromBodyLayoutChain(
  layout: AutoLayout,
  container: Container
) {
  blockStack.detachFromLayout(layout, container)
}

/** ボディレイアウト内のブロックチェーンを同期する */
export function syncBodyLayoutChain(layout: AutoLayout) {
  blockStack.syncLayout(layout)
}

/** ルートコンテナに続くフォロワーチェーンをボディレイアウトから引き出す */
export function pullFollowerChainOutOfBodyLayout(
  root: Container,
  layout: AutoLayout
) {
  blockStack.pullFollowerChainOutOfLayout(root, layout)
}

/** ドラッグ中のブロックがボディレイアウト内のどの位置に挿入されるかを判定する */
export function findBodyLayoutHit(
  dragged: Container,
  bodyLayout: AutoLayout | undefined,
  bodyEntryConnector: Connector | null | undefined,
  createdMap: Map<string, CreatedBlock>
): BodyLayoutHit | null {
  const draggedBlock = createdMap.get(dragged.id)
  if (!draggedBlock?.topConn || !bodyLayout) return null

  const hit = findConnectorInsertHit({
    dragged,
    layout: bodyLayout,
    entryConnector: bodyEntryConnector ?? undefined,
    getDraggedConnector: () => draggedBlock.topConn,
    getChildConnector: (child) => createdMap.get(child.id)?.bottomConn,
  })

  if (!hit) return null

  return {
    insertIndex: hit.insertIndex,
    targetConnector: hit.targetConnector,
    draggedBlock,
  }
}

/** ソースブロックがターゲットのCブロックボディにヒットしているかを判定する */
export function hasPriorityCBlockBodyHit(
  sourceBlock: CreatedBlock,
  targetBlock: CreatedBlock,
  createdMap: Map<string, CreatedBlock>
): boolean {
  const targetBehavior = resolveBlockBehavior(targetBlock.state.def)
  if (
    !sourceBlock.topConn ||
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

/** Cブロックのボディエントリコネクタ位置をアンカーに基づいて再配置する */
export function alignCBlockBodyEntryConnectors(cBlockRef: CBlockRef): void {
  cBlockRef.container.refreshAnchoredChildren()
}

/** 親レイアウトに属さないスタックチェーンのフォロワー位置を同期する */
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

/** スロット寸法・ヘッダー高さ・インライン配置を計算して必要な幅・高さを返す */
function computeSlotLayout(
  block: CreatedBlock,
  isCBlock: boolean,
  baseSize: { w: number; h: number }
): { headerHeight: number; requiredWidth: number; requiredHeight: number } {
  const { def, inputValues } = block.state
  const slotByIndex = new Map(
    block.slotLayouts.map((slot) => [slot.info.inputIndex, slot])
  )

  // スロット寸法の更新
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

  // ヘッダー高さの計算
  const baseHeaderHeight = isCBlock ? C_HEADER_H : baseSize.h
  const headerHeight = Math.ceil(
    Math.max(
      baseHeaderHeight,
      maxInlineHeight > 0 ? maxInlineHeight + INLINE_HEIGHT_PADDING : 0
    )
  )

  // headerRow AutoLayout で自動配置
  const headerRow = block.headerRow
  if (headerRow) {
    // スロット placeholder のサイズを実際のスロットサイズに同期
    for (const slot of block.slotLayouts) {
      if (slot.placeholder) {
        const usedWidth = Math.max(slot.info.w, slot.layout.width)
        const usedHeight = Math.max(slot.info.h, slot.layout.height)
        slot.placeholder.width = usedWidth
        slot.placeholder.height = usedHeight
      }
    }

    headerRow.minHeight = headerHeight
    headerRow.update()

    // placeholder の絶対位置をスロットのローカル位置に変換して同期
    const containerPos = block.container.position
    for (const slot of block.slotLayouts) {
      if (slot.placeholder) {
        slot.layout.position.x = slot.placeholder.position.x - containerPos.x
        slot.layout.position.y = slot.placeholder.position.y - containerPos.y
        slot.layout.relayout()
      }
    }
  }

  // ヘッダー幅を headerRow から取得
  const headerRowWidth = headerRow
    ? headerRow.width + INLINE_PADDING_X * 2
    : baseSize.w

  const requiredWidth = Math.max(baseSize.w, Math.ceil(headerRowWidth))
  const requiredHeight = Math.max(baseSize.h, headerHeight)

  return { headerHeight, requiredWidth, requiredHeight }
}

/** Cブロックのコンテナサイズを計算・適用する */
function applyCBlockLayout(
  block: CreatedBlock,
  behavior: ReturnType<typeof resolveBlockBehavior>,
  baseSize: { w: number; h: number },
  headerHeight: number,
  requiredWidth: number,
  requiredHeight: number
): void {
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
}

/** スタックブロック（非Cブロック）のコンテナサイズを適用する */
function applyStackLayout(
  block: CreatedBlock,
  baseSize: { w: number; h: number },
  requiredWidth: number,
  requiredHeight: number
): void {
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

/** ブロックのスロットサイズを再計算し、コンテナサイズを調整する */
export function relayoutSlotsAndFitBlock(block: CreatedBlock): void {
  const behavior = resolveBlockBehavior(block.state.def)
  const isCBlock = behavior.bodies.length > 0
  const baseSize = behavior.size

  const { headerHeight, requiredWidth, requiredHeight } =
    computeSlotLayout(block, isCBlock, baseSize)

  if (isCBlock) {
    applyCBlockLayout(block, behavior, baseSize, headerHeight, requiredWidth, requiredHeight)
  } else {
    applyStackLayout(block, baseSize, requiredWidth, requiredHeight)
  }

  if (!block.container.parentAutoLayout) {
    syncDetachedStackFollowers(block.container)
  }
}

/** 複数ブロックをボトムアップ順でレイアウトする（ネストの深い子から処理） */
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

/** コンテナのAutoLayoutネスト深度を計算する */
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

/** 指定ブロックから親方向に遡ってレイアウトを再計算する */
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
