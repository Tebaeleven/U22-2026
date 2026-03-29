// クラスベース疑似コードの AST 型定義

import type { StatementNode, ExprNode } from "./ast-types"

/** クラスベースのプログラム全体 = クラスの配列 */
export type ClassProgramAST = ClassAST[]

/** 1クラス = 1スプライト */
export type ClassAST = {
  name: string
  fields?: FieldDecl[]
  methods: MethodAST[]
}

/** クラスフィールド宣言（var / let / var live） */
export type FieldDecl = {
  name: string
  value: ExprNode
  mutable: boolean
  live?: boolean
}

/** クラス内のメソッド定義 */
export type MethodAST = {
  kind: MethodKind
  body: StatementNode[]
}

/** メソッドの種別（ブロックのハットに対応） */
export type MethodKind =
  | { type: "onCreate" }
  | { type: "onUpdate" }
  | { type: "onKeyPress"; key: string }
  | { type: "onClone" }
  | { type: "onTouched"; target: string }
  | { type: "onEvent"; name: string }
  | { type: "onVarChange"; variable: string }
  | { type: "onWatch"; variable: string }
  | { type: "onWatchOnce"; variable: string; condition: ExprNode }
