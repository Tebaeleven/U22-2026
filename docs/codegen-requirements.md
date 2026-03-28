# 要件定義: Phaser コード → 疑似コード → ブロック配置 自動生成パイプライン

## 1. 背景と目的

現在、デモプログラムのブロック配置は `sprites.ts` に手書きの `SerializedBlockNode[]` として定義している。これは以下の問題がある:

- builtin ID（`"builtin:77"` 等）を手動で調べて指定する必要がある
- `nextId` / `bodyChildren` / `slotChildren` の接続を手動で管理する
- Phaser サンプルコードとブロック配置の対応を目視で確認するしかない
- 新しいブロックを追加するたびに ID がずれて全体が壊れる

**目的**: Phaser のサンプルコードを中間表現（疑似コード）に変換し、その疑似コードから `SerializedBlockNode[]` を自動生成する。

## 2. パイプライン概要

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Phaser コード    │     │  疑似コード (IR)   │     │  ブロック配置 JSON    │
│  (TypeScript)    │ ──→ │  (構造化データ)     │ ──→ │  (SerializedBlockNode) │
│                  │ 手動 │                    │ 自動 │                       │
│  ※人間/AIが書く   │     │  ※定義済みの文法    │     │  ※エディタが読み込む   │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
                             ↕ 双方向
                    ┌──────────────────┐
                    │  デバッグパネル表示 │
                    │  (既存機能)       │
                    └──────────────────┘
```

### 変換フロー

**Step 1**: Phaser コード → 疑似コード（手動 or AI 支援）
- Phaser の関数呼び出しを VPL の疑似コード記法に翻訳
- スプライトごとに分割

**Step 2**: 疑似コード → ブロック配置 JSON（自動、本要件のスコープ）
- 疑似コードをパースして AST にする
- AST から `SerializedBlockNode[]` を生成
- 位置（x, y）を自動レイアウト

## 3. 疑似コード仕様（中間表現 = IR）

### 3-1. フォーマット

疑似コードは **スプライトごと** に記述する。1つのスプライトは複数のイベントハンドラを持つ。

```
sprite "プレイヤー" {
  on flagClicked {
    setPhysics("dynamic")
    setGravity(1000)
    goto(-600, -204)
    setBounce(0.1)
    setCollideWorldBounds(on)
    score = 0
    hp = 100
    addText("SCORE: 0", -800, 480)
  }

  on keyPress("space") {
    createClone("弾")
  }

  on flagClicked {
    while (true) {
      if (isKeyPressed("left arrow")) {
        setVelocityX(-250)
      } else {
        if (isKeyPressed("right arrow")) {
          setVelocityX(250)
        } else {
          setVelocityX(0)
        }
      }
      if (isKeyPressed("up arrow") && isOnGround()) {
        setVelocityY(-550)
      }
    }
  }
}

sprite "地面" {
  on flagClicked {
    setPhysics("static")
    goto(0, -380)
  }
}
```

### 3-2. 文法定義

```
Program     = SpriteBlock*
SpriteBlock = "sprite" STRING "{" EventBlock* "}"
EventBlock  = HatHeader "{" Statement* "}"

HatHeader   = "on" HatType
HatType     = "flagClicked"
            | "keyPress" "(" STRING ")"
            | "clone"
            | "touched" "(" STRING ")"
            | "event" "(" STRING ")"
            | "varChange" "(" STRING ")"

Statement   = Assignment
            | FunctionCall
            | IfStatement
            | IfElseStatement
            | WhileStatement
            | RepeatStatement
            | ForStatement
            | ReturnStatement

Assignment  = IDENTIFIER "=" Expression
            | IDENTIFIER "+=" Expression

FunctionCall = IDENTIFIER "(" ArgList? ")"

IfStatement     = "if" "(" Expression ")" "{" Statement* "}"
IfElseStatement = "if" "(" Expression ")" "{" Statement* "}" "else" "{" Statement* "}"
WhileStatement  = "while" "(" Expression ")" "{" Statement* "}"
RepeatStatement = "repeat" "(" Expression ")" "{" Statement* "}"
ForStatement    = "for" "(" IDENTIFIER "in" Expression ".." Expression ")" "{" Statement* "}"

