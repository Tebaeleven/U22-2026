import { STAGE_HEIGHT, STAGE_WIDTH } from "../engine/types"

export function stageToPhaserPoint(x: number, y: number) {
  return {
    x: STAGE_WIDTH / 2 + x,
    y: STAGE_HEIGHT / 2 - y,
  }
}

export function phaserToStagePoint(x: number, y: number) {
  return {
    x: x - STAGE_WIDTH / 2,
    y: STAGE_HEIGHT / 2 - y,
  }
}

export function stageToPhaserVector(x: number, y: number) {
  return {
    x,
    y: -y,
  }
}

export function phaserToStageVector(x: number, y: number) {
  return {
    x,
    y: -y,
  }
}

export function directionToStageVector(direction: number, speed: number) {
  const radians = ((90 - direction) * Math.PI) / 180
  return {
    x: speed * Math.cos(radians),
    y: speed * Math.sin(radians),
  }
}
