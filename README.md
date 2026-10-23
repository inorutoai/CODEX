# 医療従事者向け採用サイト

自社の医療従事者採用を想定した、1ページ構成の静的サイトです。HTML・CSSとローカル画像のみを使い、JavaScript、外部フォント、ビルド、ログイン、データベースは不要です。

## ファイルの場所

クラウドでの作業場所は `/workspace/CODEX`（Linux）です。Macにクローンした場合は、以下の例では `~/Projects/CODEX` にあります。

```text
CODEX/
├── index.html             # 全ページ内容・募集情報
├── style.css              # デザイン・スマートフォン対応
├── preview.html           # CSS・画像を埋め込んだ単独閲覧版（自動生成）
├── images/
│   └── care-team.svg      # この試作用に作成した仮イラスト
├── scripts/
│   └── build_preview.py   # Python 3標準ライブラリのみで単独閲覧版を再生成
├── screenshots/           # PC・スマホの確認画像と検証結果
└── README.md
```

トップ、私たちについて、働く環境、募集職種、応募の流れ、よくある質問、問い合わせ案内を掲載しています。

確認対象は1ページです。すべてのナビゲーションとボタンはページ内の各セクションへ移動します。別ページへのリンクや応募送信機能はありません。

## Windows・Macで単独閲覧版を開く

この作業の保存先は `/workspace/CODEX` です。手元のPCへファイルをダウンロードした場合は、保存したフォルダーを開いてください。GitHubにまだ反映されていない作業内容は、クローンでは取得できません。

- Windows：エクスプローラーで `preview.html` をダブルクリックし、EdgeやChromeで開きます。PowerShellでは保存先で `Start-Process .\preview.html` を実行できます。
- Mac：Finderで `preview.html` をダブルクリックします。ターミナルでは保存先で `open preview.html` を実行できます。
- `preview.html` は1ファイルだけをコピー・共有してもCSSと画像が表示されます。CDN・外部フォント・外部画像・JavaScriptへの依存はありません。
- 共同編集では `index.html`・`style.css`・`images/` を編集してください。こちらを確認するには同じフォルダー構成を保ったまま `index.html` を開きます。

## preview.htmlの再生成

`preview.html` は直接編集せず、共同編集用ファイルを変更した後に再生成します。Python 3が必要です（閲覧には不要）。リポジトリのルートで実行してください。

Windows（PowerShell）：

```powershell
py -3 scripts/build_preview.py
Start-Process .\preview.html
```

Mac・Linux：

```bash
python3 scripts/build_preview.py
# Macで開く場合
open preview.html
```

生成スクリプトは `style.css` を埋め込み、`images/` の画像をdata URLへ変換します。元ファイルは保持し、`preview.html` だけを上書きします。現在のサイトにJavaScriptは不要です。今後スクリプト・CSS内画像・外部依存を追加する場合は、生成処理の拡張が必要です。未対応の依存を検出した場合はエラーで停止します。

## クラウドから自分のPCへ持ち出す

この環境はクラウド上のLinuxです。`/workspace/CODEX` は手元のPCのフォルダーではありません。クラウドのファイル一覧にダウンロード機能があれば、`preview.html` を取得し、WindowsのエクスプローラーまたはMacのFinderから開きます。チャットのリンクでコード表示になる場合は、HTMLファイルとしてダウンロードできたことを確認してください。リンクを表示できたことだけではダウンロード成功とは扱いません。

編集用ファイルも必要な場合は、別途用意した `medical-site.zip` をダウンロードし、新しいフォルダーに展開してください。ZIP内の `medical-site/index.html` と `medical-site/preview.html` が確認対象です。`style.css`・`images/` も含まれます。既存の編集フォルダーへ上書き展開しないでください。

GitHubの保存先は `https://github.com/inorutoai/CODEX.git`、この完成版のブランチは `site/static-preview` です。サイトの公開やデプロイは不要です。

初回（WindowsのPowerShell／Macのターミナル共通。Gitが必要）：

