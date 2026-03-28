# ブロックエディタ: フォーム要素のオクルージョン（重なり）対策

## 原因

ブロックエディタでは `.dom-overlay` が `pointer-events: none` に設定されており、
子要素の `.scratch-block` もこれを継承する。
一方、`<select>` や `<input>` には CSS で明示的に `pointer-events: auto` が指定されている。

```
.dom-overlay          → pointer-events: none（キャンバスにイベントを透過させるため）
  .scratch-block      → pointer-events: none（継承）
    <select>          → pointer-events: auto（CSS で明示指定）
```

この構造により、**ブロック div 自体はイベントのヒットテストに参加しない**。
`z-index` でブロックの前後関係を正しく設定しても、
ブラウザのヒットテストは `pointer-events: auto` を持つ `<select>` に直接到達する。

結果として、上のブロックが視覚的に覆っていても、
下のブロックの `<select>` がクリック・ホバーに反応してしまう。

### なぜ CSS だけでは解決できないか

| 試した方法 | 結果 |
|---|---|
| `.scratch-block` に `pointer-events: auto` を追加 | ブロック div はヒットテストに参加するが、native `<select>` はブラウザのネイティブウィジェットとして z-index を無視してイベントを受け取る（macOS で確認） |
| `document.elementsFromPoint()` で判定 | `.dom-overlay` の `pointer-events: none` により、ブロック div が返却リストに含まれず判定不能 |
| 最前面チェーン以外の input に `pointer-events: none` | 重なっていないブロックの input まで無効化されてしまう |

## 対処法（最終実装）

**Container 座標によるヒットテスト + 動的 `pointer-events` 切り替え**

### 関連ファイル

- `client/web/features/editor/components/block-workspace.tsx` — ハンドラ実装
- `client/web/app/globals.css` — `.scratch-block { pointer-events: auto }` 追加

### 仕組み

`block-workspace.tsx` の `useEffect` 内で 3 つの機構を組み合わせる。

#### 1. `isFormOccluded(el)` — オクルージョン判定関数

フォーム要素の中心座標を `screenToWorld()` でワールド座標に変換し、
`containersRef.current`（レンダー順 = z-index 順）を逆順に走査。
対象ブロックより高い z-index のコンテナがその位置を覆っていれば `true`。

#### 2. `pointermove` キャプチャハンドラ

マウスが覆われた `<select>` / `<input>` に入った瞬間、
その要素に `pointer-events: none` を動的に設定する。

これにより以後のイベント（mousedown 含む）は上のブロックに届き、
カーソルも `grab` になり、ドラッグ＆ドロップも正常に動作する。

#### 3. RAF tick での復元

毎フレーム、`pointer-events: none` を設定した要素を確認し、
覆われなくなっていれば `pointer-events` を復元する。
（ブロックをドラッグで移動した後に下の select が再び操作可能になる）

```
pointermove で select に触れる
  → isFormOccluded() で覆われているか判定
  → 覆われている → pointer-events: none を設定
  → 上のブロックがイベントを受け取る（cursor: grab, ドラッグ可能）

RAF tick（毎フレーム）
  → 無効化した要素を再チェック
  → 覆われなくなった → pointer-events を復元
```

### 詰まりやすいポイント

1. **`elementsFromPoint()` は使えない**: `.dom-overlay` の `pointer-events: none` により、
   子要素のブロック div がヒットテスト対象外になるため返却リストに含まれない

2. **`preventDefault()` だけではドラッグが効かない**: macOS の native `<select>` は
   `mousedown` の `preventDefault()` 後もマウスキャプチャを保持する場合がある。
   `pointer-events: none` で要素自体にイベントが届かないようにする必要がある

3. **`pointer-events: none` の復元タイミング**: 要素自体がイベントを受け取れなくなるため
   `mouseout` で復元できない。RAF tick で毎フレーム監視して復元する
