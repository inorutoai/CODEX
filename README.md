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

## GitHubでのチーム管理と公開

変更は作業ブランチへコミット・プッシュし、Pull Requestで確認後、公開用ブランチへマージする運用を推奨します。チームメンバーはリポジトリのアクセス権設定から招待します。

GitHub Pagesで公開する場合は、確定済みの内容をGitHubへ反映後、リポジトリの **Settings → Pages** で **Deploy from a branch** を選び、公開用ブランチ（例：`main`）と **/(root)** を指定します。初回コミットが必要です。公開URLはデプロイ完了後にPages画面で確認してください。利用可能な公開設定はリポジトリの可視性・契約に依存します。

GitHubへのプッシュだけではサイトの公開は完了しません。Pages設定とデプロイ結果を別途確認してください。クラウド開発環境の公開と、GitHub Pagesでのサイト公開も別の操作です。

## 確認項目

- `index.html` を直接開き、スタイルと画像が表示されること。
- ナビゲーションが各セクションへ移動し、FAQが開閉すること。
- 幅375px程度のスマートフォン表示からデスクトップ表示まで、内容が読めて横にはみ出さないこと。
- キーボードでリンクとFAQに移動できること。
- 公開前に仮情報・応募窓口を確認すること。

クラウドの各タスクは隔離されています。既存のチェックアウトを使い、ユーザーが明示的に希望しない限りGit worktreeを追加する必要はありません。
