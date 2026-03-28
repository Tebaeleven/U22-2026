// ブロック定義・寸法定数・ヘルパー関数
import type {
  BlockBehavior,
  BlockDef,
  BlockProjectData,
  BlockShape,
  BlockState,
  CustomProcedure,
  CustomProcedureParam,
  HeaderReporterCopy,
  InputDef,
  ProcedureParamType,
  ShapeConfig,
  SlotInfo,
  ValueBlockShape,
} from "./types"

// --- 寸法定数 ---
export const CONN_OFFSET_X = 40
export const C_BODY_ENTRY_OFFSET_X = 50
export const C_BODY_ENTRY_OFFSET_Y = 0
export const C_BODY_ENTRY_HIT_RADIUS = 8
export const C_BODY_LAYOUT_OFFSET_X = 16
export const C_BODY_MIN_H = 40
export const C_HEADER_H = 40
export const C_FOOTER_H = 20
export const C_DIVIDER_H = 28
export const C_W = 220
export const INLINE_PADDING_X = 12
export const INLINE_GAP = 6
export const INLINE_SLOT_BASE_H = 24
export const INLINE_HEIGHT_PADDING = 8
export const BOOLEAN_SLOT_W = 36
export const BOOLEAN_CONNECTOR_HIT_RADIUS = 12
export const HAT_REPORTER_CHIP_MIN_W = 72
export const INPUT_MIN_W = 40
export const INPUT_TEXT_MIN_W = 64
export const INPUT_DROPDOWN_MIN_W = 80
export const INPUT_MAX_W = 180
export const INLINE_REPORTER_INPUT_MIN_W = 28
export const INLINE_REPORTER_INPUT_MAX_W = 84

export const STARTER_DEFINE_BLOCK_ID = "starter-define"
export const DEFAULT_VARIABLES = ["my variable", "score", "timer"]
export const GENERIC_RETURN_BLOCK_ID = "custom-return"
export const CUSTOM_DEFINE_PREFIX = "custom-define:"
export const CUSTOM_CALL_PREFIX = "custom-call:"
export const CUSTOM_ARGUMENT_PREFIX = "custom-argument:"

// --- ShapeConfig ---
export const SHAPE_CONFIGS: Record<BlockShape, ShapeConfig> = {
  hat: { size: { w: 200, h: 52 }, connectors: { top: false, bottom: true } },
  stack: { size: { w: 200, h: 42 }, connectors: { top: true, bottom: true } },
  "c-block": {
    size: { w: C_W, h: C_HEADER_H + C_BODY_MIN_H + C_FOOTER_H },
    connectors: { top: true, bottom: true },
    bodies: [{ minHeight: C_BODY_MIN_H }],
  },
  "c-block-else": {
    size: {
      w: C_W,
      h: C_HEADER_H + C_BODY_MIN_H + C_DIVIDER_H + C_BODY_MIN_H + C_FOOTER_H,
    },
    connectors: { top: true, bottom: true },
    bodies: [{ minHeight: C_BODY_MIN_H }, { minHeight: C_BODY_MIN_H }],
  },
  "cap-c": {
    size: { w: C_W, h: C_HEADER_H + C_BODY_MIN_H + C_FOOTER_H },
    connectors: { top: true, bottom: true },
    bodies: [{ minHeight: C_BODY_MIN_H }],
  },
  reporter: {
    size: { w: 140, h: 32 },
    connectors: { top: false, bottom: false, value: true },
  },
  boolean: {
    size: { w: 140, h: 32 },
    connectors: { top: false, bottom: false, value: true },
  },
}

type BlockBehaviorOverride = {
  connectors?: Partial<BlockBehavior["connectors"]>
  bodies?: Array<Partial<BlockBehavior["bodies"][number]>>
  contentGap?: number
}

const BLOCK_BEHAVIOR_OVERRIDES: Partial<
  Record<string, BlockBehaviorOverride>
> = {
  control_forever: {
    connectors: {
      // 将来的に Forever だけ bottom を false にする変更点をここへ集約する。
      bottom: true,
    },
  },
}

export function resolveBlockBehavior(blockOrShape: BlockDef | BlockShape): BlockBehavior {
  const def = typeof blockOrShape === "string" ? null : blockOrShape
  const shape = typeof blockOrShape === "string" ? blockOrShape : blockOrShape.shape
  const shapeConfig = SHAPE_CONFIGS[shape]
  const override = def?.opcode
    ? BLOCK_BEHAVIOR_OVERRIDES[def.opcode]
    : undefined

  return {
    size: shapeConfig.size,
    connectors: {
      top: override?.connectors?.top ?? shapeConfig.connectors.top,
      bottom: override?.connectors?.bottom ?? shapeConfig.connectors.bottom,
      value: override?.connectors?.value ?? !!shapeConfig.connectors.value,
    },
    bodies: (shapeConfig.bodies ?? []).map((body, index) => ({
      minHeight: override?.bodies?.[index]?.minHeight ?? body.minHeight,
      hasEntryConnector:
        override?.bodies?.[index]?.hasEntryConnector ?? true,
    })),
    contentGap:
      override?.contentGap ??
      (shape === "c-block-else" ? C_DIVIDER_H : undefined),
  }
}