```bash
git clone --branch site/static-preview https://github.com/inorutoai/CODEX.git CODEX-preview
cd CODEX-preview
```

Windowsは `Start-Process .\preview.html`、Macは `open preview.html` で開きます。既存のcloneを利用する場合は未保存の変更を保護し、`git fetch origin` の後に `git switch --track origin/site/static-preview` で完成版ブランチへ切り替えます。同名のローカルブランチが既にある場合は `git switch site/static-preview` を使います。

次回以降は、取得したフォルダーで先に状態を確認します。

```bash
git status --short
```

変更・未追跡ファイルが表示された場合はpullせず、別フォルダーへのバックアップまたはコミットを先に行ってください。状態が空であることを確認し、現在のブランチの更新を取り込みます。

```bash
git pull --ff-only
```

ローカルのコミットがある、競合する、上流ブランチがないなどの理由で失敗した場合はそこで停止してください。`reset --hard` や強制上書きは不要です。

## 今回のブラウザー検証

Chromiumを使用し、HTTP経由で `index.html` と `preview.html` の両方を幅1440・768・390・320pxで確認しました。CSSの適用、画像読み込み、横方向のはみ出し、PCとスマホの列構成、ページ内リンク先、募集職種への移動、FAQの開閉、上部への移動を検証しています。両版の全ページスクリーンショットは各幅でピクセル単位で一致しました。

単独HTMLは、追加リソースへのリクエストをすべて遮断したブラウザーでもCSS・画像が表示されることを確認しました。ただし、このクラウド環境のブラウザーポリシーでは `file://` が `ERR_BLOCKED_BY_ADMINISTRATOR` で拒否されるため、ファイルの直接オープンは未確認です。チャット内の動作するサイトプレビューも提供していません。手元のWindows・Macでの直接閲覧、Safari・Firefox・実機スマートフォンは未確認です。

- `screenshots/index-desktop.png`・`screenshots/preview-desktop.png`：PC幅1440px
- `screenshots/index-mobile.png`・`screenshots/preview-mobile.png`：スマホ幅390px
- `screenshots/verification.json`：各検証条件と結果

スクリーンショットは今回の生成内容の記録です。編集・再生成後は改めて確認してください。

## Macで確認する

Gitを利用できる状態でターミナルから一度だけ取得します。Gitが未導入の場合は、`git --version` を実行してmacOSのインストール案内に従ってください。非公開リポジトリの場合はGitHubへのアクセス権も必要です。

```bash
mkdir -p ~/Projects
cd ~/Projects
git clone https://github.com/inorutoai/CODEX.git
cd CODEX
open index.html
```

Finderから `index.html` をダブルクリックしても開けます。初回の取得は、サイトの変更がGitHubに反映された後に行ってください。すでにクローンしている場合は再取得せず、そのフォルダーを使ってください。

編集後は保存してブラウザーを再読み込みします。毎回ダウンロードする必要はありません。別のメンバーの更新を取り込む場合は、ローカルの変更を先にコミットするなどして保護してから実行します。

```bash
cd ~/Projects/CODEX
git pull --ff-only
open index.html
```

すべてのファイル参照は相対パスです。`images` と `style.css` を `index.html` と一緒に保管してください。サーバーは必須ではありません。

### HTMLファイルだけで完成デザインを確認する

HTML単体を表示するプレビューや、`index.html` だけをダウンロードした場合、隣のCSS・画像を読み込めず、文字中心の表示になることがあります。

`preview.html` はCSSと仮イラストをすべて埋め込んだ確認用ファイルです。これだけをMacへ保存し、ブラウザーで開けばデザインを確認できます。追加の画像・CSS・サーバー・インターネット接続は不要です。Macのターミナルでは `open preview.html` を使います。HTMLを実行・描画しないテキストビューアーでは、ブラウザーで開き直してください。

共同編集の正本は引き続き `index.html`・`style.css`・`images/` です。`preview.html` は生成時点のコピーなので、正本を変更しても自動更新されません。更新時は `python3 scripts/build_preview.py`（Windowsは `py -3 scripts/build_preview.py`）で再生成してください。公開用のエントリーは引き続き `index.html` です。

