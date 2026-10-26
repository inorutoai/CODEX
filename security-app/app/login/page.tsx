import { Brand } from "@/components/brand";
import { Login } from "@/components/login";
export default function Page() {
  return (
    <>
      <header>
        <Brand />
      </header>
      <main id="main" className="login-grid">
        <section className="login-message">
          <p className="eyebrow">TRUST BEGINS WITH SAFETY</p>
          <h1>
            安全を守る。
            <br />
            信頼を積み重ねる。
          </h1>
          <p>
            サイトのリスクを見える化し、
            <br />
            一つひとつの改善を、確かな行動へ。
          </p>
          <div className="principle">
            安全 <span>›</span> 安心 <span>›</span> 治療品質 <span>›</span> 効率
          </div>
          <small>
            患者情報を扱わない、セキュリティ管理専用のワークスペース。
          </small>
        </section>
        <Login />
      </main>
    </>
  );
}
