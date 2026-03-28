// 疑似コード文字列 → AST パーサー（トークナイザー + 再帰降下パーサー）

import type {
  ProgramAST,
  SpriteAST,
  ScriptAST,
  HatNode,
  StatementNode,
  ExprNode,
} from "./ast-types"

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
  "sprite", "on", "if", "else", "while", "repeat", "for", "in", "return",
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

    // 改行
    if (ch === "\n") {
      line++
      pos++
      continue
    }

    // 空白スキップ
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
      pos++ // 閉じ引用符
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

    // 識別子 / キーワード（日本語含む）
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

    // 絵文字: 🚩 をフラグとして処理
    if (ch === "🚩" || (source.codePointAt(pos) === 0x1F6A9)) {
      const len = ch === "🚩" ? ch.length : 2
      tokens.push({ type: "identifier", value: "🚩", line })
      pos += len
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

// ── パーサー ──

// 特殊代入マッピング: 変数名 → 関数名変換
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

class Parser {
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

  parseProgram(): ProgramAST {
    const sprites: SpriteAST[] = []
    while (this.peek().type !== "eof") {
      sprites.push(this.parseSprite())
    }
    return sprites
  }

  // ── Sprite ──

  private parseSprite(): SpriteAST {
    this.expect("keyword", "sprite")
    const name = this.expect("string").value
    this.expect("punctuation", "{")

    const scripts: ScriptAST[] = []
    while (!this.match("punctuation", "}")) {
      scripts.push(this.parseScript())
    }

    return { name, scripts }
  }

  // ── Script (EventBlock) ──

  private parseScript(): ScriptAST {
    const hat = this.parseHat()
    this.expect("punctuation", "{")
    const body = this.parseStatements()
    this.expect("punctuation", "}")
    return { hat, body }
  }

  // ── Hat ──

  private parseHat(): HatNode {
    this.expect("keyword", "on")
    const hatType = this.advance()

    // `on 🚩 click` 形式
    if (hatType.type === "identifier" && hatType.value === "🚩") {
      // "click" を消費（あれば）
      if (this.peek().type === "identifier" && this.peek().value === "click") {
        this.advance()
      }
      return { type: "flagClicked" }
    }

    const name = hatType.value

    switch (name) {
      case "flagClicked":
        return { type: "flagClicked" }
      case "keyPress": {
        this.expect("punctuation", "(")
        const key = this.expect("string").value
        this.expect("punctuation", ")")
        return { type: "keyPress", key }
      }
      case "clone":
        // `on clone` or `on clone()`
        if (this.peek().value === "(") {
          this.advance()
          this.expect("punctuation", ")")
        }
        return { type: "clone" }
      case "touched": {
        this.expect("punctuation", "(")
        const target = this.expect("string").value
        this.expect("punctuation", ")")
        return { type: "touched", target }
      }
      case "event": {
        this.expect("punctuation", "(")
        const eventName = this.expect("string").value
        this.expect("punctuation", ")")
        return { type: "event", name: eventName }
      }
      case "varChange": {
        this.expect("punctuation", "(")
        const variable = this.peek().type === "string"
          ? this.advance().value
          : this.expect("identifier").value
        this.expect("punctuation", ")")
        return { type: "varChange", variable }
      }
      default:
        throw new Error(`Unknown hat type: ${name} at line ${hatType.line}`)
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
      }
    }

    // 識別子の場合: 代入 / 関数呼び出し / プロパティアクセス
    if (t.type === "identifier") {
      const name = this.advance().value
      const next = this.peek()

      // 代入: name = expr
      if (next.type === "operator" && next.value === "=") {
        this.advance()
        const value = this.parseExpression()
        // 特殊代入チェック
        const callName = ASSIGN_TO_CALL[name]
        if (callName) {
          return { type: "call", name: callName, args: [value] }
        }
        return { type: "assign", variable: name, value }
      }

      // 複合代入: name += expr
      if (next.type === "operator" && next.value === "+=") {
        this.advance()
        const value = this.parseExpression()
        const callName = CHANGE_TO_CALL[name]
        if (callName) {
          return { type: "call", name: callName, args: [value] }
        }
        return { type: "changeBy", variable: name, value }
      }

      // 関数呼び出し: name(args)
      if (next.type === "punctuation" && next.value === "(") {
        const args = this.parseArgList()
        return { type: "call", name, args }
      }

      // プロパティアクセス: name.method(args)
      if (next.type === "punctuation" && next.value === ".") {
        this.advance()
        const method = this.expect("identifier").value
        const fullName = `${name}.${method}`
        if (this.peek().value === "(") {
          const args = this.parseArgList()
          return { type: "call", name: fullName, args }
        }
        // プロパティ代入（必要なら将来拡張）
        throw new Error(`Unexpected property access: ${fullName} at line ${next.line}`)
      }

      throw new Error(`Unexpected token after identifier "${name}": ${next.type} "${next.value}" at line ${next.line}`)
    }

    throw new Error(`Unexpected statement start: ${t.type} "${t.value}" at line ${t.line}`)
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

    // else 節の有無
    if (this.match("keyword", "else")) {
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

    // while(true) → forever
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

  // ── 式パーサー（Pratt / 優先順位クライミング） ──

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
      // -数値リテラル → 直接負の数値ノード
      if (operand.type === "number") {
        return { type: "number", value: -operand.value }
      }
      return { type: "unary", op: "-", operand }
    }

    // 単項否定
    if (t.type === "operator" && t.value === "!") {
      this.advance()
      // !(...) の括弧を処理
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

    // 識別子 → 変数 / 関数呼び出し / プロパティアクセス
    if (t.type === "identifier") {
      this.advance()
      const name = t.value

      // 関数呼び出し
      if (this.peek().value === "(") {
        const args = this.parseArgList()
        return { type: "call", name, args }
      }

      // プロパティアクセス: name.prop or name.method(args)
      if (this.peek().type === "punctuation" && this.peek().value === ".") {
        this.advance()
        const prop = this.expect("identifier").value
        // メソッド呼び出し
        if (this.peek().value === "(") {
          const args = this.parseArgList()
          return { type: "call", name: `${name}.${prop}`, args }
        }
        // プロパティ参照（velocity.x 等）
        return { type: "property", object: name, property: prop }
      }

      return { type: "variable", name }
    }

    throw new Error(`Unexpected token in expression: ${t.type} "${t.value}" at line ${t.line}`)
  }
}

// ── 公開 API ──

export function parsePseudocode(source: string): ProgramAST {
  const tokens = tokenize(source)
  const parser = new Parser(tokens)
  return parser.parseProgram()
}
