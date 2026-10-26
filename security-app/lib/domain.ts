import { z } from "zod";
export const siteSchema = z.object({
  name: z.string().trim().min(1).max(100),
  url: z.url().refine((v) => {
    const u = new URL(v);
    return (
      ["https:", "http:"].includes(u.protocol) && !u.username && !u.password
    );
  }, "認証情報を含まないHTTP(S) URLを入力してください。"),
  description: z.string().trim().max(2000),
});
export const issueSchema = z.object({
  site_id: z.uuid(),
  title: z.string().trim().min(1).max(200),
  severity: z.enum(["critical", "high", "medium", "low"]),
  status: z.enum(["open", "in_progress", "resolved"]),
  description: z.string().trim().max(5000),
  remediation: z.string().trim().max(5000),
  due_date: z.string().refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v)),
});
export type Site = {
  id: string;
  name: string;
  url: string;
  description: string;
  created_at: string;
};
export type Issue = {
  id: string;
  site_id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "resolved";
  description: string;
  remediation: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};
export type Audit = {
  id: string;
  entity_type: string;
  action: string;
  entity_label: string;
  created_at: string;
};
export const severityLabels = {
  critical: "緊急",
  high: "高",
  medium: "中",
  low: "低",
};
export const statusLabels = {
  open: "未対応",
  in_progress: "対応中",
  resolved: "解決済み",
};
export function japanDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
export function todayJst() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(
    new Date(),
  );
}
