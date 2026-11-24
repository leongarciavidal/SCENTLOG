import { expect, type Page } from "@playwright/test";

const MAILPIT = "http://127.0.0.1:54324";

export function uniqueUser() {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return { username: `t_${id}`, email: `${id}@example.com`, password: "correct-horse-42" };
}

/** Waits for the latest email sent to `to` and returns the first link in it. */
export async function latestEmailLink(to: string, subjectIncludes?: RegExp): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const search = await fetch(
      `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`,
    );
    const { messages } = (await search.json()) as { messages: { ID: string; Subject: string }[] };
    const match = messages.find((m) => !subjectIncludes || subjectIncludes.test(m.Subject));
    if (match) {
      const message = await fetch(`${MAILPIT}/api/v1/message/${match.ID}`);
      const { HTML, Text } = (await message.json()) as { HTML: string; Text: string };
      const href = (
        HTML.match(/href="([^"]+)"/)?.[1] ?? Text.match(/https?:\/\/\S+/)?.[0]
      )?.replace(/&amp;/g, "&");
      if (href) return href;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No email received for ${to}`);
}

/** Signs up through the UI and confirms the email via Mailpit. Ends on the profile page. */
export async function signUpAndConfirm(page: Page, user = uniqueUser()) {
  await page.goto("/en/signup");
  await page.getByLabel("Username").fill(user.username);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("status")).toContainText("confirmation link");

  const link = await latestEmailLink(user.email, /confirm/i);
  await page.goto(link);
  await expect(page).toHaveURL(new RegExp(`/en/${user.username}$`));
  return user;
}

/** Signs out through the account menu and waits until it has completed. */
export async function signOut(page: Page) {
  await page.getByLabel("Account").click();
  await page.getByRole("button", { name: /Sign out|Cerrar sesión/ }).click();
  await expect(page.getByRole("link", { name: /Sign in|Entrar/ })).toBeVisible();
}

/** Form alerts (scoped to <main>; Next.js adds its own hidden route announcer). */
export const formAlert = (page: Page) => page.locator("main").getByRole("alert");

/**
 * Makes a user admin using the LOCAL Supabase secret key (read from
 * `supabase status`; it never exists in app code or in the repository).
 */
export async function makeAdmin(username: string) {
  const { execSync } = await import("node:child_process");
  const env = execSync("npx supabase status -o env", { encoding: "utf8" });
  const read = (name: string) => env.match(new RegExp(`^${name}="?([^"\\n]+)"?`, "m"))?.[1];
  const apiUrl = read("API_URL");
  const secret = read("SECRET_KEY") ?? read("SERVICE_ROLE_KEY");
  if (!apiUrl || !secret) throw new Error("Local Supabase is not running");

  const response = await fetch(`${apiUrl}/rest/v1/profiles?username=eq.${username}`, {
    method: "PATCH",
    headers: {
      apikey: secret,
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ is_admin: true }),
  });
  if (!response.ok)
    throw new Error(`Could not make admin: ${response.status} ${await response.text()}`);
}
