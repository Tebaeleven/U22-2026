// サンプル統合エントリポイント
// Phaser公式と同様にカテゴリ別に整理

export type { SampleProject } from "./_helpers"
export { resolveSample } from "./_helpers"

// ── 単機能 Examples ──
import { bounceBalls } from "./physics/bounce-balls"
import { platformerBasic } from "./physics/platformer-basic"
import { velocityControl } from "./physics/velocity-control"
import { asteroidsMovement } from "./physics/asteroids-movement"
import { dragonMovement } from "./physics/dragon-movement"
import { racecar } from "./physics/racecar"
import { gravityDemo } from "./physics/gravity-demo"
import { bounceTest } from "./physics/bounce-test"
import { dragDemo } from "./physics/drag-demo"
import { massDemo } from "./physics/mass-demo"
import { immovableBody } from "./physics/immovable-body"
import { nonPushable } from "./physics/non-pushable"
import { worldWrapDemo } from "./physics/world-wrap-demo"
import { moveToTarget } from "./physics/move-to-target"
import { rotateToPointer } from "./physics/rotate-to-pointer"
import { bulletsGroup } from "./physics/bullets-group"
import { collisionEvents } from "./physics/collision-events"
import { spriteVsSprite } from "./physics/sprite-vs-sprite"
import { directControl } from "./physics/direct-control"
import { stickyPlatform } from "./physics/sticky-platform"
import { rollingBody } from "./physics/rolling-body"
import { randomVelocity } from "./physics/random-velocity"
import { maxSpeedDemo } from "./physics/max-speed-demo"
import { angularDemo } from "./physics/angular-demo"
import { cameraFollow } from "./camera/camera-follow"
import { cameraEffects } from "./camera/camera-effects"
import { cameraZoomScroll } from "./camera/camera-zoom-scroll"
import { cameraShakeHit } from "./camera/camera-shake-hit"
import { tweenProperties } from "./tweens/tween-properties"
import { tweenChain } from "./tweens/tween-chain"
import { tweenBounce } from "./tweens/tween-bounce"
import { tweenFadeInOut } from "./tweens/tween-fade-in-out"
import { particleBurst } from "./particles/particle-burst"
import { particleTrail } from "./particles/particle-trail"
import { particleExplosion } from "./particles/particle-explosion"
import { intervalSpawner } from "./timer/interval-spawner"
import { chaseEnemy } from "./math/chase-enemy"
import { orbitMotion } from "./math/orbit-motion"
import { distanceSensor } from "./math/distance-sensor"
import { soundEffects } from "./sound/sound-effects"
import { soundGame } from "./sound/sound-game"
import { cursorKeys } from "./input/cursor-keys"
import { justDown } from "./input/just-down"
import { clickSprite } from "./input/click-sprite"
import { mouseFollow } from "./input/mouse-follow"
import { mouseWheelZoom } from "./input/mouse-wheel-zoom"
import { enableDragDemo } from "./input/enable-drag"
import { dragAndDrop } from "./input/drag-and-drop"
import { wasdMovement } from "./input/wasd-movement"
import { mouseAim } from "./input/mouse-aim"
import { clickToMove } from "./input/click-to-move"
import { costumeAnim } from "./animation/costume-anim"
import { animEvents } from "./animation/anim-events"
import { multiAnim } from "./animation/multi-anim"
import { tweenCombo } from "./animation/tween-combo"

// ── モダン言語拡張サンプル ──
import { forEachDemo } from "./control/for-each-demo"
import { stateMachineDemo } from "./control/state-machine-demo"
import { spawnDemo } from "./control/spawn-demo"
import { saveLoadDemo } from "./control/save-load-demo"
import { tagGroupDemo } from "./control/tag-group-demo"
import { liveVariableDemo } from "./control/live-variable-demo"
import { lerpClampDemo } from "./math/lerp-clamp-demo"
import { stringOpsDemo } from "./math/string-ops-demo"
import { mathFunctionsDemo } from "./math/math-functions-demo"

