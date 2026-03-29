# Verse言語 Live Variable 調査レポート

## 概要

Verse の **Live Variable（ライブ変数）** は、**リアクティブプログラミングを言語プリミティブとして組み込んだ機能**。
RxJS や MobX のようなライブラリ不要で、変数の依存関係を言語ランタイムが自動追跡・再計算する。

Tim Sweeny（Epic Games）と Simon Peyton Jones（Haskell設計者）の共同設計による。
**"It's Just Code"**（フレームワーク不要）と **"Metaverse First"**（永続シミュレーション向け状態伝播）の設計原則を体現している。

---

## 1. 基本構文

### 宣言方法

```verse
# 方法1: 宣言時に live 指定
var live X : int = Y + 1       # Y が変わると X も自動的に再計算される

# 方法2: 既存変数に live 代入
var X : int = 0
set live X = Y + 1             # この時点から X は Y を追跡開始

# 方法3: イミュータブル live 変数
live Y : int = SomeExpression  # 読み取り専用。式の値を常に反映
```

### 具体例

```verse
var Y : int = 0
var live X : int = Y + 1

Print(X)     # → 1 (Y=0 なので 0+1)
set Y = 5
Print(X)     # → 6 (Y が変わったので自動で 5+1 に再計算)
set Y = 10
Print(X)     # → 11
```

### live の解除

通常の `set` で代入すると、ライブ追跡が解除される:

```verse
var live X : int = Y + 1   # Y を追跡中
set X = 42                 # ← 通常代入。追跡解除。X は固定値 42 になる
set Y = 100                # X は 42 のまま（もう追跡していない）
```

---

## 2. 通常の変数との違い

| 特徴 | 通常の変数 (`var`) | Live 変数 (`var live`) |
|------|-------------------|----------------------|
| 値の更新 | `set` で明示的に代入 | 依存先が変わると自動再計算 |
| 依存性追跡 | なし | ランタイムで動的に追跡 |
| 中間値の観測 | 常に最新値 | `batch` で中間発火を抑制可能 |
| 解除 | - | 通常の `set` で解除可能 |

---

## 3. リアクティブ構文（await / upon / when）

Live Variable と連携する3つの監視構文がある。

### `await` — 条件成立まで中断

```verse
# Score が変わるまでサスペンド（一度だけ）
await { Score <> OldScore }
Print("スコアが変わった！")
```

### `upon` — 条件が成立した瞬間に一度だけ実行

```verse
upon (Health <= 0):
    set IsDead = true
    PlayDeathAnimation()
# Health が 0 以下になった瞬間に1回だけ発火
# その後 Health が再び正になっても、もう発火しない
```

### `when` — 値が変わるたびに毎回実行

```verse
when (Score):
    UpdateScoreDisplay(Score)
# Score が変わるたびに何度でも発火する
```

**3つとも `task` を返し、キャンセル可能:**

```verse
var ScoreWatcher : task = when (Score):
    UpdateScoreDisplay(Score)

# ゲームオーバー時に監視を止める
ScoreWatcher.Cancel()
```

---

## 4. batch 式（バッチ更新）

複数の変数を同時に更新するとき、中間状態での再計算を防ぐ:

```verse
var live Total : int = X + Y

# バッチなし: 中間状態が見える
set X = 2        # → Total が再計算される（中間値）
set Y = 10       # → Total がまた再計算される（最終値）

# バッチあり: 最終状態のみ
batch:
    set X = 2
    set Y = 10
# ← batch 完了後に Total が1回だけ再計算される
```

**ゲームでの活用:** ダメージ計算で攻撃力・防御力・バフを同時更新する場合、中間状態での誤った値の伝播を防ぐ。

---

## 5. 動的な依存性追跡

追跡はランタイムで動的に行われる。条件分岐で実行パスが変わると、追跡対象も自動的に切り替わる:

```verse
SomeFun(Z : int)<reads> : int =
    if (Z > 0):
        return X    # Z > 0 のとき X を参照
    else:
        return Y    # Z <= 0 のとき Y を参照

var live W : int = SomeFun(Z)

set Z = 1      # W は X を追跡中
set X = 100    # W = 100（X の変更に反応）
set Y = 200    # W は変化なし（Y は追跡していない）

set Z = 0      # ← 追跡先が X → Y に切り替わる
               # W = 200（Y の現在値になる）
set X = 999    # W は変化なし（もう X を追跡していない）
set Y = 50     # W = 50（Y の変更に反応）
```

