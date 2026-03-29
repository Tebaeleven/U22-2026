// クラスベース疑似コードの AST 型定義

import type { StatementNode } from "./ast-types"

/** クラスベースのプログラム全体 = クラスの配列 */
export type ClassProgramAST = ClassAST[]

/** 1クラス = 1スプライト */
export type ClassAST = {
  name: string
  methods: MethodAST[]
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
