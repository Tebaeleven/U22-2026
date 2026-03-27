@AGENTS.md

# デザイン
shadcnを使う

# Supabase ローカル開発

## 起動

```bash
# プロジェクトルートで
make supabase-start    # Docker で Supabase 起動
make dev               # Next.js + Colyseus 起動
```

| サービス | URL |
|---|---|
| Next.js | http://localhost:4100 |
| Supabase API | http://127.0.0.1:54321 |
| Supabase Studio (DB GUI) | http://localhost:54323 |
| Mailpit (メール確認) | http://localhost:54324 |
| PostgreSQL | postgresql://postgres:postgres@127.0.0.1:54322/postgres |

## 認証デバッグ

### 新規登録

1. http://localhost:4100/join にアクセス
2. メールアドレス・ユーザー名・パスワード（8文字以上）を入力 → 「次へ」
3. 国を選択 → 「次へ」（ここで Supabase にユーザーが作成される）
4. 「始める」でトップページへ

ローカル環境ではメール確認が無効（`enable_confirmations = false`）なので、即ログイン状態になる。

### ログイン

1. http://localhost:4100/signin にアクセス
2. 登録済みのメールアドレスとパスワードを入力

### ログアウト

Navbar 右上のアバター → 「ログアウト」

### DB 確認

- Supabase Studio: http://localhost:54323 → Table Editor → `profiles` テーブル
- 登録するとトリガーで `profiles` レコードが自動作成される

### よく使うコマンド

```bash
make supabase-status   # Supabase の状態確認
make supabase-reset    # DB リセット（全マイグレーション再適用）
make supabase-types    # TypeScript 型定義を再生成
make supabase-stop     # Supabase 停止
```

## 認証の仕組み

- ブラウザ: `lib/supabase/client.ts` → `createBrowserClient()`
- サーバー: `lib/supabase/server.ts` → `createServerClient()` + cookies
- 保護ルート: `lib/supabase/auth.ts` → `requireAuth()` で未認証リダイレクト
- proxy.ts: Supabase セッションリフレッシュ（サーバーコンポーネントで auth.uid() を有効にするために必須）