// クラスベース疑似コード → ClassProgramAST パーサー（トークナイザー + 再帰降下）

import type { StatementNode, ExprNode } from "./ast-types"
import type { ClassProgramAST, ClassAST, MethodAST, MethodKind } from "./class-ast-types"

// ── トークン定義 ──

type TokenType =
  | "keyword"
  | "identifier"
  | "number"
  | "string"
  | "punctuation"
  | "operator"
  | "eof"

type Token = {
  type: TokenType
  value: string
  line: number
}

const KEYWORDS = new Set([
  "class", "this",
  "if", "else", "while", "repeat", "for", "in", "return",
  "true", "false",
])

const TWO_CHAR_OPS = new Set(["==", "&&", "||", "+=", ".."])
const SINGLE_CHAR_OPS = new Set(["+", "-", "*", "/", "%", ">", "<", "!", "="])
const PUNCTUATION = new Set(["(", ")", "{", "}", ",", "."])

// ── トークナイザー ──

function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  let pos = 0
  let line = 1

  while (pos < source.length) {
    const ch = source[pos]

    if (ch === "\n") {
      line++
      pos++
      continue
    }

    if (ch === " " || ch === "\t" || ch === "\r") {
      pos++
      continue
    }

    // 行コメント
    if (ch === "/" && source[pos + 1] === "/") {
      while (pos < source.length && source[pos] !== "\n") pos++
      continue
    }

    // 文字列リテラル
    if (ch === '"') {
      pos++
      let str = ""
      while (pos < source.length && source[pos] !== '"') {
        if (source[pos] === "\\" && source[pos + 1] === '"') {
          str += '"'
          pos += 2
        } else {
          str += source[pos]
          pos++
        }
      }
      pos++
      tokens.push({ type: "string", value: str, line })
      continue
    }

    // 数値リテラル
    if (ch >= "0" && ch <= "9") {
      let num = ""
      while (pos < source.length && ((source[pos] >= "0" && source[pos] <= "9") || source[pos] === ".")) {
        num += source[pos]
        pos++
      }
      tokens.push({ type: "number", value: num, line })
      continue
    }

    // 識別子 / キーワード
    if (isIdentStart(ch)) {
      let ident = ""
      while (pos < source.length && isIdentPart(source[pos])) {
        ident += source[pos]
        pos++
      }
      const type = KEYWORDS.has(ident) ? "keyword" : "identifier"
      tokens.push({ type, value: ident, line })
      continue
    }

    // 2文字演算子
    if (pos + 1 < source.length) {
      const two = source[pos] + source[pos + 1]
      if (TWO_CHAR_OPS.has(two)) {
        tokens.push({ type: "operator", value: two, line })
        pos += 2
        continue
      }
    }

    // 1文字演算子
    if (SINGLE_CHAR_OPS.has(ch)) {
      tokens.push({ type: "operator", value: ch, line })
      pos++
      continue
    }

    // 句読点
    if (PUNCTUATION.has(ch)) {
      tokens.push({ type: "punctuation", value: ch, line })
      pos++
      continue
    }

    // 不明文字はスキップ
    pos++
  }

  tokens.push({ type: "eof", value: "", line })
  return tokens
}

function isIdentStart(ch: string): boolean {
  return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_" || ch.charCodeAt(0) > 127
}

function isIdentPart(ch: string): boolean {
  return isIdentStart(ch) || (ch >= "0" && ch <= "9")
}

// ── 特殊代入マッピング ──

const ASSIGN_TO_CALL: Record<string, string> = {
  x: "setX",
  y: "setY",
  size: "setSize",
  costume: "setCostume",
}

const CHANGE_TO_CALL: Record<string, string> = {
  x: "changeXBy",
  y: "changeYBy",
}

// 演算子の優先度
const PRECEDENCE: Record<string, number> = {
  "||": 1,
  "&&": 2,
  "==": 3,
  ">": 4,
  "<": 4,
  "+": 5,
  "-": 5,
  "*": 6,
  "/": 6,
  "%": 6,
}

// ── パーサー ──

class ClassParser {
  private tokens: Token[]
  private pos: number

  constructor(tokens: Token[]) {
    this.tokens = tokens
    this.pos = 0
  }