Expression  = Literal
            | IDENTIFIER
            | FunctionCall
            | Expression BinaryOp Expression
            | UnaryOp Expression
            | "(" Expression ")"

BinaryOp    = "+" | "-" | "*" | "/" | "%" | ">" | "<" | "==" | "&&" | "||"
UnaryOp     = "!"

Literal     = NUMBER | STRING
```

### 3-3. 関数名 → opcode マッピング

疑似コードの関数名と VPL ブロックの opcode の対応表:

| 疑似コード関数 | opcode | 分類 |
|--------------|--------|------|
| `move(steps)` | `motion_movesteps` | motion |
| `turnRight(degrees)` | `motion_turnright` | motion |
| `goto(x, y)` | `motion_gotoxy` | motion |
| `glide(secs, x, y)` | `motion_glidesecstoxy` | motion |
| `tweenTo(x, y, secs)` | `motion_tweento` | motion |
| `setVelocityX(vx)` | `physics_setvelocityX` | physics |
| `setVelocityY(vy)` | `physics_setvelocityY` | physics |
| `setVelocity(vx, vy)` | `physics_setvelocity` | physics |
| `setPhysics(mode)` | `physics_setmode` | physics |
| `setGravity(g)` | `physics_setgravity` | physics |
| `setBounce(b)` | `physics_setbounce` | physics |
| `setCollideWorldBounds(on/off)` | `physics_setcollideworldbounds` | physics |
| `setAllowGravity(on/off)` | `physics_setallowgravity` | physics |
| `disableBody()` | `physics_disablebody` | physics |
| `enableBody()` | `physics_enablebody` | physics |
| `show()` | `looks_show` | looks |
| `hide()` | `looks_hide` | looks |
| `say(msg, secs)` | `looks_sayforsecs` | looks |
| `setTint(color)` | `looks_settint` | looks |
| `clearTint()` | `looks_cleartint` | looks |
| `setAlpha(pct)` | `looks_setopacity` | looks |
| `setFlipX(on/off)` | `looks_setflipx` | looks |
| `addText(text, x, y)` | `looks_addtext` | looks |
| `setText(text)` | `looks_updatetext` | looks |
| `removeText()` | `looks_removetext` | looks |
| `floatingText(text)` | `looks_floatingtext` | looks |
| `graphics.fillRect(x,y,w,h,c)` | `graphics_fillrect` | graphics |
| `graphics.clear()` | `graphics_clear` | graphics |
| `wait(secs)` | `control_wait` | control |
| `stop()` | `control_stop` | control |
| `restart()` | `control_restart` | control |
| `createClone(target)` | `clone_create` | clone |
| `deleteClone()` | `clone_delete` | clone |
| `emit(name)` | `observer_sendevent` | events |
| `touching(name)` | `sensing_touchingobject` | sensing |
| `isKeyPressed(key)` | `sensing_keypressed` | sensing |
| `isOnGround()` | `physics_onground` | physics |

| 疑似コード変数/レポーター | opcode | 分類 |
|------------------------|--------|------|
| `x` | `motion_xposition` | reporter |
| `y` | `motion_yposition` | reporter |
| `direction` | `motion_direction` | reporter |
| `velocity.x` | `physics_velocityX` | reporter |
| `velocity.y` | `physics_velocityY` | reporter |
| `mouseX` | `sensing_mousex` | reporter |
| `mouseY` | `sensing_mousey` | reporter |
| `timer` | `sensing_timer` | reporter |
| `costumeNumber` | `looks_costumenumber` | reporter |
| 変数名（上記以外） | `data_variable` | reporter |

## 4. ブロック配置 JSON 生成仕様

### 4-1. 出力形式

```typescript
interface GeneratedBlockData {
  sprites: Array<{
    id: string
    name: string
    blockData: BlockProjectData  // { customProcedures, customVariables, workspace: { blocks } }
  }>
}
```

### 4-2. レイアウトルール

- ハットブロックは上から下に配置。各スクリプト間の縦間隔は 400px
- 2列目のスクリプトは x=500 から
- `nextId` チェーンは自動計算（ブロックの下端に次のブロックを配置）
- C-block の `bodyChildren` は再帰的にネストされた文の ID リスト
- `slotChildren` はレポーター/ブーリアン式を入力スロットにネスト

### 4-3. ID 生成

- `instanceId`: `"gen-{spritePrefix}-{連番}"` 形式
- `defId`: opcode から逆引き（`BUILTIN_BLOCK_DEFS` を検索）

### 4-4. 入力値マッピング

`inputValues` のキーは `String(inputIndex)`（ブロック定義の `inputs` 配列のインデックス）。label 型の入力はスキップしない（インデックスは含む）。

例: `physics_setvelocity` の inputs が `[number, label "y:", number]` の場合:
- `inputValues: { "0": "100", "2": "-300" }`（index 1 は label なので値なし）

## 5. 実装方針

### 5-1. ファイル構成

```
features/editor/codegen/
  ├── pseudocode-parser.ts    — 疑似コード文字列 → AST
  ├── ast-types.ts            — AST の型定義
  ├── block-generator.ts      — AST → SerializedBlockNode[]
  ├── opcode-map.ts           — 関数名 ↔ opcode マッピング
  └── layout.ts               — ブロック位置の自動計算
