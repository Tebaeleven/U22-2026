# 実装計画: 疑似コード → ブロック配置 JSON 自動生成

## Context

AIが疑似コードを生成した後、それを `SerializedBlockNode[]` に自動変換するパイプラインを実装する。現在の `sprites.ts` の手書き ID ベースのブロック生成を置き換える。

## 実装するファイル（4ファイル）

```
features/editor/codegen/
  ├── ast-types.ts          — AST の型定義
  ├── pseudocode-parser.ts  — 疑似コード文字列 → AST
  ├── block-generator.ts    — AST → SerializedBlockNode[] (メイン変換)
  └── index.ts              — エントリポイント（公開 API）
```

## 変更するファイル（1ファイル）

- `lib/store/slices/sprites.ts` — 手書きブロックデータ → codegen ベースに書き換え

---

## ファイル 1: `ast-types.ts`

疑似コードの構造を表す AST 型を定義。

```typescript
// プログラム全体 = スプライトの配列
type ProgramAST = SpriteAST[]

type SpriteAST = {
  name: string
  scripts: ScriptAST[]     // イベントハンドラの配列
  variables?: string[]      // カスタム変数名
}

type ScriptAST = {
  hat: HatNode              // イベントヘッダー
  body: StatementNode[]     // 本文
}

// ── ハットブロック ──
type HatNode =
  | { type: "flagClicked" }
  | { type: "keyPress"; key: string }
  | { type: "clone" }
  | { type: "touched"; target: string }
  | { type: "event"; name: string }
  | { type: "varChange"; variable: string }

// ── 文（スタックブロック） ──
type StatementNode =
  | { type: "call"; name: string; args: ExprNode[] }
  | { type: "assign"; variable: string; value: ExprNode }
  | { type: "changeBy"; variable: string; value: ExprNode }
  | { type: "if"; condition: ExprNode; body: StatementNode[] }
  | { type: "ifElse"; condition: ExprNode; ifBody: StatementNode[]; elseBody: StatementNode[] }
  | { type: "while"; condition: ExprNode; body: StatementNode[] }
  | { type: "repeat"; times: ExprNode; body: StatementNode[] }
  | { type: "forever"; body: StatementNode[] }
  | { type: "for"; variable: string; from: ExprNode; to: ExprNode; body: StatementNode[] }

// ── 式（レポーター/値） ──
type ExprNode =
  | { type: "number"; value: number }
  | { type: "string"; value: string }
  | { type: "boolean"; value: boolean }
  | { type: "variable"; name: string }
  | { type: "call"; name: string; args: ExprNode[] }
  | { type: "binary"; op: string; left: ExprNode; right: ExprNode }
  | { type: "unary"; op: string; operand: ExprNode }
  | { type: "property"; object: ExprNode; property: string }
```

---

## ファイル 2: `pseudocode-parser.ts`

疑似コード文字列を `ProgramAST` にパースする再帰降下パーサー。

### 入力例

```
sprite "プレイヤー" {
  on flagClicked {
    setPhysics("dynamic")
    setGravity(1000)
    goto(-600, -204)
    score = 0
  }

  on flagClicked {
    while (true) {
      if (isKeyPressed("left arrow")) {
        setVelocityX(-250)
      } else {
        setVelocityX(0)
      }
    }
  }
}

sprite "地面" {
  on flagClicked {
    setPhysics("static")
    goto(0, -380)
  }
}
```

### パーサー構造

```typescript
export function parsePseudocode(source: string): ProgramAST

// 内部:
class Parser {
  private tokens: Token[]
  private pos: number

  parseProgram(): ProgramAST
  parseSprite(): SpriteAST
  parseScript(): ScriptAST
  parseHat(): HatNode
  parseStatements(): StatementNode[]
  parseStatement(): StatementNode
  parseExpression(): ExprNode
  // ... 優先度ベースの式パーサー
}
```

### トークナイザー

```typescript
type TokenType =
  | "sprite" | "on" | "if" | "else" | "while" | "repeat" | "for" | "in" | "return"
  | "true" | "false"
  | "identifier" | "number" | "string"
  | "(" | ")" | "{" | "}" | "[" | "]"
  | "+" | "-" | "*" | "/" | "%" | ">" | "<" | "==" | "&&" | "||" | "!" | "=" | "+=" | ".." | "."
  | "," | "eof"
```

### パース規則のポイント

