// 自作言語の CodeMirror 6 拡張（ハイライト・補完・リンター）

import { StreamLanguage, type StreamParser } from "@codemirror/language"
import { autocompletion, type CompletionContext, type CompletionResult } from "@codemirror/autocomplete"
import { linter, type Diagnostic } from "@codemirror/lint"
import { codeToBlockData } from "./index"

// ── キーワード・関数名・プロパティ名 ──

const KEYWORDS = new Set([
  "class", "this", "if", "else", "while", "repeat", "for", "in", "return",
  "break", "continue", "spawn", "forEach", "true", "false",
  "var", "let", "live", "when", "upon", "batch",
])

const METHODS = [
  "move", "turnRight", "turnLeft", "goto", "setPosition", "glide", "tweenTo",
  "setX", "setY", "changeXBy", "changeYBy", "ifOnEdgeBounce", "setAngle",
  "setVelocityX", "setVelocityY", "setVelocity", "setPhysics", "setGravity",
  "setBounce", "setCollideWorldBounds", "setAllowGravity", "disableBody", "enableBody",
  "onCollide", "setAcceleration", "setDrag", "setDamping", "setMaxVelocity",
  "setAngularVelocity", "setImmovable", "setMass", "setPushable",
  "worldWrap", "moveTo", "accelerateTo", "velocityFromAngle",
  "show", "hide", "say", "think", "setSize", "setCostume", "nextCostume",
  "setTint", "clearTint", "setAlpha", "setFlipX",
  "addText", "setText", "removeText", "floatingText",
  "addTextAt", "updateTextAt", "removeTextAt",
  "tweenScale", "tweenAlpha", "tweenAngle",
  "emitParticles", "createClone", "deleteClone",
  "emit", "unwatch", "touching", "isKeyPressed", "isKeyJustDown", "isOnGround",
  "enableDrag", "createAnim", "playAnim",
  "wait", "waitUntil", "stop", "restart",
  "setInterval", "clearInterval", "setTimeout",
  "cameraFollow", "cameraStopFollow", "cameraShake", "cameraZoom", "cameraFade",
  "setOrigin", "setScrollFactor", "setLayer",
  "addTag", "removeTag", "hasTag",
  "setState", "stateIs",
  "showVariable", "hideVariable",
]

const PROPERTIES = [
  "x", "y", "angle", "velocityX", "velocityY",
  "mouseX", "mouseY", "timer", "mouseDown", "mouseWheel",
  "costumeNumber", "newValue", "oldValue", "eventData",
  "state", "currentScene", "layer", "collisionTarget",
]

const GLOBAL_FUNCTIONS = [
  "join", "floor", "ceil", "round", "abs", "sqrt", "pow",
  "sin", "cos", "tan", "atan2", "sign",
  "min", "max", "lerp", "clamp", "remap",
  "random", "randomInt",
  "letterOf", "contains", "substring", "split", "replace",
  "toNumber", "toText",
  "propertyOf", "distanceTo", "angleTo",
]

const METHOD_SET = new Set(METHODS)
const GLOBAL_SET = new Set(GLOBAL_FUNCTIONS)

// ── StreamParser: 構文ハイライト ──

const parser: StreamParser<Record<string, never>> = {
  token(stream) {
    // 空白スキップ
    if (stream.eatSpace()) return null

    // 行コメント
    if (stream.match("//")) {
      stream.skipToEnd()
      return "lineComment"
    }

    // 文字列リテラル
    if (stream.match('"')) {
      while (!stream.eol()) {
        const ch = stream.next()
        if (ch === "\\") { stream.next(); continue }
        if (ch === '"') break
      }
      return "string"
    }

    // 数値リテラル
    if (stream.match(/^-?\d+(\.\d+)?/)) return "number"

    // 2文字演算子
    if (stream.match(/^(==|!=|>=|<=|&&|\|\||[+\-*/]=|\.\.)/)) return "operator"

    // 1文字演算子
    if (stream.match(/^[+\-*/%><!=%]/)) return "operator"

    // 句読点
    if (stream.match(/^[(){},.;]/)) return "punctuation"

    // 識別子 / キーワード
    if (stream.match(/^[a-zA-Z_\u0080-\uffff][a-zA-Z0-9_\u0080-\uffff]*/)) {
      const word = stream.current()
      if (KEYWORDS.has(word)) return "keyword"
      if (METHOD_SET.has(word)) return "function"
      if (GLOBAL_SET.has(word)) return "function"
      return "variableName"
    }

    // 不明文字をスキップ
    stream.next()
    return null
  },
}

