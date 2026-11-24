import { expect, test } from "@playwright/test";

import { signUpAndConfirm } from "./helpers";

test("security headers are sent", async ({ request }) => {
  const response = await request.get("/en");
  const headers = response.headers();
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("export my data, then delete my account", async ({ page }) => {
  const user = await signUpAndConfirm(page);

  // Log something so the export has content.
  await page.goto("/en/fragrances/creed-aventus-edp");
  const diary = page.getByRole("form", { name: "Your diary" });
  await diary.getByRole("button", { name: "Add to diary" }).click();
  await expect(diary.getByRole("status")).toHaveText("Saved to your diary.");

  // --- Export ------------------------------------------------------------------
  const exportResponse = await page.request.get("/api/account/export");
  expect(exportResponse.status()).toBe(200);
  expect(exportResponse.headers()["content-disposition"]).toContain("attachment");
  const data = await exportResponse.json();
  expect(data.profile.username).toBe(user.username);
  expect(data.diary).toHaveLength(1);
  expect(data.diary[0].fragrance.name).toBe("Aventus");

  // Visitors cannot export anything.
  const anonymous = await page.context().browser()!.newContext();
  const denied = await anonymous.request.get("http://localhost:3000/api/account/export");
  expect(denied.status()).toBe(401);
  await anonymous.close();

  // --- Delete ------------------------------------------------------------------
  await page.goto("/en/settings/profile");
  const form = page.getByRole("form", { name: "Delete account" });
  await form.getByLabel(/Type .* to confirm/).fill("wrong-name");
  await form.getByRole("button", { name: "Delete my account permanently" }).click();
  await expect(form.getByText("Type your username exactly to confirm.")).toBeVisible();

  await form.getByLabel(/Type .* to confirm/).fill(user.username);
  await form.getByRole("button", { name: "Delete my account permanently" }).click();
  await expect(page).toHaveURL(/\/en\?accountDeleted=1$/);
  await expect(page.getByRole("status").first()).toContainText(
    "Your account and all your data have been deleted.",
  );
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

  // The profile is gone and the old password no longer works.
  const profile = await page.goto(`/en/${user.username}`);
  expect(profile?.status()).toBe(404);
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Email or password is incorrect",
  );
});
