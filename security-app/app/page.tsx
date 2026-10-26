import { redirect } from "next/navigation";
import { configured } from "@/lib/supabase";
import { serverDb } from "@/lib/server";
import { Brand } from "@/components/brand";
import { Console } from "@/components/console";
export default async function Home() {
  if (!configured)
    return (
      <>
        <header>
          <Brand />
        </header>
        <main id="main" className="setup">
          <p className="eyebrow">ENVIRONMENT SETUP</p>
          <h1>安全に始めるための接続設定</h1>
          <p>
            SupabaseのURLと公開キーが未設定です。データを保存する前に、READMEの手順で接続してください。
          </p>
          <p>
            必要な設定：NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
          </p>
          <p>管理者用のservice_roleキーは使用しません。</p>
        </main>
      </>
    );
  const db = await serverDb();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  return (
    <>
      <header>
        <Brand />
        <span className="header-caption">安全を、日々の選択に。</span>
      </header>
      <Console email={user.email ?? ""} />
    </>
  );
}
