# Verse Live Variable vs Rx/R3/MobX 比較レポート

4つのリアクティブアプローチを、同じゲームシナリオで実装して比較する。

---

## 各アプローチの概要

| | Verse Live Variable | RxJS | R3 (Cysharp) | MobX |
|---|---|---|---|---|
| 種別 | 言語プリミティブ | ライブラリ (JS/TS) | ライブラリ (.NET/Unity) | ライブラリ (JS/TS) |
| 核心 | `var live`, `when`, `upon`, `batch` | `Observable`, `pipe`, 200+オペレータ | `ReactiveProperty`, `Subscribe` | `observable`, `computed`, `autorun` |
| 依存追跡 | 自動（ランタイム） | 手動（ストリーム合成） | 手動（ストリーム合成） | 自動（プロパティアクセス） |
| インポート | 不要（言語組み込み） | 必要 | 必要 | 必要 |

---

## シナリオ 1: UI自動更新（スコア表示）

### Verse
```verse
var Score : int = 0

when (Score):
    set ScoreText = "Score: {Score}"

set Score = 100   # → "Score: 100"
set Score = 200   # → "Score: 200"
```
**7行。宣言的。ボイラープレートなし。**

### RxJS
```typescript
const score$ = new BehaviorSubject<number>(0)

const sub = score$.subscribe(score => {
  scoreText = `Score: ${score}`
  updateUI()  // 手動でUI更新を呼ぶ
})

score$.next(100)
score$.next(200)
sub.unsubscribe()  // 忘れるとリーク
```
**12行。subscribe/unsubscribe の管理が必要。**

### R3 (C#)
```csharp
var score = new ReactiveProperty<int>(0);

var sub = score.Subscribe(s => {
    scoreText = $"Score: {s}";
});

score.Value = 100;  // 重複値は自動で無視される
score.Value = 200;
sub.Dispose();
```
**10行。重複排除が組み込み。Dispose 管理が必要。**

### MobX
```typescript
class GameState {
  score = 0
  constructor() { makeAutoObservable(this) }
  get scoreText() { return `Score: ${this.score}` }
}

const state = new GameState()
const dispose = autorun(() => updateUI(state.scoreText))

state.score = 100
state.score = 200
dispose()
```
**14行。クラス定義 + makeAutoObservable のセットアップが必要。**

### 比較

| | Verse | RxJS | R3 | MobX |
|---|---|---|---|---|
| 行数 | 7 | 12 | 10 | 14 |
| 宣言的か | ◎ | △ | △ | ○ |
| 重複排除 | ◎ 組み込み | × 手動で `distinctUntilChanged()` | ◎ 組み込み | ◎ 組み込み |

---

## シナリオ 2: 派生値の自動計算（HP% = HP / MaxHP）

### Verse
```verse
var HP : int = 100
var MaxHP : int = 100
var live HPPercent : float = HP * 1.0 / MaxHP

set HP = 75       # → HPPercent = 0.75（自動）
set MaxHP = 200   # → HPPercent = 0.375（自動）
```
**3行の宣言だけ。サブスクリプション不要。**

### RxJS
```typescript
const hp$ = new BehaviorSubject<number>(100)
const maxHp$ = new BehaviorSubject<number>(100)

const hpPercent$ = combineLatest([hp$, maxHp$]).pipe(
  map(([hp, maxHp]) => hp / maxHp)
)

const sub = hpPercent$.subscribe(pct => {
  console.log(`HP: ${(pct * 100).toFixed(0)}%`)
})

hp$.next(75)
maxHp$.next(200)
sub.unsubscribe()
```
**13行。`combineLatest` + `map` パイプの知識が必要。**

### R3 (C#)
```csharp
var hp = new ReactiveProperty<int>(100);
var maxHp = new ReactiveProperty<int>(100);

var hpPercent = hp.CombineLatest(maxHp, (h, m) => (float)h / m)
    .ToReactiveProperty();

hp.Value = 75;
maxHp.Value = 200;
hpPercent.Dispose();
```
**11行。CombineLatest → ToReactiveProperty パターン。**