  private peek(): Token {
    return this.tokens[this.pos]
  }

  private advance(): Token {
    const t = this.tokens[this.pos]
    this.pos++
    return t
  }

  private expect(type: TokenType, value?: string): Token {
    const t = this.peek()
    if (t.type !== type || (value !== undefined && t.value !== value)) {
      throw new Error(`Parser error at line ${t.line}: expected ${type}${value ? ` "${value}"` : ""}, got ${t.type} "${t.value}"`)
    }
    return this.advance()
  }

  private match(type: TokenType, value?: string): boolean {
    const t = this.peek()
    if (t.type === type && (value === undefined || t.value === value)) {
      this.advance()
      return true
    }
    return false
  }

  // ── Program ──

  parseProgram(): ClassProgramAST {
    const classes: ClassAST[] = []
    while (this.peek().type !== "eof") {
      classes.push(this.parseClass())
    }
    return classes
  }

  // ── Class ──

  private parseClass(): ClassAST {
    this.expect("keyword", "class")
    const name = this.expect("identifier").value
    this.expect("punctuation", "{")

    const methods: MethodAST[] = []
    while (!this.match("punctuation", "}")) {
      methods.push(this.parseMethod())
    }

    return { name, methods }
  }

  // ── Method ──

  private parseMethod(): MethodAST {
    const kind = this.parseMethodKind()
    this.expect("punctuation", "{")
    const body = this.parseStatements()
    this.expect("punctuation", "}")
    return { kind, body }
  }

  private parseMethodKind(): MethodKind {
    const name = this.expect("identifier").value

    switch (name) {
      case "onCreate":
        this.expect("punctuation", "(")
        this.expect("punctuation", ")")
        return { type: "onCreate" }

      case "onUpdate":
        this.expect("punctuation", "(")
        this.expect("punctuation", ")")
        return { type: "onUpdate" }

      case "onKeyPress": {
        this.expect("punctuation", "(")
        const key = this.expect("string").value
        this.expect("punctuation", ")")
        return { type: "onKeyPress", key }
      }

      case "onClone":
        this.expect("punctuation", "(")
        this.expect("punctuation", ")")
        return { type: "onClone" }

      case "onTouched": {
        this.expect("punctuation", "(")
        const target = this.expect("string").value
        this.expect("punctuation", ")")
        return { type: "onTouched", target }
      }

      case "onEvent": {
        this.expect("punctuation", "(")
        const eventName = this.expect("string").value
        this.expect("punctuation", ")")
        return { type: "onEvent", name: eventName }
      }

      case "onVarChange": {
        this.expect("punctuation", "(")
        const variable = this.peek().type === "string"
          ? this.advance().value
          : this.expect("identifier").value
        this.expect("punctuation", ")")
        return { type: "onVarChange", variable }
      }

      default:
        throw new Error(`Unknown method kind: ${name} at line ${this.peek().line}`)
    }
  }

  // ── Statements ──

  private parseStatements(): StatementNode[] {
    const stmts: StatementNode[] = []
    while (this.peek().value !== "}") {
      stmts.push(this.parseStatement())
    }
    return stmts
  }

  private parseStatement(): StatementNode {
    const t = this.peek()

    // キーワードによるディスパッチ
    if (t.type === "keyword") {
      switch (t.value) {
        case "if": return this.parseIf()
        case "while": return this.parseWhile()
        case "repeat": return this.parseRepeat()
        case "for": return this.parseFor()
        case "return": return this.parseReturn()
        case "this": return this.parseThisStatement()
      }
    }

    // this. で始まる文
    if (t.type === "keyword" && t.value === "this") {
      return this.parseThisStatement()
    }

    // 識別子の場合: ローカル変数代入 / 関数呼び出し
    if (t.type === "identifier") {
      const name = this.advance().value
      const next = this.peek()

      if (next.type === "operator" && next.value === "=") {
        this.advance()
        const value = this.parseExpression()
        return { type: "assign", variable: name, value }
      }

      if (next.type === "operator" && next.value === "+=") {
        this.advance()
        const value = this.parseExpression()
        return { type: "changeBy", variable: name, value }
      }

      if (next.type === "punctuation" && next.value === "(") {
        const args = this.parseArgList()
        return { type: "call", name, args }
      }

      if (next.type === "punctuation" && next.value === ".") {
        this.advance()
        const method = this.expect("identifier").value
        const fullName = `${name}.${method}`
        if (this.peek().value === "(") {
          const args = this.parseArgList()
          return { type: "call", name: fullName, args }
        }
        throw new Error(`Unexpected property access: ${fullName} at line ${next.line}`)
      }

      throw new Error(`Unexpected token after identifier "${name}": ${next.type} "${next.value}" at line ${next.line}`)
    }

    throw new Error(`Unexpected statement start: ${t.type} "${t.value}" at line ${t.line}`)
  }

