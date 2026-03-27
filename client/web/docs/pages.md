# ページ一覧

Scratch 3.0 のサイト構造を参考にしたページ設計。

## コアページ（必須）

| パス | ページ名 | Scratch対応 | 説明 |
|------|---------|------------|------|
| `/` | トップページ | scratch.mit.edu/ | 注目プロジェクト、最新作品の紹介 |
| `/editor` | エディター | /projects/editor | ゲーム作成エディター（VPL + ステージ） |
| `/projects/[id]` | プロジェクト詳細 | /projects/[id] | 作品の実行・閲覧ページ |
| `/explore` | 探索 | /explore/projects/all | 公開作品の一覧・カテゴリ別ブラウズ |
| `/mystuff` | マイページ | /mystuff | 自分の作品一覧・管理 |

## ユーザー関連

| パス | ページ名 | Scratch対応 | 説明 |
|------|---------|------------|------|
| `/signin` | ログイン | /signin | ログインページ |
| `/join` | アカウント作成 | /join | ユーザー登録ページ |
| `/users/[username]` | プロフィール | /user/[username] | ユーザーの公開プロフィール・作品一覧 |
| `/settings` | 設定 | /account/settings | アカウント設定 |
| `/messages` | 通知 | /messages | コメント・フォロー等の通知一覧 |

## コミュニティ

| パス | ページ名 | Scratch対応 | 説明 |
|------|---------|------------|------|
| `/studios/[id]` | スタジオ | /studio/[id] | 作品をまとめたコレクション |
| `/search` | 検索結果 | /search/projects | プロジェクト・ユーザーの検索 |

## 情報ページ

| パス | ページ名 | Scratch対応 | 説明 |
|------|---------|------------|------|
| `/ideas` | アイデア | /ideas | チュートリアル・サンプルプロジェクト集 |
| `/about` | サイト概要 | /about | プロジェクトの説明 |
| `/faq` | FAQ | /faq | よくある質問 |

## 実装フェーズ

### Phase 1（最小構成）

- `/` トップ
- `/editor` エディター
- `/projects/[id]` プロジェクト実行

### Phase 2（共有機能）

- `/explore` 探索
- `/mystuff` マイページ
- `/signin` / `/join` 認証

### Phase 3（コミュニティ）

- `/users/[username]` プロフィール
- `/studios/[id]` スタジオ
- `/search` 検索
- `/messages` 通知

### Phase 4（情報系）

- `/ideas` / `/about` / `/faq`