1. `sprite "名前" { ... }` でスプライトブロックを識別
2. `on flagClicked { ... }` でイベントハンドラを識別
3. `変数名 = 式` と `変数名 += 式` を代入文として認識
4. `関数名(引数, ...)` を関数呼び出しとして認識
5. `if (...) { ... } else { ... }` を if-else 文として認識
6. `while (true) { ... }` を forever に変換（条件が `true` の場合）
7. 式パーサーは演算子の優先度を考慮（`*` > `+` > `>` > `&&`）
8. `object.method(args)` をプロパティアクセス + 呼び出しとして認識（`graphics.fillRect(...)` 等）

---

## ファイル 3: `block-generator.ts`（最も重要）

`ProgramAST` → `Record<string, BlockProjectData>` を生成する。

### 主要な関数

```typescript
export function generateBlockData(
  program: ProgramAST
): Record<string, { name: string; blockData: BlockProjectData }>
```

### 内部処理

```typescript
class BlockGenerator {
  private blocks: SerializedBlockNode[] = []
  private idCounter = 0

  // ── opcode 逆引き ──
  // BUILTIN_BLOCK_DEFS から opcode → defId のマップを構築
  private opcodeToDefId: Map<string, string>

  // ── 関数名 → opcode マッピング ──
  // 疑似コードの関数名 → VPL opcode
  private funcToOpcode: Map<string, string> = new Map([
    ["move", "motion_movesteps"],
    ["goto", "motion_gotoxy"],
    ["setVelocityX", "physics_setvelocityX"],
    ["setVelocityY", "physics_setvelocityY"],
    ["setPhysics", "physics_setmode"],
    ["setGravity", "physics_setgravity"],
    // ... 全40+エントリ（完全なリストは codegen-requirements.md の §3-3 参照）
  ])

  // ── 引数名マッピング（argMaps の逆） ──
  // opcode の各引数名 → そのブロック定義の inputs 配列でのインデックス
  private getInputIndex(opcode: string, argName: string): number

  // ── メイン変換 ──
  generateSprite(sprite: SpriteAST): BlockProjectData {
    for (const script of sprite.scripts) {
      this.generateScript(script, xOffset)
    }
    return { customProcedures: [], customVariables: sprite.variables, workspace: { blocks: this.blocks } }
  }

  generateScript(script: ScriptAST, x: number): void {
    // 1. ハットブロック生成
    const hatId = this.generateHat(script.hat, x, y)
    // 2. 本文のステートメントをチェーン生成
    const firstBodyId = this.generateStatements(script.body)
    // 3. hatId.nextId = firstBodyId
  }

  generateStatements(stmts: StatementNode[]): string | null {
    // 各文をブロックに変換し、nextId で繋ぐ
    // 最初のブロック ID を返す
  }

  generateStatement(stmt: StatementNode): string {
    switch (stmt.type) {
      case "call":    return this.generateCall(stmt)
      case "assign":  return this.generateAssign(stmt)
      case "if":      return this.generateIf(stmt)
      case "ifElse":  return this.generateIfElse(stmt)
      case "forever": return this.generateForever(stmt)
      case "while":   return this.generateWhile(stmt)
      // ...
    }
  }

  generateCall(call: { name: string; args: ExprNode[] }): string {
    const opcode = this.funcToOpcode.get(call.name)
    const defId = this.opcodeToDefId.get(opcode)

    // 引数を inputValues と slotChildren に振り分け
    const inputValues: Record<string, string> = {}
    const slotChildren: Record<string, string> = {}

    for (let i = 0; i < call.args.length; i++) {
      const argName = argMaps[opcode][i]
      const inputIndex = this.getInputIndex(opcode, argName)
      const arg = call.args[i]

      if (arg.type === "number" || arg.type === "string") {
        // リテラル → inputValues に直接格納
        inputValues[String(inputIndex)] = String(arg.value)
      } else {
        // 式 → レポーターブロックを生成して slotChildren にネスト
        const reporterId = this.generateExpression(arg)
        slotChildren[String(inputIndex)] = reporterId
      }
    }

    return this.addBlock(defId, inputValues, { slotChildren })
  }

  generateExpression(expr: ExprNode): string {
    switch (expr.type) {
      case "variable":
        return this.addBlock(defIdOf("data_variable"), { "0": expr.name })
      case "binary":
        return this.generateBinaryExpr(expr)
      case "call":
        return this.generateReporterCall(expr)
      // ...
    }
  }

  generateBinaryExpr(expr: BinaryExprNode): string {
    const opMap = { "+": "operator_add", "-": "operator_subtract", "*": "operator_multiply", ... }
    const opcode = opMap[expr.op]

    // リテラルは inputValues、式は slotChildren にネスト
    const inputValues: Record<string, string> = {}
    const slotChildren: Record<string, string> = {}

    // operator_add の inputs: [number, label "+", number] → index 0, 2
    this.resolveExprToSlot(expr.left, "0", inputValues, slotChildren)
    this.resolveExprToSlot(expr.right, "2", inputValues, slotChildren)

    return this.addBlock(defIdOf(opcode), inputValues, { slotChildren })
  }

  // リテラルなら inputValues、式なら slotChildren にネストするヘルパー
  private resolveExprToSlot(
    expr: ExprNode,
    inputIndex: string,
    inputValues: Record<string, string>,
    slotChildren: Record<string, string>
  ) {
    if (expr.type === "number" || expr.type === "string") {
      inputValues[inputIndex] = String(expr.value)
    } else {
      slotChildren[inputIndex] = this.generateExpression(expr)
    }
  }

  // ── if 文 ──
  generateIf(stmt: IfNode): string {
    const condId = this.generateExpression(stmt.condition)
    const bodyIds = this.generateStatementsAsList(stmt.body)
    return this.addBlock(defIdOf("control_if"), {}, {
      slotChildren: { "0": condId },
      bodyChildren: [bodyIds],
    })
  }

  // ── ブロック追加ヘルパー ──
  private addBlock(defId, inputValues, extra?): string {
    const id = `gen-${this.prefix}-${++this.idCounter}`
    this.blocks.push({
      instanceId: id, defId, inputValues,
      position: { x: 0, y: 0 },
      nextId: extra?.nextId ?? null,
      bodyChildren: extra?.bodyChildren ?? [],
      slotChildren: extra?.slotChildren ?? {},
    })
    return id
  }
}
```

