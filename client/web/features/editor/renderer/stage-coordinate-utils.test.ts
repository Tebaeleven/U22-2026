// @ts-expect-error Bun のテストランナー上でのみ解決される
import { describe, expect, test } from "bun:test"
import {
  directionToStageVector,
  phaserToStagePoint,
  phaserToStageVector,
  stageToPhaserPoint,
  stageToPhaserVector,
} from "./stage-coordinate-utils"

describe("stage-coordinate-utils", () => {
  test("ステージ座標と Phaser 座標を相互変換できる", () => {
    const phaser = stageToPhaserPoint(120, 80)
    expect(phaserToStagePoint(phaser.x, phaser.y)).toEqual({ x: 120, y: 80 })
  })

  test("速度ベクトルは Y 方向の符号だけを反転する", () => {
    expect(stageToPhaserVector(25, 40)).toEqual({ x: 25, y: -40 })
    expect(phaserToStageVector(25, -40)).toEqual({ x: 25, y: 40 })
  })

  test("direction は Scratch 系の角度規約で解決する", () => {
    const up = directionToStageVector(0, 10)
    expect(up.x).toBeCloseTo(0)
    expect(up.y).toBeCloseTo(10)

    const right = directionToStageVector(90, 10)
    expect(right.x).toBeCloseTo(10)
    expect(right.y).toBeCloseTo(0)

    const down = directionToStageVector(180, 10)
    expect(down.x).toBeCloseTo(0)
    expect(down.y).toBeCloseTo(-10)

    const left = directionToStageVector(270, 10)
    expect(left.x).toBeCloseTo(-10)
    expect(left.y).toBeCloseTo(0)
  })
})
