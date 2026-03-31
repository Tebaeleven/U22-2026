// @ts-expect-error Bun のテストランナー上でのみ解決される
import { describe, expect, test } from "bun:test"
import { resolveSample, SAMPLE_PROJECTS } from "./index"
import {
  CERTIFIED_SAMPLE_IDS,
  CERTIFIED_SAMPLE_MANIFESTS,
  PHYSICS_CERTIFIED_SAMPLE_IDS,
  PHYSICS_CERTIFIED_SAMPLE_MANIFESTS,
} from "./certification"

describe("sample resolution", () => {
  test("全81サンプルを strict v2 で blockData へ解決できる", () => {
    expect(SAMPLE_PROJECTS).toHaveLength(81)

    for (const sample of SAMPLE_PROJECTS) {
      const resolved = resolveSample(sample)
      expect(resolved.sprites.length).toBeGreaterThan(0)
      for (const sprite of resolved.sprites) {
        expect(resolved.blockDataMap[sprite.id]).toBeDefined()
      }
    }
  })

  test("重点サンプルの certification manifest を満たす", () => {
    expect(CERTIFIED_SAMPLE_MANIFESTS).toHaveLength(5)

    for (const manifest of CERTIFIED_SAMPLE_MANIFESTS) {
      const sample = SAMPLE_PROJECTS.find((entry) => entry.id === manifest.id)
      expect(sample).toBeDefined()
      if (!sample) continue

      expect(CERTIFIED_SAMPLE_IDS.has(sample.id)).toBe(true)
      expect(sample.sprites.map((sprite) => sprite.name)).toEqual(manifest.expectedSprites)

      const soundNames = sample.sprites.flatMap((sprite) => sprite.sounds?.map((sound) => sound.name) ?? [])
      for (const soundName of manifest.requiredSoundNames) {
        expect(soundNames).toContain(soundName)
      }

      for (const spriteName of manifest.requiredAssetSpriteNames) {
        const sprite = sample.sprites.find((entry) => entry.name === spriteName)
        expect(sprite).toBeDefined()
        expect(sprite?.costumes.some((costume) => costume.dataUrl.startsWith("/assets/samples/"))).toBe(true)
      }

      for (const snippet of manifest.requiredPseudocodeSnippets) {
        expect(sample.pseudocode).toContain(snippet)
      }

      const resolved = resolveSample(sample)
      for (const sprite of resolved.sprites) {
        expect(resolved.blockDataMap[sprite.id]).toBeDefined()
      }
    }
  })

  test("physics 重点サンプルの certification manifest を満たす", () => {
    expect(PHYSICS_CERTIFIED_SAMPLE_MANIFESTS).toHaveLength(8)

    for (const manifest of PHYSICS_CERTIFIED_SAMPLE_MANIFESTS) {
      const sample = SAMPLE_PROJECTS.find((entry) => entry.id === manifest.id)
      expect(sample).toBeDefined()
      if (!sample) continue

      expect(PHYSICS_CERTIFIED_SAMPLE_IDS.has(sample.id)).toBe(true)
      expect(sample.sprites.map((sprite) => sprite.name)).toEqual(manifest.expectedSprites)

      for (const snippet of manifest.requiredPseudocodeSnippets) {
        expect(sample.pseudocode).toContain(snippet)
      }

      const resolved = resolveSample(sample)
      for (const sprite of resolved.sprites) {
        expect(resolved.blockDataMap[sprite.id]).toBeDefined()
      }
    }
  })
})
