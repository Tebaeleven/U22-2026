import { AutoLayout, Connector, Container } from "headless-vpl"
import type { Workspace } from "headless-vpl"
import type { BlockDef, CBlockRef, CreatedBlock, SlotInfo, SlotLayoutRef } from "./types"
import {
  BOOLEAN_CONNECTOR_HIT_RADIUS,
  C_BODY_ENTRY_HIT_RADIUS,
  C_BODY_ENTRY_OFFSET_X,
  C_BODY_ENTRY_OFFSET_Y,
  C_BODY_LAYOUT_OFFSET_X,
  C_FOOTER_H,
  C_HEADER_H,
  C_W,
  CONN_OFFSET_X,
  INLINE_GAP,
  INLINE_PADDING_X,
  INLINE_SLOT_BASE_H,
  computeSlotInfos,
  createInitialInputValues,
  estimateTextWidth,
  getHeaderReporterCopies,
  getHeaderReporterCopyLabel,
  hatReporterChipWidth,
  inputWidth,
  resolveBlockBehavior,
} from "./blocks"

/** ブロック定義からコンテナ・コネクタ・スロットを生成してワークスペースに配置する */
export function createBlock(
  ws: Workspace,
  def: BlockDef,
  x: number,
  y: number
): CreatedBlock {
  const behavior = resolveBlockBehavior(def)
  const { w, h } = behavior.size
  const isCBlock = behavior.bodies.length > 0
  const state = {
    id: "",
    def,
    inputValues: createInitialInputValues(def.inputs),
  }

  // --- Connectors ---
  const topConn = behavior.connectors.top
    ? new Connector({
        position: [CONN_OFFSET_X, 0],
        name: "top",
        type: "input",
      })
    : null

  const bottomConn = behavior.connectors.bottom
    ? new Connector({
        name: "bottom",
        type: "output",
        anchor: {
          target: "parent",
          origin: "bottom-left",
          offset: [CONN_OFFSET_X, 0],
        },
      })
    : null

  const valueConnector = behavior.connectors.value
    ? new Connector({
        name: "value",
        type: "output",
        hitRadius: BOOLEAN_CONNECTOR_HIT_RADIUS,
        anchor: { target: "parent", origin: "center-left" },
      })
    : null

  const children: Record<string, Connector | AutoLayout> = {}
  if (topConn) children.top = topConn
  if (bottomConn) children.bottom = bottomConn
  if (valueConnector) children.value = valueConnector

  // --- Body layouts（C-block系のみ） ---
  const bodyLayouts: AutoLayout[] = []
  const bodyEntryConnectors: Array<Connector | null> = []
  if (behavior.bodies.length > 0) {
    let bodyY = C_HEADER_H
    for (let i = 0; i < behavior.bodies.length; i += 1) {
      const bodyKey = `body${i + 1}`
      const entryKey = `bodyEntry${i + 1}`
      const body = behavior.bodies[i]

      const layout = new AutoLayout({
        position: [C_BODY_LAYOUT_OFFSET_X, bodyY],
        direction: "vertical",
        gap: 0,
        alignment: "start",
        minWidth: C_W - 32,
        minHeight: body.minHeight,
      })
      children[bodyKey] = layout
      bodyLayouts.push(layout)

      const entry = body.hasEntryConnector
        ? new Connector({
            name: `body-entry-${i + 1}`,
            type: "input",
            hitRadius: C_BODY_ENTRY_HIT_RADIUS,
            anchor: {
              target: bodyKey,
              origin: "top-left",
              offset: [C_BODY_ENTRY_OFFSET_X, C_BODY_ENTRY_OFFSET_Y],
            },
          })
        : null
      if (entry) {
        children[entryKey] = entry
      }
      bodyEntryConnectors.push(entry)

      bodyY += body.minHeight + (behavior.contentGap ?? 0)
    }
  }

  // --- headerRow AutoLayout（ラベル + スロットを横並べ） ---
  const blockH = isCBlock ? C_HEADER_H : h
  const headerRow = new AutoLayout({
    position: [INLINE_PADDING_X, 0],
    direction: "horizontal",
    gap: INLINE_GAP,
    alignment: "center",
    minHeight: INLINE_SLOT_BASE_H,
    resizesParent: false,
  })
  children.headerRow = headerRow

  // ラベル用ダミー Container（workspace なしで SvgRenderer に描画されない）
  const labelContainers: Container[] = []

  const createLabelContainer = (text: string, namePrefix: string): Container => {
    const lbl = new Container({
      name: namePrefix,
      width: estimateTextWidth(text),
      height: INLINE_SLOT_BASE_H,
    })
    labelContainers.push(lbl)
    return lbl
  }

  // ブロック名をラベルとして追加
  if (def.name) {
    const nameContainer = createLabelContainer(def.name, "label_name")
    headerRow.Children.push(nameContainer)
  }

  // --- Slot layouts ---
  const slotInfos = computeSlotInfos(def, state.inputValues)
  const slotInfoMap = new Map<number, SlotInfo>(slotInfos.map((s) => [s.inputIndex, s]))
  const slotLayouts: SlotLayoutRef[] = []

  for (let i = 0; i < def.inputs.length; i += 1) {
    const input = def.inputs[i]

    if (input.type === "label") {
      const lbl = createLabelContainer(input.text, `label_${i}`)
      headerRow.Children.push(lbl)
      continue
    }

    if (input.type === "param-chip") {
      const lbl = createLabelContainer(input.label, `chip_${i}`)
      headerRow.Children.push(lbl)
      continue
    }

    // スロット（number, text, dropdown, boolean-slot, variable-name）
    const slotInfo = slotInfoMap.get(i)
    if (!slotInfo) continue

    // headerRow にスロットと同じサイズのダミー Container を配置（位置計算用）
    const slotPlaceholder = new Container({
      name: `slotPlaceholder_${slotInfo.inputIndex}`,
      width: slotInfo.w,
      height: slotInfo.h,
    })
    headerRow.Children.push(slotPlaceholder)

    // 実際のスロット AutoLayout は Container.children に登録（ネスト・アンカー用）
    const slotLayout = new AutoLayout({
      position: [0, 0],
      direction: "horizontal",
      gap: 0,
      alignment: "center",
      minWidth: slotInfo.w,
      minHeight: slotInfo.h,
      resizesParent: false,
    })
    children[`slot${slotInfo.inputIndex}`] = slotLayout

    // 全スロットにコネクタを追加（スロット左端、レポーター/ブーリアンの valueConn と接続）
    const slotConnector = new Connector({
      name: `slot-connector-${slotInfo.inputIndex}`,
      type: "input",
      hitRadius: BOOLEAN_CONNECTOR_HIT_RADIUS,
      anchor: { target: slotLayout, origin: "center-left" },
    })
    children[`slotConnector${slotInfo.inputIndex}`] = slotConnector
    slotLayouts.push({ info: slotInfo, layout: slotLayout, connector: slotConnector, placeholder: slotPlaceholder })
  }

  // ヘッダーレポーターコピーもラベルとして追加
  const headerReporterCopies = getHeaderReporterCopies(def)
  for (const copy of headerReporterCopies) {
    const label = getHeaderReporterCopyLabel(copy, state)
    const lbl = createLabelContainer(label, `hrc_${copy.label}`)
    lbl.width = hatReporterChipWidth(label)
    headerRow.Children.push(lbl)
  }

  // --- Container ---
  const container = new Container({
    workspace: ws,
    position: [x, y],
    name:
      def.name ||
      def.inputs
        .map((i) => (i.type === "label" ? i.text : ""))
        .join(" ")
        .trim() ||
      "block",
    color: def.color,
    width: w,
    height: h,
    widthMode: "hug",
    heightMode: "hug",
    padding: isCBlock
      ? { top: C_HEADER_H, bottom: C_FOOTER_H, left: 16, right: 16 }
      : undefined,
    minWidth: w,
    minHeight: h,
    contentGap: behavior.contentGap,
    children,
  })
  state.id = container.id

  let cBlockRef: CBlockRef | null = null
  if (isCBlock) {
    cBlockRef = {
      container,
      bodyLayouts,
      bodyEntryConnectors,
      bottomConnector: bottomConn,
    }
  }

  return {
    container,
    topConn,
    bottomConn,
    cBlockRef,
    slotLayouts,
    valueConnector,
    state,
    headerRow,
    labelContainers,
  }
}