```

### 5-2. 処理フロー

```typescript
// 1. 疑似コードをパース
const ast = parsePseudocode(pseudocodeString)

// 2. スプライトごとにブロックデータを生成
const result = generateBlockData(ast)
// → { sprites: [{ id, name, blockData }] }

// 3. sprites.ts の DEFAULT_SPRITES と blockDataMap に反映
```

### 5-3. 双方向性

既存の `pseudocode-generator.ts` は `CompiledProgram → 疑似コード文字列` の変換。
新しい `pseudocode-parser.ts` + `block-generator.ts` は `疑似コード文字列 → SerializedBlockNode[]` の変換。

これにより:
- **正方向**: ブロック → CompiledProgram → 疑似コード（デバッグ表示）
- **逆方向**: 疑似コード → AST → ブロック配置（コード生成）

2つの変換は対称であるべき。正方向で出力した疑似コードを逆方向に入力すれば、元のブロック配置が再現される。

## 6. ユースケース

### UC-1: AI がゲームを生成する

1. AI に「プラットフォーマーを作って」とプロンプト
2. AI が Phaser サンプルコードを出力
3. AI が疑似コードに変換
4. パイプラインが疑似コードをパースし `BlockProjectData` を生成
5. エディタに読み込む → すぐに実行可能

### UC-2: 開発者がデモプログラムを更新する

1. `docs/` に Phaser サンプルコードを書く
2. 疑似コードに手動変換（AI 支援）
3. `codegen` を使って `BlockProjectData` を自動生成
4. `sprites.ts` の `DEFAULT_BLOCK_DATA` を置き換え
5. builtin ID のずれを気にする必要がなくなる

### UC-3: ユーザーがコードからブロックを生成する

1. ユーザーがエディタ上で疑似コードを入力（将来的な UI）
2. 入力された疑似コードからブロックを自動生成
3. ワークスペースに配置される

## 7. 制約と前提

- 疑似コード文法は既存の `pseudocode-generator.ts` の出力と互換
- `defId` は実行時に `BUILTIN_BLOCK_DEFS` から opcode で逆引き（ID のハードコードを避ける）
- C-block のネストは再帰的に処理（最大深度制限なし）
- reporter のネスト（`(a + b) * c` → `operator_multiply` に `operator_add` がネスト）に対応
- 変数名は `customVariables` フィールドから自動収集

## 8. 優先度

| フェーズ | 内容 | 目的 |
|---------|------|------|
| P0 | `opcode-map.ts` — 関数名↔opcode 双方向マップ | 基盤 |
| P0 | `pseudocode-parser.ts` — 疑似コード→AST パーサー | 基盤 |
| P0 | `block-generator.ts` — AST→SerializedBlockNode[] | 基盤 |
| P1 | `layout.ts` — ブロック位置自動計算 | UX |
| P1 | `sprites.ts` を codegen ベースに書き換え | メンテナンス性 |
| P2 | エディタ UI に疑似コード入力欄を追加 | ユーザー向け |