  // ── this. 文 ──

  private parseThisStatement(): StatementNode {
    this.expect("keyword", "this")
    this.expect("punctuation", ".")
    const name = this.expect("identifier").value
    const next = this.peek()

    // this.prop = expr
    if (next.type === "operator" && next.value === "=") {
      this.advance()
      const value = this.parseExpression()
      const callName = ASSIGN_TO_CALL[name]
      if (callName) {
        return { type: "call", name: callName, args: [value] }
      }
      return { type: "assign", variable: name, value }
    }

    // this.prop += expr
    if (next.type === "operator" && next.value === "+=") {
      this.advance()
      const value = this.parseExpression()
      const callName = CHANGE_TO_CALL[name]
      if (callName) {
        return { type: "call", name: callName, args: [value] }
      }
      return { type: "changeBy", variable: name, value }
    }

    // this.method(args)
    if (next.type === "punctuation" && next.value === "(") {
      const args = this.parseArgList()
      return { type: "call", name, args }
    }

    // this.obj.method(args) — graphics.fillRect 等
    if (next.type === "punctuation" && next.value === ".") {
      this.advance()
      const method = this.expect("identifier").value
      const fullName = `${name}.${method}`
      if (this.peek().value === "(") {
        const args = this.parseArgList()
        return { type: "call", name: fullName, args }
      }
      throw new Error(`Unexpected property access: this.${fullName} at line ${next.line}`)
    }

    throw new Error(`Unexpected token after this.${name}: ${next.type} "${next.value}" at line ${next.line}`)
  }

  // ── 制御文 ──

  private parseIf(): StatementNode {
    this.expect("keyword", "if")
    this.expect("punctuation", "(")
    const condition = this.parseExpression()
    this.expect("punctuation", ")")
    this.expect("punctuation", "{")
    const ifBody = this.parseStatements()
    this.expect("punctuation", "}")

    if (this.match("keyword", "else")) {
      // else if サポート: else の直後に if が来たらネストした ifElse に変換
      if (this.peek().type === "keyword" && this.peek().value === "if") {
        const nestedIf = this.parseIf()
        return { type: "ifElse", condition, ifBody, elseBody: [nestedIf] }
      }
      this.expect("punctuation", "{")
      const elseBody = this.parseStatements()
      this.expect("punctuation", "}")
      return { type: "ifElse", condition, ifBody, elseBody }
    }

    return { type: "if", condition, body: ifBody }
  }

  private parseWhile(): StatementNode {
    this.expect("keyword", "while")
    this.expect("punctuation", "(")
    const condition = this.parseExpression()
    this.expect("punctuation", ")")
    this.expect("punctuation", "{")
    const body = this.parseStatements()
    this.expect("punctuation", "}")

    if (condition.type === "boolean" && condition.value === true) {
      return { type: "forever", body }
    }
    return { type: "while", condition, body }
  }

  private parseRepeat(): StatementNode {
    this.expect("keyword", "repeat")
    this.expect("punctuation", "(")
    const times = this.parseExpression()
    this.expect("punctuation", ")")
    this.expect("punctuation", "{")
    const body = this.parseStatements()
    this.expect("punctuation", "}")
    return { type: "repeat", times, body }
  }

  private parseFor(): StatementNode {
    this.expect("keyword", "for")
    this.expect("punctuation", "(")
    const variable = this.expect("identifier").value
    this.expect("keyword", "in")
    const from = this.parseExpression()
    this.expect("operator", "..")
    const to = this.parseExpression()
    this.expect("punctuation", ")")
    this.expect("punctuation", "{")
    const body = this.parseStatements()
    this.expect("punctuation", "}")
    return { type: "for", variable, from, to, body }
  }

