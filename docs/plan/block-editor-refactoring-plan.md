# block-editor リファクタリング計画

## Context

`client/web/features/editor/block-editor/` のコードが複雑化しており、特に `controller.ts`（1192行、30+メソッド）がGod Classになっている。AIでも修正・改良しやすい構造にするため、デザインパターンを適用してコードを分割・整理し、全関数に日本語コメントを付与する。

**優先目標:** 読みやすさ・変更のしやすさ・バグ修正のしやすさ

## 現状の問題点

| ファイル | 行数 | 主な問題 |
|---------|------|---------|
| `controller.ts` | 1192行 | God Class（30+メソッド、6つの責務が混在） |
| `blocks.ts` | 828行 | 定数・定義・ヘルパー・手続き関連が一つのファイルに混在 |
| `layout.ts` | 318行 | `relayoutSlotsAndFitBlock()` が148行の巨大関数 |
| `connections.ts` | 230行 | マジックナンバー、バリデーションロジックの重複 |
| `factory.ts` | 188行 | 比較的良好 |
| `types.ts` | ~100行 | 良好（純粋な型定義） |

### controller.ts の責務分析

| 責務クラスター | メソッド数 | 概算行数 |
|--------------|----------|---------|
| 手続き（Procedure）管理 | 14 | ~270 |
| 永続化（Persistence） | 5 | ~250 |
| ブロックライフサイクル | 7 | ~150 |
| ワークスペースライフサイクル | 11 | ~250 |
| スナップショット/購読 | 12 | ~150 |
| 変数管理 | 2 | ~20 |

## 方針

**Facade + Delegation パターン** を採用。`BlockEditorController` は単一エントリポイント（Facade）として残し、内部的に専門マネージャーに委譲する。これにより：
- `view.tsx` / `block-workspace.tsx` の変更が不要（公開API維持）
- テストの書き換えが最小限
- 段階的に実施可能

## Phase 0: 定数の抽出（リスク: 最小）

**対象:** `connections.ts`, `controller.ts`

マジックナンバーを名前付き定数に置換。ゾーン優先度は1つのオブジェクトにまとめて優先順位の全体像を可視化する：

```typescript
// connections.ts

/** ドラッグ判定のゾーン優先度（値が大きいほど優先） */
const ZONE_PRIORITY = {
  BODY: 200,    // Cブロック内部（最優先）
  SLOT: 150,    // スロットはめ込み
  SNAP: 100,    // スタック接続
} as const

const SLOT_ZONE_PADDING = 0
const BODY_ZONE_PADDING = 10
const SLOT_CENTER_TOLERANCE = { x: 30, y: 20 }

// controller.ts
const DUPLICATE_OFFSET = 48
```

## Phase 1: 日本語 JSDoc コメント追加（リスク: ゼロ）

全ファイルの全エクスポート関数・クラスメソッドに `/** ... */` 形式の日本語コメントを追加。ロジック変更なし。

対象ファイル:
- `types.ts` — 型グループごとのセクションコメント
- `blocks.ts` — 全エクスポート関数・定数
- `connections.ts` — 全6エクスポート関数 + プライベートヘルパー
- `layout.ts` — 全エクスポート関数
- `factory.ts` — `createBlock`
- `controller.ts` — 全メソッド（public + private）

## Phase 2: `layout.ts` の長関数分割（リスク: 低）

**対象:** `relayoutSlotsAndFitBlock()`（148行）

実際のコードではスロット寸法計算・ヘッダー高さ計算・カーソルベース配置が cursor 変数を共有しており密結合。5分割ではなく **3分割** が現実的：

```
relayoutSlotsAndFitBlock()  ← オーケストレーター（~30行）
  ├── computeSlotLayout()        — スロット寸法+配置計算（寸法・高さ・カーソル配置を統合）
  ├── applyCBlockLayout()        — Cブロックのサイズ適用
  └── applyStackLayout()         — 通常ブロックのサイズ適用
```

テスト影響: なし（内部関数の分割のみ）

## Phase 3: `connections.ts` のバリデーション統合（リスク: 低）

重複する形状バリデーションロジックを共通ファクトリに抽出：

