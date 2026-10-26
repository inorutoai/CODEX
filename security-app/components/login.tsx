"use client";
import { useEffect, useState } from "react";
import { browserDb, configured } from "@/lib/supabase";
import { LockKeyhole, ArrowRight } from "lucide-react";
export function Login() {
  const [signup, setSignup] = useState(false),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    setReady(true);
    if (new URLSearchParams(window.location.search).has("error"))
      setMessage(
        "確認リンクを処理できませんでした。期限切れの場合は再登録し、新しい確認メールをお使いください。",
      );
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    try {
      const db = browserDb();
      const credentials = {
        email: String(form.get("email")).trim(),
        password: String(form.get("password")),
      };
      const result = signup
        ? await db.auth.signUp({
            ...credentials,
            options: {
              emailRedirectTo: window.location.origin + "/auth/callback",
            },
          })
        : await db.auth.signInWithPassword(credentials);
      if (result.error) {
        setMessage(
          "認証できませんでした。入力内容・メール確認状況を確認し、時間をおいて再試行してください。",
        );
        return;
      }
      if (signup && !result.data.session) {
        setMessage(
          "確認メールを送信しました。メールのリンクを開いて登録を完了してください。",
        );
        return;
      }
      window.location.assign("/");
    } catch {
      setMessage(
        "認証サービスに接続できませんでした。接続設定を確認してください。",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="login-card">
      <div className="icon-square">
        <LockKeyhole size={22} />
      </div>
      <h2>{signup ? "アカウントを作成" : "おかえりなさい"}</h2>
      <p className="muted">
        {signup
          ? "自分の管理領域を作成します。"
          : "アカウントにログインして管理を始めましょう。"}
      </p>
      <form method="post" onSubmit={submit}>
        <label>
          メールアドレス
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="you@example.com"
          />
        </label>
        <label>
          パスワード
          <input
            name="password"
            type="password"
            autoComplete={signup ? "new-password" : "current-password"}
            required
            minLength={12}
            maxLength={128}
            placeholder="12文字以上"
          />
        </label>
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
        {!configured && <p role="alert">Supabase接続設定が必要です。</p>}
        <button
          className="primary wide"
          disabled={!ready || busy || !configured}
        >
          {busy ? "処理中…" : signup ? "アカウントを作成" : "ログイン"}
          <ArrowRight size={17} />
        </button>
      </form>
      <button
        className="text-button wide"
        disabled={!ready || busy}
        onClick={() => {
          setSignup(!signup);
          setMessage("");
        }}
      >
        {signup ? "ログインに戻る" : "初めての方：アカウント作成"}
      </button>
      <small>患者情報・認証情報を管理項目へ入力しないでください。</small>
    </section>
  );
}