### MobX
```typescript
class PlayerStats {
  hp = 100
  maxHp = 100
  constructor() { makeAutoObservable(this) }
  get hpPercent() { return this.hp / this.maxHp }
}

const stats = new PlayerStats()
stats.hp = 75       // hpPercent = 0.75（自動）
stats.maxHp = 200   // hpPercent = 0.375（自動）
```
**7行。computed getter で自然。Verse に最も近い。**

### 比較

| | Verse | RxJS | R3 | MobX |
|---|---|---|---|---|
| 行数 | 3 | 13 | 11 | 7 |
| 概念負荷 | 低（`var live` だけ） | 高（combineLatest, pipe, map） | 中（CombineLatest） | 低（computed getter） |
| 依存追跡 | 自動 | 手動（明示的に合成） | 手動（明示的に合成） | 自動 |

---

## シナリオ 3: 条件反応（HP <= 0 で死亡、一度だけ発火）

### Verse
```verse
upon (Health <= 0):
    set IsDead = true
    Print("Player died!")

set Health = 50   # 何も起きない
set Health = 0    # → "Player died!"（1回だけ）
set Health = -10  # 何も起きない（もう発火済み）
```
**3行。`upon` が「一度だけ」を言語レベルで保証。**

### RxJS
```typescript
const health$ = new BehaviorSubject<number>(100)

health$.pipe(
  filter(hp => hp <= 0),
  take(1)  // ← これを忘れると何度も発火する
).subscribe(() => {
  isDead = true
  console.log("Player died!")
})

health$.next(50)
health$.next(0)    // → "Player died!"
health$.next(-10)  // 何も起きない
```
**11行。`filter` + `take(1)` の組み合わせ。take を忘れるバグが起きやすい。**

### R3 (C#)
```csharp
var health = new ReactiveProperty<int>(100);

health.Where(hp => hp <= 0)
    .Take(1)
    .Subscribe(_ => {
        isDead = true;
        Console.WriteLine("Player died!");
    });

health.Value = 50;
health.Value = 0;    // → "Player died!"
health.Value = -10;  // 何も起きない
```
**9行。Where + Take(1)。Take 完了時に自動 Dispose。**

### MobX
```typescript
const dispose = reaction(
  () => player.health <= 0,
  (isDead) => {
    if (isDead) {
      player.isDead = true
      console.log("Player died!")
      dispose()  // ← 手動でリスナーを解除
    }
  }
)
```
**14行。「一度だけ」を手動 dispose で実現。忘れると何度も発火。**

### 比較

| | Verse | RxJS | R3 | MobX |
|---|---|---|---|---|
| 行数 | 3 | 11 | 9 | 14 |
| 「一度だけ」保証 | ◎ 言語組み込み | ○ `take(1)` | ○ `Take(1)` | △ 手動 `dispose()` |
| ミスの起きやすさ | 低い | 中（take 忘れ） | 中（Take 忘れ） | 高（dispose 忘れ） |

---

## シナリオ 4: バッチ更新（複数値を変更、通知は一度だけ）

### Verse
```verse
var live Total : int = X + Y

batch:
    set X = 2
    set Y = 10
    set X += 5
# → Total は 17 に1回だけ再計算（中間値 2 は見えない）
```
**`batch` ブロックで囲むだけ。言語組み込み。**

### RxJS
```typescript
// ネイティブのバッチ機能がない → ハックが必要
const updates$ = new Subject<Partial<State>>()

updates$.pipe(
  bufferTime(0),  // マイクロタスクで集約
  filter(buf => buf.length > 0)
).subscribe(updates => {
  const final = updates.reduce((acc, u) => ({ ...acc, ...u }), state)
  applyState(final)
})

updates$.next({ x: 2 })
updates$.next({ y: 10 })
updates$.next({ x: 7 })
```
**16行以上。ネイティブサポートなし。`bufferTime(0)` は本来の用途と違う。**

