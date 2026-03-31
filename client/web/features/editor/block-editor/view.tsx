// ブロック描画コンポーネント
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
} from "react"
import type { Container } from "headless-vpl"
import type {
  BlockState,
  CBlockRef,
  CreatedBlock,
  HeaderReporterCopy,
  InputDef,
} from "./types"
import {
  C_BODY_MIN_H,
  C_FOOTER_H,
  C_HEADER_H,
  C_W,
  INLINE_SLOT_BASE_H,
  type BlockAssetOptions,
  SPRITE_DROPDOWN_OPCODES,
  CROSS_SPRITE_VAR_OPCODES,
  getHeaderReporterCopies,
  getHeaderReporterCopyLabel,
  getInputDisplayValue,
  getInputValue,
  estimateTextWidth,
  hatReporterChipWidth,
  inputWidth,
  isInlineReporterVariableInput,
  resolveBlockBehavior,
} from "./blocks"

function ReporterCopyChip({
  label,
  style,
  onMouseDown,
}: {
  label: string
  style?: CSSProperties
  onMouseDown?: (event: ReactMouseEvent<HTMLElement>) => void
}) {
  return (
    <button
      type="button"
      className="scratch-header-copy-chip"
      style={style}
      onMouseDownCapture={onMouseDown}
    >
      {label}
    </button>
  )
}

