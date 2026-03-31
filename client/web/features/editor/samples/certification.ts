export type CertifiedSampleManifest = {
  id: string
  expectedSprites: string[]
  requiredSoundNames: string[]
  requiredAssetSpriteNames: string[]
  requiredPseudocodeSnippets: string[]
}

export type PhysicsCertifiedSampleManifest = {
  id: string
  expectedSprites: string[]
  requiredPseudocodeSnippets: string[]
}

export const CERTIFIED_SAMPLE_MANIFESTS: CertifiedSampleManifest[] = [
  {
    id: "breakout",
    expectedSprites: ["パドル", "ボール", "ブリック", "HUD"],
    requiredSoundNames: [],
    requiredAssetSpriteNames: [],
    requiredPseudocodeSnippets: [
      'onTouched("ブリック")',
      'onTouched("ボール")',
      "this.broken = 1",
      'this.emit("brick-destroyed", "")',
    ],
  },
  {
    id: "wall-breaker",
    expectedSprites: ["プレイヤー", "ハンマー", "ブリック", "コウモリ", "コイン", "地面", "足場", "HUD"],
    requiredSoundNames: ["jump", "stone", "kill", "coin"],
    requiredAssetSpriteNames: ["プレイヤー", "ハンマー", "ブリック", "コウモリ", "コイン"],
    requiredPseudocodeSnippets: [
      'onEvent("attack")',
      'this.emit("brick-hit", "")',
      'this.emit("spawn-coin", "")',
    ],
  },
  {
    id: "mars-explorer",
    expectedSprites: ["探検家", "壁", "酸素タンク", "ドローン", "穴", "出口", "HUD"],
    requiredSoundNames: ["oxygen", "kill"],
    requiredAssetSpriteNames: ["探検家", "ドローン", "穴"],
    requiredPseudocodeSnippets: [
      'onTouched("酸素タンク")',
      'onTouched("ドローン")',
      'onTouched("出口")',
    ],
  },
  {
    id: "wave-shooter",
    expectedSprites: ["プレイヤー", "自弾", "敵", "敵弾", "パワーアップ", "HUD"],
    requiredSoundNames: ["shot", "explosion", "destroy", "wave-clear"],
    requiredAssetSpriteNames: ["プレイヤー", "敵"],
    requiredPseudocodeSnippets: [
      'onEvent("start-wave")',
      'onEvent("enemy-killed")',
      'onEvent("wave-clear")',
    ],
  },
  {
    id: "sokoban",
    expectedSprites: ["プレイヤー", "箱1", "箱2", "箱3", "ゴール", "壁", "HUD"],
    requiredSoundNames: ["bump", "win"],
    requiredAssetSpriteNames: ["プレイヤー", "箱1", "箱2", "箱3", "ゴール"],
    requiredPseudocodeSnippets: [
      "this.setPushable(true)",
      'onEvent("goal-check")',
      'onEvent("all-clear")',
    ],
  },
]

export const CERTIFIED_SAMPLE_IDS = new Set(
  CERTIFIED_SAMPLE_MANIFESTS.map((manifest) => manifest.id)
)

export const PHYSICS_CERTIFIED_SAMPLE_MANIFESTS: PhysicsCertifiedSampleManifest[] = [
  {
    id: "physics-bounce-balls",
    expectedSprites: ["赤ボール", "青ボール", "緑ボール", "地面"],
    requiredPseudocodeSnippets: [
      'this.setPhysics("dynamic")',
      'this.setBounce(0.95)',
      'this.setPhysics("static")',
    ],
  },
  {
    id: "physics-gravity-demo",
    expectedSprites: ["軽いブロック", "重いブロック", "浮くブロック", "地面", "HUD"],
    requiredPseudocodeSnippets: [
      'this.setGravity(300)',
      'this.setGravity(900)',
      'this.setAllowGravity("off")',
    ],
  },
  {
    id: "physics-platformer-basic",
    expectedSprites: ["プレイヤー", "地面", "浮島1", "浮島2"],
    requiredPseudocodeSnippets: [
      "this.isOnGround()",
      "this.setVelocityY(550)",
      'this.setPhysics("static")',
    ],
  },
  {
    id: "beginner",
    expectedSprites: ["プレイヤー", "地面", "コイン"],
    requiredPseudocodeSnippets: [
      "this.isOnGround()",
      "this.setVelocityY(500)",
      'this.setPhysics("static")',
    ],
  },
  {
    id: "first-game",
    expectedSprites: ["プレイヤー", "地面", "浮島1", "浮島2", "浮島3", "スター", "ボム", "HUD"],
    requiredPseudocodeSnippets: [
      'onKeyPress("up arrow")',
      "this.isOnGround()",
      'this.setPhysics("static")',
    ],
  },
  {
    id: "physics-sticky-platform",
    expectedSprites: ["プレイヤー", "足場1", "足場2", "地面"],
    requiredPseudocodeSnippets: [
      'this.setImmovable("on")',
      'this.setAllowGravity("off")',
      "this.isOnGround()",
    ],
  },
  {
    id: "input-cursor-keys",
    expectedSprites: ["プレイヤー", "地面"],
    requiredPseudocodeSnippets: [
      'this.setPhysics("dynamic")',
      "this.setDrag(200, 200)",
      'this.setPhysics("static")',
    ],
  },
  {
    id: "wall-breaker",
    expectedSprites: ["プレイヤー", "ハンマー", "ブリック", "コウモリ", "コイン", "地面", "足場", "HUD"],
    requiredPseudocodeSnippets: [
      'onKeyPress("up arrow")',
      "this.isOnGround()",
      'this.setPhysics("static")',
    ],
  },
]

export const PHYSICS_CERTIFIED_SAMPLE_IDS = new Set(
  PHYSICS_CERTIFIED_SAMPLE_MANIFESTS.map((manifest) => manifest.id)
)