// --- 共通ヘルパー ---
export function getBlockSize(shape: BlockShape): { w: number; h: number } {
  return resolveBlockBehavior(shape).size
}

export function hasTopConnector(shape: BlockShape): boolean {
  return resolveBlockBehavior(shape).connectors.top
}

export function hasBottomConnector(shape: BlockShape): boolean {
  return resolveBlockBehavior(shape).connectors.bottom
}

export function isCBlockShape(shape: BlockShape): boolean {
  return resolveBlockBehavior(shape).bodies.length > 0
}

export function isInlineValueShape(shape: BlockShape): boolean {
  return resolveBlockBehavior(shape).connectors.value
}

export function isValueBlockShape(shape: BlockShape): shape is ValueBlockShape {
  return isInlineValueShape(shape)
}

export function estimateTextWidth(text: string): number {
  return text.length * 7.5
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function createEditorId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function isInlineReporterVariableInput(
  input: InputDef
): input is Extract<InputDef, { type: "variable-name" }> & {
  appearance: "inline-reporter"
} {
  return input.type === "variable-name" && input.appearance === "inline-reporter"
}

function createBuiltinBlockDefs() {
  const V = ["my variable", "score", "timer"]
  const L = ["my list", "inventory", "path"]
  const K = ["space", "up arrow", "down arrow", "right arrow", "left arrow", "any"]
  const EVT = ["message1", "game-over", "reset", "coin-hit", "collision"]

  const defs: Omit<BlockDef, "id" | "source">[] = [
    { category: "events", name: "When 🏴 clicked", opcode: "event_whenflagclicked", shape: "hat", color: "#FFBF00", inputs: [] },
    { category: "events", name: "When", opcode: "event_whenkeypressed", shape: "hat", color: "#FFBF00", inputs: [{ type: "dropdown", default: "space", options: K }, { type: "label", text: "key pressed" }] },
    {
      category: "events",
      name: "When variable",
      opcode: "observer_whenvarchanges",
      shape: "hat",
      color: "#FFBF00",
      inputs: [
        { type: "dropdown", default: "my variable", options: V },
        { type: "label", text: "changes" },
      ],
      headerReporterCopies: [
        { label: "new value", blockName: "New value" },
        { label: "old value", blockName: "Old value" },
      ],
    },
    { category: "events", name: "New value", opcode: "observer_newvalue", shape: "reporter", color: "#FFBF00", inputs: [] },
    { category: "events", name: "Old value", opcode: "observer_oldvalue", shape: "reporter", color: "#FFBF00", inputs: [] },
    { category: "events", name: "Stop watching", opcode: "observer_stopwatching", shape: "stack", color: "#FFBF00", inputs: [{ type: "dropdown", default: "my variable", options: V }] },
    { category: "events", name: "Send event", opcode: "observer_sendevent", shape: "stack", color: "#FFBF00", inputs: [{ type: "dropdown", default: "message1", options: EVT }, { type: "label", text: "with" }, { type: "text", default: "data" }] },
    { category: "events", name: "When event", opcode: "observer_wheneventreceived", shape: "hat", color: "#FFBF00", inputs: [{ type: "dropdown", default: "message1", options: EVT }, { type: "label", text: "received" }] },
    { category: "events", name: "Event data", opcode: "observer_eventdata", shape: "reporter", color: "#FFBF00", inputs: [] },

    { category: "motion", name: "Move", opcode: "motion_movesteps", shape: "stack", color: "#4C97FF", inputs: [{ type: "number", default: 10 }, { type: "label", text: "steps" }] },
    { category: "motion", name: "Turn ↻", opcode: "motion_turnright", shape: "stack", color: "#4C97FF", inputs: [{ type: "number", default: 15 }, { type: "label", text: "degrees" }] },
    { category: "motion", name: "Go to x:", opcode: "motion_gotoxy", shape: "stack", color: "#4C97FF", inputs: [{ type: "number", default: 0 }, { type: "label", text: "y:" }, { type: "number", default: 0 }] },
    { category: "motion", name: "Glide", opcode: "motion_glidesecstoxy", shape: "stack", color: "#4C97FF", inputs: [{ type: "number", default: 1 }, { type: "label", text: "secs to x:" }, { type: "number", default: 0 }, { type: "label", text: "y:" }, { type: "number", default: 0 }] },
    { category: "motion", name: "Change x by", opcode: "motion_changexby", shape: "stack", color: "#4C97FF", inputs: [{ type: "number", default: 10 }] },
    { category: "motion", name: "Change y by", opcode: "motion_changeyby", shape: "stack", color: "#4C97FF", inputs: [{ type: "number", default: 10 }] },
    { category: "motion", name: "Set x to", opcode: "motion_setx", shape: "stack", color: "#4C97FF", inputs: [{ type: "number", default: 0 }] },
    { category: "motion", name: "Set y to", opcode: "motion_sety", shape: "stack", color: "#4C97FF", inputs: [{ type: "number", default: 0 }] },
    { category: "motion", name: "If on edge, bounce", opcode: "motion_ifonedgebounce", shape: "stack", color: "#4C97FF", inputs: [] },
    { category: "motion", name: "X position", opcode: "motion_xposition", shape: "reporter", color: "#4C97FF", inputs: [] },
    { category: "motion", name: "Y position", opcode: "motion_yposition", shape: "reporter", color: "#4C97FF", inputs: [] },
    { category: "motion", name: "Direction", opcode: "motion_direction", shape: "reporter", color: "#4C97FF", inputs: [] },

    { category: "looks", name: "Say", opcode: "looks_sayforsecs", shape: "stack", color: "#9966FF", inputs: [{ type: "text", default: "Hello!" }, { type: "label", text: "for" }, { type: "number", default: 2 }, { type: "label", text: "seconds" }] },
    { category: "looks", name: "Think", opcode: "looks_think", shape: "stack", color: "#9966FF", inputs: [{ type: "text", default: "Hmm..." }] },
    { category: "looks", name: "Set size to", opcode: "looks_setsizeto", shape: "stack", color: "#9966FF", inputs: [{ type: "number", default: 100 }, { type: "label", text: "%" }] },
    { category: "looks", name: "Show", opcode: "looks_show", shape: "stack", color: "#9966FF", inputs: [] },
    { category: "looks", name: "Hide", opcode: "looks_hide", shape: "stack", color: "#9966FF", inputs: [] },
    { category: "looks", name: "Switch costume to", opcode: "looks_switchcostumeto", shape: "stack", color: "#9966FF", inputs: [{ type: "dropdown", default: "costume1", options: ["costume1", "costume2", "costume3"] }] },

    { category: "control", name: "Wait", opcode: "control_wait", shape: "stack", color: "#FFAB19", inputs: [{ type: "number", default: 1 }, { type: "label", text: "seconds" }] },
    { category: "control", name: "Repeat", opcode: "control_repeat", shape: "c-block", color: "#FFAB19", inputs: [{ type: "number", default: 10 }] },
    {
      category: "control",
      name: "for",
      opcode: "control_for_range",
      shape: "c-block",
      color: "#FFAB19",
      inputs: [
        {
          type: "variable-name",
          default: "i",
          editable: false,
          appearance: "inline-reporter",
          copySource: {
            targetOpcode: "control_loop_variable",
            targetShape: "reporter",
            inputBindings: { 0: 0 },
          },
          minWidth: INLINE_REPORTER_INPUT_MIN_W,
          maxWidth: INLINE_REPORTER_INPUT_MAX_W,
        },
        { type: "label", text: "=" },
        { type: "number", default: 1 },
        { type: "label", text: "to" },
        { type: "number", default: 10 },
      ],
    },
    { category: "control", name: "Forever", opcode: "control_forever", shape: "c-block", color: "#FFAB19", inputs: [] },
    { category: "control", name: "If", opcode: "control_if", shape: "c-block", color: "#FFAB19", inputs: [{ type: "boolean-slot" }, { type: "label", text: "then" }] },
    { category: "control", name: "If", opcode: "control_if_else", shape: "c-block-else", color: "#FFAB19", inputs: [{ type: "boolean-slot" }, { type: "label", text: "then" }] },
    { category: "control", name: "Repeat until", opcode: "control_repeat_until", shape: "c-block", color: "#FFAB19", inputs: [{ type: "boolean-slot" }] },
    { category: "control", name: "Wait until", opcode: "control_wait_until", shape: "stack", color: "#FFAB19", inputs: [{ type: "boolean-slot" }] },
    { category: "control", name: "Stop all", opcode: "control_stop", shape: "stack", color: "#FFAB19", inputs: [] },
    {
      category: "control",
      name: "",
      opcode: "control_loop_variable",
      shape: "reporter",
      color: "#FFAB19",
      paletteHidden: true,
      inputs: [{ type: "variable-name", default: "i", editable: false, minWidth: 28, maxWidth: 96 }],
    },

    { category: "sensing", name: "Touching", opcode: "sensing_touchingobject", shape: "boolean", color: "#5CB1D6", inputs: [{ type: "dropdown", default: "mouse-pointer", options: ["mouse-pointer", "edge", "プレイヤー", "地面", "浮島", "コイン", "敵"] }] },
    { category: "sensing", name: "Key", opcode: "sensing_keypressed", shape: "boolean", color: "#5CB1D6", inputs: [{ type: "dropdown", default: "space", options: K }, { type: "label", text: "pressed?" }] },
    { category: "sensing", name: "Mouse X", opcode: "sensing_mousex", shape: "reporter", color: "#5CB1D6", inputs: [] },
    { category: "sensing", name: "Mouse Y", opcode: "sensing_mousey", shape: "reporter", color: "#5CB1D6", inputs: [] },
    { category: "sensing", name: "Timer", opcode: "sensing_timer", shape: "reporter", color: "#5CB1D6", inputs: [] },
    { category: "sensing", name: "Reset timer", opcode: "sensing_resettimer", shape: "stack", color: "#5CB1D6", inputs: [] },

    { category: "operators", name: "", opcode: "operator_add", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 0 }, { type: "label", text: "+" }, { type: "number", default: 0 }] },
    { category: "operators", name: "", opcode: "operator_subtract", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 0 }, { type: "label", text: "-" }, { type: "number", default: 0 }] },
    { category: "operators", name: "", opcode: "operator_multiply", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 0 }, { type: "label", text: "*" }, { type: "number", default: 0 }] },
    { category: "operators", name: "", opcode: "operator_divide", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 0 }, { type: "label", text: "/" }, { type: "number", default: 0 }] },
    { category: "operators", name: "Pick random", opcode: "operator_random", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 1 }, { type: "label", text: "to" }, { type: "number", default: 10 }] },
    { category: "operators", name: "", opcode: "operator_gt", shape: "boolean", color: "#59C059", inputs: [{ type: "number", default: 0 }, { type: "label", text: ">" }, { type: "number", default: 0 }] },
    { category: "operators", name: "", opcode: "operator_lt", shape: "boolean", color: "#59C059", inputs: [{ type: "number", default: 0 }, { type: "label", text: "<" }, { type: "number", default: 0 }] },
    { category: "operators", name: "", opcode: "operator_equals", shape: "boolean", color: "#59C059", inputs: [{ type: "number", default: 0 }, { type: "label", text: "=" }, { type: "number", default: 0 }] },
    { category: "operators", name: "", opcode: "operator_and", shape: "boolean", color: "#59C059", inputs: [{ type: "boolean-slot" }, { type: "label", text: "and" }, { type: "boolean-slot" }] },
    { category: "operators", name: "", opcode: "operator_or", shape: "boolean", color: "#59C059", inputs: [{ type: "boolean-slot" }, { type: "label", text: "or" }, { type: "boolean-slot" }] },
    { category: "operators", name: "Not", opcode: "operator_not", shape: "boolean", color: "#59C059", inputs: [{ type: "boolean-slot" }] },
    { category: "operators", name: "Join", opcode: "operator_join", shape: "reporter", color: "#59C059", inputs: [{ type: "text", default: "hello" }, { type: "text", default: "world" }] },
    { category: "operators", name: "Length of", opcode: "operator_length", shape: "reporter", color: "#59C059", inputs: [{ type: "text", default: "hello" }] },
    { category: "operators", name: "Mod", opcode: "operator_mod", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 0 }, { type: "label", text: "%" }, { type: "number", default: 0 }] },
    { category: "operators", name: "Round", opcode: "operator_round", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 0 }] },

    { category: "variables", name: "Variable", opcode: "data_variable", shape: "reporter", color: "#FF8C1A", inputs: [{ type: "dropdown", default: "my variable", options: V }] },
    { category: "variables", name: "Set", opcode: "data_setvariableto", shape: "stack", color: "#FF8C1A", inputs: [{ type: "dropdown", default: "my variable", options: V }, { type: "label", text: "to" }, { type: "number", default: 0 }] },
    { category: "variables", name: "Change", opcode: "data_changevariableby", shape: "stack", color: "#FF8C1A", inputs: [{ type: "dropdown", default: "my variable", options: V }, { type: "label", text: "by" }, { type: "number", default: 1 }] },
    { category: "variables", name: "Show variable", opcode: "data_showvariable", shape: "stack", color: "#FF8C1A", inputs: [{ type: "dropdown", default: "my variable", options: V }] },
    { category: "variables", name: "Hide variable", opcode: "data_hidevariable", shape: "stack", color: "#FF8C1A", inputs: [{ type: "dropdown", default: "my variable", options: V }] },

    { category: "lists", name: "Add", opcode: "data_addtolist", shape: "stack", color: "#FF661A", inputs: [{ type: "text", default: "thing" }, { type: "label", text: "to" }, { type: "dropdown", default: "my list", options: L }] },
    { category: "lists", name: "Delete", opcode: "data_deleteoflist", shape: "stack", color: "#FF661A", inputs: [{ type: "number", default: 1 }, { type: "label", text: "of" }, { type: "dropdown", default: "my list", options: L }] },
    { category: "lists", name: "Item", opcode: "data_itemoflist", shape: "reporter", color: "#FF661A", inputs: [{ type: "number", default: 1 }, { type: "label", text: "of" }, { type: "dropdown", default: "my list", options: L }] },
    { category: "lists", name: "Length of", opcode: "data_lengthoflist", shape: "reporter", color: "#FF661A", inputs: [{ type: "dropdown", default: "my list", options: L }] },

    {
      category: "myblocks",
      name: "Define",
      opcode: "procedures_starter",
      shape: "hat",
      color: "#FF6680",
      inputs: [],
      paletteHidden: true,
    },
    {
      category: "myblocks",
      name: "Return",
      opcode: "procedures_return",
      shape: "stack",
      color: "#FF6680",
      inputs: [{ type: "text", default: "", placeholder: "value" }],
    },

    // --- クローン ---
    { category: "control", name: "Create clone of", opcode: "clone_create", shape: "stack", color: "#FFAB19", inputs: [{ type: "dropdown", default: "myself", options: ["myself", "プレイヤー", "地面", "浮島", "コイン", "敵", "弾"] }] },
    { category: "control", name: "When I start as a clone", opcode: "clone_whencloned", shape: "hat", color: "#FFAB19", inputs: [] },
    { category: "control", name: "Delete this clone", opcode: "clone_delete", shape: "stack", color: "#FFAB19", inputs: [] },

    // --- コスチューム拡張 ---
    { category: "looks", name: "Next costume", opcode: "looks_nextcostume", shape: "stack", color: "#9966FF", inputs: [] },
    { category: "looks", name: "Costume #", opcode: "looks_costumenumber", shape: "reporter", color: "#9966FF", inputs: [] },

    // --- HUD テキスト ---
    { category: "looks", name: "Show text", opcode: "looks_addtext", shape: "stack", color: "#9966FF", inputs: [{ type: "text", default: "Score: 0" }, { type: "label", text: "at x:" }, { type: "number", default: -900 }, { type: "label", text: "y:" }, { type: "number", default: 500 }] },
    { category: "looks", name: "Update text to", opcode: "looks_updatetext", shape: "stack", color: "#9966FF", inputs: [{ type: "text", default: "Score: 10" }] },
    { category: "looks", name: "Remove text", opcode: "looks_removetext", shape: "stack", color: "#9966FF", inputs: [] },

    // --- 物理 ---
    { category: "physics", name: "Set physics", opcode: "physics_setmode", shape: "stack", color: "#FF4D6A", inputs: [{ type: "dropdown", default: "dynamic", options: ["dynamic", "static", "none"] }] },
    { category: "physics", name: "Set gravity to", opcode: "physics_setgravity", shape: "stack", color: "#FF4D6A", inputs: [{ type: "number", default: 500 }] },
    { category: "physics", name: "Set velocity x:", opcode: "physics_setvelocity", shape: "stack", color: "#FF4D6A", inputs: [{ type: "number", default: 0 }, { type: "label", text: "y:" }, { type: "number", default: 0 }] },
    { category: "physics", name: "Set velocity x to", opcode: "physics_setvelocityX", shape: "stack", color: "#FF4D6A", inputs: [{ type: "number", default: 0 }] },
    { category: "physics", name: "Set velocity y to", opcode: "physics_setvelocityY", shape: "stack", color: "#FF4D6A", inputs: [{ type: "number", default: -300 }] },
    { category: "physics", name: "Velocity x", opcode: "physics_velocityX", shape: "reporter", color: "#FF4D6A", inputs: [] },
    { category: "physics", name: "Velocity y", opcode: "physics_velocityY", shape: "reporter", color: "#FF4D6A", inputs: [] },
    { category: "physics", name: "On ground?", opcode: "physics_onground", shape: "boolean", color: "#FF4D6A", inputs: [] },
    { category: "physics", name: "Set bounce to", opcode: "physics_setbounce", shape: "stack", color: "#FF4D6A", inputs: [{ type: "number", default: 0 }] },
    { category: "physics", name: "Set collide world bounds", opcode: "physics_setcollideworldbounds", shape: "stack", color: "#FF4D6A", inputs: [{ type: "dropdown", default: "on", options: ["on", "off"] }] },
    { category: "physics", name: "Disable body", opcode: "physics_disablebody", shape: "stack", color: "#FF4D6A", inputs: [] },
    { category: "physics", name: "Enable body", opcode: "physics_enablebody", shape: "stack", color: "#FF4D6A", inputs: [] },

    // --- 衝突イベント（コールバック型） ---
    { category: "physics", name: "On collide with", opcode: "physics_oncollide", shape: "stack", color: "#FF4D6A", inputs: [{ type: "dropdown", default: "プレイヤー", options: ["any", "プレイヤー", "地面", "浮島", "コイン", "敵"] }, { type: "label", text: "send" }, { type: "dropdown", default: "collision", options: EVT }] },
    { category: "physics", name: "Collision target", opcode: "physics_collisiontarget", shape: "reporter", color: "#FF4D6A", inputs: [] },
    { category: "physics", name: "Set allow gravity", opcode: "physics_setallowgravity", shape: "stack", color: "#FF4D6A", inputs: [{ type: "dropdown", default: "on", options: ["on", "off"] }] },

    // --- 見た目拡張 ---
    { category: "looks", name: "Set tint to", opcode: "looks_settint", shape: "stack", color: "#9966FF", inputs: [{ type: "text", default: "#ff0000" }] },
    { category: "looks", name: "Clear tint", opcode: "looks_cleartint", shape: "stack", color: "#9966FF", inputs: [] },
    { category: "looks", name: "Set opacity to", opcode: "looks_setopacity", shape: "stack", color: "#9966FF", inputs: [{ type: "number", default: 100 }, { type: "label", text: "%" }] },
    { category: "looks", name: "Set flip x", opcode: "looks_setflipx", shape: "stack", color: "#9966FF", inputs: [{ type: "dropdown", default: "on", options: ["on", "off"] }] },
    { category: "looks", name: "Floating text", opcode: "looks_floatingtext", shape: "stack", color: "#9966FF", inputs: [{ type: "text", default: "+10" }] },

    // --- グラフィックス描画（Phaser Graphics API 相当） ---
    { category: "looks", name: "Fill rect x:", opcode: "graphics_fillrect", shape: "stack", color: "#9966FF", inputs: [{ type: "number", default: 0 }, { type: "label", text: "y:" }, { type: "number", default: 0 }, { type: "label", text: "w:" }, { type: "number", default: 100 }, { type: "label", text: "h:" }, { type: "number", default: 20 }, { type: "label", text: "color:" }, { type: "text", default: "#00ff00" }] },
    { category: "looks", name: "Clear graphics", opcode: "graphics_clear", shape: "stack", color: "#9966FF", inputs: [] },

    // --- 衝突イベント（ハット） ---
    { category: "events", name: "When touched by", opcode: "event_whentouched", shape: "hat", color: "#FFBF00", inputs: [{ type: "dropdown", default: "コイン", options: ["any", "プレイヤー", "地面", "浮島", "コイン", "敵", "弾"] }] },

    // --- 制御拡張 ---
    { category: "control", name: "Restart game", opcode: "control_restart", shape: "stack", color: "#FFAB19", inputs: [] },

    // --- モーション拡張 ---
    { category: "motion", name: "Tween to x:", opcode: "motion_tweento", shape: "stack", color: "#4C97FF", inputs: [{ type: "number", default: 0 }, { type: "label", text: "y:" }, { type: "number", default: 0 }, { type: "label", text: "in" }, { type: "number", default: 1 }, { type: "label", text: "secs" }] },
  ]

  return defs.map((def, index) => {
    let id = `builtin:${index}`
    let source: BlockDef["source"] = { kind: "builtin" }
    if (def.opcode === "procedures_starter") {
      id = STARTER_DEFINE_BLOCK_ID
      source = { kind: "starter-define" }
    }
    if (def.opcode === "procedures_return") {
      id = GENERIC_RETURN_BLOCK_ID
      source = { kind: "custom-return" }
    }
    return { ...def, id, source }
  })
}

