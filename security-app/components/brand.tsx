import fs from "node:fs";
import path from "node:path";
export function Brand() {
  const exists = fs.existsSync(
    path.join(process.cwd(), "public/images/inoruto-logo.png"),
  );
  return (
    <a href="/" className="brand" aria-label="ホームへ">
      {exists ? (
        /* eslint-disable-next-line @next/next/no-img-element */ <img
          src="/images/inoruto-logo.png"
          alt="イノルト整形外科 痛みと骨粗鬆症クリニック"
        />
      ) : (
        <span className="logo-pending">承認済みロゴ 未配置</span>
      )}
      <span className="brand-divider" />
      <span>SECURITY CONSOLE</span>
    </a>
  );
}