  private parseReturn(): StatementNode {
    this.expect("keyword", "return")
    const value = this.parseExpression()
    return { type: "return", value }
  }

  // ── 引数リスト ──

  private parseArgList(): ExprNode[] {
    this.expect("punctuation", "(")
    const args: ExprNode[] = []
    if (this.peek().value !== ")") {
      args.push(this.parseExpression())
      while (this.match("punctuation", ",")) {
        args.push(this.parseExpression())
      }
    }
    this.expect("punctuation", ")")
    return args
  }

  // ── 式パーサー（優先順位クライミング） ──

  private parseExpression(minPrec = 0): ExprNode {
    let left = this.parsePrimary()

    while (true) {
      const t = this.peek()
      if (t.type !== "operator") break
      const prec = PRECEDENCE[t.value]
      if (prec === undefined || prec < minPrec) break

      const op = this.advance().value
      const right = this.parseExpression(prec + 1)
      left = { type: "binary", op, left, right }
    }

    return left
  }

  private parsePrimary(): ExprNode {
    const t = this.peek()

    // 単項マイナス
    if (t.type === "operator" && t.value === "-") {
      this.advance()
      const operand = this.parsePrimary()
      if (operand.type === "number") {
        return { type: "number", value: -operand.value }
      }
      return { type: "unary", op: "-", operand }
    }

    // 単項否定
    if (t.type === "operator" && t.value === "!") {
      this.advance()
      if (this.peek().value === "(") {
        this.advance()
        const operand = this.parseExpression()
        this.expect("punctuation", ")")
        return { type: "unary", op: "!", operand }
      }
      const operand = this.parsePrimary()
      return { type: "unary", op: "!", operand }
    }

    // 括弧
    if (t.type === "punctuation" && t.value === "(") {
      this.advance()
      const expr = this.parseExpression()
      this.expect("punctuation", ")")
      return expr
    }

    // 数値リテラル
    if (t.type === "number") {
      this.advance()
      return { type: "number", value: Number(t.value) }
    }

    // 文字列リテラル
    if (t.type === "string") {
      this.advance()
      return { type: "string", value: t.value }
    }

    // ブーリアンリテラル
    if (t.type === "keyword" && (t.value === "true" || t.value === "false")) {
      this.advance()
      return { type: "boolean", value: t.value === "true" }
    }

    // this.prop / this.method(args) / this.obj.prop
    if (t.type === "keyword" && t.value === "this") {
      this.advance()
      this.expect("punctuation", ".")
      const name = this.expect("identifier").value

      // this.method(args) — 式中の関数呼び出し（レポーター/ブーリアン）
      if (this.peek().value === "(") {
        const args = this.parseArgList()
        return { type: "call", name, args }
      }

      // this.obj.prop — velocity.x 等
      if (this.peek().type === "punctuation" && this.peek().value === ".") {
        this.advance()
        const prop = this.expect("identifier").value
        // this.obj.method(args)
        if (this.peek().value === "(") {
          const args = this.parseArgList()
          return { type: "call", name: `${name}.${prop}`, args }
        }
        return { type: "property", object: name, property: prop }
      }

      return { type: "variable", name }
    }

    // 識別子 → 変数 / 関数呼び出し / プロパティアクセス
    if (t.type === "identifier") {
      this.advance()
      const name = t.value

      if (this.peek().value === "(") {
        const args = this.parseArgList()
        return { type: "call", name, args }
      }

      if (this.peek().type === "punctuation" && this.peek().value === ".") {
        this.advance()
        const prop = this.expect("identifier").value
        if (this.peek().value === "(") {
          const args = this.parseArgList()
          return { type: "call", name: `${name}.${prop}`, args }
        }
        return { type: "property", object: name, property: prop }
      }

      return { type: "variable", name }
    }

    throw new Error(`Unexpected token in expression: ${t.type} "${t.value}" at line ${t.line}`)
  }
}

// ── 公開 API ──

export function parseClassCode(source: string): ClassProgramAST {
  const tokens = tokenize(source)
  const parser = new ClassParser(tokens)
  return parser.parseProgram()
}