export const BUILTIN_BLOCK_DEFS: BlockDef[] = createBuiltinBlockDefs()

export const DEFAULT_BLOCK_PROJECT_DATA: BlockProjectData = {
  customProcedures: [],
  workspace: {
    blocks: [],
  },
}

export function createDefaultProcedure(): CustomProcedure {
  const param = createDefaultProcedureParam("text")
  return {
    id: createEditorId("procedure"),
    name: "my block",
    tokens: [
      { id: createEditorId("token"), type: "label", text: "my block" },
      { id: createEditorId("token"), type: "param", paramId: param.id },
    ],
    params: [param],
    returnsValue: false,
  }
}

export function createDefaultProcedureParam(
  valueType: ProcedureParamType
): CustomProcedureParam {
  return {
    id: createEditorId("param"),
    name: valueType === "number" ? "number" : "text",
    valueType,
  }
}

export function getProcedureDisplayName(procedure: CustomProcedure): string {
  const parts: string[] = []
  for (const token of procedure.tokens) {
    if (token.type === "label") {
      if (token.text.trim()) parts.push(token.text.trim())
      continue
    }
    const param = procedure.params.find((item) => item.id === token.paramId)
    if (param) parts.push(param.name.trim())
  }
  return parts.join(" ").trim() || "my block"
}