---

## 6. Input-Output 変数ペア

`In -> Out` 構文で、変換前の値と変換後の値を同時に管理できる:

```verse
# Clamp: 値を 0〜100 の範囲に制限する変換器
var Clamp : clamp_transform = clamp_transform{ Lower := 0, Upper := 100 }

# BaseHealth(入力) → Health(出力) を Clamp で変換
var BaseHealth -> Health : Clamp.Evaluate = 50

Print(Health)        # → 50（範囲内なのでそのまま）

set Health = 120     # BaseHealth = 120, Health = 100（上限でクランプ）
set Health = -10     # BaseHealth = -10, Health = 0（下限でクランプ）

# 変換パラメータを変えると出力も自動再計算
set Clamp.Upper = 60 # Health = 50 → そのまま（50 < 60 なので範囲内）
set BaseHealth = 80  # Health = 60（80 > 60 なのでクランプ）
```

**ゲームでの活用:**
- HPバー: 生の値 → クランプ → UI表示
- ダメージ計算: 基礎攻撃力 → バフ倍率 → 最終ダメージ
- カメラ: 生の座標 → スムージング → 表示座標

---

## 7. ゲーム開発の実践的ユースケース

### 7.1 UI の自動同期

```verse
# スコア変数
var Score : int = 0

# UI を自動更新（Score が変わるたびに発火）
when (Score):
    ScoreText.SetText("SCORE: {Score}")

# ゲームロジック側はスコアを変えるだけ。UI更新を意識しない
set Score += 100
set Score += 50
```

→ 現在の自作言語で `observer_whenvarchanges` + `updateTextAt` でやっていることが、言語レベルで統合される。

### 7.2 ステータスのバフ/デバフ（Modifier Stack）

```verse
var BaseAttack : int = 100
var BuffMultiplier : float = 1.0
var live FinalAttack : int = Floor(BaseAttack * BuffMultiplier)

# バフを適用
set BuffMultiplier = 1.5     # FinalAttack = 150（自動再計算）

# レベルアップ
set BaseAttack = 120         # FinalAttack = 180（自動再計算）

# バフ解除
set BuffMultiplier = 1.0     # FinalAttack = 120（自動再計算）
```

### 7.3 条件付きリアクティビティ（AI 状態切替）

```verse
var live TargetPosition : vector3 =
    if (IsAggressive):
        PlayerPosition     # 攻撃モード: プレイヤーを追跡
    else:
        PatrolWaypoint     # 巡回モード: ウェイポイントを追跡

# モード切替で追跡対象が自動的に切り替わる
set IsAggressive = true      # → プレイヤーの位置を追跡開始
set IsAggressive = false     # → ウェイポイントの位置を追跡開始
```

### 7.4 タイムアウト付きイベント待ち

```verse
race:
    # 分岐1: プレイヤーの入力を待つ
    upon (InputReceived):
        ProcessInput()
    # 分岐2: 5秒タイムアウト
    Sleep(5.0)
# 先に完了した方が採用され、もう一方はキャンセル
```

---

## 8. `@editable` との関係

**Live Variable と @editable は別の機能:**

| 機能 | 用途 | タイミング |
|------|------|-----------|
| `@editable` | UEFNエディタの Details パネルでプロパティを設定 | エディタ時（ゲーム実行前） |
| `live` | コード実行中の依存性追跡と自動再計算 | ランタイム（ゲーム実行中） |

```verse
# @editable: エディタで値を設定（実行前に固定）
@editable MaxHP : int = 100

# live: ランタイムで自動追跡
var live CurrentHPPercent : float = CurrentHP / MaxHP
```

両者を組み合わせることで、エディタで設定した値をランタイムで動的に参照できる。

---

## 9. 自作言語への適用可能性

### 既にある機能との対応

| Verse の機能 | 自作言語の現状 | ギャップ |
|-------------|--------------|---------|
| `when(Score)` | `observer_whenvarchanges` ハットブロック | ブロックレベルでは実現済み。テキスト構文がない |
| `upon(Health <= 0)` | `observer_whenvarchanges` + if | 条件式で直接監視する構文がない |
| `await { condition }` | `waitUntil(condition)` | ほぼ同等 |
| `batch` | なし | 中間状態の抑制機能がない |
| `var live X = Y + 1` | なし | 自動再計算の仕組みがない |

### 取り入れられそうな機能

