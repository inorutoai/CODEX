import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!,
  key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const password = "Local-Test-Only-37!";
const email = `security-${Date.now()}@example.test`;
const make = () =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
const owner = make(),
  other = make(),
  anon = make();
let siteId: string, issueId: string, otherId: string;
test.beforeAll(async () => {
  expect(
    new URL(url).hostname,
    "Integration tests must use the local test database",
  ).toBe("127.0.0.1");
  const a = await owner.auth.signUp({ email, password });
  expect(a.error).toBeNull();
  expect(a.data.session).toBeTruthy();
  const b = await other.auth.signUp({
    email: `other-${Date.now()}@example.test`,
    password,
  });
  expect(b.error).toBeNull();
  otherId = b.data.user!.id;
});
test("RLS rejects anonymous access, cross-user reads/writes, ownership changes and audit tampering", async () => {
  const s = await owner
    .from("sites")
    .insert({
      name: "検証用サイト",
      url: "https://example.com",
      description: "架空の検証データ",
    })
    .select()
    .single();
  expect(s.error).toBeNull();
  siteId = s.data.id;
  const i = await owner
    .from("issues")
    .insert({
      site_id: siteId,
      title: "要確認：多要素認証",
      severity: "high",
      status: "open",
      description: "架空の確認事項",
      remediation: "",
      due_date: "2026-11-10",
    })
    .select()
    .single();
  expect(i.error).toBeNull();
  issueId = i.data.id;
  expect((await anon.from("sites").select()).error).not.toBeNull();
  expect(
    (
      await anon
        .from("issues")
        .insert({ site_id: siteId, title: "blocked", severity: "low" })
    ).error,
  ).not.toBeNull();
  expect((await other.from("sites").select()).data).toEqual([]);
  expect((await other.from("issues").select()).data).toEqual([]);
  expect((await other.from("audit_events").select()).data).toEqual([]);
  expect(
    (
      await other
        .from("sites")
        .update({ name: "hijacked" })
        .eq("id", siteId)
        .select()
    ).data,
  ).toEqual([]);
  expect(
    (
      await other
        .from("issues")
        .update({ status: "resolved" })
        .eq("id", issueId)
        .select()
    ).data,
  ).toEqual([]);
  expect(
    (await other.from("sites").delete().eq("id", siteId).select()).data,
  ).toEqual([]);
  expect(
    (await other.from("issues").delete().eq("id", issueId).select()).data,
  ).toEqual([]);
  expect(
    (
      await other.from("sites").insert({
        owner_id: s.data.owner_id,
        name: "forged",
        url: "https://example.com",
      })
    ).error,
  ).not.toBeNull();
  expect(
    (
      await other
        .from("issues")
        .insert({ site_id: siteId, title: "cross-owner", severity: "low" })
    ).error,
  ).not.toBeNull();
  expect(
    (await owner.from("sites").update({ owner_id: otherId }).eq("id", siteId))
      .error,
  ).not.toBeNull();
  expect(
    (await owner.from("issues").update({ owner_id: otherId }).eq("id", issueId))
      .error,
  ).not.toBeNull();
  expect(
    (
      await owner
        .from("sites")
        .update({ url: "javascript:alert(1)" })
        .eq("id", siteId)
    ).error,
  ).not.toBeNull();
  expect(
    (
      await owner.from("audit_events").insert({
        owner_id: s.data.owner_id,
        entity_type: "sites",
        entity_id: siteId,
        entity_label: "forged",
        action: "INSERT",
      })
    ).error,
  ).not.toBeNull();
  expect(
    (await owner.from("audit_events").delete().eq("entity_id", siteId)).error,
  ).not.toBeNull();
  expect(
    (await owner.from("sites").delete().eq("id", siteId)).error?.code,
  ).toBe("23503");
  const updated = await owner
    .from("issues")
    .update({ status: "in_progress", remediation: "認証設定を確認する" })
    .eq("id", issueId)
    .select()
    .single();
  expect(updated.error).toBeNull();
  expect(updated.data.status).toBe("in_progress");
  expect((await owner.from("audit_events").select()).data!.length).toBe(3);
});
test("login, complete UI CRUD, filters, persistence, responsive layouts and logout", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page).toHaveURL(/login/);
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード").fill(password);
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "セキュリティ概要" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "要確認：多要素認証", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "管理サイト", exact: true }).click();
  await page
    .getByRole("button", { name: "サイトを追加", exact: true })
    .first()
    .click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("サイト名").fill("ブラウザー検証サイト");
  await dialog.getByLabel("サイトURL").fill("https://example.org");
  await dialog.getByLabel("説明").fill("架空データ・患者情報なし");
  await dialog.getByRole("button", { name: "保存する" }).click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("button", { name: "ブラウザー検証サイトを編集", exact: true })
    .click();
  await dialog.getByLabel("説明").fill("編集と永続化を確認");
  await dialog.getByRole("button", { name: "保存する" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText("編集と永続化を確認")).toBeVisible();
  await page.getByRole("button", { name: "脆弱性・改善", exact: true }).click();
  await page
    .getByRole("button", { name: "確認事項を追加", exact: true })
    .click();
  await dialog
    .getByLabel("管理サイト")
    .selectOption({ label: "ブラウザー検証サイト" });
  await dialog.getByLabel("タイトル").fill("要確認：依存パッケージの更新");
  await dialog.getByLabel("重要度").selectOption("medium");
  await dialog
    .getByLabel("確認内容")
    .fill("架空の検証項目。実サイトの診断結果ではありません。");
  await dialog.getByLabel("対応期限").fill("2026-11-15");
  await dialog.getByRole("button", { name: "保存する" }).click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("button", { name: "要確認：依存パッケージの更新", exact: true })
    .click();
  await dialog.getByLabel("ステータス").selectOption("resolved");
  await dialog
    .getByLabel("改善内容・再確認結果")
    .fill("再検証完了（テスト用）");
  await dialog.getByRole("button", { name: "保存する" }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByLabel("ステータスで絞り込み").selectOption("resolved");
  await expect(
    page.getByRole("button", { name: "要確認：多要素認証", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "要確認：依存パッケージの更新",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "脆弱性・改善", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "要確認：依存パッケージの更新",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "概要", exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1080 });
  fs.mkdirSync("docs/screenshots", { recursive: true });
  await page.screenshot({
    path: "docs/screenshots/desktop.png",
    fullPage: true,
  });
  for (const width of [768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    if (width === 390)
      await page.screenshot({
        path: "docs/screenshots/mobile.png",
        fullPage: true,
      });
  }
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.getByRole("button", { name: "脆弱性・改善", exact: true }).click();
  await page
    .getByRole("button", {
      name: "要確認：依存パッケージの更新を削除",
      exact: true,
    })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "キャンセル" })
    .click();
  await expect(
    page.getByRole("button", {
      name: "要確認：依存パッケージの更新",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "要確認：依存パッケージの更新を削除",
      exact: true,
    })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "削除する" })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "要確認：依存パッケージの更新",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "管理サイト", exact: true }).click();
  await page
    .getByRole("button", { name: "ブラウザー検証サイトを削除" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "削除する" })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "ブラウザー検証サイト" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "ログアウト", exact: true }).click();
  await expect(page).toHaveURL(/login/);
  await page.goto("/");
  await expect(page).toHaveURL(/login/);
  expect(errors).toEqual([]);
});
test.afterAll(async () => {
  if (issueId) await owner.from("issues").delete().eq("id", issueId);
  if (siteId) await owner.from("sites").delete().eq("id", siteId);
  await owner.auth.signOut();
  await other.auth.signOut();
});

test("account creation, recoverable data loading errors and mobile logout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await page
    .getByRole("button", { name: "初めての方：アカウント作成" })
    .click();
  await page
    .getByLabel("メールアドレス")
    .fill(`signup-${Date.now()}@example.test`);
  await page.getByLabel("パスワード").fill(password);
  await page
    .getByRole("button", { name: "アカウントを作成", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "セキュリティ概要" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "まずは確認結果を記録しましょう" }),
  ).toBeVisible();
  const addSite = page.getByRole("button", {
    name: "サイトを追加",
    exact: true,
  });
  await addSite.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() =>
      Boolean(document.activeElement?.closest("dialog")),
    ),
  ).toBeTruthy();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(addSite).toBeFocused();
  await page.route("**/rest/v1/sites*", (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({ code: "42501", message: "permission denied" }),
    }),
  );
  await page.reload();
  await expect(
    page.getByRole("alert").filter({ hasText: "データを取得できません" }),
  ).toContainText("データを取得できません");
  await page.unroute("**/rest/v1/sites*");
  await page.getByRole("button", { name: "再試行", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "まずは確認結果を記録しましょう" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "ログアウト", exact: true }).click();
  await expect(page).toHaveURL(/login/);
});
