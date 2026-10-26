# Security Console — イノルトのサイト安全管理

Next.js App Router / TypeScript / Tailwind CSS / Supabase (PostgreSQL + Auth)。既存の採用サイトは変更せず、このディレクトリに独立したアプリを追加しています。

日常的に使う方は [「URLを開くだけ」の利用方法](docs/simple-use.md) を参照してください。初回の本番配置を済ませれば、普段の起動依頼やコマンド操作は不要です。固定URLはまだ発行していません。

## 実装範囲

- メール・パスワードによる登録、ログイン、メール確認コールバック、ログアウト、セッション更新。
- 管理サイトの作成・一覧・編集・削除。確認事項が紐づくサイトの削除はDBが拒否。
- 脆弱性／確認事項のCRUD、重要度、対応状況、改善・再確認記録、期限、検索・絞り込み。
- 登録データから件数と対応完了率を算出。操作履歴をDBトリガーで記録。
- 個人ごとのRLS。匿名、別ユーザー、所有者の付け替え、操作履歴の改ざんを拒否。
- 読み込み、空データ、保存成功、通信・権限エラー、削除確認。レスポンシブUI。

**自動スキャンや脆弱性の自動検出は実装していません。** 権限のある対象について確認した事実を記録する管理アプリです。完了率は安全性のスコアではありません。チーム共有・組織管理・監視ジョブ・通知は今後の拡張対象です。

## ローカル開発（このクラウド環境）

Node.js 24、npm、Docker Compose、curl、Chromiumが必要です。各タスクは隔離済みなので既存チェックアウトを使い、明示的な依頼がなければGit worktreeを追加しません。

```bash
cd /workspace/CODEX/security-app
npm_config_cache=/workspace/.npm-cache npm ci
npm run db:start
npm run db:env
npm run dev
```

- ローカル検証はDocker Composeで公式PostgreSQL / Supabase Auth (GoTrue) / PostgREST / Nginxを起動します。標準Supabase CLI構成は、この環境のVFS方式のDockerで展開時に容量不足になったため、使用するコンポーネントだけに絞りました。公開Supabaseの全機能を再現するものではありません。
- `db:start` はローカル用のランダムなDBパスワード・JWT署名鍵を無視対象の `dev/.env.local-stack` に生成し、権限0600で保存します。既存の値は保持。アプリには公開anonキーだけを `.env.local` に保存し、既存ファイルを上書きしません。これらのファイルを公開・コミットしないでください。
- `dev/bootstrap.sql` はローカルの認証用ロールと `auth.uid()` を初期化します。`supabase/migrations` は本番Supabaseと共通のアプリスキーマです。マイグレーションはトランザクションと実行済み記録を使い、再起動時に再適用しません。既存DBをリセットしません。
- APIはDockerホストのループバック54321だけに公開します。ローカルゲートウェイはAPIキー検証を行わず、データ認可をPostgRESTのJWT検証とDB権限・RLSで行います。本番のSupabase gatewayの代替として公開する構成ではありません。
- ローカルではメール確認を無効にしています。本番は下記手順で有効にします。DBキーや署名鍵を本番環境へ流用しないでください。
- Dockerプロセスは環境スナップショットに依存せず、毎回 `db:start` で再起動します。停止は `npm run db:stop`（ボリューム保持）。初回はDocker Hubの公式イメージ取得にネットワークが必要です。イメージは検証したdigestに固定しています。別タスクへのDockerボリューム引き継ぎは未検証です。消失時は空の開発用DBを再作成します。本番データは外部Supabaseで管理してください。

```bash
npm run build
npm run start
# 別ターミナル：上記の本番サーバーとローカルDBを使用
npm run typecheck
npm test
```

Playwrightは `/usr/bin/chromium` を使用します。他のマシンでは `PLAYWRIGHT_CHROMIUM_EXECUTABLE` を指定してください。テストは `127.0.0.1` のDB以外には実行できません。架空の `.test` アカウントと管理データだけを使います。アカウントとその操作履歴はローカル検証用DBに残ります。テストは実行順に依存し、1ワーカーで実行します。

## 公開用Supabaseプロジェクトの作成・接続

