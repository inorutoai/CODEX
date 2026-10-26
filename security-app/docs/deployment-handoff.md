# 固定URL公開作業の引き継ぎ

## ソースと公開先

- リポジトリ：`https://github.com/inorutoai/CODEX`
- アプリのブランチ：`codex/security-console`
- アプリのディレクトリ：`security-app`
- ホスティング予定：Vercel。Root Directoryは `security-app`。
- Git連携で公開する場合、デプロイ対象も `codex/security-console` ブランチにする。未反映の `main` をそのまま指定しない。
- バックエンド：Supabase。
- 利用者向けの固定URL：未発行。デプロイ成功の確認はまだない。

`main` には元の採用サイトがある。アプリを探すときは、このブランチを取得すること。既存の作業内容を `git status` で確認し、他の変更を破棄・上書きしない。各タスクは隔離済みなので、明示的な依頼がなければworktreeを作らない。

## 実装・検証済み

Next.js / TypeScript / Tailwind CSSによる管理画面、Supabase Auth、サイト・確認事項のCRUD、検索、対応状況と期限、変更履歴、本人だけのRLSを実装済み。自動スキャン・組織共有は未実装。[検証記録](validation.md)を参照。

ローカル開発用のCompose構成は本番に公開しない。本番は外部SupabaseとVercelへ接続する。`vercel.json` とNode.js 24の指定は同梱済み。初回マイグレーションは `supabase/migrations/20261026000000_security.sql`。

## Supabase認証で止まっている点

ユーザーはSupabaseにログインし、プロジェクトを作成したと報告済み。予定名は `inoruto-security` だが、プロジェクトID・URLはAPIでまだ確認できていない。重複するプロジェクトを勝手に作成しない。

`SUPABASE_ACCESS_TOKEN` は環境設定で登録・公開済み。最後に確認した設定はsourceが `environment`、保存済みbindingあり、接続先は `api.supabase.com`。この作業セッションからの `GET https://api.supabase.com/v1/projects` は401、応答は `Format is Authorization: Bearer [token]`。Python urllibとcurl、通常経路と昇格経路で確認している。個人用から環境用への切り替えと公開後も、このセッションでは成功しなかった。

ユーザーは、元の登録値がAccountのAccess Tokensで発行した `sbp_` から始まるトークン本体であると確認済み。実行環境の値は秘密を隠した代理文字列なので、その文字列自体の形から元のトークンが間違っていると判断しない。ユーザーに再発行・再入力を繰り返させず、まず新しい実行環境で既存bindingによる読み取り接続を確認する。認証成功やプロジェクト操作成功を、401のまま主張しない。

秘密値をチャット、ツール出力、コミット、起動手順へ出さない。保存済みの設定名とAPI応答状態だけを確認する。確認に必要なネットワーク権限は通常のツール手順で取得し、TLS検証やアクセス制御を無効化しない。

## 次に行う作業

1. 上記ブランチのアプリを確認し、保存済みSupabase認証でプロジェクト一覧を読む。
2. 認証できたら既存プロジェクトの状態とスキーマを確認し、未適用のアプリスキーマ・RLS・認証コールバックを設定する。既存データをリセットしない。
3. Vercelの操作権限を確認する。現在この環境に `VERCEL_TOKEN` は未登録で、空だった要件は削除済み。必要な場合だけ安全な環境設定に要件を追加し、値はチャットで求めない。
4. 公開用SupabaseのURLと公開anon/publishableキーをVercelに設定してデプロイする。service_roleキーやDBパスワードをフロントエンドへ渡さない。アカウントの契約条件・料金が変わる操作は、具体的な条件を確認してから扱う。
5. 実際に発行されたURLを使ってSite URL・許可コールバック・メール確認を設定し、認証・CRUD・2ユーザー間の拒否を検証して利用者へURLを渡す。ローカル専用テストを本番DBへそのまま向けない。

承認済みロゴPNGも未提供。`public/images/inoruto-logo.png` に提供素材をそのまま配置し、ロゴを文字や生成画像で再現しない。
