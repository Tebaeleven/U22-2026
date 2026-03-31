// ClassProgramAST → SemanticProgramIR 変換レイヤー

import type { ProgramAST, SemanticProgramIR, ScriptAST, HatNode, StatementNode, ExprNode } from "./ast-types"
import type { ClassProgramAST, ClassAST, MethodAST, MethodKind } from "./class-ast-types"

/** ClassProgramAST を既存の ProgramAST に変換する */
export function classASTToLegacyAST(program: ClassProgramAST): ProgramAST {
  return program.map(cls => classToSprite(cls))
}

export function classASTToSemanticIR(program: ClassProgramAST): SemanticProgramIR {
  return classASTToLegacyAST(program)
}

function classToSprite(cls: ClassAST): ProgramAST[number] {
  const variables = new Set<string>()

  // フィールド宣言から変数を収集
  const fieldInits: StatementNode[] = []
  if (cls.fields) {
    for (const field of cls.fields) {
      variables.add(field.name)
      if (field.live) {
        // var live → liveAssign 文（ランタイムが式ブロックを保持して依存追跡する）
        fieldInits.push({ type: "liveAssign", variable: field.name, value: field.value })
      } else {
        fieldInits.push({ type: "assign", variable: field.name, value: field.value })
      }
    }
  }

  for (const method of cls.methods) {
    collectVariables(method.body, variables)
  }

  // onCreate メソッドの先頭にフィールド初期化を挿入
  const scripts: ScriptAST[] = []
  for (const method of cls.methods) {
    const generatedScripts = methodToScripts(method)

    if (method.kind.type === "onCreate" && fieldInits.length > 0) {
      generatedScripts[0].body = [...fieldInits, ...generatedScripts[0].body]
    }

    scripts.push(...generatedScripts)
  }

  // onCreate がない場合でもフィールド初期化が必要ならスクリプトを生成
  if (fieldInits.length > 0 && !cls.methods.some(m => m.kind.type === "onCreate")) {
    scripts.unshift({ hat: { type: "flagClicked" }, body: fieldInits })
  }

  return {
    name: cls.name,
    variables: variables.size > 0 ? [...variables] : undefined,
    scripts,
  }
}

function buildMethodBody(method: MethodAST): StatementNode[] {
  let body: StatementNode[]
  if (method.kind.type === "onUpdate") {
    body = [{ type: "forever", body: method.body }]
  } else if (method.kind.type === "onWatchOnce") {
    // upon: 条件成立時のみボディ実行 + 自動で監視停止
    body = [{
      type: "if",
      condition: method.kind.condition,
      body: [
        ...method.body,
        { type: "call", name: "unwatch", args: [{ type: "string", value: method.kind.variable }] },
      ],
    }]
  } else {
    body = method.body
  }

  return body
}

function methodToScripts(method: MethodAST): ScriptAST[] {
  const body = buildMethodBody(method)

  if (method.kind.type === "onUpdate") {
    return [
      { hat: { type: "flagClicked" }, body },
      { hat: { type: "clone" }, body: structuredClone(body) },
    ]
  }

  return [{ hat: methodKindToHat(method.kind), body }]
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
    case "onWatch":
      return { type: "liveWhen", variable: kind.variable }
    case "onWatchOnce":
      return { type: "liveUpon", variable: kind.variable }
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
    case "forEach":
      collectVariables(stmt.body, vars)
      break
    case "spawn":
      collectVariables(stmt.body, vars)
      break
    case "varDecl":
      vars.add(stmt.name)
      break
    case "liveAssign":
      vars.add(stmt.variable)
      break
    case "batch":
      collectVariables(stmt.body, vars)
      break
    case "break":
    case "continue":
    case "call":
    case "return":
      break
  }
}