**レベル1: テキスト構文の追加（低コスト）**

```javascript
// 既存の observer ブロックをテキストで書けるようにする
when (this.score) {
  this.updateTextAt("score", "SCORE: {this.score}")
}

upon (this.hp <= 0) {
  this.die()
}
```
→ 既存の `onVarChange` メソッドの汎用化。パーサーに `when` / `upon` キーワードを追加するだけ。

**レベル2: live 変数（中コスト）**

```javascript
class プレイヤー {
  var hp = 100
  var maxHp = 100
  var live hpPercent = this.hp / this.maxHp  // 自動再計算

  onCreate() {
    // hpPercent は hp や maxHp が変わるたびに自動更新される
  }
}
```
→ ランタイムに依存性追跡エンジンを追加する必要がある。`setVariable()` のフックを拡張。

**レベル3: batch（中コスト）**

```javascript
// 複数変数を同時更新。中間発火を抑制
batch {
  this.hp -= damage
  this.shield -= overflow
}
```
→ `Runtime.setVariable()` にバッチモードを追加。

---

## 10. なぜ Verse はこんなに短く書けるのか — ライブラリ vs 言語の本質的な壁

### 疑問

Rx や R3、MobX は何年も開発されてきた成熟したライブラリなのに、なぜ Verse のように簡潔に書けなかったのか？
言語レベルでサポートするということは、裏側で AST やパーサーを使って複雑さを隠蔽しているということなのか？

### 答え: ライブラリには「触れない領域」が3つある

結論から言うと、**ライブラリがどんなに頑張っても、ホスト言語の構文を変えることはできない**。これが根本的な制約。

具体的に、ライブラリが絶対にできないことが3つある:

#### 壁1: 代入演算子 `=` を乗っ取れない

```verse
# Verse: 普通の代入に見えるが、裏で通知が走る
set Score = 100
```

```typescript
// RxJS: = は JavaScript の構文。ライブラリが介入できない
score$.next(100)   // ← .next() を呼ばないといけない

// R3: 同じ
score.Value = 100  // ← .Value プロパティ経由にするしかない

// MobX: Proxy/defineProperty で「ほぼ」乗っ取れるが…
state.score = 100  // ← makeAutoObservable() のセットアップが事前に必要
```

**Verse のコンパイラは `set` 文を見たとき、AST レベルで「この変数に依存している全ての live 変数を再計算する」コードを自動挿入できる。** ライブラリは `=` の動作を変更できないので、`.next()` や `.Value` という迂回路を作るしかない。

MobX は JavaScript の `Proxy` を使って最も近いところまで来ているが、それでも `makeAutoObservable(this)` というセットアップが必要で、プリミティブ型（`number`, `string`）は Proxy でラップできないという制限がある。

#### 壁2: 式の「読み取り」を自動追跡できない

```verse
# Verse: この式を評価するとき、コンパイラが「HP と MaxHP を読んだ」と記録する
var live HPPercent = HP / MaxHP
```

```typescript
// RxJS: 「何に依存しているか」を開発者が手動で教える必要がある
const hpPercent$ = combineLatest([hp$, maxHp$]).pipe(
  map(([hp, maxHp]) => hp / maxHp)
)
// ↑ combineLatest に [hp$, maxHp$] を渡すのは「依存宣言」を人間がやっている
```

**Verse のランタイムは式の評価中に「どの変数が読まれたか」をトレースしている。** だから開発者は「何に依存しているか」を書く必要がない。`HP / MaxHP` と書くだけで、`HP` と `MaxHP` への依存が自動的に検出される。

RxJS/R3 はストリーム（Observable）の世界に閉じているので、`combineLatest([hp$, maxHp$])` のように「この2つのストリームを合成する」と明示的に書かなければならない。これが冗長さの最大の原因。

MobX はここでも Proxy を使って近いことを実現しているが、`computed` getter の中でしかトレースが効かないという制限がある。

#### 壁3: 新しい制御構文を追加できない

```verse
# Verse: upon は言語のキーワード。パーサーが直接処理する
upon (Health <= 0):
    Die()

# Verse: batch も言語のキーワード
batch:
    set X = 1
    set Y = 2
```

```typescript
// RxJS: 言語に upon がないので、オペレータの組み合わせで表現するしかない
health$.pipe(
  filter(hp => hp <= 0),
  take(1)               // ← upon の「一度だけ」はこう書くしかない
).subscribe(() => die())

// RxJS: batch はそもそも存在しない。bufferTime(0) で無理やり近似
```

