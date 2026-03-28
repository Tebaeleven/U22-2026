// codegen エントリポイント

export { parsePseudocode } from "./pseudocode-parser"
export { generateBlockData } from "./block-generator"
export type { ProgramAST, SpriteAST, ScriptAST } from "./ast-types"

import type { BlockProjectData } from "../block-editor/types"
import { parsePseudocode } from "./pseudocode-parser"
import { generateBlockData } from "./block-generator"

/** 疑似コード文字列 → スプライト名ごとの BlockProjectData マップ */
export function pseudocodeToBlockData(
  source: string,
): Record<string, BlockProjectData> {
  const ast = parsePseudocode(source)
  return generateBlockData(ast)
}