export const customLanguage = StreamLanguage.define(parser)

// ── オートコンプリート ──

function customCompletions(context: CompletionContext): CompletionResult | null {
  // this. の後の補完
  const thisMatch = context.matchBefore(/this\.[\w]*/)
  if (thisMatch) {
    const methodOptions = METHODS.map(name => ({
      label: name,
      type: "method" as const,
      apply: name + "()",
      boost: 1,
    }))
    const propOptions = PROPERTIES.map(name => ({
      label: name,
      type: "property" as const,
      boost: 0,
    }))
    return {
      from: thisMatch.from + 5, // "this." の後
      options: [...methodOptions, ...propOptions],
      validFor: /^[\w]*$/,
    }
  }

  // 一般的な補完（キーワード・グローバル関数）
  const wordMatch = context.matchBefore(/[\w]+/)
  if (!wordMatch || wordMatch.from === wordMatch.to) return null

  const keywordOptions = [
    { label: "class", type: "keyword" as const },
    { label: "var", type: "keyword" as const },
    { label: "var live", type: "keyword" as const, apply: "var live " },
    { label: "let", type: "keyword" as const },
    { label: "if", type: "keyword" as const, apply: "if () {\n  \n}" },
    { label: "else", type: "keyword" as const },
    { label: "while", type: "keyword" as const, apply: "while () {\n  \n}" },
    { label: "repeat", type: "keyword" as const, apply: "repeat () {\n  \n}" },
    { label: "for", type: "keyword" as const, apply: "for ( in ..) {\n  \n}" },
    { label: "forEach", type: "keyword" as const, apply: "forEach ( in ) {\n  \n}" },
    { label: "spawn", type: "keyword" as const, apply: "spawn {\n  \n}" },
    { label: "batch", type: "keyword" as const, apply: "batch {\n  \n}" },
    { label: "when", type: "keyword" as const, apply: "when (this.) {\n  \n}" },
    { label: "upon", type: "keyword" as const, apply: "upon (this.) {\n  \n}" },
    { label: "return", type: "keyword" as const },
    { label: "break", type: "keyword" as const },
    { label: "continue", type: "keyword" as const },
    { label: "onCreate", type: "function" as const, apply: "onCreate() {\n  \n}" },
    { label: "onUpdate", type: "function" as const, apply: "onUpdate() {\n  \n}" },
    { label: "onKeyPress", type: "function" as const, apply: 'onKeyPress("") {\n  \n}' },
    { label: "onTouched", type: "function" as const, apply: 'onTouched("") {\n  \n}' },
    { label: "onEvent", type: "function" as const, apply: 'onEvent("") {\n  \n}' },
    { label: "onClone", type: "function" as const, apply: "onClone() {\n  \n}" },
  ]

  const globalFnOptions = GLOBAL_FUNCTIONS.map(name => ({
    label: name,
    type: "function" as const,
    apply: name + "()",
  }))

  return {
    from: wordMatch.from,
    options: [...keywordOptions, ...globalFnOptions],
    validFor: /^[\w]*$/,
  }
}

export const customAutocompletion = autocompletion({
  override: [customCompletions],
  activateOnTyping: true,
})

// ── リンター: パースエラーをインライン表示 ──

export const customLinter = linter((view) => {
  const doc = view.state.doc.toString()
  if (!doc.trim()) return []

  try {
    codeToBlockData(doc)
    return []
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    const diagnostics: Diagnostic[] = []

    // "Parser error at line N:" からエラー行を抽出
    const lineMatch = msg.match(/at line (\d+)/)
    const errorLine = lineMatch ? Number(lineMatch[1]) : 1

    // 行番号を doc の位置に変換
    const lineCount = view.state.doc.lines
    const targetLine = Math.min(errorLine, lineCount)
    const line = view.state.doc.line(targetLine)

    diagnostics.push({
      from: line.from,
      to: line.to,
      severity: "error",
      message: msg.replace(/^Parser error at line \d+: /, ""),
    })

    return diagnostics
  }
}, { delay: 500 })
