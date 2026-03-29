// サンプル共通ヘルパー

import type { SpriteDef, Costume, SoundDef } from "../constants"
import { DEFAULT_COLLIDER, createRectCostume } from "../constants"
import type { BlockProjectData } from "../block-editor/types"
import { codeToBlockData } from "../codegen"

let _urlCostumeSeq = 0
/** URL指定のコスチューム（public/ 配下の画像ファイルを直接参照） */
export function createUrlCostume(
  name: string, url: string, width: number, height: number,
): Costume {
  return { id: `url-costume-${++_urlCostumeSeq}`, name, dataUrl: url, width, height }
}

let _soundSeq = 0
/** URL指定のサウンド定義 */
export function snd(name: string, url: string): SoundDef {
  return { id: `snd-${++_soundSeq}`, name, dataUrl: url }
}

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
