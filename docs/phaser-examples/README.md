# Phaser 3.85.0 サンプルコード集（Tier 1）

ゲーム開発の核となるカテゴリのサンプルコードを収集・整理したドキュメント。
ソース: https://phaser.io/examples/v3.85.0 (MIT License)

## ファイル一覧

| ファイル | カテゴリ | サンプル数 | 内容 |
|---------|---------|-----------|------|
| [physics-arcade.md](physics-arcade.md) | Physics - Arcade | 78 | 移動、衝突、重力、弾丸、プラットフォーマー、トップダウンシューター等 |
| [input.md](input.md) | Input | 30 | キーボード(12)、マウス(9)、ドラッグ(8)、ゲームパッド(2) |
| [animation.md](animation.md) | Animation | 35 | アニメーション作成、フレーム生成、再生制御、イベント、演出 |
| [sprites.md](sprites.md) | Sprites | 8 | スプライトの基本操作、回転、透明度、カスタムクラス |
| [games.md](games.md) | Games | 18 | Breakout、First Game（プラットフォーマー）、Snake |
| [tilemap-collision.md](tilemap-collision.md) | Tilemap Collision | 12 | Arcade/Matter物理でのタイルマップ衝突判定 |

**合計: 181サンプル / 14,888行**

## カテゴリ詳細

### physics-arcade.md
- 基本操作 / 移動・速度 / ターゲット追従 / 衝突判定 / オーバーラップ
- 物理プロパティ / ワールド境界 / 弾丸・シューティング / プラットフォーマー
- ダイレクトコントロール / トップダウンシューター / その他

### input.md
- Keyboard: カーソルキー、キー登録、JustDown、コンボ、テキスト入力
- Mouse: クリック、ホイール、ポインターロック、右クリック
- Dragging: ドラッグ有効化、軸制限、グリッドスナップ、カード操作
- Gamepad: D-Pad、アナログスティック

### animation.md
- アニメーション作成（スプライトシート、アトラス、PNG連番、Aseprite）
- フレーム生成 / 再生制御（チェーン、ミックス、リバース、ヨーヨー）
- イベント（完了、リピート、アップデート） / 表示・演出

### games.md
- Breakout: 完成版ブロック崩しゲーム
- First Game: プラットフォーマーの段階的チュートリアル（Part 8-10）
- Snake: スネークゲームの段階的チュートリアル（Part 1-7）

### tilemap-collision.md
- Arcade Physics: CSVマップ、カスタムコールバック、複数タイルサイズ
- Matter Physics: タイルボディ破壊、壁ジャンプ、ゴーストコリジョン

## 今後の予定（Tier 2, 3）

未収集のカテゴリ:
- **Tier 2**: tweens, camera, text, particle-emitter, graphics, physics/matterjs, timeline, paths/followers
- **Tier 3**: display (masks/shaders/tint/blend-modes), fx, transform, depth-sorting, geom, math, scenes, textures, actions, events, audio
