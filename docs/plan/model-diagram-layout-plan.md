# モデル図レイアウト: PlantUML 完全再現計画

## 背景

### PlantUML のレイアウトの正体

PlantUML のクラス図レイアウトは **Graphviz dot**（Sugiyama 階層レイアウト）そのもの。PlantUML 自体はレイアウトアルゴリズムを持っておらず、以下のパイプラインで座標を得ている:

```
PlantUML のパイプライン:
  1. Java 側でノードサイズを事前計算（StringBounder）
  2. DOT 言語に変換（fixedsize=true でサイズ固定）
  3. Graphviz dot エンジンに渡して座標を計算
  4. 出力（SVG）から座標だけ抽出
  5. 自前レンダラー（IEntityImage）で描画
```

つまり **PlantUML と同じレイアウト = Graphviz dot と同じレイアウト** である。

### PlantUML のレイアウトエンジン一覧

| エンジン | 方式 | 用途 |
|---|---|---|
| **Graphviz (dot)** | 外部プロセスで `.dot` → SVG → 座標抽出 | クラス図、ステート図等の構造図（メイン） |
| **Smetana** | Graphviz の C コードを Java に移植した内蔵版 | 同上（外部依存なし版） |
| **ELK** | Eclipse Layout Kernel（Java ライブラリ） | `!pragma layout elk` で切替可 |
| **独自エンジン** | ダイアグラム固有ロジック | シーケンス図、アクティビティ図、ガントチャート等 |

### Graphviz dot アルゴリズム（Sugiyama 法）の概要

1. **サイクル除去** — DFS でバックエッジを反転し DAG 化
2. **レイヤリング** — ノードを階層（rank）に割り当て
3. **交差最小化** — 各階層内でノード順序を重心法/メディアン法で最適化（NP困難のヒューリスティック近似）
4. **座標割り当て** — ノードの x, y 座標を決定
5. **エッジルーティング** — B-spline（3次ベジェ曲線）がデフォルト。`polyline`（折線）や `ortho`（直交）も選択可

### PlantUML が生成する DOT の特徴

```dot
digraph ClassDiagram {
  rankdir=TB;
  nodesep=0.6;
  ranksep=0.8;
  splines=polyline;
  node [shape=box, fixedsize=true];

  "Player" [width=3.33, height=1.67, label=<<TABLE>...</TABLE>>];
  "Enemy"  [width=3.33, height=2.08, label=<<TABLE>...</TABLE>>];

  "Player" -> "Enemy" [color="#A80036", label="attacks"];
}
```

- `fixedsize=true`: ノードサイズを Graphviz に任せず事前計算値を使用
- `splines=polyline`: エッジを折れ線で描画（PlantUML デフォルト）
- HTML-like label（`<TABLE>`）でクラスボックスを表現
- 幅/高さはインチ単位（72px = 1inch）

---

## 現状

### 現在の実装（`model-diagram/layout.ts`）

371行のカスタム Sugiyama 実装。以下のフェーズで構成:

1. `breakCycles()` — DFS でバックエッジ除去
2. BFS 最長パスレイヤリング
3. `orderLayersByBarycenter()` — 交差最小化
4. `assignPositionsWithMedian()` — メディアン法 x 座標最適化 + チェーンオフセット
5. `computeGridLayout()` — 関係なし時のグリッドフォールバック

**問題点:**
- Graphviz dot と同じアルゴリズム系統だが、実装の詳細（ヒューリスティック、定数、エッジケース処理）が異なるため、PlantUML とは異なるレイアウト結果になる
- `CreatedSpriteCard`（headless-vpl 依存の型）に結合しており、純粋な幾何計算として分離できていない

---

## 設計

### 方針: Graphviz WASM でレイアウト計算

**`@viz-js/viz`** を使い、ブラウザ上で実際の Graphviz dot エンジンを実行する。

| 項目 | 詳細 |
|---|---|
| ライブラリ | `@viz-js/viz` (npm) |
| エンジン | Graphviz dot の WASM ビルド |
| バンドルサイズ | gzip ~600KB（WASM 内蔵、依存パッケージなし） |
| 出力形式 | `json0`（座標データのみ、描画コマンドなし） |
| 座標系 | 中心基準・ポイント(pt)単位 → 左上基準・px に変換 |

### パイプライン

