import { expect, test } from "@playwright/test";

import { formAlert, latestEmailLink, signOut, signUpAndConfirm, uniqueUser } from "./helpers";

test("sign up, confirm email and land on the new profile", async ({ page }) => {
  const user = await signUpAndConfirm(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(user.username);
  // Header now shows the account menu instead of "Sign in".
  await expect(page.getByLabel("Account")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
});

test("sign-up validation: reserved, badly formatted and taken usernames", async ({ page }) => {
  const existing = await signUpAndConfirm(page);
  await signOut(page);

  await page.goto("/en/signup");
  const username = page.getByLabel("Username");
  const submit = page.getByRole("button", { name: "Create account" });
  await page.getByLabel("Email").fill(uniqueUser().email);
  await page.getByLabel("Password").fill("correct-horse-42");

  await username.fill("admin");
  // Passwords are intentionally cleared after a failed submission.
  await page.getByLabel("Password").fill("correct-horse-42");
  await submit.click();
  await expect(page.getByText("This username is reserved")).toBeVisible();

  await username.fill("Bad Name!");
  // Passwords are intentionally cleared after a failed submission.
  await page.getByLabel("Password").fill("correct-horse-42");
  await submit.click();
  await expect(page.getByText("Use 3–30 lowercase letters")).toBeVisible();

  await username.fill(existing.username);
  // Passwords are intentionally cleared after a failed submission.
  await page.getByLabel("Password").fill("correct-horse-42");
  await submit.click();
  await expect(page.getByText("This username is already taken")).toBeVisible();
});

test("sign out, wrong password, then sign in", async ({ page }) => {
  const user = await signUpAndConfirm(page);
  await signOut(page);
  await expect(page).toHaveURL(/\/en$/);

  await page.goto("/en/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(formAlert(page)).toContainText("Email or password is incorrect");
  // The email field keeps its value after the error.
  await expect(page.getByLabel("Email")).toHaveValue(user.email);

  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByLabel("Account")).toBeVisible();
});

test("protected settings page redirects to login and back", async ({ page }) => {
  const user = uniqueUser();
  await signUpAndConfirm(page, user);
  await signOut(page);

  await page.goto("/en/settings/profile");
  await expect(page).toHaveURL(/\/en\/login\?next=/);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/settings\/profile$/);
});

test("password recovery by email", async ({ page, context }) => {
  const user = await signUpAndConfirm(page);
  await context.clearCookies();

  await page.goto("/en/forgot-password");
  await page.getByLabel("Email").fill(user.email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText("reset your password");

  const link = await latestEmailLink(user.email, /reset/i);
  await page.goto(link);
  await expect(page).toHaveURL(/\/en\/reset-password$/);

  await page.getByLabel("New password", { exact: true }).fill("brand-new-pass-77");
  await page.getByLabel("Repeat new password").fill("brand-new-pass-77");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByRole("status")).toContainText("password has been updated");

  await context.clearCookies();
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill("brand-new-pass-77");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByLabel("Account")).toBeVisible();
});

test("an invalid email link shows a friendly error", async ({ page }) => {
  await page.goto("/auth/confirm?code=not-a-real-code&next=/es/reset-password");
  await expect(page).toHaveURL(/\/es\/login\?error=link$/);
  await expect(formAlert(page)).toContainText("no es válido");
});

test("unknown profiles return 404", async ({ page }) => {
  const response = await page.goto("/en/nobody_has_this_name_123");
  expect(response?.status()).toBe(404);
});
