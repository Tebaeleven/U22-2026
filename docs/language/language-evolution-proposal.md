# 自作言語の進化プラン：ゲーム開発特化言語への道

## 目次

1. [現在の自作言語の棚卸し](#1-現在の自作言語の棚卸し)
2. [ゲーム開発言語の最新トレンド調査](#2-ゲーム開発言語の最新トレンド調査)
3. [自作言語に取り入れるべき機能提案](#3-自作言語に取り入れるべき機能提案)
4. [実装ロードマップ](#4-実装ロードマップ)

---

## 1. 現在の自作言語の棚卸し

### 基本構造

- **1クラス = 1スプライト**。クラスベースのイベント駆動言語
- **7種のイベントメソッド**: `onCreate`, `onUpdate`, `onKeyPress`, `onClone`, `onTouched`, `onEvent`, `onVarChange`
- **動的型付け**。変数宣言キーワードなし（初回代入で暗黙生成）
- **ブロックエディタとの双方向変換**が前提

### 現在サポートしている構文

```javascript
class スプライト名 {
  onCreate() {
    this.x = 100            // プロパティ代入
    this.score = 0           // 暗黙的な変数生成
    myLocal = 42             // ローカル変数（宣言なし）
    this.score += 1          // 複合代入（+=のみ）
  }
  onUpdate() {
    if (condition) { } else if (condition) { } else { }
    while (condition) { }
    repeat (10) { }
    for (i in 1 .. 10) { }
    forEach (item in myList) { }
    spawn { }                // 並列実行
    break / continue / return
  }
}
```

### 現状の強み

| 強み | 説明 |
|------|------|
| スプライト直結のクラス | ゲームオブジェクトと1:1対応で直感的 |
| 豊富な組み込み関数 | 150以上のプリミティブ（物理・カメラ・パーティクル等） |
| イベント駆動 | `onTouched`, `onEvent` 等がファーストクラス |
| spawn による並列実行 | 複数アニメーションの同時実行が簡単 |
| 日本語識別子 | クラス名・変数名に日本語が使える |
| ブロック⇔テキスト双方向変換 | ビジュアルとテキストを行き来できる |

### 現状の課題・不足

| 不足点 | 詳細 |
|--------|------|
| 変数宣言がない | スコープが不明確。`this.x` と `x` の違いが暗黙的 |
| 型の概念がない | 型ミスがランタイムまで発見できない |
| ユーザー定義関数が書けない | 7種のイベントメソッド以外にメソッドを定義できない |
| 複合代入が `+=` のみ | `-=`, `*=`, `/=` がない |
| データ構造が弱い | 配列リテラル `[]`、オブジェクトリテラル `{}` がない |
| 文字列補間がない | `join()` で連結するしかない |
| switch/match がない | if-else チェーンで代替 |
| 三項演算子がない | 式レベルの条件分岐ができない |
| エラーハンドリングがない | 実行時エラーを捕捉できない |
| 継承がない | スプライト間でコードを共有する仕組みがない |

---

## 2. ゲーム開発言語の最新トレンド調査

### 2.1 GDScript (Godot 4.x)

Godot エンジンの公式スクリプト言語。Python風の構文でゲーム開発に特化。

**変数宣言と型:**
```gdscript
var speed: float = 10.0       # 型注釈付き
var name := "Player"          # 型推論
const MAX_HP: int = 100       # 定数
@export var health: int = 100 # エディタから編集可能
```

**シグナル（イベントシステム）:**
```gdscript
signal health_changed(new_value: int)   # シグナル宣言
health_changed.emit(50)                 # 発火
health_changed.connect(_on_health_changed) # 接続
```

**非同期処理:**
```gdscript
await get_tree().create_timer(1.0).timeout  # 1秒待つ
var result = await http_request.request_completed  # HTTP待ち
```

**パターンマッチング:**
```gdscript
match state:
    "idle":
        play_idle()
    "walk", "run":
        play_move()
    _:
        pass
```

**自作言語への示唆:**
- `var` / `const` による明示的な変数宣言
- 段階的型付け（型なしで始めて、後から型をつけられる）
- `@export` のようなアノテーションでエディタ連携
- `match` 文はゲームの状態管理に最適

---

### 2.2 Verse (Epic Games)

Fortnite Creative / UEFN 向けに Epic Games が開発した革新的な言語。関数型プログラミングの概念をゲーム開発に持ち込んだ。

**変数宣言:**
```verse
X := 42                    # 不変（デフォルト）
var X : int = 42           # 可変（明示的に var）
```

**最大の革新: 失敗コンテキスト（Failable Context）:**
```verse
# if は「失敗する可能性のある式」を試行するコンテキスト
if (Player := FindPlayer[]):
    # FindPlayer が成功した場合のみ実行
    Player.Damage(10)

# 従来の null チェック、配列境界チェック、型キャストが全て統一
if (Item := Inventory[Index]):
    UseItem(Item)
```
→ ゲーム開発で頻出する「あるかもしれない値」の処理が劇的にシンプルになる。

**並行処理モデル:**
```verse
# spawn: 非同期タスク起動
spawn { MoveToTarget() }

# sync: 全タスク完了を待つ
sync:
    MoveToPosition(A)
    PlayAnimation("walk")

# race: 最初に完了したものを採用、残りはキャンセル
race:
    Sleep(5.0)          # 5秒のタイムアウト
    WaitForInput()      # ユーザー入力待ち

# rush: 最初に完了したものを採用、残りは続行
rush:
    FadeInMusic()
    LoadNextLevel()
```
→ ゲームでは「タイムアウト付きの入力待ち」「複数アニメーションの同期」が頻出。これらを言語レベルで解決。

**エフェクトシステム:**
```verse
# 関数の副作用を型レベルで明示
FindPlayer()<decides><transacts> : player
# <decides> = 失敗する可能性がある
# <transacts> = 失敗時にロールバック可能
# <suspends> = 中断・再開可能（コルーチン的）
```

**自作言語への示唆:**
- `var` / `let`（不変デフォルト）で意図を明確化
- `race` / `sync` はゲーム特有の並行パターンとして非常に有用
- 失敗コンテキストは教育用には高度だが、概念として参考になる

---

### 2.3 C# in Unity

**async/await（Unity 6 以降）:**
```csharp
async Awaitable MoveToTarget() {
    while (Vector3.Distance(transform.position, target) > 0.1f) {
        transform.position = Vector3.MoveTowards(...);
        await Awaitable.NextFrameAsync();
    }
}
```

**属性によるエディタ連携:**
```csharp
[SerializeField] private float speed = 10f;
[Range(0, 100)] public int health;
[Header("Movement Settings")]
public float jumpForce = 5f;
```

**自作言語への示唆:**
- `await` はゲームの非同期処理のスタンダード
- 属性/アノテーションによるメタデータ付与

---

### 2.4 Luau (Roblox)

**段階的型付け:**
```lua
--!strict  -- ファイル単位で厳密モードを有効化

local speed: number = 10
local name: string = "Player"
type Point = { x: number, y: number }

-- Union 型
type Result = string | number
```

**タスクスケジューリング:**
```lua
task.spawn(function()     -- 新しいスレッドで実行
    task.wait(1)          -- 1秒待つ
    print("done")
end)

task.delay(2, function()  -- 2秒後に実行
    print("delayed")
end)
```

**自作言語への示唆:**
- ファイル/ブロック単位で型チェックの厳密さを切り替えられる設計
- `task.spawn` / `task.wait` はシンプルで教育的

---

### 2.5 言語横断的トレンドまとめ

| トレンド | 採用言語 | 重要度 |
|----------|----------|--------|
| **段階的型付け** | GDScript, Luau, TypeScript | ★★★ |
| **var/let/const による変数宣言** | Verse, GDScript, JS, C# | ★★★ |
| **await による非同期処理** | GDScript, C#, Verse | ★★★ |
| **シグナル/イベント宣言** | GDScript, C# | ★★☆ |
| **パターンマッチ (match/switch)** | GDScript, Verse, Rust | ★★☆ |
| **並行制御 (race/sync)** | Verse | ★★☆ |
| **エディタ連携アノテーション** | GDScript, C#, Verse | ★☆☆ |
| **失敗コンテキスト / Option型** | Verse, Rust | ★☆☆ |

---

## 3. 自作言語に取り入れるべき機能提案

### 優先度: 高 — すぐに効果が大きいもの

#### 3.1 変数宣言キーワード `var` / `let` の導入

**現状:**
```javascript
this.score = 0       // インスタンス変数？ローカル変数？
myTemp = 42          // スコープが不明確
```

**提案:**
```javascript
class プレイヤー {
  // インスタンス変数（スプライトのプロパティ）
  var score = 0
  var hp = 100
  let MAX_SPEED = 300    // 定数（変更不可）

  onCreate() {
    var temp = 42        // ローカル変数（メソッド内のみ）
    this.score = 0       // this. でインスタンス変数を明示的に参照
  }
}
```

**設計ポイント:**
- `var` = 可変変数、`let` = 定数（JavaScript の逆だが、GDScript/Verse に近い）
- もしくは JavaScript に合わせて `let` = 可変、`const` = 定数 でも良い
- `this.` 付きはインスタンス変数、`var` で宣言したものはローカル変数、と明確に分離
- **後方互換**: 宣言なし代入も当面はサポートし、段階的に移行

**ブロック表現:**
- 「変数 `score` を `0` にする」スタックブロック（既存の `data_setvariableto` を流用）
- 「定数 `MAX_SPEED` = `300`」ブロック（新規）

---

#### 3.2 ユーザー定義メソッド

**現状:** 7種のイベントメソッド以外にメソッドを定義できない。コードの再利用が不可能。

**提案:**
```javascript
class プレイヤー {
  // ユーザー定義メソッド（引数・戻り値あり）
  takeDamage(amount) {
    this.hp -= amount
    this.cameraShake(150, 0.015)
    if (this.hp <= 0) {
      this.die()
    }
  }

  die() {
    this.gameOver = 1
    this.tweenAlpha(0, 1)
    emit("game-over")
  }

  // 戻り値のあるメソッド
  isAlive() {
    return this.hp > 0
  }

  onTouched("敵") {
    this.takeDamage(20)    // 自作メソッドを呼ぶ
  }

  onUpdate() {
    if (this.isAlive()) {  // 戻り値を使う
      // 行動ロジック
    }
  }
}
```

**設計ポイント:**
- 既存の `CustomProcedure` 機能（ブロックエディタのマイブロック）と対応させる
- イベントメソッドは `on` プレフィックスで区別
- `on` がないメソッドはユーザー定義メソッド → ブロック側では `custom-define` / `custom-call` に変換

---

#### 3.3 複合代入演算子の拡充

**現状:** `+=` のみ。

**提案:** `-=`, `*=`, `/=`, `%=` を追加。

```javascript
this.hp -= damage
this.speed *= 0.9        // 減速
this.angle += deltaAngle
```

**実装:**
- パーサーのトークナイザに `*=`, `-=`, `/=`, `%=` を追加
- AST に `changeBy` の拡張として `operator` フィールドを追加（`+`, `-`, `*`, `/`, `%`）
- ブロック側では `data_changevariableby` を拡張するか、式展開（`x = x * 0.9`）にコンパイル

---

#### 3.4 文字列補間（テンプレートリテラル）

**現状:**
```javascript
this.updateTextAt("score", join("SCORE: ", this.score))
```

**提案:**
```javascript
this.updateTextAt("score", "SCORE: {this.score}")
// または
this.updateTextAt("score", f"SCORE: {this.score}")
```

**設計ポイント:**
- `"... {expr} ..."` で式を埋め込み（Python f-string 風）
- ブロック側では `operator_join` のチェーンに自動変換
- 初心者にとって `join()` より直感的

---

### 優先度: 中 — ゲーム開発の表現力を上げるもの

#### 3.5 match/switch 文

ゲームは状態管理の塊。if-else チェーンは読みにくい。

**提案:**
```javascript
match (this.state) {
  "idle" {
    this.playAnim("idle")
  }
  "walk", "run" {
    this.move(this.speed)
  }
  "attack" {
    this.playAnim("attack")
    wait(0.5)
  }
  _ {
    // デフォルト
  }
}
```

**ブロック表現:** 既存のステートマシンブロック（`statemachine_enter` 等）と連携。

---

#### 3.6 await 式による非同期の明示化

**現状:** `wait(1)` や `glide(2, x, y)` は暗黙的にスレッドを停止する。

**提案:**
```javascript
// 現状のまま動くが、明示的に await も書ける
await wait(1)
await this.glide(2, 100, 200)

// await の真価: 完了を待ってから次へ
await this.tweenScale(2, 0.5)
await this.tweenAlpha(0, 0.3)
// ↑ 順番に実行される

// sync: 同時実行して全部終わるのを待つ（Verse風）
sync {
  this.tweenScale(2, 0.5)
  this.tweenAlpha(0, 0.3)
}
// ↑ 両方同時に開始、両方終わったら次へ

// race: 最初に終わったものを採用（タイムアウトに最適）
race {
  waitForInput()           // ユーザー入力を待つ
  wait(5)                  // 5秒タイムアウト
}
```

**設計ポイント:**
- 既存の `spawn` と組み合わせて `spawn`, `sync`, `race` の3つの並行制御を提供
- ゲーム開発で頻出する「タイムアウト付き待機」「複数アニメーション同期」をシンプルに表現
- ブロック側では `sync` = Cブロック（全ボディを並行実行して全完了待ち）、`race` = Cブロック（最初の完了で打ち切り）

---

#### 3.7 配列リテラルとオブジェクトリテラル

**提案:**
```javascript
var enemies = ["スライム", "ゴブリン", "ドラゴン"]
var pos = { x: 100, y: 200 }

// 配列操作
enemies.push("ボス")
var first = enemies[0]
var len = enemies.length

// forEach がさらに自然に
forEach (enemy in enemies) {
  this.createClone(enemy)
}
```

**設計ポイント:**
- 既存のリスト系ブロック（`data_addtolist`, `data_itemoflist` 等）と対応
- オブジェクトリテラルは既存の `dict` 系ブロックと対応
- 教育的配慮: 配列を先に導入し、オブジェクトは後から

---

#### 3.8 段階的型注釈（オプショナル型）

**提案:**
```javascript
class プレイヤー {
  var score: number = 0         // 型注釈あり
  var name: string = "プレイヤー"
  var isAlive: bool = true

  // 引数の型注釈
  takeDamage(amount: number) {
    this.hp -= amount
  }

  // 戻り値の型注釈
  getSpeed(): number {
    return this.speed
  }
}
```

**設計ポイント:**
- 型は完全にオプション。書かなくても動く（GDScript/Luau と同じ段階的型付け）
- 基本型: `number`, `string`, `bool`, `list`, `dict`
- 型エラーはエディタ上で警告表示（赤波線等）。実行は止めない
- 教育的価値: 「型をつけるとバグが減る」ことを体験で学べる

---

### 優先度: 低 — 将来的に検討するもの

#### 3.9 継承 / ミックスイン

```javascript
// ミックスイン（共通振る舞いの共有）
mixin Damageable {
  var hp = 100

  takeDamage(amount) {
    this.hp -= amount
    if (this.hp <= 0) {
      this.die()
    }
  }
}

class プレイヤー with Damageable {
  onCreate() {
    this.hp = 200  // オーバーライド
  }
}

class 敵 with Damageable {
  onCreate() {
    this.hp = 50
  }
}
```

**設計ポイント:**
- 完全な継承ではなく、ミックスイン（振る舞いの共有）に留める
- ゲーム開発のコンポーネント指向と相性が良い
- ブロック側での表現は複雑なので、テキストモード専用機能でもよい

---

#### 3.10 列挙型（enum）

```javascript
enum State { Idle, Walk, Attack, Dead }
enum Direction { Up, Down, Left, Right }

// 使用
this.state = State.Attack

match (this.state) {
  State.Idle { ... }
  State.Walk { ... }
}
```

---

#### 3.11 ラムダ / 無名関数

```javascript
// タイマーコールバック
this.setInterval(0.5) {
  this.emitParticles(this.x, this.y, 3, "#ff0000", 100)
}

// ソートなどの高階関数
enemies.sortBy { enemy => enemy.hp }
```

---

## 4. 実装ロードマップ

### Phase 1: 基盤強化（変数・メソッド）

| 項目 | 変更箇所 | 難易度 |
|------|----------|--------|
| `var` / `let` 変数宣言 | class-parser.ts, ast-types.ts, block-generator.ts | 中 |
| 複合代入 `-=`, `*=`, `/=` | class-parser.ts (トークナイザ + パーサー) | 低 |
| ユーザー定義メソッド | class-parser.ts, ast-types.ts, block-generator.ts, class-ast-types.ts | 高 |
| 文字列補間 `"... {expr} ..."` | class-parser.ts (トークナイザ) | 中 |

### Phase 2: 制御フロー拡張

| 項目 | 変更箇所 | 難易度 |
|------|----------|--------|
| `match` 文 | class-parser.ts, ast-types.ts, block-generator.ts, 新ブロック定義 | 中 |
| `sync` / `race` ブロック | class-parser.ts, control.ts, sequencer.ts, thread.ts | 高 |
| `await` キーワード | class-parser.ts（既存動作のシンタックスシュガー） | 低 |

### Phase 3: データ構造・型

| 項目 | 変更箇所 | 難易度 |
|------|----------|--------|
| 配列リテラル `[]` | class-parser.ts, ast-types.ts, block-generator.ts | 中 |
| オブジェクトリテラル `{}` | class-parser.ts, ast-types.ts, block-generator.ts | 中 |
| 段階的型注釈 | class-parser.ts, 新: type-checker.ts | 高 |

### Phase 4: 高度な機能

| 項目 | 変更箇所 | 難易度 |
|------|----------|--------|
| ミックスイン | class-parser.ts, runtime.ts | 高 |
| enum | class-parser.ts, ast-types.ts | 中 |
| ラムダ | class-parser.ts, ast-types.ts, sequencer.ts | 高 |

---

## 参考: 各言語からの採用判断サマリー

| 機能 | 着想元 | 採用判断 | 理由 |
|------|--------|----------|------|
| `var` / `let` / `const` | GDScript, JS, Verse | ✅ 採用 | スコープの明確化は最優先 |
| 段階的型付け | GDScript, Luau | ✅ 採用 | 初心者に優しく、成長に応じて厳密にできる |
| ユーザー定義メソッド | 全言語 | ✅ 採用 | コード再利用の基本 |
| 文字列補間 | Python, JS, C# | ✅ 採用 | join() より圧倒的に書きやすい |
| match 文 | GDScript, Verse, Rust | ✅ 採用 | ゲームの状態管理に不可欠 |
| sync / race | Verse | ✅ 採用 | ゲーム特有の並行パターンを簡潔に表現 |
| await | GDScript, C#, JS | ✅ 採用 | 非同期の明示化（既存動作の構文糖衣） |
| 配列・オブジェクトリテラル | JS, Python, GDScript | ✅ 採用 | データ構造の表現力向上 |
| シグナル宣言 | GDScript | ⏸ 保留 | 既存の `emit`/`onEvent` で十分機能している |
| 失敗コンテキスト | Verse | ❌ 見送り | 教育用途には複雑すぎる |
| ECS / データ指向 | Unity DOTS | ❌ 見送り | スプライトベースの設計と相容れない |
| 継承 | 一般OOP | ⏸ 保留 | ミックスインの方がゲーム向き。Phase 4 で検討 |
| @export アノテーション | GDScript, C# | ⏸ 保留 | ブロックエディタのUIで代替可能 |

---

## 改良後の言語イメージ（最終ビジョン）

```javascript
class プレイヤー {
  var score: number = 0
  var hp: number = 100
  let MAX_SPEED = 300

  onCreate() {
    this.setPhysics("dynamic")
    this.setCollideWorldBounds(true)
  }

  onUpdate() {
    if (this.isKeyPressed("left arrow")) {
      this.setVelocityX(-MAX_SPEED)
    } else if (this.isKeyPressed("right arrow")) {
      this.setVelocityX(MAX_SPEED)
    }

    // match で状態管理
    match (this.state) {
      "invincible" {
        this.invincibleTimer -= 1
        if (this.invincibleTimer <= 0) {
          this.setState("normal")
        }
      }
    }
  }

  onKeyPress("space") {
    if (this.isAlive()) {
      this.shoot()
    }
  }

  onTouched("敵") {
    this.takeDamage(20)
  }

  onEvent("coin-get") {
    this.score += 50
    this.updateTextAt("score", "SCORE: {this.score}")
  }

  // ユーザー定義メソッド
  takeDamage(amount: number) {
    this.hp -= amount
    this.cameraShake(150, 0.015)

    // sync: 無敵アニメーションを同時実行
    sync {
      this.tweenAlpha(0.3, 0.1)
      this.tweenScale(1.2, 0.1)
    }
    await this.tweenAlpha(1, 0.1)

    if (this.hp <= 0) {
      this.die()
    }
  }

  shoot() {
    this.createClone("弾")
    this.emitParticles(this.x, this.y + 30, 5, "#ffcc00", 100)
  }

  die() {
    this.gameOver = 1
    // race: 演出 or 3秒タイムアウト
    race {
      {
        await this.tweenAlpha(0, 2)
        await wait(1)
      }
      wait(3)
    }
    emit("game-over")
  }

  isAlive(): bool {
    return this.hp > 0
  }
}
```
