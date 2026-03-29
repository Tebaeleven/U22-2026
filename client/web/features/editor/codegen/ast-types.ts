// 疑似コードの AST 型定義

/** プログラム全体 = スプライトの配列 */
export type ProgramAST = SpriteAST[]

export type SpriteAST = {
  name: string
  scripts: ScriptAST[]
  variables?: string[]
}

export type ScriptAST = {
  hat: HatNode
  body: StatementNode[]
}

// ── ハットブロック ──

export type HatNode =
  | { type: "flagClicked" }
  | { type: "keyPress"; key: string }
  | { type: "clone" }
  | { type: "touched"; target: string }
  | { type: "event"; name: string }
  | { type: "varChange"; variable: string }

// ── 文（スタックブロック） ──

export type StatementNode =
  | { type: "call"; name: string; args: ExprNode[] }
  | { type: "assign"; variable: string; value: ExprNode }
  | { type: "changeBy"; variable: string; value: ExprNode }
  | { type: "if"; condition: ExprNode; body: StatementNode[] }
  | { type: "ifElse"; condition: ExprNode; ifBody: StatementNode[]; elseBody: StatementNode[] }
  | { type: "while"; condition: ExprNode; body: StatementNode[] }
  | { type: "repeat"; times: ExprNode; body: StatementNode[] }
  | { type: "forever"; body: StatementNode[] }
  | { type: "for"; variable: string; from: ExprNode; to: ExprNode; body: StatementNode[] }
  | { type: "forEach"; variable: string; list: string; body: StatementNode[] }
  | { type: "spawn"; body: StatementNode[] }
  | { type: "break" }
  | { type: "continue" }
  | { type: "return"; value: ExprNode }

// ── 式（レポーター/値） ──

export type ExprNode =
  | { type: "number"; value: number }
  | { type: "string"; value: string }
  | { type: "boolean"; value: boolean }
  | { type: "variable"; name: string }
  | { type: "call"; name: string; args: ExprNode[] }
  | { type: "binary"; op: string; left: ExprNode; right: ExprNode }
  | { type: "unary"; op: string; operand: ExprNode }
  | { type: "property"; object: string; property: string }
