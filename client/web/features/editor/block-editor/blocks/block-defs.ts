// ビルトインブロック定義・lookup関数
import type { BlockDef, BlockProjectData, BlockShape, CustomProcedure } from "../types"
import {
  INLINE_REPORTER_INPUT_MAX_W,
  INLINE_REPORTER_INPUT_MIN_W,
  GENERIC_RETURN_BLOCK_ID,
  STARTER_DEFINE_BLOCK_ID,
} from "./constants"
import { buildProcedureBlockDefs, normalizeProcedure } from "./procedure-helpers"

function createBuiltinBlockDefs() {
  const V = ["my variable", "score", "timer"]
  const L = ["my list", "inventory", "path"]
  const D = ["my dict", "inventory", "settings"]
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
    { category: "motion", name: "Go to", opcode: "motion_gotoxy", shape: "stack", color: "#4C97FF", inputs: [{ type: "label", text: "x:" }, { type: "number", default: 0 }, { type: "label", text: "y:" }, { type: "number", default: 0 }] },
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
    { category: "looks", name: "Print", opcode: "looks_print", shape: "stack", color: "#9966FF", inputs: [{ type: "text", default: "hello" }] },
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
    { category: "variables", name: "Set live", opcode: "data_setlivevariable", shape: "stack", color: "#FF8C1A", inputs: [{ type: "dropdown", default: "my variable", options: V }, { type: "label", text: "= live" }, { type: "number", default: 0 }], description: "依存変数が変わったら自動再計算される変数を設定" },
    { category: "variables", name: "When live", opcode: "live_when", shape: "hat", color: "#FF8C1A", inputs: [{ type: "dropdown", default: "my variable", options: V }, { type: "label", text: "changes" }], description: "Live変数が変わるたびに実行" },
    { category: "variables", name: "Upon live", opcode: "live_upon", shape: "hat", color: "#FF8C1A", inputs: [{ type: "dropdown", default: "my variable", options: V }, { type: "label", text: "≤ 0" }], description: "Live変数の条件が成立したら一度だけ実行" },
    { category: "variables", name: "Show variable", opcode: "data_showvariable", shape: "stack", color: "#FF8C1A", inputs: [{ type: "dropdown", default: "my variable", options: V }] },
    { category: "variables", name: "Hide variable", opcode: "data_hidevariable", shape: "stack", color: "#FF8C1A", inputs: [{ type: "dropdown", default: "my variable", options: V }] },

    { category: "lists", name: "Add", opcode: "data_addtolist", shape: "stack", color: "#FF661A", inputs: [{ type: "text", default: "thing" }, { type: "label", text: "to" }, { type: "dropdown", default: "my list", options: L }] },
    { category: "lists", name: "Delete", opcode: "data_deleteoflist", shape: "stack", color: "#FF661A", inputs: [{ type: "number", default: 1 }, { type: "label", text: "of" }, { type: "dropdown", default: "my list", options: L }] },
    { category: "lists", name: "Item", opcode: "data_itemoflist", shape: "reporter", color: "#FF661A", inputs: [{ type: "number", default: 1 }, { type: "label", text: "of" }, { type: "dropdown", default: "my list", options: L }] },
    { category: "lists", name: "Insert", opcode: "data_insertatlist", shape: "stack", color: "#FF661A", inputs: [{ type: "text", default: "thing" }, { type: "label", text: "at" }, { type: "number", default: 1 }, { type: "label", text: "of" }, { type: "dropdown", default: "my list", options: L }] },
    { category: "lists", name: "Replace", opcode: "data_replaceitemoflist", shape: "stack", color: "#FF661A", inputs: [{ type: "number", default: 1 }, { type: "label", text: "of" }, { type: "dropdown", default: "my list", options: L }, { type: "label", text: "with" }, { type: "text", default: "thing" }] },
    { category: "lists", name: "Contains", opcode: "data_listcontainsitem", shape: "boolean", color: "#FF661A", inputs: [{ type: "dropdown", default: "my list", options: L }, { type: "label", text: "contains" }, { type: "text", default: "thing" }] },
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
    { category: "physics", name: "Set velocity", opcode: "physics_setvelocity", shape: "stack", color: "#FF4D6A", inputs: [{ type: "label", text: "x:" }, { type: "number", default: 0 }, { type: "label", text: "y:" }, { type: "number", default: 0 }] },
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

    // --- グラフィックス描画 ---
    { category: "looks", name: "Fill rect", opcode: "graphics_fillrect", shape: "stack", color: "#9966FF", inputs: [{ type: "label", text: "x:" }, { type: "number", default: 0 }, { type: "label", text: "y:" }, { type: "number", default: 0 }, { type: "label", text: "w:" }, { type: "number", default: 100 }, { type: "label", text: "h:" }, { type: "number", default: 20 }, { type: "label", text: "color:" }, { type: "text", default: "#00ff00" }] },
    { category: "looks", name: "Clear graphics", opcode: "graphics_clear", shape: "stack", color: "#9966FF", inputs: [] },

    // --- 衝突イベント（ハット） ---
    { category: "events", name: "When touched by", opcode: "event_whentouched", shape: "hat", color: "#FFBF00", inputs: [{ type: "dropdown", default: "コイン", options: ["any", "プレイヤー", "地面", "浮島", "コイン", "敵", "弾"] }] },

    // --- 制御拡張 ---
    { category: "control", name: "Restart game", opcode: "control_restart", shape: "stack", color: "#FFAB19", inputs: [] },

    // --- モーション拡張 ---
    { category: "motion", name: "Tween to", opcode: "motion_tweento", shape: "stack", color: "#4C97FF", inputs: [{ type: "label", text: "x:" }, { type: "number", default: 0 }, { type: "label", text: "y:" }, { type: "number", default: 0 }, { type: "label", text: "in" }, { type: "number", default: 1 }, { type: "label", text: "secs" }] },

    // --- 回転 ---
    { category: "motion", name: "Set angle to", opcode: "motion_setangle", shape: "stack", color: "#4C97FF", inputs: [{ type: "number", default: 0 }] },
    { category: "motion", name: "Angle", opcode: "motion_angle", shape: "reporter", color: "#4C97FF", inputs: [] },

    // --- カメラ ---
    { category: "camera", name: "Camera follow me", opcode: "camera_follow", shape: "stack", color: "#3D9970", inputs: [] },
    { category: "camera", name: "Camera stop follow", opcode: "camera_stopfollow", shape: "stack", color: "#3D9970", inputs: [] },
    { category: "camera", name: "Camera shake", opcode: "camera_shake", shape: "stack", color: "#3D9970", inputs: [{ type: "number", default: 200 }, { type: "label", text: "ms intensity:" }, { type: "number", default: 0.01 }] },
    { category: "camera", name: "Camera zoom", opcode: "camera_zoom", shape: "stack", color: "#3D9970", inputs: [{ type: "number", default: 1 }] },
    { category: "camera", name: "Camera fade", opcode: "camera_fade", shape: "stack", color: "#3D9970", inputs: [{ type: "number", default: 1000 }, { type: "label", text: "ms" }] },

    // --- Tween 拡張 ---
    { category: "looks", name: "Tween scale to", opcode: "tween_scale", shape: "stack", color: "#9966FF", inputs: [{ type: "number", default: 2 }, { type: "label", text: "in" }, { type: "number", default: 1 }, { type: "label", text: "secs" }] },
    { category: "looks", name: "Tween alpha to", opcode: "tween_alpha", shape: "stack", color: "#9966FF", inputs: [{ type: "number", default: 0.5 }, { type: "label", text: "in" }, { type: "number", default: 1 }, { type: "label", text: "secs" }] },
    { category: "looks", name: "Tween angle to", opcode: "tween_angle", shape: "stack", color: "#9966FF", inputs: [{ type: "number", default: 360 }, { type: "label", text: "in" }, { type: "number", default: 1 }, { type: "label", text: "secs" }] },

    // --- 数学 ---
    { category: "operators", name: "Random int", opcode: "math_randomint", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 1 }, { type: "label", text: "to" }, { type: "number", default: 100 }] },
    { category: "operators", name: "Angle to", opcode: "math_angleto", shape: "reporter", color: "#59C059", inputs: [{ type: "text", default: "プレイヤー" }] },
    { category: "operators", name: "Distance to", opcode: "math_distanceto", shape: "reporter", color: "#59C059", inputs: [{ type: "text", default: "プレイヤー" }] },
    { category: "operators", name: "Abs", opcode: "math_abs", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 0 }] },
    { category: "operators", name: "Min", opcode: "math_min", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 0 }, { type: "number", default: 0 }] },
    { category: "operators", name: "Max", opcode: "math_max", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 0 }, { type: "number", default: 0 }] },
    { category: "operators", name: "Sin", opcode: "math_sin", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 0 }] },
    { category: "operators", name: "Cos", opcode: "math_cos", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 0 }] },

    // --- タイマー ---
    { category: "control", name: "Set interval", opcode: "timer_setinterval", shape: "stack", color: "#FFAB19", inputs: [{ type: "text", default: "tick" }, { type: "label", text: "every" }, { type: "number", default: 1000 }, { type: "label", text: "ms" }] },
    { category: "control", name: "Clear interval", opcode: "timer_clearinterval", shape: "stack", color: "#FFAB19", inputs: [{ type: "text", default: "tick" }] },
    { category: "control", name: "Set timeout", opcode: "timer_settimeout", shape: "stack", color: "#FFAB19", inputs: [{ type: "text", default: "delayed" }, { type: "label", text: "after" }, { type: "number", default: 1000 }, { type: "label", text: "ms" }] },

    // --- テキスト拡張 ---
    { category: "looks", name: "Add text", opcode: "text_addat", shape: "stack", color: "#9966FF", inputs: [{ type: "text", default: "score" }, { type: "label", text: ":" }, { type: "text", default: "SCORE: 0" }, { type: "label", text: "x:" }, { type: "number", default: 0 }, { type: "label", text: "y:" }, { type: "number", default: 0 }, { type: "label", text: "size:" }, { type: "number", default: 24 }, { type: "label", text: "color:" }, { type: "text", default: "#ffffff" }] },
    { category: "looks", name: "Update text", opcode: "text_updateat", shape: "stack", color: "#9966FF", inputs: [{ type: "text", default: "score" }, { type: "label", text: "to" }, { type: "text", default: "SCORE: 10" }] },
    { category: "looks", name: "Remove text", opcode: "text_removeat", shape: "stack", color: "#9966FF", inputs: [{ type: "text", default: "score" }] },

    // --- パーティクル ---
    { category: "looks", name: "Emit particles", opcode: "particle_emit", shape: "stack", color: "#9966FF", inputs: [{ type: "label", text: "x:" }, { type: "number", default: 0 }, { type: "label", text: "y:" }, { type: "number", default: 0 }, { type: "label", text: "count:" }, { type: "number", default: 20 }, { type: "label", text: "color:" }, { type: "text", default: "#ff6600" }, { type: "label", text: "speed:" }, { type: "number", default: 200 }] },

    // --- Phase 1: 物理プロパティ拡張 ---
    { category: "physics", name: "Set acceleration", opcode: "physics_setacceleration", shape: "stack", color: "#FF4D6A", inputs: [{ type: "label", text: "x:" }, { type: "number", default: 0 }, { type: "label", text: "y:" }, { type: "number", default: 0 }] },
    { category: "physics", name: "Set acceleration x to", opcode: "physics_setaccelerationx", shape: "stack", color: "#FF4D6A", inputs: [{ type: "number", default: 0 }] },
    { category: "physics", name: "Set acceleration y to", opcode: "physics_setaccelerationy", shape: "stack", color: "#FF4D6A", inputs: [{ type: "number", default: 0 }] },
    { category: "physics", name: "Set drag", opcode: "physics_setdrag", shape: "stack", color: "#FF4D6A", inputs: [{ type: "label", text: "x:" }, { type: "number", default: 100 }, { type: "label", text: "y:" }, { type: "number", default: 100 }] },
    { category: "physics", name: "Set damping", opcode: "physics_setdamping", shape: "stack", color: "#FF4D6A", inputs: [{ type: "dropdown", default: "on", options: ["on", "off"] }] },
    { category: "physics", name: "Set max velocity", opcode: "physics_setmaxvelocity", shape: "stack", color: "#FF4D6A", inputs: [{ type: "label", text: "x:" }, { type: "number", default: 200 }, { type: "label", text: "y:" }, { type: "number", default: 200 }] },
    { category: "physics", name: "Set angular velocity", opcode: "physics_setangularvelocity", shape: "stack", color: "#FF4D6A", inputs: [{ type: "number", default: 0 }, { type: "label", text: "deg/s" }] },
    { category: "physics", name: "Set immovable", opcode: "physics_setimmovable", shape: "stack", color: "#FF4D6A", inputs: [{ type: "dropdown", default: "on", options: ["on", "off"] }] },
    { category: "physics", name: "Set mass to", opcode: "physics_setmass", shape: "stack", color: "#FF4D6A", inputs: [{ type: "number", default: 1 }] },
    { category: "physics", name: "Speed", opcode: "physics_speed", shape: "reporter", color: "#FF4D6A", inputs: [] },
    { category: "physics", name: "Set pushable", opcode: "physics_setpushable", shape: "stack", color: "#FF4D6A", inputs: [{ type: "dropdown", default: "on", options: ["on", "off"] }] },
    { category: "physics", name: "World wrap padding:", opcode: "physics_worldwrap", shape: "stack", color: "#FF4D6A", inputs: [{ type: "number", default: 32 }] },

    // --- Phase 2: 高度な物理操作 ---
    { category: "physics", name: "Move to", opcode: "physics_moveto", shape: "stack", color: "#FF4D6A", inputs: [{ type: "dropdown", default: "プレイヤー", options: ["プレイヤー"] }, { type: "label", text: "at speed" }, { type: "number", default: 200 }] },
    { category: "physics", name: "Accelerate to", opcode: "physics_accelerateto", shape: "stack", color: "#FF4D6A", inputs: [{ type: "dropdown", default: "プレイヤー", options: ["プレイヤー"] }, { type: "label", text: "at" }, { type: "number", default: 100 }] },
    { category: "physics", name: "Velocity from angle", opcode: "physics_velocityfromangle", shape: "stack", color: "#FF4D6A", inputs: [{ type: "number", default: 0 }, { type: "label", text: "speed:" }, { type: "number", default: 200 }] },

    // --- Phase 4: Phaser API 拡張 ---
    { category: "physics", name: "Set body size", opcode: "physics_setbodysize", shape: "stack", color: "#FF4D6A", inputs: [{ type: "label", text: "w:" }, { type: "number", default: 32 }, { type: "label", text: "h:" }, { type: "number", default: 32 }] },
    { category: "physics", name: "Set body offset", opcode: "physics_setbodyoffset", shape: "stack", color: "#FF4D6A", inputs: [{ type: "label", text: "x:" }, { type: "number", default: 0 }, { type: "label", text: "y:" }, { type: "number", default: 0 }] },
    { category: "physics", name: "Set circle radius:", opcode: "physics_setcircle", shape: "stack", color: "#FF4D6A", inputs: [{ type: "number", default: 16 }] },
    { category: "looks", name: "Set origin", opcode: "looks_setorigin", shape: "stack", color: "#9966FF", inputs: [{ type: "label", text: "x:" }, { type: "number", default: 0.5 }, { type: "label", text: "y:" }, { type: "number", default: 0.5 }] },
    { category: "looks", name: "Set scroll factor", opcode: "looks_setscrollfactor", shape: "stack", color: "#9966FF", inputs: [{ type: "label", text: "x:" }, { type: "number", default: 1 }, { type: "label", text: "y:" }, { type: "number", default: 1 }] },
    { category: "looks", name: "Set background", opcode: "scene_setbackground", shape: "stack", color: "#9966FF", inputs: [{ type: "text", default: "#000000" }] },

    // --- Phase 3: 入力拡張 ---
    { category: "sensing", name: "Mouse down?", opcode: "sensing_mousedown", shape: "boolean", color: "#5CB1D6", inputs: [] },
    { category: "sensing", name: "Mouse wheel", opcode: "sensing_mousewheel", shape: "reporter", color: "#5CB1D6", inputs: [] },
    { category: "sensing", name: "Key", opcode: "sensing_keyjustdown", shape: "boolean", color: "#5CB1D6", inputs: [{ type: "dropdown", default: "space", options: K }, { type: "label", text: "just pressed?" }] },
    { category: "sensing", name: "Enable drag", opcode: "sensing_enabledrag", shape: "stack", color: "#5CB1D6", inputs: [] },

    // --- Phase 4: アニメーション拡張 ---
    { category: "looks", name: "Create anim", opcode: "anim_create", shape: "stack", color: "#9966FF", inputs: [{ type: "text", default: "walk" }, { type: "label", text: "frames:" }, { type: "number", default: 0 }, { type: "label", text: "to" }, { type: "number", default: 3 }, { type: "label", text: "rate:" }, { type: "number", default: 10 }, { type: "label", text: "loop:" }, { type: "dropdown", default: "on", options: ["on", "off"] }] },
    { category: "looks", name: "Play anim", opcode: "anim_play", shape: "stack", color: "#9966FF", inputs: [{ type: "text", default: "walk" }] },
    { category: "looks", name: "Stop anim", opcode: "anim_stop", shape: "stack", color: "#9966FF", inputs: [] },
    { category: "looks", name: "On anim complete send", opcode: "anim_oncomplete", shape: "stack", color: "#9966FF", inputs: [{ type: "dropdown", default: "anim_done", options: EVT }] },

    // --- Phase 5: オーディオ ---
    { category: "sound", name: "Play sound", opcode: "sound_play", shape: "stack", color: "#D65CD6", inputs: [{ type: "dropdown", default: "beep", options: ["beep", "coin", "jump", "hit", "laser", "powerup", "explosion"] }] },
    { category: "sound", name: "Play sound loop", opcode: "sound_playloop", shape: "stack", color: "#D65CD6", inputs: [{ type: "dropdown", default: "beep", options: ["beep", "coin", "jump", "hit", "laser", "powerup", "explosion"] }] },
    { category: "sound", name: "Stop sound", opcode: "sound_stop", shape: "stack", color: "#D65CD6", inputs: [{ type: "dropdown", default: "beep", options: ["beep", "coin", "jump", "hit", "laser", "powerup", "explosion"] }] },
    { category: "sound", name: "Set volume", opcode: "sound_setvolume", shape: "stack", color: "#D65CD6", inputs: [{ type: "dropdown", default: "beep", options: ["beep", "coin", "jump", "hit", "laser", "powerup", "explosion"] }, { type: "label", text: "to" }, { type: "number", default: 50 }, { type: "label", text: "%" }] },

    // ─── モダン言語拡張: 比較演算子 ───
    { category: "operators", name: "", opcode: "operator_gte", shape: "boolean", color: "#59C059", inputs: [{ type: "number", default: 0 }, { type: "label", text: "≥" }, { type: "number", default: 0 }] },
    { category: "operators", name: "", opcode: "operator_lte", shape: "boolean", color: "#59C059", inputs: [{ type: "number", default: 0 }, { type: "label", text: "≤" }, { type: "number", default: 0 }] },
    { category: "operators", name: "", opcode: "operator_neq", shape: "boolean", color: "#59C059", inputs: [{ type: "number", default: 0 }, { type: "label", text: "≠" }, { type: "number", default: 0 }] },

    // ─── モダン言語拡張: 文字列操作 ───
    { category: "operators", name: "Letter", opcode: "operator_letter_of", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 1 }, { type: "label", text: "of" }, { type: "text", default: "hello" }] },
    { category: "operators", name: "Contains", opcode: "operator_contains", shape: "boolean", color: "#59C059", inputs: [{ type: "text", default: "hello" }, { type: "label", text: "contains" }, { type: "text", default: "ell" }] },
    { category: "operators", name: "Substring", opcode: "operator_substring", shape: "reporter", color: "#59C059", inputs: [{ type: "text", default: "hello" }, { type: "label", text: "from" }, { type: "number", default: 1 }, { type: "label", text: "len" }, { type: "number", default: 3 }] },
    { category: "operators", name: "Split", opcode: "operator_split", shape: "reporter", color: "#59C059", inputs: [{ type: "text", default: "a,b,c" }, { type: "label", text: "by" }, { type: "text", default: "," }] },
    { category: "operators", name: "Replace", opcode: "operator_replace", shape: "reporter", color: "#59C059", inputs: [{ type: "text", default: "hello" }, { type: "label", text: "replace" }, { type: "text", default: "l" }, { type: "label", text: "with" }, { type: "text", default: "r" }] },

    // ─── モダン言語拡張: 型変換 ───
    { category: "operators", name: "To number", opcode: "operator_tonum", shape: "reporter", color: "#59C059", inputs: [{ type: "text", default: "42" }] },
    { category: "operators", name: "To text", opcode: "operator_tostr", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 42 }] },

    // ─── モダン言語拡張: 数学関数 ───
    { category: "operators", name: "Lerp", opcode: "math_lerp", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 0 }, { type: "label", text: "→" }, { type: "number", default: 100 }, { type: "label", text: "%" }, { type: "number", default: 50 }] },
    { category: "operators", name: "Clamp", opcode: "math_clamp", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 50 }, { type: "label", text: "min" }, { type: "number", default: 0 }, { type: "label", text: "max" }, { type: "number", default: 100 }] },
    { category: "operators", name: "Floor", opcode: "math_floor", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 0 }] },
    { category: "operators", name: "Ceil", opcode: "math_ceil", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 0 }] },
    { category: "operators", name: "Sqrt", opcode: "math_sqrt", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 0 }] },
    { category: "operators", name: "Pow", opcode: "math_pow", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 2 }, { type: "label", text: "^" }, { type: "number", default: 3 }] },
    { category: "operators", name: "Atan2", opcode: "math_atan2", shape: "reporter", color: "#59C059", inputs: [{ type: "label", text: "y:" }, { type: "number", default: 0 }, { type: "label", text: "x:" }, { type: "number", default: 0 }] },
    { category: "operators", name: "Tan", opcode: "math_tan", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 0 }] },
    { category: "operators", name: "Sign", opcode: "math_sign", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 0 }] },
    { category: "operators", name: "Remap", opcode: "math_remap", shape: "reporter", color: "#59C059", inputs: [{ type: "number", default: 50 }, { type: "label", text: "from" }, { type: "number", default: 0 }, { type: "number", default: 100 }, { type: "label", text: "to" }, { type: "number", default: 0 }, { type: "number", default: 1 }] },
    { category: "operators", name: "π", opcode: "math_pi", shape: "reporter", color: "#59C059", inputs: [] },

    // ─── モダン言語拡張: 制御構文 ───
    { category: "control", name: "Break", opcode: "control_break", shape: "stack", color: "#FFAB19", inputs: [] },
    { category: "control", name: "Continue", opcode: "control_continue", shape: "stack", color: "#FFAB19", inputs: [] },
    {
      category: "control",
      name: "For each",
      opcode: "control_for_each",
      shape: "c-block",
      color: "#FFAB19",
      inputs: [
        {
          type: "variable-name",
          default: "item",
          editable: false,
          appearance: "inline-reporter",
          copySource: {
            targetOpcode: "control_foreach_variable",
            targetShape: "reporter",
            inputBindings: { 0: 0 },
          },
          minWidth: INLINE_REPORTER_INPUT_MIN_W,
          maxWidth: INLINE_REPORTER_INPUT_MAX_W,
        },
        { type: "label", text: "in" },
        { type: "dropdown", default: "my list", options: L },
      ],
    },
    {
      category: "control",
      name: "",
      opcode: "control_foreach_variable",
      shape: "reporter",
      color: "#FFAB19",
      paletteHidden: true,
      inputs: [{ type: "variable-name", default: "item", editable: false, minWidth: 28, maxWidth: 96 }],
    },
    { category: "control", name: "Spawn", opcode: "control_spawn", shape: "c-block", color: "#FFAB19", inputs: [] },
    { category: "control", name: "Batch", opcode: "control_batch", shape: "c-block", color: "#FFAB19", inputs: [{ type: "label", text: "batch" }] },

    // ─── モダン言語拡張: 辞書 ───
    { category: "lists", name: "Dict set", opcode: "data_dictset", shape: "stack", color: "#FF661A", inputs: [{ type: "dropdown", default: "my dict", options: D }, { type: "label", text: "key" }, { type: "text", default: "key" }, { type: "label", text: "to" }, { type: "text", default: "value" }] },
    { category: "lists", name: "Dict get", opcode: "data_dictget", shape: "reporter", color: "#FF661A", inputs: [{ type: "dropdown", default: "my dict", options: D }, { type: "label", text: "key" }, { type: "text", default: "key" }] },
    { category: "lists", name: "Dict delete", opcode: "data_dictdelete", shape: "stack", color: "#FF661A", inputs: [{ type: "dropdown", default: "my dict", options: D }, { type: "label", text: "key" }, { type: "text", default: "key" }] },
    { category: "lists", name: "Dict has key", opcode: "data_dicthas", shape: "boolean", color: "#FF661A", inputs: [{ type: "dropdown", default: "my dict", options: D }, { type: "label", text: "has" }, { type: "text", default: "key" }] },
    { category: "lists", name: "Dict keys", opcode: "data_dictkeys", shape: "reporter", color: "#FF661A", inputs: [{ type: "dropdown", default: "my dict", options: D }] },
    { category: "lists", name: "Dict length", opcode: "data_dictlength", shape: "reporter", color: "#FF661A", inputs: [{ type: "dropdown", default: "my dict", options: D }] },

    // ─── モダン言語拡張: 状態マシン ───
    { category: "control", name: "Set state to", opcode: "state_set", shape: "stack", color: "#FFAB19", inputs: [{ type: "text", default: "idle" }] },
    { category: "control", name: "State", opcode: "state_get", shape: "reporter", color: "#FFAB19", inputs: [] },
    { category: "control", name: "When state is", opcode: "state_when", shape: "hat", color: "#FFAB19", inputs: [{ type: "text", default: "idle" }] },
    { category: "control", name: "State is", opcode: "state_is", shape: "boolean", color: "#FFAB19", inputs: [{ type: "text", default: "idle" }] },

    // ─── モダン言語拡張: シーン管理 ───
    { category: "camera", name: "Switch scene to", opcode: "scene_switch", shape: "stack", color: "#3D9970", inputs: [{ type: "text", default: "game" }] },
    { category: "camera", name: "Current scene", opcode: "scene_current", shape: "reporter", color: "#3D9970", inputs: [] },
    { category: "camera", name: "Set time scale to", opcode: "scene_timescale", shape: "stack", color: "#3D9970", inputs: [{ type: "number", default: 1 }] },
    { category: "camera", name: "Save", opcode: "scene_save", shape: "stack", color: "#3D9970", inputs: [{ type: "text", default: "highscore" }, { type: "label", text: "value" }, { type: "text", default: "0" }] },
    { category: "camera", name: "Load", opcode: "scene_load", shape: "reporter", color: "#3D9970", inputs: [{ type: "text", default: "highscore" }] },

    // ─── モダン言語拡張: スプライト操作 ───
    { category: "sensing", name: "Property of", opcode: "sprite_getprop", shape: "reporter", color: "#5CB1D6", inputs: [{ type: "dropdown", default: "プレイヤー", options: ["プレイヤー"] }, { type: "label", text: "." }, { type: "dropdown", default: "x", options: ["x", "y", "direction", "size", "state", "costume #", "layer"] }] },
    { category: "sensing", name: "Set layer to", opcode: "sprite_setlayer", shape: "stack", color: "#5CB1D6", inputs: [{ type: "number", default: 0 }] },
    { category: "sensing", name: "Layer", opcode: "sprite_getlayer", shape: "reporter", color: "#5CB1D6", inputs: [] },
    { category: "sensing", name: "Add tag", opcode: "sprite_addtag", shape: "stack", color: "#5CB1D6", inputs: [{ type: "text", default: "enemy" }] },
    { category: "sensing", name: "Remove tag", opcode: "sprite_removetag", shape: "stack", color: "#5CB1D6", inputs: [{ type: "text", default: "enemy" }] },
    { category: "sensing", name: "Has tag", opcode: "sprite_hastag", shape: "boolean", color: "#5CB1D6", inputs: [{ type: "text", default: "enemy" }] },
    { category: "sensing", name: "For each with tag", opcode: "sprite_withtagdo", shape: "c-block", color: "#5CB1D6", inputs: [{ type: "text", default: "enemy" }] },
    { category: "sensing", name: "Tag loop target", opcode: "sprite_taglooptarget", shape: "reporter", color: "#5CB1D6", inputs: [] },

    // ─── モダン言語拡張: イージング（既存 Tween 拡張） ───
    // 既存の Tween ブロックと同じ color/category だが、イージング選択付き
    { category: "motion", name: "Tween to (ease)", opcode: "motion_tweento_ease", shape: "stack", color: "#4C97FF", inputs: [{ type: "label", text: "x:" }, { type: "number", default: 0 }, { type: "label", text: "y:" }, { type: "number", default: 0 }, { type: "label", text: "in" }, { type: "number", default: 1 }, { type: "label", text: "secs" }, { type: "dropdown", default: "linear", options: ["linear", "ease-in", "ease-out", "ease-in-out", "bounce"] }] },
    { category: "looks", name: "Tween scale (ease)", opcode: "tween_scale_ease", shape: "stack", color: "#9966FF", inputs: [{ type: "number", default: 2 }, { type: "label", text: "in" }, { type: "number", default: 1 }, { type: "label", text: "secs" }, { type: "dropdown", default: "linear", options: ["linear", "ease-in", "ease-out", "ease-in-out", "bounce"] }] },
    { category: "looks", name: "Tween alpha (ease)", opcode: "tween_alpha_ease", shape: "stack", color: "#9966FF", inputs: [{ type: "number", default: 0.5 }, { type: "label", text: "in" }, { type: "number", default: 1 }, { type: "label", text: "secs" }, { type: "dropdown", default: "linear", options: ["linear", "ease-in", "ease-out", "ease-in-out", "bounce"] }] },
    { category: "looks", name: "Tween angle (ease)", opcode: "tween_angle_ease", shape: "stack", color: "#9966FF", inputs: [{ type: "number", default: 360 }, { type: "label", text: "in" }, { type: "number", default: 1 }, { type: "label", text: "secs" }, { type: "dropdown", default: "linear", options: ["linear", "ease-in", "ease-out", "ease-in-out", "bounce"] }] },
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