## 任意のHTTP確認

Python 3がインストールされている場合だけ、チェックアウトのルートで次を実行できます。

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Macではブラウザーで自分のPCのポート8000へアクセスしてください。停止はターミナルで `Control+C` です。クラウドのポートはMacのポートとは別で、このオンボーディング画面からのプレビューには使いません。

## 仮情報と差し替え

- 施設名、理念、採用メッセージ、制度紹介、選考フロー、FAQは仮です。施設が実施している制度・診療内容を保証する文章ではありません。
- 「看護師」「その他の医療専門職」は掲載例です。募集の実施を示すものではありません。給与・勤務地・資格・勤務時間などは未確定のため記載していません。
- `images/care-team.svg` は仮イラストです。実在の施設や職員の画像ではありません。実際の写真に変更する場合は利用許諾・本人同意を確認し、HTMLの画像パスと代替テキストも更新してください。
- 応募窓口は準備中です。フォーム、ダミーのメールアドレス、個人情報の送信・保存機能はありません。

公開前に、施設の正式名称・所在地・診療内容、実際の職場情報、募集要項、選考方法、承認済みの応募窓口へ差し替えてください。確定した箇所だけ仮表示を外します。個人情報を取り扱う応募窓口を設ける場合は、適切なプライバシーポリシーと案内も準備してください。

## チームで更新する運用

### 管理者の初期設定

今回の運用整備のレビュー担当・公開確認担当は `@inorutoai` です。各更新Issueの作業担当は個別に指定します。GitHubのReviewer・Assignee設定はAPIまたは画面で実際に設定し、本文への記載だけで割当済みと扱わないでください。

この運用手順・テンプレート・生成スクリプトは、レビュー後に `main` へ統合してからチーム全員が使います。Issueテンプレートの通常表示にはデフォルトブランチへのマージが必要です。既存の作業ブランチにしかない間は、最新 `main` から始める作業ではまだ利用できません。

- GitHubのリポジトリ設定からチームメンバーを招待します。担当者は実際のGitHubユーザーを指定し、共有アカウントは使いません。
- `main` を統合先とします。管理者は利用プランで可能な範囲でRulesetsまたはBranch protectionを設定し、Pull Requestと別メンバー1名以上の承認を必須にし、強制push・ブランチ削除を禁止してください。このドキュメント追加だけでは保護設定は適用されません。
- 現在のリポジトリはPublicです。サイトに閲覧認証を付けてもソースは公開されたままです。機密情報や応募者情報をIssue・コード・画像に入れないでください。ソースも限定する場合は管理者が非公開化と影響を確認します。

### 1. Issueで担当と完了条件を決める

GitHubの **Issues → New issue** から「サイト更新」を選びます。テンプレートがまだ表示されない場合は、`.github/ISSUE_TEMPLATE/site-update.md` を使って手動作成できます。

- 目的、変更箇所、掲載する確定情報を記載します。
- **Assignees** に作業担当者を設定します。レビュー担当者と公開確認担当者も本文にGitHubユーザー名で記載し、担当者と合意します。
- 完了条件は、内容承認、PC・スマホ表示、相対パス、レビュー、マージ、公開後の認証と表示確認まで分けます。公開が未設定なら、実装完了と公開待ちを区別します。
- 未確定の給与・制度・応募先を推測で埋めず、掲載責任者に確認します。

### 2. 作業前に保存状態と最新コードを確認する

WindowsのPowerShellまたはMacのターミナルで作業フォルダーを開き、エディターの未保存ファイルを保存してから実行します。Gitはエディター内の未保存内容を検出できません。

```bash
cd /path/to/CODEX
git status --short --branch
```

