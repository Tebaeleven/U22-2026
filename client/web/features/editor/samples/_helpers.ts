// サンプル共通ヘルパー

import type { SpriteDef } from "../constants"
import { DEFAULT_COLLIDER, createRectCostume } from "../constants"
import type { BlockProjectData } from "../block-editor/types"
import { codeToBlockData } from "../codegen"

export type SampleProject = {
  id: string
  name: string
  description: string
  /** カテゴリ（フォルダ名に対応） */
  category: string
  sprites: SpriteDef[]
  pseudocode: string
}

/** スプライト定義の簡易ファクトリ */
export function sp(
  id: string, name: string, emoji: string,
  costume: { w: number; h: number; color: string; radius?: number; border?: string },
  pos: { x: number; y: number },
  extra?: Partial<SpriteDef>,
): SpriteDef {
  return {
    id, name, emoji,
    costumes: [createRectCostume(name, costume.w, costume.h, costume.color, {
      borderRadius: costume.radius ?? 0,
      borderColor: costume.border,
      borderWidth: costume.border ? 2 : undefined,
    })],
    currentCostumeIndex: 0,
    collider: { ...DEFAULT_COLLIDER },
    x: pos.x, y: pos.y,
    size: 100, direction: 90, visible: true,
    ...extra,
  }
}

/** 疑似コードからBlockProjectDataマップを生成 */
export function buildBlockDataMap(
  sprites: SpriteDef[],
  pseudocode: string,
): Record<string, BlockProjectData> {
  const generated = codeToBlockData(pseudocode)
  const map: Record<string, BlockProjectData> = {}
  for (const sprite of sprites) {
    map[sprite.id] = generated[sprite.name] ?? {
      customProcedures: [],
      workspace: { blocks: [] },
    }
  }
  return map
}

/** サンプルを読み込み可能な形式に変換 */
export function resolveSample(sample: SampleProject): {
  sprites: SpriteDef[]
  blockDataMap: Record<string, BlockProjectData>
} {
  return {
    sprites: sample.sprites,
    blockDataMap: buildBlockDataMap(sample.sprites, sample.pseudocode),
  }
}