```typescript
/** ドラッグされたブロックの形状を検証するバリデーターを生成する */
function createShapeValidator(
  createdMap: Map<string, CreatedBlock>,
  acceptedShapes: BlockShape[]
): (dragged: Container) => boolean
```

テスト影響: なし（内部リファクタリング）

## Phase 4: `VariableManager` 抽出（リスク: 低）

**新規ファイル:** `variable-manager.ts`

`addVariable`, `removeVariable` を移動。小規模だが、Manager 抽出パターンの検証として最初に実施する。後続の Phase 5-6 で同じパターンを適用する際のテンプレートになる。

## Phase 5: `ProcedureManager` 抽出（リスク: 中、効果: 大）

**新規ファイル:** `procedure-manager.ts`

controller.ts から14メソッド（~270行）を移動：
- `updateProcedure`, `createProcedureLabel`, `createProcedureParam`
- `moveProcedureToken`, `removeProcedureToken`, `setProcedureLabelText`
- `setProcedureParamName`, `reorderProcedureToken`, `changeProcedureTokenType`
- `setProcedureReturnsValue`, `createProcedureBlock`, `createProcedureFromSpec`
- `cloneProcedureDefinition`, `removeProcedure`

Host インターフェースは最小限に絞る。`updateProcedure()` が毎回 export → rebuild の重いパスを通るため、個別メソッドではなく1つの `applyProcedureChange` に集約：

```typescript
/** ProcedureManager がコントローラーに要求する操作のインターフェース */
type ProcedureManagerHost = {
  getSnapshot(): BlockEditorSnapshot
  /** 手続き定義の変更を適用し、ワークスペースを再構築する */
  applyProcedureChange(updater: (procs: CustomProcedure[]) => CustomProcedure[]): void
  addBlock(defId: string, x: number, y: number): string | null
}
```

controller.ts 側はワンライナー委譲：
```typescript
createProcedureLabel(id: string) { this.procedureManager.createLabel(id) }
```

**追加修正:** ID生成を `Date.now() + Math.random()` から `crypto.randomUUID()` に統一（blocks.ts と整合）

## Phase 6: `PersistenceManager` 抽出（リスク: 中、効果: 大）

**新規ファイル:** `persistence-manager.ts`

`rebuildFromProjectData()`（141行）を分解して移動：
- `deserializeBlocks()` — シリアライズデータからブロック生成
- `restoreStackConnections()` — スタック接続の復元
- `restoreBodyNesting()` — Cブロックのボディネスティング復元
- `restoreSlotNesting()` — スロットネスティング復元
- `exportWorkspaceData()` — ワークスペースデータのエクスポート

**バグ修正しやすさの改善:** 各サブ関数でデータ不整合を検出してログ出力する：

```typescript
/** スタック接続を復元する。不整合があればwarningを返す */
function restoreStackConnections(...): { warnings: string[] }
// 例: nextId が存在しないブロックを指す → warning + チェーン分断
// 例: ブロック定義IDが見つからない → warning + スキップ
```

controller.ts から ~250行削減。

## Phase 7: `blocks.ts` のモジュール分割（リスク: 中）

828行の `blocks.ts` を論理的に分割：

```
block-editor/
  blocks.ts                ← バレル再エクスポート（既存importを維持）
  blocks/
    constants.ts           ← 寸法定数、SHAPE_CONFIGS (~50行)
    block-behavior.ts      ← resolveBlockBehavior、形状ヘルパー (~80行)
    block-defs.ts          ← ビルトインブロック定義、lookup関数 (~400行)
    input-helpers.ts       ← inputWidth、computeSlotPositions等 (~120行)
    procedure-helpers.ts   ← カスタム手続き関連ヘルパー (~100行)
```

`blocks.ts` をバレルファイルとして残すことで、他ファイルのimportパス変更不要。

## Phase 8: Controller 最終整理

Phase 4-6 完了後の controller.ts（~500-600行）を整理：
- マネージャーのインスタンス化をコンストラクタに集約
- 残存するブロックライフサイクル・ワークスペース管理のメソッドにコメント追加
- observer クリーンアップの安全性向上（try-finally パターン）：