```
CreatedSpriteCard[]（headless-vpl）
    │
    ├── id, label, width, height を抽出
    ↓
LayoutNode[], LayoutEdge[]（純粋型）
    │
    ↓
generateDot()
    │  ノードサイズを px → inch 変換
    │  fixedsize=true で DOT 文字列生成
    ↓
DOT 文字列
    │
    ↓
@viz-js/viz（Graphviz WASM）
    │  format: "json0" で座標のみ取得
    ↓
Graphviz JSON 出力
    │
    ↓
parseDotJson()
    │  中心座標 → 左上座標
    │  ポイント → px 変換
    ↓
LayoutResult: Map<spriteId, { x, y }>
    │
    ↓
container.move(x, y)（headless-vpl）
```

### ファイル構成

```
model-diagram/
  layout.ts              → 削除（layout/ に移行）
  layout/
    types.ts             → LayoutNode, LayoutEdge, LayoutResult, LayoutEngine
    dot-generator.ts     → ノード/エッジ → DOT 文字列生成
    dot-parser.ts        → Graphviz JSON → LayoutResult 変換
    graphviz.ts          → GraphvizLayout（@viz-js/viz で dot 実行）
    grid.ts              → GridLayout（関係なし時のフォールバック）
    index.ts             → re-export
  controller.ts          → import 先変更 + async 化
```

---

## 実装詳細

### `layout/types.ts` — 純粋型定義

headless-vpl に一切依存しない型。

```typescript
/** ノード記述（headless-vpl 非依存） */
export type LayoutNode = {
  id: string
  label: string  // DOT の label に使用
  width: number  // px
  height: number // px
}

/** 有向エッジ */
export type LayoutEdge = {
  from: string
  to: string
}

/** レイアウト結果 */
export type LayoutResult = Map<string, { x: number; y: number }>

/** レイアウトオプション（Graphviz の属性に対応） */
export type LayoutOptions = {
  nodesep?: number    // ノード間距離（inch）。デフォルト: 0.6
  ranksep?: number    // レイヤー間距離（inch）。デフォルト: 0.8
  rankdir?: "TB" | "LR" | "BT" | "RL"  // レイアウト方向。デフォルト: TB
  splines?: "polyline" | "ortho" | "spline" | "line"  // エッジ描画方式。デフォルト: polyline
}

/** プラガブルなレイアウトエンジン */
export interface LayoutEngine {
  compute(nodes: LayoutNode[], edges: LayoutEdge[], options?: LayoutOptions): Promise<LayoutResult>
}
```

`compute` が `Promise` を返す理由: Graphviz WASM の初期化が非同期のため。

### `layout/dot-generator.ts` — DOT 文字列生成

PlantUML と同じ方式。ノードサイズを px → inch に変換し `fixedsize=true` で渡す。

```typescript
const PX_PER_INCH = 72

export function generateDot(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  options?: LayoutOptions
): string {
  // rankdir, nodesep, ranksep, splines をオプションから取得
  // node [shape=box, fixedsize=true] をグローバル設定
  // 各ノード: width=px/72, height=px/72
  // 各エッジ: "from" -> "to"
}
```

### `layout/dot-parser.ts` — JSON 出力パース

Graphviz `json0` 出力の座標変換。

```typescript
export function parseDotJson(json: any): LayoutResult {
  // json.objects[].pos: "cx,cy"（中心、ポイント単位）
  // json.objects[].width/height: インチ単位
  // → 左上座標 (cx - w/2, cy - h/2) に変換
}
```

**座標系の注意:**
- Graphviz の `pos` はノード**中心**座標（ポイント単位、72pt = 1inch）
- `width`/`height` は**インチ単位**（`× 72` でポイントに変換）
- Y 軸は下が正（`yInvert: true` で反転可能）

### `layout/graphviz.ts` — メインエンジン

```typescript
// Viz.js インスタンスをシングルトンでキャッシュ（初期化は1回だけ）
let vizPromise: Promise<any> | null = null

export class GraphvizLayout implements LayoutEngine {
  async compute(nodes, edges, options): Promise<LayoutResult> {
    const dot = generateDot(nodes, edges, options)
    const viz = await getViz()  // シングルトン
    const json = JSON.parse(viz.renderString(dot, { format: "json0" }))
    return parseDotJson(json)
  }
}
```

### `layout/grid.ts` — グリッドフォールバック

関係が1つもない場合の単純グリッド配置（既存の `computeGridLayout` を移植）。

### `controller.ts` の変更