// スプライト名を動的に注入するopcodeとそのプレフィックスオプション
export const SPRITE_DROPDOWN_OPCODES: Record<string, { prefixOptions: string[]; inputIndex: number }> = {
  sensing_touchingobject: { prefixOptions: ["mouse-pointer", "edge"], inputIndex: 0 },
  clone_create: { prefixOptions: ["myself"], inputIndex: 0 },
  physics_oncollide: { prefixOptions: ["any"], inputIndex: 0 },
  event_whentouched: { prefixOptions: ["any"], inputIndex: 0 },
  physics_moveto: { prefixOptions: [], inputIndex: 0 },
  physics_accelerateto: { prefixOptions: [], inputIndex: 0 },
  sprite_getprop: { prefixOptions: [], inputIndex: 0 },
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

/** ビルトイン＋カスタム手続きの全ブロック定義を取得する */
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

/** パレット表示用のブロック定義をカテゴリでフィルタして取得する */
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

/** 定義IDからブロック定義を検索する */
export function getBlockDefById(
  defId: string,
  customProcedures: CustomProcedure[],
  spriteNames?: string[]
): BlockDef | undefined {
  return getBlockDefs(customProcedures, spriteNames).find((def) => def.id === defId)
}

/** ビルトインブロック定義を名前と形状で検索してIDを返す */
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
