// バレル再エクスポート — 既存の import パスを維持する
export {
  CONN_OFFSET_X,
  C_BODY_ENTRY_OFFSET_X,
  C_BODY_ENTRY_OFFSET_Y,
  C_BODY_ENTRY_HIT_RADIUS,
  C_BODY_LAYOUT_OFFSET_X,
  C_BODY_MIN_H,
  C_HEADER_H,
  C_FOOTER_H,
  C_DIVIDER_H,
  C_W,
  INLINE_PADDING_X,
  INLINE_GAP,
  INLINE_SLOT_BASE_H,
  INLINE_HEIGHT_PADDING,
  BOOLEAN_SLOT_W,
  BOOLEAN_CONNECTOR_HIT_RADIUS,
  HAT_REPORTER_CHIP_MIN_W,
  INPUT_MIN_W,
  INPUT_TEXT_MIN_W,
  INPUT_DROPDOWN_MIN_W,
  INPUT_MAX_W,
  INLINE_REPORTER_INPUT_MIN_W,
  INLINE_REPORTER_INPUT_MAX_W,
  STARTER_DEFINE_BLOCK_ID,
  DEFAULT_VARIABLES,
  GENERIC_RETURN_BLOCK_ID,
  CUSTOM_DEFINE_PREFIX,
  CUSTOM_CALL_PREFIX,
  CUSTOM_ARGUMENT_PREFIX,
  SHAPE_CONFIGS,
} from "./blocks/constants"

export {
  resolveBlockBehavior,
  getBlockSize,
  hasTopConnector,
  hasBottomConnector,
  isCBlockShape,
  isInlineValueShape,
  isValueBlockShape,
} from "./blocks/block-behavior"

export {
  estimateTextWidth,
  createEditorId,
  isInlineReporterVariableInput,
  getInputDefaultValue,
  createInitialInputValues,
  getInputValue,
  getInputDisplayValue,
  getAcceptedValueShapes,
  inputWidth,
  getHeaderReporterCopies,
  getHeaderReporterCopyLabel,
  hatReporterChipWidth,
  getInputSerializationKey,
  getInputIndexBySerializationKey,
  computeSlotPositions,
  computeSlotInfos,
} from "./blocks/input-helpers"

export {
  createDefaultProcedure,
  createDefaultProcedureParam,
  getProcedureDisplayName,
  normalizeProcedure,
  getProcedureParam,
  buildProcedureBlockDefs,
} from "./blocks/procedure-helpers"

export {
  BUILTIN_BLOCK_DEFS,
  DEFAULT_BLOCK_PROJECT_DATA,
  SPRITE_DROPDOWN_OPCODES,
  getBlockDefs,
  getPaletteBlockDefs,
  getBlockDefById,
  findBuiltinBlockDefId,
} from "./blocks/block-defs"

export { applySpriteRenameToBlockProjectData } from "./block-data-sprite-rename"