```typescript
// 変更前
import { computeAutoLayout } from "./layout"
const positions = computeAutoLayout(this.cards, allRelations)  // sync

// 変更後
import { GraphvizLayout, GridLayout, type LayoutNode, type LayoutEdge } from "./layout"

private graphvizLayout = new GraphvizLayout()
private gridLayout = new GridLayout()

// loadSprites と autoArrange を async 化
const layoutNodes: LayoutNode[] = this.cards.map(c => ({
  id: c.node.spriteId,
  label: c.node.spriteName,
  width: c.container.width,
  height: c.container.height,
}))
const layoutEdges: LayoutEdge[] = allRelations.map(r => ({
  from: r.fromSpriteId,
  to: r.toSpriteId,
}))
const engine = layoutEdges.length > 0 ? this.graphvizLayout : this.gridLayout
const positions = await engine.compute(layoutNodes, layoutEdges)  // async
```

---

## 対象ファイル一覧

| ファイル | 操作 |
|---|---|
| `client/web/package.json` | `@viz-js/viz` 追加 |
| `model-diagram/layout/types.ts` | 新規作成 |
| `model-diagram/layout/dot-generator.ts` | 新規作成 |
| `model-diagram/layout/dot-parser.ts` | 新規作成 |
| `model-diagram/layout/graphviz.ts` | 新規作成 |
| `model-diagram/layout/grid.ts` | 新規作成 |
| `model-diagram/layout/index.ts` | 新規作成 |
| `model-diagram/controller.ts` | 変更（async 化 + 型変換） |
| `model-diagram/layout.ts` | 削除 |

---

## 検証方法

1. `cd client/web && bun add @viz-js/viz` でインストール
2. `bun run build` でビルドエラーなし確認
3. エディタでモデル図を開き、自動整列ボタンでレイアウト確認
4. PlantUML Web エディタで同じノード構成のクラス図を生成し、レイアウトを目視比較

---

## 参考: PlantUML の内部アーキテクチャ

### レンダリングパイプライン全体

```
テキスト (.puml)
    │
    ├─ TIM プリプロセッサ（マクロ展開・!include）
    ↓
  正規表現ベース行単位パーサー（Command パターン）
    │  ※ BNF/PEG 等の正式な文法定義は存在しない
    ↓
  ダイアグラム内部モデル（Entity, Link 等）
    │
    ├─ 構造図（クラス図等）→ DotStringFactory → DOT 文字列
    │     → Graphviz/Smetana/ELK → SVG → 座標抽出
    │
    ├─ シーケンス図 → 独自エンジン（時間軸×参加者）
    ├─ アクティビティ図（新）→ 独自エンジン（Ftile 再帰構造）
    └─ ガントチャート等 → 独自エンジン
    │
    ↓
  UGraphic 描画抽象（Strategy パターン）
    │
    ├─ UGraphicSvg → SVG (javax.xml DOM)
    ├─ UGraphicG2d → PNG/PDF (java.awt.Graphics2D)
    └─ UGraphicTxt → ASCII art
```

### ダイアグラムタイプ別レイアウトエンジン

| ダイアグラム | レイアウト | エッジ | 交差最小化 |
|---|---|---|---|
| クラス図 | Graphviz dot / Smetana / ELK | スプライン / ortho / polyline | Sugiyama 法 |
| シーケンス図 | 独自（時間軸×参加者） | 水平直線 | 時系列順で回避 |
| アクティビティ図（新） | 独自（Ftile） | 直交的縦横線 | フロー構造から決定的配置 |
| ステートマシン図 | Graphviz dot / Smetana / ELK | スプライン | Sugiyama 法 |
| ユースケース図 | Graphviz dot / Smetana / ELK | スプライン | Sugiyama 法 |

### PlantUML のソースコード構造（Java）

| パッケージ | 責務 |
|---|---|
| `net.sourceforge.plantuml.svek` | Graphviz/Smetana 連携（DOT 生成 → SVG 座標抽出） |
| `net.sourceforge.plantuml.klimt` | 描画プリミティブ（UGraphic, UText, ULine 等） |
| `net.sourceforge.plantuml.style` | CSS 風スタイル解決 |
| `net.sourceforge.plantuml.sequencediagram` | シーケンス図独自レイアウト |
| `net.sourceforge.plantuml.activitydiagram3` | 新アクティビティ図独自レイアウト |
| `gen.lib.cgraph` / `gen.lib.dotgen` | Smetana（Graphviz Java 移植） |

### ブラウザで利用可能な代替ライブラリ

| ライブラリ | 言語 | サイズ | アルゴリズム | 備考 |
|---|---|---|---|---|
| **@viz-js/viz** | WASM | gzip ~600KB | Graphviz dot そのもの | **PlantUML 完全再現ならこれ** |
| dagre | JS | ~85KB | Sugiyama（独自実装） | 2019年以降メンテなし |
| elkjs | WASM | ~350KB | ELK Layered | PlantUML の ELK モードと同等 |
| d3-force | JS | ~30KB | 力学モデル | 階層レイアウト向きではない |