### 位置計算

ハットブロックのみ位置を設定。各スクリプトは以下のルールで配置:

```
スクリプト1: x=20,  y=20
スクリプト2: x=20,  y=500
スクリプト3: x=500, y=20
スクリプト4: x=500, y=500
スクリプト5: x=980, y=20
...
```

2列レイアウトで、各スクリプト間は縦 480px、横 480px。

---

## ファイル 4: `index.ts`

```typescript
export { parsePseudocode } from "./pseudocode-parser"
export { generateBlockData } from "./block-generator"
export type { ProgramAST, SpriteAST, ScriptAST } from "./ast-types"

// 便利関数: 疑似コード文字列 → BlockProjectData マップ
export function pseudocodeToBlockData(
  source: string
): Record<string, BlockProjectData> {
  const ast = parsePseudocode(source)
  return generateBlockData(ast)
}
```

---

## `sprites.ts` の書き換え

手書きの `buildPlayerBlocks()` 等を削除し、疑似コードベースに:

```typescript
import { pseudocodeToBlockData } from "@/features/editor/codegen"

const DEMO_PSEUDOCODE = `
sprite "プレイヤー" {
  on flagClicked {
    setPhysics("dynamic")
    setGravity(1000)
    goto(-600, -204)
    setBounce(0.1)
    setCollideWorldBounds(on)
    score = 0
    hp = 100
    addText("SCORE: 0", -800, 480)
  }
  on flagClicked {
    while (true) {
      if (isKeyPressed("left arrow")) {
        setVelocityX(-250)
      } else {
        if (isKeyPressed("right arrow")) {
          setVelocityX(250)
        } else {
          setVelocityX(0)
        }
      }
      if (isKeyPressed("up arrow") && isOnGround()) {
        setVelocityY(-550)
      }
    }
  }
  // ... 他のスクリプト
}

sprite "地面" {
  on flagClicked {
    setPhysics("static")
    goto(0, -380)
  }
}
// ... 他のスプライト
`

const DEFAULT_BLOCK_DATA = pseudocodeToBlockData(DEMO_PSEUDOCODE)
```

---

## 実装順序

| ステップ | ファイル | 内容 | 見積もり |
|---------|---------|------|---------|
| 1 | `ast-types.ts` | AST 型定義 | 小 |
| 2 | `pseudocode-parser.ts` | トークナイザー + 再帰降下パーサー | 大 |
| 3 | `block-generator.ts` | AST → SerializedBlockNode[] 変換 | 大 |
| 4 | `index.ts` | エントリポイント | 小 |
| 5 | `sprites.ts` | デモデータを疑似コードベースに書き換え | 中 |
| 6 | テスト | パーサー + ジェネレーターの単体テスト | 中 |

## 検証方法

1. `bun test` — パーサーとジェネレーターのテスト
2. `npx tsc --noEmit` — 型チェック
3. ブラウザで `/editor` → 旗を押す → 従来と同じ動作（回帰テスト）
4. デバッグパネルの疑似コード表示 → 入力した疑似コードと一致（ラウンドトリップ確認）