変更があればその場で止まり、内容を確認します。必要な変更は現在の作業ブランチにコミットするか、`git stash push -u -m "作業前の退避"` で未追跡ファイルごと一時退避します。無関係な変更をまとめてコミットしないでください。ignoredファイルは `stash -u` の対象外です。`reset --hard`、`clean -fd`、強制pushは使いません。

クリーンな状態になったら、以下を順に実行します。いずれか失敗した場合は、後続を実行せず原因を確認します。

```bash
git switch main
git fetch origin refs/heads/main:refs/remotes/origin/main
git merge --ff-only origin/main
# 123をIssue番号、説明部分を作業内容に置き換える
git switch -c update/123-recruitment-copy
```

`--ff-only` が失敗したらローカルとリモートの履歴が分岐しています。他の人の変更を上書きせず、担当者と確認してください。退避した変更が今回の作業に必要なら、`git stash list` で対象を確認して `git stash apply` で戻し、内容を確認できるまで退避を削除しません。

### 3. 修正・表示確認・commit・push

`index.html`、`style.css`、必要な画像を修正します。HTML・CSS・画像を変更したら、必ず単独閲覧版も再生成します。

```bash
python3 scripts/build_preview.py
```

Windowsでは `py -3 scripts/build_preview.py` を使えます。Macでは次で直接開きます。

```bash
open index.html
```

Windowsでは `Start-Process .\index.html` と `Start-Process .\preview.html`、Macでは `open index.html` と `open preview.html` を使います。直接表示できない環境はHTTPで確認し、未確認の方法をPRに明記します。

ページ末尾の確認項目をPC（1440px）とスマートフォン（390px、必要に応じて320px）幅で確認します。両版で同じ画面幅・ブラウザー・ズーム・FAQ開閉状態を使い、デザインと画像を比較してください。開発者ツールのNetwork/ConsoleでCSS・画像の読み込み失敗がないことを確認し、リンクを実際に操作します。`screenshots/index-desktop.png`・`index-mobile.png`・`preview-desktop.png`・`preview-mobile.png` を更新し、PRに画像と確認条件を記載します。古い検証結果を今回の実行結果として流用しないでください。リンク・画像の参照は相対パスにし、フォームや認証のない応募情報収集は追加しません。確認後は差分を確認して、今回変更したファイルだけを指定します。

```bash
git diff
git diff --check
git status --short
# 以下は実際に変更したファイルだけに調整
git add -- index.html style.css preview.html screenshots/index-desktop.png screenshots/index-mobile.png screenshots/preview-desktop.png screenshots/preview-mobile.png
git diff --cached
git diff --cached --check
git commit -m "Update recruitment information"
git push -u origin HEAD
```

`.gitignore` は秘密情報の検査を代替しません。コミット前にAPIキー、メールの認証情報、応募者情報、未承認の写真が含まれていないことを確認します。

### 4. Pull Requestと競合の解消

GitHubで作業ブランチから `main` へのPull Requestを作成します。`.github/PULL_REQUEST_TEMPLATE.md` に沿って変更理由・確認結果・残る仮情報を記載し、Issueを `Refs #123` で関連付け、レビュー担当者に依頼します。公開確認まで管理するIssueには、マージ時に自動で閉じる `Closes` を使いません。

PR作成後に最新の `main` と競合した場合は、作業ブランチで実行します。

```bash
git status --short --branch
# ローカル変更があれば先に保護する
git fetch origin refs/heads/main:refs/remotes/origin/main
git merge origin/main
```

競合が発生したら `git status` と差分で両者の意図を読み、必要なら変更者に確認して編集します。`<<<<<<<`、`=======`、`>>>>>>>` を残さず、片側を一括採用しないでください。`preview.html` の競合は正本のHTML・CSS・画像を先に解消し、生成スクリプトで再生成します。解消したファイルだけ `git add -- ファイル名` で登録し、両版の表示を再確認してから `git commit`、`git push` します。判断できない場合は作業を止めて相談します。merge開始前がクリーンだった場合、必要に応じて `git merge --abort` で開始前へ戻せます。共有ブランチの履歴は書き換えません。

### 5. レビュー後にmainへマージする