export function normalizeProcedure(
  procedure: CustomProcedure
): CustomProcedure {
  return {
    ...procedure,
    name: getProcedureDisplayName(procedure),
  }
}

export function getProcedureParam(
  procedure: CustomProcedure,
  paramId: string
): CustomProcedureParam | undefined {
  return procedure.params.find((param) => param.id === paramId)
}

function createProcedureDefineDef(procedure: CustomProcedure): BlockDef {
  return {
    id: `${CUSTOM_DEFINE_PREFIX}${procedure.id}`,
    name: "define",
    opcode: "procedures_definition",
    shape: "hat",
    color: "#FF6680",
    category: "myblocks",
    source: { kind: "custom-define", procedureId: procedure.id },
    paletteHidden: true,
    inputs: procedure.tokens.flatMap((token): InputDef[] => {
      if (token.type === "label") {
        return [{ type: "label", text: token.text }]
      }
      const param = getProcedureParam(procedure, token.paramId)
      if (!param) return []
      return [{
        type: "param-chip",
        paramId: param.id,
        label: param.name,
        valueType: param.valueType,
      }]
    }),
  }
}

function createProcedureCallDef(procedure: CustomProcedure): BlockDef {
  return {
    id: `${CUSTOM_CALL_PREFIX}${procedure.id}`,
    name: "",
    opcode: procedure.returnsValue
      ? "procedures_call_reporter"
      : "procedures_call_stack",
    shape: procedure.returnsValue ? "reporter" : "stack",
    color: "#FF6680",
    category: "myblocks",
    source: { kind: "custom-call", procedureId: procedure.id },
    inputs: procedure.tokens.flatMap((token): InputDef[] => {
      if (token.type === "label") {
        return [{ type: "label", text: token.text }]
      }
      const param = getProcedureParam(procedure, token.paramId)
      if (!param) return []
      if (param.valueType === "number") {
        return [{
          type: "number",
          default: 0,
          placeholder: param.name,
          paramId: param.id,
        }]
      }
      return [{
        type: "text",
        default: "",
        placeholder: param.name,
        paramId: param.id,
      }]
    }),
  }
}

