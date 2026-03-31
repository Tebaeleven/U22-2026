// codegen エントリポイント

export { parsePseudocode } from "./pseudocode-parser"
export { parseClassCode } from "./class-parser"
export { validateClassProgram } from "./class-validator"
export { classASTToLegacyAST, classASTToSemanticIR } from "./ast-converter"
export { generateBlockData, generateBlockDataFromIR } from "./block-generator"
export type { ProgramAST, SpriteAST, ScriptAST, SemanticProgramIR, SemanticSpriteIR, SemanticScriptIR } from "./ast-types"
export type { ClassProgramAST, ClassAST, MethodAST, MethodKind } from "./class-ast-types"

import type { BlockProjectData } from "../block-editor/types"
import { parsePseudocode } from "./pseudocode-parser"
import { parseClassCode } from "./class-parser"
import { validateClassProgram } from "./class-validator"
import { classASTToSemanticIR } from "./ast-converter"
import { generateBlockData, generateBlockDataFromIR } from "./block-generator"

export type CodegenOptions = {
  validateClassProgram?: boolean
}

/** 疑似コード文字列 → スプライト名ごとの BlockProjectData マップ */
export function pseudocodeToBlockData(
  source: string,
): Record<string, BlockProjectData> {
  const ast = parsePseudocode(source)
  return generateBlockData(ast)
}

/** クラスベース疑似コード → スプライト名ごとの BlockProjectData マップ */
export function classCodeToBlockData(
  source: string,
  options?: CodegenOptions,
): Record<string, BlockProjectData> {
  const classAST = parseClassCode(source)
  if (options?.validateClassProgram !== false) {
    validateClassProgram(classAST)
  }
  const semanticIR = classASTToSemanticIR(classAST)
  return generateBlockDataFromIR(semanticIR)
}

/** 自動判定: class キーワードが含まれればクラスベース、それ以外は旧形式で解析 */
export function codeToBlockData(
  source: string,
  options?: CodegenOptions,
): Record<string, BlockProjectData> {
  // コメント行と空行を除去してから判定
  const firstCode = source
    .split("\n")
    .map(l => l.trim())
    .find(l => l.length > 0 && !l.startsWith("//"))
  if (firstCode?.startsWith("class ")) {
    return classCodeToBlockData(source, options)
  }
  return pseudocodeToBlockData(source)
}
