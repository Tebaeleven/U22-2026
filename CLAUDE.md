# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

U22プログラミングコンテスト2026の作品リポジトリ。Colyseus ベースのマルチプレイヤーゲームと headless-vpl（ビジュアルプログラミング言語ライブラリ）を組み合わせたプロジェクト。

## 開発コマンド

```bash
# 初回セットアップ
make install

# 開発サーバー起動（クライアント + WebSocket + Supabase 全部起動）
make dev

# 個別起動
make dev-client    # Next.js → http://localhost:4100
make dev-server    # Colyseus → ws://localhost:4200
make dev-supabase  # Supabase ローカル環境

# 停止・状態確認・ログ
make stop          # 全部停止
make stop-supabase # Supabase のみ停止
make status
make logs-client
make logs-server

# Supabase ユーティリティ
make migrate         # 未適用マイグレーションのみ適用（データ保持）
make reset-supabase  # DB リセット（全データ削除 → マイグレーション再適用 + シード）
make gen-types       # TypeScript 型生成
```

### クライアント単体コマンド（client/web/）

```bash
bun run dev          # 開発サーバー
bun run build        # プロダクションビルド
bun run lint         # ESLint 実行
```

### サーバー単体コマンド（server/websocket/）

```bash
bun run dev          # tsx --watch で起動
bun run start        # tsx で起動
```

### headless-vpl ライブラリ（libs/headless-vpl/）

```bash
# ルートから（推奨）
make build-vpl       # ビルド + クライアントの node_modules にコピー
make test-vpl        # Vitest テスト実行
make lint-vpl        # Biome リンター実行
make watch-vpl       # ファイル監視 → 変更時に自動ビルド（要 fswatch）

# libs/headless-vpl/ 単体
bun run build:lib    # ライブラリビルド（dist/ 生成）
bun run test         # Vitest テスト実行
bun run lint         # Biome リンター
bun run format       # Biome フォーマッター
```

## アーキテクチャ

```
client/web/          → Next.js 16 + React 19 フロントエンド（Bun）
server/websocket/    → Colyseus WebSocket サーバー（Bun + tsx）
server/supabase/     → Supabase（マイグレーション・設定）
libs/headless-vpl/   → VPL ライブラリ（Git サブモジュール、Bun + Vite）
```

### エディタのフォルダ構造

```
client/web/features/editor/
├── block-editor/              ← ブロックエディタ本体（コントローラー、接続、レイアウト、永続化）
│   └── blocks/                ← ブロック定義（block-defs.ts: 396定義）、形状・振る舞い・定数
├── engine/                    ← VM / ランタイムエンジン
│   ├── runtime.ts             ← メインゲームループ、スプライト状態、スレッド管理
│   ├── sequencer.ts           ← スレッド実行スケジューラ（ラウンドロビン）
│   ├── thread.ts              ← 実行スレッド（ブロックスタック、フレームスタック）
│   ├── script-builder.ts      ← ブロックデータ → 実行可能 ScriptBlock ツリー変換
│   ├── program-builder.ts     ← 全スプライト一括コンパイル
│   ├── block-registry.ts      ← オペコード → ブロック関数ディスパッチ
│   ├── types.ts               ← BlockUtil, GameSceneProxy, SpriteRuntime 等の型定義
│   └── primitives/            ← 21カテゴリのプリミティブ関数
│       ├── motion.ts, looks.ts, sound.ts, events.ts
│       ├── control.ts, sensing.ts, operators.ts, variables.ts
│       ├── observer.ts, physics.ts, clone.ts, camera.ts
│       ├── tween.ts, math.ts, timer.ts, text.ts
│       ├── particle.ts, anim.ts, state-machine.ts
│       ├── scene-util.ts, sprite-util.ts
│       └── index.ts           ← 全プリミティブの再エクスポート
├── codegen/                   ← コード生成パイプライン
│   ├── class-parser.ts        ← クラスベース疑似コード → ClassProgramAST
│   ├── ast-types.ts           ← AST 型定義（ProgramAST, StatementNode, ExprNode 等）
│   ├── ast-converter.ts       ← ClassProgramAST → ProgramAST 正規化変換
│   └── block-generator.ts     ← AST → SerializedBlockNode[] 変換
├── renderer/                  ← Phaser ベースのゲームレンダラー
│   ├── phaser-stage.tsx       ← Phaser インスタンスの React ラッパー
│   └── game-scene.ts          ← ゲームシーン実装（物理・スプライト・トゥイーン）
├── components/                ← React UI コンポーネント（23ファイル）
│   ├── block-workspace.tsx    ← ブロックキャンバス
│   ├── block-palette.tsx      ← ブロックパレット
│   ├── stage-panel.tsx        ← ゲームプレビュー
│   ├── sprite-list.tsx        ← スプライト一覧
│   └── ...                    ← デバッグ、アセット、コスチューム、サウンド等
├── samples/                   ← サンプルプロジェクト（11カテゴリ）
│   ├── physics/, camera/, tweens/, particles/, timer/
│   ├── input/, animation/, math/, control/, sound/
│   └── games/                 ← 完成ゲーム例（Breakout, Snake, Pong 等）
├── hooks/                     ← React hooks
└── utils/                     ← ユーティリティ（画像境界検出等）
```

### 通信フロー

クライアント（Colyseus SDK）→ WebSocket → Colyseus サーバー → Schema ベースの状態自動同期

### クライアント構成

- **App Router**（`app/` ディレクトリ）
- **Feature ベース**のディレクトリ構成（`features/game/` 等）
- パスエイリアス: `@/*` → `./*`
- スタイリング: Tailwind CSS v4
- クライアントコンポーネントは `"use client"` ディレクティブが必要

### headless-vpl の統合

`client/web/scripts/prepare-headless-vpl.mjs` が `libs/headless-vpl/dist` を `node_modules/headless-vpl` にコピーする。`bun run dev` / `bun run build` 実行時に自動で走る。

## ユビキタス言語

ブロックエディタの用語定義は @docs/ubiquitous-language.md を参照。
ユーザーが「レポーターブロック」「ディファインブロック」「引数ブロック」等の用語を使った場合、このドキュメントに基づいて解釈すること。

## ガイド（トラブルシュート・ベストプラクティス）

@docs/guide/ にコネクタ接続周りの過去の問題点と解決策がまとめられている。ブロックの接続・近接判定・ネスティングに関する修正を行う前に必ず目を通すこと。

- @docs/guide/block-editor-connector-proximity.md — スロット近接ハイライト、コネクタ `hitRadius` と当たり判定の整合、Forever body への C ブロックネスト問題と `skipNearLayoutCheck` による対処

## 重要な注意事項

- **Next.js 16.2.1** はトレーニングデータと異なる破壊的変更がある。コードを書く前に `node_modules/next/dist/docs/` のガイドを確認すること
- サーバー側の TypeScript は `experimentalDecorators: true`（Colyseus Schema 用）
- headless-vpl は Git サブモジュール。変更時は本体リポジトリとの整合性に注意
- 全て日本語で返答すること

### headless-vpl に関する制約

- **headless-vpl（`libs/headless-vpl/`）のコードは絶対に変更しないこと**
- headless-vpl は If ブロック（`c-block`）のネスティングが正しく動作している実績がある
- Forever ブロック（`cap-c`）のネスティングが動作しない場合、原因は headless-vpl ではなく `client/web/features/editor/` 側の実装にある
- 修正は常に `client/web/` 以下のコードで行うこと