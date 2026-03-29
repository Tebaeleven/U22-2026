// ClassProgramAST → ProgramAST 変換レイヤー

import type { ProgramAST, ScriptAST, HatNode, StatementNode, ExprNode } from "./ast-types"
import type { ClassProgramAST, ClassAST, MethodAST, MethodKind } from "./class-ast-types"

/** ClassProgramAST を既存の ProgramAST に変換する */
export function classASTToLegacyAST(program: ClassProgramAST): ProgramAST {
  return program.map(cls => classToSprite(cls))
}

function classToSprite(cls: ClassAST): ProgramAST[number] {
  const variables = new Set<string>()
  for (const method of cls.methods) {
    collectVariables(method.body, variables)
  }

  return {
    name: cls.name,
    variables: variables.size > 0 ? [...variables] : undefined,
    scripts: cls.methods.map(m => methodToScript(m)),
  }
}

function methodToScript(method: MethodAST): ScriptAST {
  const hat = methodKindToHat(method.kind)
  // onUpdate は forever でラップして毎フレーム実行にする
  const body: StatementNode[] = method.kind.type === "onUpdate"
    ? [{ type: "forever", body: method.body }]
    : method.body

  return { hat, body }
}

function methodKindToHat(kind: MethodKind): HatNode {
  switch (kind.type) {
    case "onCreate":
      return { type: "flagClicked" }
    case "onUpdate":
      return { type: "flagClicked" }
    case "onKeyPress":
      return { type: "keyPress", key: kind.key }
    case "onClone":
      return { type: "clone" }
    case "onTouched":
      return { type: "touched", target: kind.target }
    case "onEvent":
      return { type: "event", name: kind.name }
    case "onVarChange":
      return { type: "varChange", variable: kind.variable }
  }
}

// ── 変数名の収集 ──

/** StatementNode の再帰走査で代入・変更される変数名を収集する */
function collectVariables(stmts: StatementNode[], vars: Set<string>): void {
  for (const stmt of stmts) {
    collectFromStatement(stmt, vars)
  }
}

function collectFromStatement(stmt: StatementNode, vars: Set<string>): void {
  switch (stmt.type) {
    case "assign":
      vars.add(stmt.variable)
      break
    case "changeBy":
      vars.add(stmt.variable)
      break
    case "if":
      collectVariables(stmt.body, vars)
      break
    case "ifElse":
      collectVariables(stmt.ifBody, vars)
      collectVariables(stmt.elseBody, vars)
      break
    case "while":
    case "repeat":
    case "forever":
      collectVariables(stmt.body, vars)
      break
    case "for":
      collectVariables(stmt.body, vars)
      break
    case "call":
    case "return":
      break
  }
}