```typescript
/** オブザーバーを再登録する。エラー時もリークしないよう try-finally で保護 */
refreshObservers() {
  this.cleanupObservers()
  try {
    this.finalizeConnectionObservers()
  } catch (e) {
    this.cleanupObservers()
    throw e
  }
}
```

## 実施順序

| 順番 | Phase | リスク | 削減行数 | テスト影響 |
|------|-------|--------|----------|-----------|
| 1 | Phase 0 (定数抽出) | 最小 | 0 | なし |
| 2 | Phase 1 (JSDocコメント) | ゼロ | 0 | なし |
| 3 | Phase 2 (layout分割) | 低 | 0 | なし |
| 4 | Phase 3 (validation統合) | 低 | ~15 | なし |
| 5 | Phase 4 (VariableManager) | 低 | ~20 | なし |
| 6 | Phase 5 (ProcedureManager) | 中 | ~270 | Facade維持で変更不要 |
| 7 | Phase 6 (PersistenceManager) | 中 | ~250 | Facade維持で変更不要 |
| 8 | Phase 7 (blocks.ts分割) | 中 | 0 | import先変更のみ |
| 9 | Phase 8 (Controller整理) | 低 | 0 | なし |

**順序変更のポイント:** VariableManager（旧Phase 6）を Phase 5-6 より前に実施。小規模で低リスクなため、Manager 抽出パターンの検証に最適。

## リファクタリング後のファイル構成

```
block-editor/
  types.ts                   ← 型定義（変更なし）
  blocks.ts                  ← バレル再エクスポート
  blocks/
    constants.ts             ← 寸法定数、SHAPE_CONFIGS
    block-behavior.ts        ← resolveBlockBehavior、形状ヘルパー
    block-defs.ts            ← ビルトインブロック定義、lookup
    input-helpers.ts         ← inputWidth、computeSlotPositions等
    procedure-helpers.ts     ← カスタム手続き関連ヘルパー
  factory.ts                 ← ブロック生成（変更最小）
  connections.ts             ← 接続・ゾーン登録（定数抽出+バリデーション統合）
  layout.ts                  ← レイアウト管理（関数分割）
  controller.ts              ← Facade（~500-600行に削減）
  procedure-manager.ts       ← 手続き管理（新規）
  persistence-manager.ts     ← 永続化管理（新規）
  variable-manager.ts        ← 変数管理（新規）
  view.tsx                   ← React表示（変更なし）
  sample-scene.ts            ← テストヘルパー（変更なし）
  *.test.ts                  ← テスト（最小限の変更）
```

## 対象ファイル一覧

### 変更するファイル
- `client/web/features/editor/block-editor/controller.ts`
- `client/web/features/editor/block-editor/connections.ts`
- `client/web/features/editor/block-editor/layout.ts`
- `client/web/features/editor/block-editor/blocks.ts`
- `client/web/features/editor/block-editor/factory.ts`
- `client/web/features/editor/block-editor/types.ts`

### 新規作成するファイル
- `client/web/features/editor/block-editor/procedure-manager.ts`
- `client/web/features/editor/block-editor/persistence-manager.ts`
- `client/web/features/editor/block-editor/variable-manager.ts`
- `client/web/features/editor/block-editor/blocks/constants.ts`
- `client/web/features/editor/block-editor/blocks/block-behavior.ts`
- `client/web/features/editor/block-editor/blocks/block-defs.ts`
- `client/web/features/editor/block-editor/blocks/input-helpers.ts`
- `client/web/features/editor/block-editor/blocks/procedure-helpers.ts`

### 変更しないファイル
- `view.tsx` — 公開APIを維持するため変更不要
- `sample-scene.ts` — テストヘルパー、変更不要

## 検証方法

各Phase完了後に以下を実行：
```bash
# 型チェック
cd client/web && bunx tsc --noEmit

# リント（未使用import等の検出）
cd client/web && bun run lint

# ビルド確認
cd client/web && bun run build
```

Phase 5-6（Manager抽出）完了後の追加検証：
```bash
# controller.ts の公開メソッド一覧が変わっていないことを確認
grep -n 'public\|^\s\+\w\+(' client/web/features/editor/block-editor/controller.ts
```

最終確認として `make dev-client` でブロックエディタの動作を目視確認。
