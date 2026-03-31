import type { BlockArgs, BlockUtil } from "../types"

/**
 * オーディオプリミティブ
 * Web Audio API を使用してブラウザ上でサウンドを再生する。
 * アセットは事前にロードせず、組み込みのオシレーターベースで生成する。
 */

const audioCtx = typeof AudioContext !== "undefined" ? new AudioContext() : null
const activeOscillators = new Map<string, { osc: OscillatorNode; gain: GainNode }>()
const volumes = new Map<string, number>()

/** 組み込みサウンドの定義 */
const BUILTIN_SOUNDS: Record<string, { freq: number; duration: number; type: OscillatorType }> = {
  beep: { freq: 440, duration: 0.2, type: "sine" },
  coin: { freq: 880, duration: 0.15, type: "square" },
  jump: { freq: 300, duration: 0.1, type: "sawtooth" },
  hit: { freq: 150, duration: 0.3, type: "triangle" },
  laser: { freq: 1200, duration: 0.1, type: "sawtooth" },
  powerup: { freq: 600, duration: 0.3, type: "sine" },
  explosion: { freq: 80, duration: 0.5, type: "sawtooth" },
}

function playTone(name: string, loop: boolean) {
  if (!audioCtx) return
  if (audioCtx.state === "suspended") audioCtx.resume()

  // 既に再生中なら停止
  stopTone(name)

  const def = BUILTIN_SOUNDS[name] ?? BUILTIN_SOUNDS.beep
  const vol = volumes.get(name) ?? 0.3

  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = def.type
  osc.frequency.value = def.freq
  gain.gain.value = vol
  osc.connect(gain)
  gain.connect(audioCtx.destination)

  osc.start()

  if (loop) {
    activeOscillators.set(name, { osc, gain })
  } else {
    // フェードアウトして停止
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + def.duration)
    osc.stop(audioCtx.currentTime + def.duration + 0.01)
  }
}

function stopTone(name: string) {
  const entry = activeOscillators.get(name)
  if (entry) {
    entry.osc.stop()
    activeOscillators.delete(name)
  }
}

function resolveVolumePercent(args: BlockArgs) {
  return Math.max(0, Math.min(100, Number(args.VOL ?? 50))) / 100
}

/** 効果音を再生 */
export function sound_play(args: BlockArgs, util: BlockUtil) {
  const name = String(args.SOUND ?? "beep")
  const sprite = util.getSprite()
  const scene = util.getScene()
  if (scene?.playSpriteSound(sprite.id, name, { loop: false })) {
    return
  }
  playTone(name, false)
}

/** BGMをループ再生 */
export function sound_playloop(args: BlockArgs, util: BlockUtil) {
  const name = String(args.SOUND ?? "beep")
  const sprite = util.getSprite()
  const scene = util.getScene()
  if (scene?.playSpriteSound(sprite.id, name, { loop: true })) {
    return
  }
  playTone(name, true)
}

/** サウンドを停止 */
export function sound_stop(args: BlockArgs, util: BlockUtil) {
  const name = String(args.SOUND ?? "beep")
  const sprite = util.getSprite()
  util.getScene()?.stopSpriteSound(sprite.id, name)
  stopTone(name)
}

/** 音量を設定 (0-100) */
export function sound_setvolume(args: BlockArgs, util: BlockUtil) {
  const name = String(args.SOUND ?? "beep")
  const vol = resolveVolumePercent(args)
  volumes.set(name, vol)
  const entry = activeOscillators.get(name)
  if (entry) entry.gain.gain.value = vol
  const sprite = util.getSprite()
  util.getScene()?.setSpriteSoundVolume(sprite.id, name, vol)
}