**ライブラリは新しいキーワードを追加できない。** `upon`, `when`, `batch` のようなゲーム開発に特化した制御構造は、ホスト言語の既存構文（メソッドチェーン、コールバック、ジェネリクス）で「模倣」するしかない。これが `.pipe(filter(...), take(1)).subscribe(...)` のような冗長なチェーンになる理由。

### 図解: 同じことを実現するための「層の数」

```
Verse（言語レベル）:
┌─────────────────────────────────┐
│  var live X = Y + 1             │  ← 開発者が書くコード（1層）
├─────────────────────────────────┤
│  コンパイラ/ランタイムが自動処理:    │
│  ・Y の読み取りを検知             │
│  ・Y → X の依存エッジを登録       │
│  ・Y が変わったら X を再計算       │
│  ・通知をバッチ最適化             │
└─────────────────────────────────┘

RxJS（ライブラリレベル）:
┌─────────────────────────────────┐
│  combineLatest([y$]).pipe(      │  ← 開発者が書くコード（何層も重なる）
│    map(([y]) => y + 1)          │
│  )                              │
├─────────────────────────────────┤
│  開発者が自分でやること:           │
│  ・BehaviorSubject でラップ       │  ← 壁1: = が使えないから
│  ・combineLatest で依存を明示     │  ← 壁2: 読み取り追跡がないから
│  ・pipe + map で変換を記述        │  ← 壁3: 新構文が作れないから
│  ・subscribe + unsubscribe 管理  │
└─────────────────────────────────┘
```

### MobX が「一番近い」理由

MobX は JavaScript の `Proxy` と `Object.defineProperty` を駆使して、壁1と壁2を**部分的に**突破している:

```typescript
// MobX: Proxy のおかげで通常の代入構文が使える（壁1を部分突破）
state.score = 100  // Proxy が set トラップで通知を発火

// MobX: computed getter 内の読み取りを自動追跡（壁2を部分突破）
get hpPercent() { return this.hp / this.maxHp }
// ↑ getter 実行中に this.hp と this.maxHp へのアクセスを Proxy が検知
```

しかし以下の制限が残る:
- `makeAutoObservable(this)` のセットアップが必須（完全には透過的でない）
- プリミティブ型の変数は Proxy でラップできない（オブジェクトのプロパティにする必要がある）
- `upon` のような「一度だけ発火」は `reaction` + 手動 `dispose()` で模倣するしかない（壁3）
- `batch` は `runInAction` で対応できるが、言語キーワードではない（壁3）

### まとめ: なぜ言語レベルのサポートが必要なのか

| 制約 | ライブラリ（Rx/R3） | Proxy系（MobX） | 言語（Verse） |
|------|-------------------|----------------|-------------|
| `=` で通知を発火 | × `.next()` 必須 | △ オブジェクトプロパティのみ | ◎ 全変数で可能 |
| 読み取りの自動追跡 | × 手動で `combineLatest` | △ getter 内のみ | ◎ 全ての式で可能 |
| 新しい制御構文 | × チェーンで模倣 | × チェーンで模倣 | ◎ `upon`, `when`, `batch` |
| セットアップ | × Subject 生成 | △ makeAutoObservable | ◎ 不要 |
| 動的依存切り替え | × `switchMap` | ◎ 自動 | ◎ 自動 |

**結論:** Verse が短く書けるのは「裏側で AST・パーサー・ランタイムが複雑さを隠蔽しているから」であり、まさにその通り。コンパイラが `set` 文を見て依存グラフの更新コードを注入し、ランタイムが式評価中の変数読み取りをトレースして依存関係を自動構築する。これはライブラリの層では原理的に実現できない。

**自作言語への含意:** 自分で言語を作っているなら、Verse と同じことができる立場にある。パーサーとランタイムを制御できるので、`var live` や `when` / `upon` を言語キーワードとして実装し、コンパイル時に依存追跡コードを自動挿入できる。これはライブラリ作者には不可能な、言語設計者だけの特権。

---

## 参考資料

- [Live Variables - Book of Verse](https://verselang.github.io/book/15_live_variables/)
- [Verse Language Reference (Epic Developer Community)](https://dev.epicgames.com/documentation/en-us/fortnite/verse-language-reference)
- [The Verse Calculus - Simon Peyton Jones](https://simon.peytonjones.org/verse-calculus/)