レビュー担当者は、Issueの条件、掲載内容、差分、画像の利用許諾、表示確認結果をチェックします。修正後は再レビューし、承認された最新の差分をGitHub上で `main` にマージします。未解決のレビューや競合がある場合はマージしません。mainの変更が入った場合は作業ブランチに取り込み、必要な表示確認を再実施します。

### 6. 公開反映と実際のURLでの確認

**現状：公開先・認証設定は未確定です。自動デプロイは設定していません。`main` の更新が公開へ反映されることは、まだ保証されません。**

要件は「社内・関係者の確認用・無料枠のみ・GitLabログインによる閲覧制限を検討」です。ソースはGitHubでPublicのままとすることを合意済みです。Cloudflareは候補から外し、GitLab Pagesのアクセス制限・閲覧者アカウント・無料枠・CI利用条件を確認してから採用判断します。一般公開のGitHub Pagesを有効にしたり、認証のないプレビューURLを共有したりしないでください。公開先・無料枠・認証対象・費用を管理者が確認し、承認してから設定します。

承認したホスティングでGit連携する場合は **公開対象ブランチを `main`、配信元をリポジトリのルート** とし、HTMLをそのまま配信する設定にします。作業ブランチとPR用のプレビューも認証を必須にするか無効にします。これは今後の設定方針であり、現時点で適用済みの設定ではありません。

公開設定が完了したら、公開担当者がこの節に次を記録してPRで共有します。

| 設定 | 現在の状態 |
| --- | --- |
| ホスティング・管理チーム | GitLab Pagesを検討中、未作成・未接続 |
| 公開URL | 未発行 |
| 反映ブランチ | `main` を予定（未接続） |
| 配信入口 | `index.html`（`style.css`・`images/`を同梱） |
| GitLab連携 | GitHub `main` を承認後に同期する構成を検討、未設定 |
| ビルド | 不要（配信サービス側の設定は未実施） |
| 閲覧認証・許可メンバー | 未設定 |
| PR・別ドメインの認証 | 未設定 |
| 費用・無料枠・上限 | 未確認 |

接続後は、次の順番で毎回確認します。

1. `main` へのマージ後、配信サービスのデプロイ完了を待ちます。成功したデプロイのコミットSHAがマージ後の `main` と一致することを確認します。
2. 許可されたチームメンバーで**実際の公開URL**の `index.html` を開きます。HTTP成功だけで完了にせず、CSS・画像の読み込み、ページ内リンク・FAQ・更新内容を確認します。PC幅1440pxとスマホ幅390pxでスクリーンショットを撮り、デプロイSHAと一緒にIssueへ添付します。
3. 未ログインのプライベートウィンドウでは認証を要求されること、許可外のユーザーには拒否されることを確認します。サービス既定ドメイン、別ドメイン、プレビューURLからも認証を迂回できないことを確認します。
4. 確認担当者がIssueへURL・デプロイSHA・確認端末・結果を記録し、全完了条件を満たしたらIssueを閉じます。認証や公開が未確認なら公開待ちとして残します。
5. 表示不具合は修正PRを作成します。急いで戻す場合も、対象変更を打ち消すrevert PRをレビューして反映し、履歴を残します。閲覧制限が破られた場合は公開担当者が配信を停止・制限し、認証を直すまで再公開しません。

GitHubへのpush、PRのマージ、配信サービスでのデプロイ成功、実際のURLでの確認は、それぞれ別の完了条件です。

## 確認項目

- `index.html` を直接開き、スタイルと画像が表示されること。
- ナビゲーションが各セクションへ移動し、FAQが開閉すること。
- 幅375px程度のスマートフォン表示からデスクトップ表示まで、内容が読めて横にはみ出さないこと。
- キーボードでリンクとFAQに移動できること。
- 公開前に仮情報・応募窓口を確認すること。

クラウドの各タスクは隔離されています。既存のチェックアウトを使い、ユーザーが明示的に希望しない限りGit worktreeを追加する必要はありません。