function createProcedureArgumentDef(
  procedure: CustomProcedure,
  param: CustomProcedureParam
): BlockDef {
  return {
    id: `${CUSTOM_ARGUMENT_PREFIX}${procedure.id}:${param.id}`,
    name: param.name,
    opcode: "procedures_argument",
    shape: "reporter",
    color: "#FF6680",
    category: "myblocks",
    source: {
      kind: "custom-argument",
      procedureId: procedure.id,
      paramId: param.id,
    },
    inputs: [],
    paletteHidden: true,
  }
}

export function buildProcedureBlockDefs(procedure: CustomProcedure): BlockDef[] {
  return [
    createProcedureDefineDef(procedure),
    createProcedureCallDef(procedure),
    ...procedure.params.map((param) =>
      createProcedureArgumentDef(procedure, param)
    ),
  ]
}

// スプライト名を動的に注入するopcodeとそのプレフィックスオプション
export const SPRITE_DROPDOWN_OPCODES: Record<string, { prefixOptions: string[]; inputIndex: number }> = {
  sensing_touchingobject: { prefixOptions: ["mouse-pointer", "edge"], inputIndex: 0 },
  clone_create: { prefixOptions: ["myself"], inputIndex: 0 },
  physics_oncollide: { prefixOptions: ["any"], inputIndex: 0 },
  event_whentouched: { prefixOptions: ["any"], inputIndex: 0 },
}

