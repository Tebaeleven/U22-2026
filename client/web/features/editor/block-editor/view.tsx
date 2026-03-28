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
  getHeaderReporterCopies,
  getHeaderReporterCopyLabel,
  getInputDisplayValue,
  getInputValue,
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
    return <span className="scratch-label-token">{input.text}</span>
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
  const slotWidth = Math.max(
    slot?.layout.width ?? 0,
    slot?.info.w ?? inputWidth(input, getInputValue(input, block, index))
  )
  const slotHeight = Math.max(
    slot?.layout.height ?? 0,
    slot?.info.h ?? INLINE_SLOT_BASE_H
  )
  const isNested = Boolean(nestedSlots[`${block.id}-${index}`])
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
    const isVariableDropdown = block.def.category === "variables"
    const extraOptions = isVariableDropdown && customVariables
      ? customVariables.filter((v) => !input.options.includes(v))
      : []
    return (
      <span className="scratch-slot-host" style={hostStyle}>
        <select
          value={getInputValue(input, block, index)}
          onChange={(e) =>
            onInputValueChange?.(block.id, index, e.currentTarget.value)
          }
          style={{ width: slotWidth }}
        >
          {input.options.map((option) => (
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
        {def.name && <span>{def.name}</span>}
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
        {def.name && <span>{def.name}</span>}
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
          {def.name && <span>{def.name}</span>}
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
      {def.name && <span>{def.name}</span>}
      {renderInputs()}
      <HeaderReporterCopies
        block={block}
        copies={headerReporterCopies}
        onMouseDown={onHeaderReporterMouseDown}
      />
    </div>
  )
}