### R3 (C#)
```csharp
// ネイティブ batch はないが、フレーム単位の Chunk で代替
x.Chunk(Observable.EveryUpdate())
    .Subscribe(values => {
        Console.WriteLine($"X = {values.Last()}");
    });

// 同一フレーム内で更新
x.Value = 2;
y.Value = 10;
x.Value = 7;
// フレーム終了時に通知が1回
```
**10行。ゲームループのフレーム単位で自然にバッチ化。**

### MobX
```typescript
reaction(
  () => state.x + state.y,
  (total) => console.log(`Total: ${total}`)
)

runInAction(() => {
  state.x = 2
  state.y = 10
  state.x = 7
})
// → "Total: 17"（1回だけ）
```
**14行。`runInAction` が Verse の `batch` に最も近い。**

### 比較

| | Verse | RxJS | R3 | MobX |
|---|---|---|---|---|
| バッチサポート | ◎ 言語組み込み | × ハック必要 | △ フレーム単位 | ○ `runInAction` |
| 中間値の排除 | ◎ 自動 | △ 手動 | △ フレーム依存 | ◎ 自動 |
| ネスト可能 | ◎ | × | × | ○ |

---

## シナリオ 5: 動的な依存切り替え（AIの追跡対象）

攻撃モード→プレイヤーを追跡、巡回モード→ウェイポイントを追跡。モードが変わると追跡対象も切り替わる。

### Verse
```verse
var live TargetPos : vector3 =
    if (IsAggressive?) then PlayerPos else WaypointPos

set IsAggressive = true
# → PlayerPos を追跡開始（WaypointPos の変更には反応しなくなる）

set IsAggressive = false
# → WaypointPos を追跡開始（PlayerPos の変更には反応しなくなる）
```
**2行の宣言だけ。依存の動的切り替えが完全自動。**
ランタイムが「今回の計算で実際に読まれた変数」だけを追跡するため、条件分岐の結果によって追跡対象が自動的に変わる。

### RxJS
```typescript
const targetPos$ = isAggressive$.pipe(
  switchMap(agg => agg ? playerPos$ : waypointPos$)
)

const sub = targetPos$.subscribe(pos => updateAI(pos))
```
**`switchMap` が必要。ストリームの切り替え概念を理解しないと書けない。**

### R3 (C#)
```csharp
var targetPos = isAggressive
    .Select(agg => agg ? playerPos : waypointPos)
    .Switch()
    .ToReactiveProperty();
```
**`Select` + `Switch` パターン。RxJS の switchMap に相当。**

### MobX
```typescript
get targetPos() {
  return this.isAggressive ? this.playerPos : this.waypointPos
}
```
**1行の computed getter。Verse と同様に自動追跡。最も Verse に近い。**

### 比較

| | Verse | RxJS | R3 | MobX |
|---|---|---|---|---|
| 行数 | 2 | 4 | 4 | 1 |
| 動的依存追跡 | ◎ 自動 | △ `switchMap` | △ `Select+Switch` | ◎ 自動 |
| 概念負荷 | 低 | 高 | 高 | 低 |

---

## シナリオ 6: クリーンアップ/破棄

### Verse
```verse
# upon/when はタスクを返す → Cancel() で停止
Task := when (Score):
    UpdateUI(Score)
Task.Cancel()

# live 変数は通常の代入で追跡解除
var live X = Y + 1
set X = 42          # ← 通常代入で追跡停止
```
**Cancel() または通常代入。GC は言語ランタイムが管理。**