function injectSpriteNames(defs: BlockDef[], spriteNames: string[]): BlockDef[] {
  return defs.map((def) => {
    if (!def.opcode) return def
    const config = SPRITE_DROPDOWN_OPCODES[def.opcode]
    if (!config) return def
    const input = def.inputs[config.inputIndex]
    if (input?.type !== "dropdown") return def
    const newInputs = [...def.inputs]
    newInputs[config.inputIndex] = {
      ...input,
      options: [...config.prefixOptions, ...spriteNames],
    }
    return { ...def, inputs: newInputs }
  })
}

export function getBlockDefs(
  customProcedures: CustomProcedure[],
  spriteNames?: string[]
): BlockDef[] {
  const normalized = customProcedures.map(normalizeProcedure)
  const defs = [
    ...BUILTIN_BLOCK_DEFS,
    ...normalized.flatMap((procedure) => buildProcedureBlockDefs(procedure)),
  ]
  return spriteNames ? injectSpriteNames(defs, spriteNames) : defs
}

export function getPaletteBlockDefs(
  category: BlockDef["category"],
  customProcedures: CustomProcedure[],
  spriteNames?: string[]
): BlockDef[] {
  return getBlockDefs(customProcedures, spriteNames).filter((def) => {
    if (def.category !== category) return false
    if (def.paletteHidden) return false
    if (def.source.kind === "custom-define") return false
    if (def.source.kind === "custom-argument") return false
    return true
  })
}

