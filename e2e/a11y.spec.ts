import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { signUpAndConfirm } from "./helpers";

/** Runs axe (WCAG 2.1 A + AA rules) and fails with a readable summary. */
async function expectAccessible(page: Page, name: string) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    // The Next.js dev-tools badge is not part of the site.
    .exclude("nextjs-portal")
    .analyze();
  const summary = results.violations.map(
    (v) =>
      `${name} · ${v.id} (${v.impact}): ${v.help} → ${v.nodes
        .map((n) => n.target.join(" "))
        .slice(0, 3)
        .join(" | ")}`,
  );
  expect(summary, summary.join("\n")).toEqual([]);
}

const PUBLIC_PAGES = [
  "/en",
  "/es/discover",
  "/en/fragrances",
  "/en/fragrances?q=hermes&family=woody-spicy",
  "/es/fragrances/hermes-terre-d-hermes-edt",
  "/en/brands",
  "/en/brands/chanel",
  "/en/perfumers/jacques-polge",
  "/en/lists",
  "/en/login",
  "/es/signup",
  "/en/forgot-password",
  "/es/privacy",
  "/en/does-not-exist",
];

for (const path of PUBLIC_PAGES) {
  test(`accessible: ${path}`, async ({ page }) => {
    await page.goto(path);
    await expectAccessible(page, path);
  });
}

test("accessible: signed-in pages", async ({ page }) => {
  test.setTimeout(90_000);
  const user = await signUpAndConfirm(page);
  for (const path of [
    `/en/${user.username}`,
    "/en/settings/profile",
    "/en/settings/favorites",
    "/en/feed",
    `/en/${user.username}/collection`,
    "/en/lists/new",
    "/en/fragrances/dior-sauvage-edt",
  ]) {
    await page.goto(path);
    await expectAccessible(page, path);
  }
});
