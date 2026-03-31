# ブロックヘッダーの AutoLayout 化

## 概要

ブロックのヘッダー行（ブロック名 + ラベル + 入力スロット）の位置計算を、手動カーソル計算から headless-vpl の AutoLayout による自動配置に移行した。

## 背景と課題

### 問題

SVG デバッグ表示（headless-vpl の当たり判定座標）と React DOM のブロック表示がズレていた。

- headless-vpl 側: `estimateTextWidth()` でテキスト幅を推定し、カーソルベースでスロットの x 座標を手動計算
- DOM 側: CSS flex レイアウトで自然幅配置

推定幅と実際の DOM 幅が一致しないため、レポーターブロックをスロットにネストした時に余白が生じていた。

### 以前の構造

```
Container (block)
├─ top: Connector
├─ bottom: Connector
├─ slot0: AutoLayout [position = estimateTextWidth でハードコード]
├─ slot1: AutoLayout [position = カーソル計算]
├─ slot2: AutoLayout [position = カーソル計算]
└─ (body1, body2: C-block のみ)
```

- ブロック名やラベルテキストは DOM の span でのみ表示され、headless-vpl 側に対応要素がなかった
- スロットの x 座標は `layout.ts` の `computeSlotLayout()` 内でカーソル変数を進めながら手動設定

## 現在の構造

```
Container (block)
├─ top: Connector
├─ bottom: Connector
├─ value: Connector
├─ headerRow: AutoLayout (horizontal, gap=6, alignment=center)
│   ├─ labelName: Container (workspace なし, width=推定テキスト幅)
│   ├─ label_0: Container (workspace なし, width=推定ラベル幅)  ← "x:" 等
│   ├─ slotPlaceholder_0: Container (スロットと同サイズ, 位置計算用)
│   ├─ label_1: Container (workspace なし)
│   ├─ slotPlaceholder_1: Container
│   └─ ...
├─ slot0: AutoLayout (実際のスロット, placeholder の位置を使用)
├─ slot1: AutoLayout
└─ (body1, body2, bodyEntry1...: C-block のみ)
```

### headerRow の役割

- 全てのインライン要素（ブロック名、ラベル、スロット）を横方向に自動配置
- gap=6px で統一された間隔を保証
- alignment=center で縦方向中央揃え

### ラベル Container

- workspace を渡さずに作成（`new Container({ name: "...", width: w, height: h })`）
- SvgRenderer に描画されない（workspace 未登録のため `addElement` が呼ばれない）
- ただし親 Container の `propagateWorkspace` で workspace が伝搬されるとデバッグ表示に現れる

### slot placeholder

- headerRow の Children として配置され、AutoLayout による位置計算を受ける
- 実際のスロット AutoLayout は Container.children に登録（ネスト・アンカー用）
- `computeSlotLayout()` で placeholder の絶対位置をスロットのローカル位置に変換して同期

## レイアウト計算フロー

```
relayoutSlotsAndFitBlock(block)
  ↓
computeSlotLayout(block, isCBlock, baseSize)
  ├─ 各スロットの minWidth/minHeight を更新
  ├─ placeholder のサイズを実際のスロットサイズに同期
  ├─ headerRow.update() → AutoLayout が全子要素を自動配置
  ├─ placeholder の絶対位置 → スロットのローカル位置に変換
  └─ requiredWidth = headerRow.width + INLINE_PADDING_X * 2
  ↓
applyCBlockLayout() or applyStackLayout()
  └─ Container サイズを設定
```

## headless-vpl への変更

### workspace null 安全化

`MovableObject.move()` と `AutoLayout.update()/relayout()/move()` で `this.workspace?.eventBus.emit()` に変更。
workspace なしの Container/AutoLayout でもクラッシュしなくなった。

## 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `libs/headless-vpl/.../MovableObject.ts` | `workspace?.eventBus` で null 安全に |
| `libs/headless-vpl/.../AutoLayout.ts` | 同上（3箇所） |
| `block-editor/factory.ts` | headerRow 作成、ラベル/placeholder Container 作成 |
| `block-editor/layout.ts` | カーソル計算を削除、headerRow.update() + 位置同期に置換 |
| `block-editor/types.ts` | CreatedBlock に headerRow/labelContainers、SlotLayoutRef に placeholder 追加 |
| `block-editor/blocks/input-helpers.ts` | `computeSlotInfos`（位置なし版）追加 |
| `block-editor/view.tsx` | ラベル/ブロック名 span に固定幅スタイル適用 |

## 座標系の注意点

- headerRow の AutoLayout は `absolutePosition`（コンテナ位置 + ローカル位置）で子を配置する
- placeholder の `position` は `move()` により絶対座標で設定される
- スロット AutoLayout の `position` はコンテナ相対のローカル座標
- 同期時に `placeholder.position - container.position` でローカル座標に変換が必要

## ブロック定義の注意点

ブロック名の末尾に `x:` 等のラベルテキストを含めると、headless-vpl の座標計算と DOM の flex 配置がズレる原因になる。ラベルは必ず `inputs` 配列の `{ type: "label", text: "x:" }` として分離すること。

```typescript
// 悪い例
{ name: "Go to x:", inputs: [{ type: "number", default: 0 }, ...] }

// 良い例
{ name: "Go to", inputs: [{ type: "label", text: "x:" }, { type: "number", default: 0 }, ...] }
```