export function getBlockDefById(
  defId: string,
  customProcedures: CustomProcedure[],
  spriteNames?: string[]
): BlockDef | undefined {
  return getBlockDefs(customProcedures, spriteNames).find((def) => def.id === defId)
}

export function findBuiltinBlockDefId(
  name: string,
  shape?: BlockShape
): string {
  const def = BUILTIN_BLOCK_DEFS.find(
    (item) =>
      item.name === name && (shape === undefined || item.shape === shape)
  )
  if (!def) {
    throw new Error(`BlockDef not found: ${name} (${shape ?? "any"})`)
  }
  return def.id
}

export function getInputDefaultValue(input: InputDef): string | null {
  switch (input.type) {
    case "number":
    case "text":
    case "variable-name":
    case "dropdown":
      return String(input.default)
    case "param-chip":
    case "boolean-slot":
    case "label":
      return null
  }
}

export function createInitialInputValues(
  inputs: InputDef[]
): Record<number, string> {
  const values: Record<number, string> = {}
  for (let index = 0; index < inputs.length; index += 1) {
    const value = getInputDefaultValue(inputs[index])
    if (value !== null) {
      values[index] = value
    }
  }
  return values
}

export function getInputValue(
  input: InputDef,
  blockState: Pick<BlockState, "inputValues">,
  index: number
): string {
  return blockState.inputValues[index] ?? getInputDefaultValue(input) ?? ""
}

export function getInputDisplayValue(
  input: InputDef,
  blockState: Pick<BlockState, "inputValues">,
  index: number
): string {
  const value = getInputValue(input, blockState, index)
  if (value) return value
  if ("placeholder" in input && input.placeholder) return input.placeholder
  if (input.type === "param-chip") return input.label
  return ""
}