// ── 統合ゲーム（個別ファイル） ──
import { beginnerGame } from "./games/beginner"
import { breakoutGame } from "./games/breakout"
import { spaceShooterGame } from "./games/space-shooter"
import { endlessRunnerGame } from "./games/endless-runner"
import { snakeGame } from "./games/snake"
import { topdownActionGame } from "./games/topdown-action"
import { pongGame } from "./games/pong"
import { asteroidGame } from "./games/asteroid-game"
import { topdownRpg } from "./games/topdown-rpg"
import { firstGame } from "./games/first-game"
import { flappyBird } from "./games/flappy-bird"
import { emojiMatchGame } from "./games/emoji-match"
import { mathChallengeGame } from "./games/math-challenge"
import { sokobanGame } from "./games/sokoban"
import { marsExplorerGame } from "./games/mars-explorer"
import { waveShooterGame } from "./games/wave-shooter"
import { wallBreakerGame } from "./games/wall-breaker"

import type { SampleProject } from "./_helpers"

/** カテゴリ定義 */
export interface SampleCategory {
  id: string
  name: string
  description: string
  samples: SampleProject[]
}

/** 全カテゴリ */
export const SAMPLE_CATEGORIES: SampleCategory[] = [
  {
    id: "physics",
    name: "Physics",
    description: "重力・衝突・バウンド・速度制御",
    samples: [bounceBalls, platformerBasic, velocityControl, asteroidsMovement, dragonMovement, racecar, gravityDemo, bounceTest, dragDemo, massDemo, immovableBody, nonPushable, worldWrapDemo, moveToTarget, rotateToPointer, bulletsGroup, collisionEvents, spriteVsSprite, directControl, stickyPlatform, rollingBody, randomVelocity, maxSpeedDemo, angularDemo],
  },
  {
    id: "camera",
    name: "Camera",
    description: "カメラ追従・シェイク・ズーム・フェード",
    samples: [cameraFollow, cameraEffects, cameraZoomScroll, cameraShakeHit],
  },
  {
    id: "tweens",
    name: "Tweens",
    description: "スケール・透明度・角度のアニメーション",
    samples: [tweenProperties, tweenChain, tweenBounce, tweenFadeInOut],
  },
  {
    id: "particles",
    name: "Particles",
    description: "パーティクルエフェクト",
    samples: [particleBurst, particleTrail, particleExplosion],
  },
  {
    id: "timer",
    name: "Timer",
    description: "インターバル・タイムアウト",
    samples: [intervalSpawner],
  },
  {
    id: "input",
    name: "Input",
    description: "キーボード・マウス・ドラッグ操作",
    samples: [cursorKeys, justDown, clickSprite, mouseFollow, mouseWheelZoom, enableDragDemo, dragAndDrop, wasdMovement, mouseAim, clickToMove],
  },
  {
    id: "animation",
    name: "Animation",
    description: "コスチューム・Tweenアニメーション",
    samples: [costumeAnim, animEvents, multiAnim, tweenCombo],
  },
  {
    id: "math",
    name: "Math",
    description: "角度・距離・三角関数・補間・文字列",
    samples: [chaseEnemy, orbitMotion, distanceSensor, lerpClampDemo, mathFunctionsDemo, stringOpsDemo],
  },
  {
    id: "control-advanced",
    name: "Advanced Control",
    description: "状態マシン・forEach・spawn・タグ・セーブ",
    samples: [forEachDemo, stateMachineDemo, spawnDemo, tagGroupDemo, saveLoadDemo, liveVariableDemo],
  },
  {
    id: "sound",
    name: "Sound",
    description: "効果音・BGM・サウンド制御",
    samples: [soundEffects, soundGame],
  },
  {
    id: "games",
    name: "Games",
    description: "複数機能を組み合わせた完成ゲーム",
    samples: [
      beginnerGame,
      breakoutGame,
      spaceShooterGame,
      endlessRunnerGame,
      snakeGame,
      topdownActionGame,
      pongGame,
      asteroidGame,
      topdownRpg,
      firstGame,
      flappyBird,
      emojiMatchGame,
      mathChallengeGame,
      sokobanGame,
      marsExplorerGame,
      waveShooterGame,
      wallBreakerGame,
    ],
  },
]

/** 後方互換: フラットなサンプル一覧 */
export const SAMPLE_PROJECTS: SampleProject[] =
  SAMPLE_CATEGORIES.flatMap((c) => c.samples)
