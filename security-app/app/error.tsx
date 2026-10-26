"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="setup">
      <h1>画面を読み込めませんでした</h1>
      <p>
        接続状態を確認して再試行してください。改善しない場合は管理者へ連絡してください。
      </p>
      <button className="primary" onClick={reset}>
        再試行
      </button>
      <p>
        <a href="/login">ログイン画面へ</a>
      </p>
    </main>
  );
}