1. ご本人のSupabaseアカウントでダッシュボードを開き、組織と「New project」を選びます。名前・リージョン・プランを決め、DBパスワードは安全な場所に保存してください。実運用のリージョンや契約条件は組織の管理方針に合わせます。
2. 新規プロジェクトのSQL Editorで [スキーマ](supabase/migrations/20261026000000_security.sql) を実行します。既存スキーマへ再実行するスクリプトではありません。運用後の変更は追加マイグレーションで管理します。
3. プロジェクトのConnect/API設定からURLとpublishable key（またはlegacy anon key）を取得します。環境設定に `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を登録します。これらはブラウザーで使う公開設定です。**service_role / secret key / DBパスワードを使わないでください。** キーをチャットやGitHubへ貼らないでください。
4. ネットワーク制限がある環境では、そのプロジェクトの `<project-ref>.supabase.co` を許可します。CSPは標準Supabaseホストに対応しています。カスタムドメインの場合は `next.config.ts` の接続先も合わせて設定してください。
5. Auth設定でメール確認を有効にし、パスワード最小12文字、公開先のSite URLと許可する `/auth/callback` URLを設定します。必要に応じて組織の方針で公開登録を停止し、招待制にします。本番メールはSMTPを設定し、配信とリダイレクトを確認してください。
6. 公開環境用の変数に切り替えて再ビルドします。2アカウントで認証・CRUD・相互アクセス拒否を再検証してから運用を開始します。ローカルの確認結果だけで本番のRLS検証済みとはしません。
7. Next.jsサーバーとして配置してください。GitHub Pagesの静的公開だけでは動作しません。HTTPSを使用し、ホスト側のHSTS、監視、バックアップ、保持期間と退職時のアクセス管理を組織で設定します。

クラウド環境の設定保存・Publishと、アプリの本番デプロイ・Supabase作成は別の操作です。この作業ではSupabaseの外部管理ツールやご本人のログイン済みブラウザーがなく、クラウドプロジェクトを作成したとは主張しません。

## スキーマと安全なアクセス

SQLが正本です。[設計](docs/architecture.md)も参照してください。

| テーブル | 主な列 | 制約・アクセス |
| --- | --- | --- |
| `sites` | `id`, `owner_id`, `name`, `url`, `description`, `created_at` | UUID主キー。所有者は `auth.uid()`。HTTP(S) URL、文字数制約、本人だけCRUD |
| `issues` | `id`, `owner_id`, `site_id`, `title`, `severity`, `status`, `description`, `remediation`, `due_date`, `created_at`, `updated_at` | `(site_id, owner_id)` 複合FKで同じ所有者のサイトだけ参照。列挙値・文字数制約、本人だけCRUD |
| `audit_events` | `id`, `owner_id`, `entity_type`, `entity_id`, `entity_label`, `action`, `created_at` | DBトリガーが追加。本人はSELECTのみ。サイト・確認事項の削除後も履歴を保持 |

所有者・ID・作成日時は変更できません。更新日時はDBが設定。クライアントは公開キー＋利用者JWTで操作し、service_roleを使いません。RLSに加え、GRANT・DB制約を適用しています。履歴トリガーのみ最小限の `security definer` と固定search_pathを使用し、直接実行権限を剥奪しています。

患者情報・認証情報を入力しないでください。操作履歴にもサイト名・確認事項名が残るため、入力制限は履歴にも適用されます。履歴はこのアプリ利用者からの改ざんを防ぎますが、DB管理者に対する外部の改ざん防止監査基盤ではありません。

## ブランド素材とデザイン

承認済み `images/inoruto-logo.png` がリポジトリにないため、ロゴは未配置表示です。文字や生成画像によるロゴの再現はしていません。素材を受領後、PNGをそのまま `public/images/inoruto-logo.png` に配置してください。共通ヘッダー左上で暗背景・縦横比維持・正式な代替テキスト・ホームリンクを適用します。

色・余白・角丸は `app/globals.css` の変数を基盤としています。オレンジ `#ed6d29`、黒 `#18191d` は未承認の提案色。元の採用サイトの緑配色はそのまま残しています。詳細は [デザイン判断](docs/design.md)。

## 検証結果

実行コマンド、テスト範囲、PC・スマートフォンのスクリーンショット、未検証事項は [検証記録](docs/validation.md) に記載しています。開発用ゲートウェイの許可Originは127.0.0.1に限定しています。外部プレビューや本番公開には、本番Supabaseへの切り替えと公開先に合わせた設定が必要です。