export function getAcceptedValueShapes(input: InputDef): ValueBlockShape[] {
  switch (input.type) {
    case "boolean-slot":
      return ["boolean"]
    case "number":
    case "text":
    case "dropdown":
      return ["reporter"]
    case "variable-name":
    case "param-chip":
    case "label":
      return []
  }
}

export function inputWidth(input: InputDef, value?: string): number {
  switch (input.type) {
    case "number": {
      const text = value ?? String(input.default)
      const display = text || input.placeholder || "0"
      const minWidth = input.minWidth ?? INPUT_MIN_W
      const maxWidth = input.maxWidth ?? 120
      return clamp(
        Math.ceil(estimateTextWidth(display) + 22),
        minWidth,
        maxWidth
      )
    }
    case "text": {
      const text = value ?? input.default
      const display = text || input.placeholder || " "
      const minWidth = input.minWidth ?? INPUT_TEXT_MIN_W
      const maxWidth = input.maxWidth ?? INPUT_MAX_W
      return clamp(
        Math.ceil(estimateTextWidth(display) + 22),
        minWidth,
        maxWidth
      )
    }
    case "variable-name": {
      const text = value ?? input.default
      const display = text || input.placeholder || "i"
      const minWidth = input.minWidth ?? (
        isInlineReporterVariableInput(input)
          ? INLINE_REPORTER_INPUT_MIN_W
          : INPUT_MIN_W
      )
      const maxWidth = input.maxWidth ?? (
        isInlineReporterVariableInput(input)
          ? INLINE_REPORTER_INPUT_MAX_W
          : INPUT_MAX_W
      )
      const paddingWidth = isInlineReporterVariableInput(input) ? 16 : 22
      return clamp(
        Math.ceil(estimateTextWidth(display) + paddingWidth),
        minWidth,
        maxWidth
      )
    }
    case "dropdown": {
      const text = value ?? input.default
      const widestOption = input.options.reduce((max, option) => {
        return Math.max(max, estimateTextWidth(option))
      }, estimateTextWidth(text))
      const minWidth = input.minWidth ?? INPUT_DROPDOWN_MIN_W
      const maxWidth = input.maxWidth ?? INPUT_MAX_W
      return clamp(Math.ceil(widestOption + 30), minWidth, maxWidth)
    }
    case "param-chip":
      return hatReporterChipWidth(input.label)
    case "boolean-slot":
      return input.minWidth ?? BOOLEAN_SLOT_W
    case "label":
      return estimateTextWidth(input.text)
  }
}

export function getHeaderReporterCopies(
  def: Pick<BlockDef, "headerReporterCopies">
): HeaderReporterCopy[] {
  return def.headerReporterCopies ?? []
}

export function getHeaderReporterCopyLabel(
  copy: HeaderReporterCopy,
  blockState: Pick<BlockState, "def" | "inputValues">
): string {
  if (copy.labelInputIndex !== undefined) {
    const input = blockState.def.inputs[copy.labelInputIndex]
    if (input) {
      return getInputValue(input, blockState, copy.labelInputIndex)
    }
  }
  return copy.label ?? ""
}

export function hatReporterChipWidth(label: string): number {
  return clamp(
    Math.ceil(estimateTextWidth(label) + 24),
    HAT_REPORTER_CHIP_MIN_W,
    INPUT_MAX_W
  )
}

export function getInputSerializationKey(
  def: BlockDef,
  input: InputDef,
  index: number
): string {
  if (def.source.kind === "custom-call") {
    if (
      (input.type === "number" || input.type === "text") &&
      input.paramId
    ) {
      return input.paramId
    }
  }
  return String(index)
}

export function getInputIndexBySerializationKey(
  def: BlockDef,
  key: string
): number {
  for (let index = 0; index < def.inputs.length; index += 1) {
    if (getInputSerializationKey(def, def.inputs[index], index) === key) {
      return index
    }
  }
  return -1
}

export function computeSlotPositions(
  def: BlockDef,
  inputValues: Record<number, string> = createInitialInputValues(def.inputs)
): SlotInfo[] {
  let cursor =
    INLINE_PADDING_X +
    estimateTextWidth(def.name) +
    (def.name ? INLINE_GAP : 0)
  const behavior = resolveBlockBehavior(def)
  const blockH = behavior.bodies.length > 0 ? C_HEADER_H : behavior.size.h
  const slotY = (blockH - INLINE_SLOT_BASE_H) / 2
  const slots: SlotInfo[] = []

  for (let i = 0; i < def.inputs.length; i += 1) {
    const input = def.inputs[i]
    const w = inputWidth(input, inputValues[i])
    if (
      input.type !== "label" &&
      input.type !== "variable-name" &&
      input.type !== "param-chip"
    ) {
      slots.push({
        inputIndex: i,
        x: cursor,
        y: slotY,
        w,
        h: INLINE_SLOT_BASE_H,
        acceptedShapes: getAcceptedValueShapes(input),
      })
    }
    cursor += w + INLINE_GAP
  }

  return slots
}
