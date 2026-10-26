import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Security Console | イノルト",
  description: "サイトの脆弱性と改善対応を、安全に見える化する管理アプリ",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <a className="skip" href="#main">
          本文へ移動
        </a>
        {children}
      </body>
    </html>
  );
}
