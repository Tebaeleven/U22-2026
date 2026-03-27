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

## 重要な注意事項

- **Next.js 16.2.1** はトレーニングデータと異なる破壊的変更がある。コードを書く前に `node_modules/next/dist/docs/` のガイドを確認すること
- サーバー側の TypeScript は `experimentalDecorators: true`（Colyseus Schema 用）
- headless-vpl は Git サブモジュール。変更時は本体リポジトリとの整合性に注意