function InlineToken({
  block,
  input,
  index,
  createdBlock,
  nestedSlots,
  customVariables,
  spriteNames,
  spriteVariablesMap,
  assetOptions,
  onInputValueChange,
  onParamChipMouseDown,
  onReporterCopyMouseDown,
}: {
  block: BlockState
  input: InputDef
  index: number
  createdBlock?: CreatedBlock
  nestedSlots: Record<string, string>
  customVariables?: string[]
  spriteNames?: string[]
  spriteVariablesMap?: Record<string, string[]>
  assetOptions?: BlockAssetOptions
  onInputValueChange?: (
    blockId: string,
    inputIndex: number,
    value: string
  ) => void
  onParamChipMouseDown?: (
    blockId: string,
    paramId: string,
    event: ReactMouseEvent<HTMLButtonElement>
  ) => void
  onReporterCopyMouseDown?: (
    blockId: string,
    copy: HeaderReporterCopy,
    event: ReactMouseEvent<HTMLElement>
  ) => void
}) {
  if (input.type === "label") {
    return (
      <span
        className="scratch-label-token"
        style={{ width: estimateTextWidth(input.text), flexShrink: 0 }}
      >
        {input.text}
      </span>
    )
  }

  if (input.type === "param-chip") {
    return (
      <button
        type="button"
        className="scratch-header-copy-chip"
        style={{ minWidth: hatReporterChipWidth(input.label) }}
        onMouseDownCapture={(event) =>
          onParamChipMouseDown?.(block.id, input.paramId, event)
        }
      >
        {input.label}
      </button>
    )
  }

  const slot = createdBlock?.slotLayouts.find(
    (item) => item.info.inputIndex === index
  )
  const isNested = Boolean(nestedSlots[`${block.id}-${index}`])
  const baseWidth = slot?.info.w ?? inputWidth(input, getInputValue(input, block, index))
  // ネスト時は AutoLayout の実際の幅を使う（余白を防ぐ）
  // 未ネスト時は基本幅と AutoLayout 幅の大きい方を使う
  const slotWidth = isNested
    ? (slot?.layout.width ?? baseWidth)
    : Math.max(slot?.layout.width ?? 0, baseWidth)
  const slotHeight = Math.max(
    slot?.layout.height ?? 0,
    slot?.info.h ?? INLINE_SLOT_BASE_H
  )
  const hostStyle = { width: slotWidth, height: slotHeight }

  if (isNested) {
    return (
      <span
        className="scratch-slot-host scratch-slot-spacer scratch-slot-filled"
        style={hostStyle}
      />
    )
  }

  if (isInlineReporterVariableInput(input)) {
    return (
      <span className="scratch-slot-host" style={hostStyle}>
        <ReporterCopyChip
          label={getInputDisplayValue(input, block, index)}
          style={{ width: "100%", minWidth: slotWidth }}
          onMouseDown={(event) => {
            if (input.copySource) {
              onReporterCopyMouseDown?.(block.id, input.copySource, event)
            }
          }}
        />
      </span>
    )
  }

  if (
    input.type === "number" ||
    input.type === "text" ||
    (input.type === "variable-name" && input.editable !== false)
  ) {
    return (
      <span className="scratch-slot-host" style={hostStyle}>
        <input
          type="text"
          inputMode={input.type === "number" ? "numeric" : undefined}
          value={getInputValue(input, block, index)}
          placeholder={
            "placeholder" in input ? input.placeholder : undefined
          }
          onChange={(e) =>
            onInputValueChange?.(block.id, index, e.currentTarget.value)
          }
          style={{ width: slotWidth }}
        />
      </span>
    )
  }

  if (input.type === "variable-name") {
    return (
      <span className="scratch-slot-host" style={hostStyle}>
        <span className="scratch-variable-token">
          {getInputDisplayValue(input, block, index)}
        </span>
      </span>
    )
  }

  if (input.type === "dropdown") {
    // スプライト関連ドロップダウンは動的にoptionsを差し替える
    const spriteConfig = block.def.opcode ? SPRITE_DROPDOWN_OPCODES[block.def.opcode] : undefined
    const isSpriteDropdown = spriteConfig && spriteConfig.inputIndex === index && spriteNames

    // クロススプライト変数ブロックの変数ドロップダウンでは、選択中のスプライトの変数を表示する
    const crossVarConfig = block.def.opcode ? CROSS_SPRITE_VAR_OPCODES[block.def.opcode] : undefined
    const isCrossVarDropdown = crossVarConfig && crossVarConfig.variableInputIndex === index
    let resolvedVariables = customVariables
    if (isCrossVarDropdown && spriteVariablesMap) {
      const spriteInput = block.def.inputs[crossVarConfig.spriteInputIndex]
      const spriteDefault = spriteInput && "default" in spriteInput ? spriteInput.default : ""
      const selectedSprite = block.inputValues[crossVarConfig.spriteInputIndex] ?? spriteDefault ?? ""
      resolvedVariables = spriteVariablesMap[String(selectedSprite)] ?? []
    }

    const isVariableDropdown = block.def.category === "variables" && !isSpriteDropdown
    const isSoundDropdown = ["sound_play", "sound_playloop", "sound_stop", "sound_setvolume"].includes(block.def.opcode ?? "") && index === 0
    const isCostumeDropdown = block.def.opcode === "looks_switchcostumeto" && index === 0
    const extraOptions = isVariableDropdown && resolvedVariables
      ? resolvedVariables.filter((v) => !input.options.includes(v))
      : []
    const assetDrivenOptions = isSoundDropdown
      ? assetOptions?.sounds
      : isCostumeDropdown
        ? assetOptions?.costumes
        : undefined
    const baseOptions = assetDrivenOptions && assetDrivenOptions.length > 0
      ? [...assetDrivenOptions, ...input.options.filter((option) => !assetDrivenOptions.includes(option))]
      : isSpriteDropdown
      ? [...spriteConfig.prefixOptions, ...spriteNames]
      : input.options
    // 現在の選択値がoptionsに含まれない場合でもフォールバックを防ぐ
    const currentValue = getInputValue(input, block, index)
    const options = currentValue && !baseOptions.includes(currentValue)
      ? [...baseOptions, currentValue]
      : baseOptions

    return (
      <span className="scratch-slot-host" style={hostStyle}>
        <select
          value={getInputValue(input, block, index)}
          onChange={(e) =>
            onInputValueChange?.(block.id, index, e.currentTarget.value)
          }
          style={{ width: slotWidth }}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          {extraOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </span>
    )
  }

  // boolean-slot
  return (
    <span
      className="scratch-slot-host scratch-slot-boolean"
      style={hostStyle}
    >
      <span className="scratch-boolean-slot" />
    </span>
  )
}

function HeaderReporterCopies({
  block,
  copies,
  onMouseDown,
}: {
  block: BlockState
  copies: HeaderReporterCopy[]
  onMouseDown?: (
    blockId: string,
    copy: HeaderReporterCopy,
    event: ReactMouseEvent<HTMLElement>
  ) => void
}) {
  if (copies.length === 0) return null

  return (
    <>
      {copies.map((copy, index) => {
        const label = getHeaderReporterCopyLabel(copy, block)
        return (
          <ReporterCopyChip
            key={`${copy.blockName ?? copy.targetOpcode ?? "copy"}-${index}`}
            label={label}
            style={{ minWidth: hatReporterChipWidth(label) }}
            onMouseDown={(event) => onMouseDown?.(block.id, copy, event)}
          />
        )
      })}
    </>
  )
}

export function BlockView({
  block,
  container,
  createdBlock,
  cBlockRef,
  zIndex,
  nestedSlots,
  customVariables,
  spriteNames,
  spriteVariablesMap,
  assetOptions,
  onInputValueChange,
  onHeaderReporterMouseDown,
  onParamChipMouseDown,
  onProcedureDefineClick,
  onCustomReporterClick,
}: {
  block: BlockState
  container?: Container
  createdBlock?: CreatedBlock
  cBlockRef?: CBlockRef
  zIndex?: number
  nestedSlots?: Record<string, string>
  customVariables?: string[]
  spriteNames?: string[]
  spriteVariablesMap?: Record<string, string[]>
  assetOptions?: BlockAssetOptions
  onInputValueChange?: (
    blockId: string,
    inputIndex: number,
    value: string
  ) => void
  onHeaderReporterMouseDown?: (
    blockId: string,
    copy: HeaderReporterCopy,
    event: ReactMouseEvent<HTMLElement>
  ) => void
  onParamChipMouseDown?: (
    blockId: string,
    paramId: string,
    event: ReactMouseEvent<HTMLButtonElement>
  ) => void
  onProcedureDefineClick?: (
    block: BlockState,
    event: ReactMouseEvent<HTMLDivElement>
  ) => void
  onCustomReporterClick?: (
    block: BlockState,
    event: ReactMouseEvent<HTMLDivElement>
  ) => void
}) {
  const { def } = block
  const bg = def.color
  const ns = nestedSlots ?? {}
  const blockStyle = { zIndex }
  const behavior = resolveBlockBehavior(def)
  const headerReporterCopies = getHeaderReporterCopies(def)

  const renderInputs = () =>
    def.inputs.map((input, index) => (
      <InlineToken
        key={index}
        block={block}
        input={input}
        index={index}
        createdBlock={createdBlock}
        nestedSlots={ns}
        customVariables={customVariables}
        spriteNames={spriteNames}
        spriteVariablesMap={spriteVariablesMap}
        assetOptions={assetOptions}
        onInputValueChange={onInputValueChange}
        onParamChipMouseDown={onParamChipMouseDown}
        onReporterCopyMouseDown={onHeaderReporterMouseDown}
      />
    ))

  if (def.shape === "reporter" || def.shape === "boolean") {
    const isCustomReporter =
      def.shape === "reporter" && def.source.kind === "custom-call"
    return (
      <div
        id={`node-${block.id}`}
        className={`scratch-block scratch-${def.shape === "boolean" ? "boolean" : "reporter"}`}
        style={{
          ...blockStyle,
          background: bg,
          minWidth: behavior.size.w,
          minHeight: container?.minHeight ?? behavior.size.h,
          cursor: isCustomReporter ? "pointer" : undefined,
        }}
        onClick={(event) => {
          if (isCustomReporter) {
            onCustomReporterClick?.(block, event)
          }
        }}
      >
        {def.name && <span style={{ width: estimateTextWidth(def.name), flexShrink: 0 }}>{def.name}</span>}
        {renderInputs()}
      </div>
    )
  }

  if (def.shape === "hat") {
    const isProcedureDefine = def.source.kind === "custom-define"
    return (
      <div
        id={`node-${block.id}`}
        className="scratch-block scratch-hat"
        style={{
          ...blockStyle,
          background: bg,
          minWidth: behavior.size.w,
          cursor: isProcedureDefine ? "pointer" : undefined,
        }}
        onClick={(event) => {
          if (isProcedureDefine) {
            onProcedureDefineClick?.(block, event)
          }
        }}
      >
        {def.name && <span style={{ width: estimateTextWidth(def.name), flexShrink: 0 }}>{def.name}</span>}
        {renderInputs()}
        <HeaderReporterCopies
          block={block}
          copies={headerReporterCopies}
          onMouseDown={onHeaderReporterMouseDown}
        />
      </div>
    )
  }

  if (behavior.bodies.length > 0) {
    const bodyCount = behavior.bodies.length
    return (
      <div
        id={`node-${block.id}`}
        className="scratch-block scratch-c-block"
        style={{
          ...blockStyle,
          background: bg,
          minWidth: C_W,
          minHeight: container?.minHeight ?? behavior.size.h,
        }}
      >
        <div
          className="scratch-c-header"
          style={{
            height: cBlockRef?.container.padding.top ?? C_HEADER_H,
          }}
        >
          {def.name && <span style={{ width: estimateTextWidth(def.name), flexShrink: 0 }}>{def.name}</span>}
          {renderInputs()}
          <HeaderReporterCopies
            block={block}
            copies={headerReporterCopies}
            onMouseDown={onHeaderReporterMouseDown}
          />
        </div>
        {Array.from({ length: bodyCount }).map((_, bodyIndex) => {
          const bodyLayout = cBlockRef?.bodyLayouts[bodyIndex]
          return (
            <div key={bodyIndex}>
              <div
                className={`scratch-c-body${
                  bodyLayout && bodyLayout.Children.length > 0
                    ? " has-children"
                    : ""
                }`}
                style={{
                  height: Math.max(bodyLayout?.height ?? 0, C_BODY_MIN_H),
                }}
              />
              {bodyIndex === 0 && def.shape === "c-block-else" && (
                <div className="scratch-c-divider">else</div>
              )}
            </div>
          )
        })}
        <div
          className="scratch-c-footer"
          style={{
            height:
              cBlockRef?.container.padding.bottom ?? C_FOOTER_H,
          }}
        />
      </div>
    )
  }

  return (
    <div
      id={`node-${block.id}`}
      className="scratch-block scratch-stack"
      style={{ ...blockStyle, background: bg, minWidth: behavior.size.w }}
    >
      {def.name && <span style={{ width: estimateTextWidth(def.name), flexShrink: 0 }}>{def.name}</span>}
      {renderInputs()}
      <HeaderReporterCopies
        block={block}
        copies={headerReporterCopies}
        onMouseDown={onHeaderReporterMouseDown}
      />
    </div>
  )
}
