"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Globe2,
  LayoutDashboard,
  LogOut,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { allRows } from "@/lib/data";
import { browserDb } from "@/lib/supabase";
import {
  type Site,
  type Issue,
  type Audit,
  siteSchema,
  issueSchema,
  severityLabels,
  statusLabels,
  japanDate,
  todayJst,
} from "@/lib/domain";
type View = "overview" | "sites" | "issues" | "guide";
type Editor = { kind: "site"; item?: Site } | { kind: "issue"; item?: Issue };
const nav = [
  { id: "overview", label: "概要", icon: LayoutDashboard },
  { id: "sites", label: "管理サイト", icon: Globe2 },
  { id: "issues", label: "脆弱性・改善", icon: ShieldCheck },
  { id: "guide", label: "操作手順", icon: BookOpen },
] as const;
const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
function Badge({
  type,
  children,
}: {
  type: string;
  children: React.ReactNode;
}) {
  return <span className={"badge " + type}>{children}</span>;
}
export function Console({ email }: { email: string }) {
  const [view, setView] = useState<View>("overview"),
    [sites, setSites] = useState<Site[]>([]),
    [issues, setIssues] = useState<Issue[]>([]),
    [audit, setAudit] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [editor, setEditor] = useState<Editor | null>(null),
    [deleting, setDeleting] = useState<{
      kind: "site" | "issue";
      id: string;
      name: string;
    } | null>(null),
    [busy, setBusy] = useState(false);
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [severity, setSeverity] = useState("all");
  const dialog = useRef<HTMLDialogElement>(null),
    confirm = useRef<HTMLDialogElement>(null),
    [formError, setFormError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const db = browserDb();
      const [s, i, a] = await Promise.all([
        allRows<Site>((from, to) =>
          db
            .from("sites")
            .select("*")
            .order("created_at", { ascending: false })
            .order("id")
            .range(from, to),
        ),
        allRows<Issue>((from, to) =>
          db
            .from("issues")
            .select("*")
            .order("created_at", { ascending: false })
            .order("id")
            .range(from, to),
        ),
        db
          .from("audit_events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
      if (a.error) throw a.error;
      setSites(s);
      setIssues(i);
      setAudit(a.data ?? []);
    } catch {
      setError(
        "データを取得できません。接続設定・ログイン状態・RLS権限を確認して再試行してください。",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (editor) dialog.current?.showModal();
    else dialog.current?.close();
    setFormError("");
  }, [editor]);
  useEffect(() => {
    if (deleting) confirm.current?.showModal();
    else confirm.current?.close();
    setFormError("");
  }, [deleting]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(t);
  }, [notice]);
  const open = issues.filter((i) => i.status !== "resolved"),
    resolved = issues.filter((i) => i.status === "resolved").length,
    urgent = open.filter(
      (i) => i.severity === "critical" || i.severity === "high",
    ).length;
  const filtered = issues.filter(
    (i) =>
      (status === "all" || i.status === status) &&
      (severity === "all" || i.severity === severity) &&
      (i.title + " " + sites.find((s) => s.id === i.site_id)?.name)
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const siteName = (id: string) =>
    sites.find((s) => s.id === id)?.name ?? "不明なサイト";
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editor) return;
    setBusy(true);
    setFormError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const db = browserDb();
      let result;
      if (editor.kind === "site") {
        const parsed = siteSchema.safeParse(data);
        if (!parsed.success) {
          setFormError("サイト名とHTTP(S) URL・文字数を確認してください。");
          return;
        }
        result = editor.item
          ? await db
              .from("sites")
              .update(parsed.data)
              .eq("id", editor.item.id)
              .select("id")
              .single()
          : await db.from("sites").insert(parsed.data).select("id").single();
      } else {
        const parsed = issueSchema.safeParse(data);
        if (!parsed.success) {
          setFormError("必須項目・文字数・日付を確認してください。");
          return;
        }
        const values = {
          ...parsed.data,
          due_date: parsed.data.due_date || null,
        };
        result = editor.item
          ? await db
              .from("issues")
              .update(values)
              .eq("id", editor.item.id)
              .select("id")
              .single()
          : await db.from("issues").insert(values).select("id").single();
      }
      if (result.error) {
        setFormError(
          "保存できません。入力内容・接続・権限を確認してください。",
        );
        return;
      }
      setEditor(null);
      setNotice("変更を保存しました。");
      await load();
    } catch {
      setFormError("通信に失敗しました。入力内容は保持されています。");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setFormError("");
    try {
      const { error } = await browserDb()
        .from(deleting.kind === "site" ? "sites" : "issues")
        .delete()
        .eq("id", deleting.id)
        .select("id")
        .single();
      if (error) {
        setFormError(
          deleting.kind === "site"
            ? "削除できません。関連する脆弱性を先に削除するか、権限を確認してください。"
            : "削除できません。接続・権限を確認してください。",
        );
        return;
      }
      setDeleting(null);
      setNotice("削除しました。操作履歴は保持されます。");
      await load();
    } catch {
      setFormError("通信に失敗しました。再試行してください。");
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    const { error } = await browserDb().auth.signOut();
    if (error) {
      setError("ログアウトに失敗しました。再試行してください。");
      setBusy(false);
    } else window.location.assign("/login");
  }
  function issueTable(list: Issue[]) {
    return (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>脆弱性・確認事項</th>
              <th>重要度</th>
              <th>ステータス</th>
              <th>対応期限</th>
              <th>
                <span className="sr-only">操作</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((i) => (
              <tr key={i.id}>
                <td>
                  <button
                    className="row-title"
                    onClick={() => setEditor({ kind: "issue", item: i })}
                  >
                    {i.title}
                  </button>
                  <small>{siteName(i.site_id)}</small>
                </td>
                <td>
                  <Badge type={i.severity}>{severityLabels[i.severity]}</Badge>
                </td>
                <td>
                  <Badge type={i.status}>{statusLabels[i.status]}</Badge>
                </td>
                <td>
                  <span
                    className={
                      i.due_date &&
                      i.due_date < todayJst() &&
                      i.status !== "resolved"
                        ? "overdue"
                        : ""
                    }
                  >
                    {i.due_date ?? "未設定"}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      aria-label={i.title + "を編集"}
                      onClick={() => setEditor({ kind: "issue", item: i })}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      aria-label={i.title + "を削除"}
                      onClick={() =>
                        setDeleting({ kind: "issue", id: i.id, name: i.title })
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <p className="workspace-label">WORKSPACE</p>
        <div className="workspace">
          <div className="workspace-icon">
            <ShieldCheck size={21} />
          </div>
          <div>
            セキュリティ管理<small>個人ワークスペース</small>
          </div>
        </div>
        <nav aria-label="メインナビゲーション">
          {nav.map((n) => (
            <button
              key={n.id}
              aria-label={n.label}
              aria-current={view === n.id ? "page" : undefined}
              onClick={() => setView(n.id)}
            >
              <n.icon size={19} />
              {n.label}
              {n.id === "issues" && open.length > 0 && (
                <span className="nav-count">{open.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="safety-note">
            <ShieldCheck size={20} />
            <strong>安全を、すべての基準に。</strong>
            <p>
              小さな改善の積み重ねが、
              <br />
              大きな信頼につながります。
            </p>
          </div>
          <div className="user">
            <span className="avatar">{email.charAt(0).toUpperCase()}</span>
            <div>
              <strong>管理アカウント</strong>
              <small title={email}>{email}</small>
            </div>
            <button onClick={logout} disabled={busy} aria-label="ログアウト">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <main id="main" className="main-content">
        <div className="breadcrumb">
          ワークスペース <ChevronRight size={13} />
          <span>{nav.find((n) => n.id === view)?.label}</span>
        </div>
        <div className="mobile-account">
          <span>個人ワークスペース</span>
          <button onClick={logout} disabled={busy}>
            <LogOut size={15} />
            ログアウト
          </button>
        </div>
        <div className="page-heading">
          <div>
            <p className="eyebrow">SECURITY MANAGEMENT</p>
            <h1>
              {view === "overview"
                ? "セキュリティ概要"
                : view === "sites"
                  ? "管理サイト"
                  : view === "issues"
                    ? "脆弱性・改善"
                    : "操作手順"}
            </h1>
            <p className="muted">
              {view === "overview"
                ? "リスクを把握し、次の改善へ。サイトの安全を、日々の確かな行動に。"
                : view === "sites"
                  ? "管理するサイトと、その確認状況を一か所に。"
                  : view === "issues"
                    ? "確認事項から解決まで、一つひとつ着実に。"
                    : "日々の確認と改善を、迷わず進めるために。"}
            </p>
          </div>
          {view !== "guide" && (
            <button
              className="primary"
              disabled={loading || !!error}
              onClick={() =>
                setEditor(
                  view === "sites" || !sites.length
                    ? { kind: "site" }
                    : { kind: "issue" },
                )
              }
            >
              <Plus size={17} />
              {view === "sites" || !sites.length
                ? "サイトを追加"
                : "確認事項を追加"}
            </button>
          )}
        </div>
        {notice && (
          <div role="status" className="toast">
            <CheckCircle2 size={18} />
            {notice}
            <button aria-label="通知を閉じる" onClick={() => setNotice("")}>
              <X size={16} />
            </button>
          </div>
        )}
        {error && (
          <div role="alert" className="error-box">
            {error}
            <button onClick={load}>再試行</button>
          </div>
        )}
        {loading ? (
          <div role="status" className="loading">
            データを読み込んでいます…
          </div>
        ) : (
          !error && (
            <>
              {view === "overview" && (
                <>
                  <div className="summary-banner">
                    <div className="banner-icon">
                      <ShieldCheck size={25} />
                    </div>
                    <div>
                      <strong>
                        {urgent > 0
                          ? `${urgent}件の優先的な確認・対応が必要です`
                          : open.length > 0
                            ? "改善対応を進めましょう"
                            : "確認と記録で、安全を積み重ねましょう"}
                      </strong>
                      <p>
                        {issues.length === 0
                          ? "まだ確認事項が登録されていません。サイトを追加して、確認結果を記録しましょう。"
                          : "登録された確認事項に基づく状況です。サイト全体の安全性を保証するものではありません。"}
                      </p>
                    </div>
                    <span className="live-label">登録データから集計</span>
                  </div>
                  <div className="stats">
                    <article>
                      <span>
                        管理サイト
                        <Globe2 size={18} />
                      </span>
                      <p>
                        {sites.length}
                        <small>サイト</small>
                      </p>
                      <footer>管理対象として登録済み</footer>
                    </article>
                    <article>
                      <span>
                        未解決の確認事項
                        <CircleAlert size={18} />
                      </span>
                      <p>
                        {open.length}
                        <small>件</small>
                      </p>
                      <footer>
                        <span className="orange-dot" />
                        {urgent}件が緊急・高重要度
                      </footer>
                    </article>
                    <article>
                      <span>
                        解決済み
                        <CheckCircle2 size={18} />
                      </span>
                      <p>
                        {resolved}
                        <small>件</small>
                      </p>
                      <footer>記録をもとに継続的な改善を</footer>
                    </article>
                    <article>
                      <span>
                        対応完了率
                        <Activity size={18} />
                      </span>
                      <p>
                        {issues.length
                          ? Math.round((resolved / issues.length) * 100)
                          : 0}
                        <small>%</small>
                      </p>
                      <div className="progress">
                        <span
                          style={{
                            width: `${issues.length ? (resolved / issues.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <footer>解決済み / 全確認事項</footer>
                    </article>
                  </div>
                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <h2>優先して対応する項目</h2>
                        <p>未解決の項目を、重要度順に表示しています。</p>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => setView("issues")}
                      >
                        すべて見る <ArrowRight size={15} />
                      </button>
                    </div>
                    {open.length ? (
                      issueTable(
                        [...open]
                          .sort(
                            (a, b) =>
                              severityOrder[a.severity] -
                              severityOrder[b.severity],
                          )
                          .slice(0, 5),
                      )
                    ) : (
                      <div className="empty">
                        <CheckCircle2 />
                        <h3>
                          {issues.length
                            ? "登録された項目はすべて解決済みです"
                            : "まずは確認結果を記録しましょう"}
                        </h3>
                        <p>
                          未登録は「問題なし」を意味しません。操作手順から確認の流れをご覧ください。
                        </p>
                        <button
                          className="text-button"
                          onClick={() => setView("guide")}
                        >
                          操作手順を見る <ArrowRight size={15} />
                        </button>
                      </div>
                    )}
                  </section>
                  <div className="bottom-grid">
                    <section className="panel">
                      <div className="panel-heading">
                        <h2>最近の操作履歴</h2>
                        <Activity size={18} />
                      </div>
                      <div className="timeline">
                        {audit.length ? (
                          audit.map((a) => (
                            <div key={a.id}>
                              <span className="timeline-dot" />
                              <div>
                                <strong>{a.entity_label}</strong>
                                <p>
                                  {a.entity_type === "sites"
                                    ? "管理サイト"
                                    : "確認事項"}
                                  を
                                  {a.action === "INSERT"
                                    ? "追加"
                                    : a.action === "UPDATE"
                                      ? "更新"
                                      : "削除"}
                                  しました
                                </p>
                              </div>
                              <time>{japanDate(a.created_at)}</time>
                            </div>
                          ))
                        ) : (
                          <p className="muted">操作履歴はまだありません。</p>
                        )}
                      </div>
                    </section>
                    <section className="guide-card">
                      <span className="eyebrow">SAFETY FIRST</span>
                      <BookOpen size={30} />
                      <h2>
                        日々の確認を、
                        <br />
                        確かな改善につなげる。
                      </h2>
                      <p>
                        確認・記録・対応・再確認。
                        <br />
                        4つのステップで、安全を守りましょう。
                      </p>
                      <button onClick={() => setView("guide")}>
                        操作手順を確認 <ArrowRight size={17} />
                      </button>
                    </section>
                  </div>
                </>
              )}
              {view === "sites" && (
                <section className="panel">
                  <div className="panel-heading">
                    <h2>
                      登録サイト <span className="count">{sites.length}</span>
                    </h2>
                  </div>
                  {sites.length ? (
                    <div className="site-grid">
                      {sites.map((s) => (
                        <article className="site-card" key={s.id}>
                          <div className="site-top">
                            <div className="icon-square">
                              <Globe2 size={23} />
                            </div>
                            <div className="row-actions">
                              <button
                                aria-label={s.name + "を編集"}
                                onClick={() =>
                                  setEditor({ kind: "site", item: s })
                                }
                              >
                                <Pencil size={17} />
                              </button>
                              <button
                                aria-label={s.name + "を削除"}
                                onClick={() =>
                                  setDeleting({
                                    kind: "site",
                                    id: s.id,
                                    name: s.name,
                                  })
                                }
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </div>
                          <h3>{s.name}</h3>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {s.url} ↗
                          </a>
                          <p>{s.description || "説明は未登録です。"}</p>
                          <footer>
                            未解決{" "}
                            <strong>
                              {
                                issues.filter(
                                  (i) =>
                                    i.site_id === s.id &&
                                    i.status !== "resolved",
                                ).length
                              }
                            </strong>{" "}
                            件<span>登録日 {japanDate(s.created_at)}</span>
                          </footer>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="empty">
                      <Globe2 />
                      <h3>管理サイトを登録しましょう</h3>
                      <p>
                        サイト名とURLを登録すると、確認事項を紐づけられます。
                      </p>
                      <button
                        className="primary"
                        onClick={() => setEditor({ kind: "site" })}
                      >
                        <Plus size={16} />
                        サイトを追加
                      </button>
                    </div>
                  )}
                </section>
              )}
              {view === "issues" && (
                <section className="panel">
                  <div className="filters">
                    <label className="search">
                      <Search size={18} />
                      <input
                        aria-label="確認事項を検索"
                        placeholder="タイトル・サイト名で検索"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                    <select
                      aria-label="ステータスで絞り込み"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="all">すべてのステータス</option>
                      {Object.entries(statusLabels).map(([k, v]) => (
                        <option value={k} key={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="重要度で絞り込み"
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                    >
                      <option value="all">すべての重要度</option>
                      {Object.entries(severityLabels).map(([k, v]) => (
                        <option value={k} key={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <span className="muted">{filtered.length}件</span>
                  </div>
                  {filtered.length ? (
                    issueTable(filtered)
                  ) : (
                    <div className="empty">
                      <Search />
                      <h3>
                        {issues.length
                          ? "条件に一致する項目がありません"
                          : "確認事項はまだありません"}
                      </h3>
                      <p>
                        {sites.length
                          ? "確認結果を追加し、改善の経過を記録しましょう。"
                          : "先に管理サイトを追加してください。"}
                      </p>
                    </div>
                  )}
                </section>
              )}
              {view === "guide" && (
                <section className="panel guide-content">
                  <h2>安全管理の基本フロー</h2>
                  <p className="muted">
                    このアプリは手動で確認した結果を管理します。外部サイトへの自動スキャンは行いません。
                  </p>
                  {[
                    {
                      title: "管理するサイトを登録",
                      text: "「管理サイト」から、権限のあるサイトの名前とURLを登録します。URLにパスワードやトークンを含めないでください。",
                    },
                    {
                      title: "確認結果と重要度を記録",
                      text: "HTTPS、認証・権限、依存パッケージ、バックアップなどを、許可された方法で確認します。「確認事項を追加」から、事実・影響・確認方法を記録してください。未検証の疑いは、タイトルに「要確認」と明記します。",
                    },
                    {
                      title: "改善策と対応期限を決める",
                      text: "緊急・高重要度の項目から優先します。改善内容と期限を入力し、作業を始めたら「対応中」に更新します。",
                    },
                    {
                      title: "再確認して解決にする",
                      text: "修正後に同じ確認方法で再検証し、結果を改善内容へ記録して「解決済み」にします。変更履歴は自動で保持されます。",
                    },
                  ].map((s, i) => (
                    <article className="guide-step" key={s.title}>
                      <span>0{i + 1}</span>
                      <div>
                        <h3>{s.title}</h3>
                        <p>{s.text}</p>
                      </div>
                    </article>
                  ))}
                  <div className="notice">
                    <strong>入力とアクセスのルール</strong>
                    <p>
                      患者情報、個人の体験談、パスワード、APIキーは入力しないでください。現在のデータはログインした本人のみ閲覧・編集できます。チーム共有には別途メンバー権限設計が必要です。
                    </p>
                  </div>
                </section>
              )}
            </>
          )
        )}
        <footer className="main-footer">
          <span>SECURITY CONSOLE</span>
          <span>安全 ＞ 安心 ＞ 治療品質 ＞ 効率</span>
        </footer>
      </main>
      <dialog
        ref={dialog}
        onCancel={(e) => {
          if (busy) e.preventDefault();
          else setEditor(null);
        }}
        onClose={() => {
          if (!busy) setEditor(null);
        }}
        aria-labelledby="editor-title"
      >
        {editor && (
          <>
            <div className="dialog-heading">
              <div>
                <p className="eyebrow">
                  {editor.kind === "site" ? "WEBSITE" : "SECURITY FINDING"}
                </p>
                <h2 id="editor-title">
                  {editor.kind === "site" ? "管理サイト" : "確認事項"}を
                  {editor.item ? "編集" : "追加"}
                </h2>
              </div>
              <button
                aria-label="閉じる"
                disabled={busy}
                onClick={() => setEditor(null)}
              >
                <X />
              </button>
            </div>
            <form
              method="post"
              onSubmit={save}
              key={editor.kind + (editor.item?.id ?? "new")}
            >
              {editor.kind === "site" ? (
                <>
                  <label>
                    サイト名 <span>必須</span>
                    <input
                      name="name"
                      required
                      maxLength={100}
                      defaultValue={editor.item?.name}
                      placeholder="例：公式サイト"
                    />
                  </label>
                  <label>
                    サイトURL <span>必須</span>
                    <input
                      name="url"
                      type="url"
                      required
                      maxLength={2048}
                      defaultValue={editor.item?.url}
                      placeholder="https://example.com"
                    />
                  </label>
                  <label>
                    説明
                    <textarea
                      name="description"
                      maxLength={2000}
                      defaultValue={editor.item?.description}
                      placeholder="管理目的・確認範囲など"
                    />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    管理サイト <span>必須</span>
                    <select
                      name="site_id"
                      required
                      defaultValue={editor.item?.site_id ?? sites[0]?.id}
                    >
                      {sites.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    タイトル <span>必須</span>
                    <input
                      name="title"
                      required
                      maxLength={200}
                      defaultValue={editor.item?.title}
                      placeholder="例：要確認：管理画面の多要素認証"
                    />
                  </label>
                  <div className="form-grid">
                    <label>
                      重要度
                      <select
                        name="severity"
                        defaultValue={editor.item?.severity ?? "medium"}
                      >
                        {Object.entries(severityLabels).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      ステータス
                      <select
                        name="status"
                        defaultValue={editor.item?.status ?? "open"}
                      >
                        {Object.entries(statusLabels).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label>
                    確認内容
                    <textarea
                      name="description"
                      maxLength={5000}
                      defaultValue={editor.item?.description}
                      placeholder="確認した事実・影響・確認方法"
                    />
                  </label>
                  <label>
                    改善内容・再確認結果
                    <textarea
                      name="remediation"
                      maxLength={5000}
                      defaultValue={editor.item?.remediation}
                      placeholder="改善手順と、再確認した結果"
                    />
                  </label>
                  <label>
                    対応期限
                    <input
                      name="due_date"
                      type="date"
                      defaultValue={editor.item?.due_date ?? ""}
                    />
                  </label>
                </>
              )}
              <small>患者情報・認証情報は入力しないでください。</small>
              {formError && (
                <p role="alert" className="form-error">
                  {formError}
                </p>
              )}
              <div className="dialog-actions">
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={() => setEditor(null)}
                >
                  キャンセル
                </button>
                <button
                  className="primary"
                  disabled={busy || (editor.kind === "issue" && !sites.length)}
                >
                  <Check size={17} />
                  {busy ? "保存中…" : "保存する"}
                </button>
              </div>
            </form>
          </>
        )}
      </dialog>
      <dialog
        ref={confirm}
        onCancel={(e) => {
          if (busy) e.preventDefault();
          else setDeleting(null);
        }}
        aria-labelledby="delete-title"
      >
        <h2 id="delete-title">削除しますか？</h2>
        <p className="delete-copy">
          「{deleting?.name}」を削除します。元に戻せません。操作履歴は残ります。
        </p>
        {formError && (
          <p role="alert" className="form-error">
            {formError}
          </p>
        )}
        <div className="dialog-actions">
          <button
            className="secondary"
            disabled={busy}
            onClick={() => setDeleting(null)}
          >
            キャンセル
          </button>
          <button className="danger" disabled={busy} onClick={remove}>
            {busy ? "削除中…" : "削除する"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