### RxJS
```typescript
// パターン1: 個別解除
sub.unsubscribe()

// パターン2: まとめて解除
const subs = new Subscription()
subs.add(sub1)
subs.add(sub2)
subs.unsubscribe()

// パターン3: takeUntil（推奨）
const destroy$ = new Subject<void>()
obs$.pipe(takeUntil(destroy$)).subscribe(handler)
destroy$.next()
destroy$.complete()
```
**3つのパターン。takeUntil が推奨だが覚えることが多い。**

### R3 (C#)
```csharp
// DisposableBag（struct、軽量）
DisposableBag bag;
obs1.Subscribe(h1).AddTo(ref bag);
obs2.Subscribe(h2).AddTo(ref bag);
bag.Dispose();

// CancellationToken（推奨）
var cts = new CancellationTokenSource();
obs.Subscribe(handler, cts.Token);
cts.Cancel();

// ObservableTracker でリーク検出（他にない独自機能）
ObservableTracker.EnableTracking = true;
ObservableTracker.ForEachActiveTask(info => Log(info));
```
**用途別に5種類。ObservableTracker によるリーク検出は R3 固有の強み。**

### MobX
```typescript
const dispose = autorun(() => { /* ... */ })
dispose()  // 関数呼び出しで解除
```
**シンプル。dispose 関数を呼ぶだけ。ただし一括管理の仕組みはない。**

---

## 総合評価

### 行数比較（全シナリオ合計）

| シナリオ | Verse | RxJS | R3 | MobX |
|----------|-------|------|-----|------|
| 1. UI自動更新 | 7 | 12 | 10 | 14 |
| 2. 派生値 | 3 | 13 | 11 | 7 |
| 3. 一度だけ発火 | 3 | 11 | 9 | 14 |
| 4. バッチ更新 | 8 | 16+ | 10 | 14 |
| 5. 動的依存 | 2 | 4 | 4 | 1 |
| **合計** | **23** | **56+** | **44** | **50** |

### 特徴マトリクス

| 観点 | Verse | RxJS | R3 | MobX |
|------|-------|------|-----|------|
| 簡潔さ | ◎ | × | △ | ○ |
| 自動依存追跡 | ◎ | × | × | ◎ |
| バッチ更新 | ◎ | × | △ | ○ |
| 「一度だけ」保証 | ◎ | ○ | ○ | △ |
| フレームベース処理 | ◎ | × | ◎ | × |
| リーク検出 | ? | × | ◎ | × |
| 学習曲線 | 緩やか | 急峻 | 中程度 | 緩やか |
| エコシステム | 小（UEFN限定） | 大 | 中（Unity/.NET） | 大 |

### 本質的な違い

**Rx / R3 = ストリーム指向:**
「値の変化をストリーム（時系列のイベント列）として扱う」。開発者は「どのストリームを組み合わせるか」を明示的に宣言する。合成オペレータ（`combineLatest`, `switchMap`, `merge`）の知識が必要。

**Verse / MobX = 透過的リアクティブ:**
「普通の変数を使うだけで依存関係が自動追跡される」。開発者はリアクティブであることを意識しない。式を書けば依存グラフが自動構築される。

→ **ゲーム開発、特に教育向けには「透過的リアクティブ」が圧倒的に向いている。** ストリーム指向はパワフルだが概念負荷が高すぎる。

---

## 自作言語への示唆

現在の自作言語には既に `observer_whenvarchanges`（変数監視ハットブロック）がある。これは Verse の `when` に相当する。

拡張するなら:

| 段階 | 追加する機能 | Verse 相当 | 実装コスト |
|------|-------------|-----------|----------|
| 1 | テキスト構文で `when` / `upon` を書けるようにする | `when`, `upon` | 低（パーサー拡張のみ） |
| 2 | `batch` ブロックを追加する | `batch` | 中（Runtime に一時通知抑制フラグ） |
| 3 | `var live` で派生値を宣言する | `var live` | 高（依存性追跡エンジン） |
| 4 | `sync` / `race` 並行制御 | `sync`, `race` | 高（Sequencer 拡張） |
