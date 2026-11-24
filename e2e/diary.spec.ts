import { expect, test, type Page } from "@playwright/test";

import { signOut, signUpAndConfirm } from "./helpers";

const diaryForm = (page: Page) => page.getByRole("form", { name: "Your diary" });

test("visitors are invited to sign in and come back to the fragrance", async ({ page }) => {
  const user = await signUpAndConfirm(page);
  await signOut(page);

  await page.goto("/en/fragrances/diptyque-tam-dao-edt");
  await expect(diaryForm(page)).toHaveCount(0);
  await page.locator("main").getByRole("link", { name: "Sign in", exact: true }).click();
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/fragrances\/diptyque-tam-dao-edt$/);
  await expect(diaryForm(page)).toBeVisible();
});

test("log, rate, make private, pick as favourite and remove a fragrance", async ({
  page,
  browser,
}) => {
  const user = await signUpAndConfirm(page);
  const slug = "guerlain-habit-rouge-edt";

  // --- Log it as Owned with 4.5 stars ------------------------------------
  await page.goto(`/en/fragrances/${slug}`);
  const form = diaryForm(page);
  await form.getByText("Owned", { exact: true }).click();
  await form.getByLabel("4.5 stars").check({ force: true });
  await expect(form.getByText("4.5", { exact: true })).toBeVisible();
  await form.getByLabel("Personal notes").fill("Grandfather's coat, in the best way.");
  await form.getByRole("button", { name: "Add to diary" }).click();
  await expect(form.getByRole("status")).toHaveText("Saved to your diary.");
  await expect(form.getByRole("button", { name: "Update entry" })).toBeVisible();
  await expect(page.getByText(/In \d+ diar(y|ies)/)).toBeVisible();

  // --- Profile and collection --------------------------------------------
  await page.goto(`/en/${user.username}`);
  await expect(page.getByRole("link", { name: /^1\s*Owned$/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Habit Rouge" })).toBeVisible();

  await page.getByRole("link", { name: "View full collection" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your collection");
  await expect(page.locator("main article")).toHaveCount(1);
  await page.getByRole("link", { name: /^Wishlist/ }).click();
  await expect(page.locator("main article")).toHaveCount(0);

  // --- Validation: a future date is rejected by the server ----------------
  await page.goto(`/en/fragrances/${slug}`);
  await form.getByLabel("Date added").evaluate((el) => el.removeAttribute("max"));
  await form.getByLabel("Date added").fill("2999-01-01");
  await form.getByRole("button", { name: "Update entry" }).click();
  await expect(form.getByText("Choose a valid date that is not in the future.")).toBeVisible();

  // --- Make it a private wishlist entry -----------------------------------
  await page.reload();
  await form.getByText("Wishlist", { exact: true }).click();
  await form.getByLabel("Keep this entry private").check();
  await form.getByRole("button", { name: "Update entry" }).click();
  await expect(form.getByRole("status")).toHaveText("Saved to your diary.");

  // The owner still sees it (marked private)…
  await page.goto(`/en/${user.username}/collection?status=wishlist`);
  await expect(page.locator("main article")).toHaveCount(1);
  await expect(page.locator("main article").getByText("Private")).toBeVisible();

  // …but a signed-out visitor does not.
  const visitor = await browser.newPage();
  await visitor.goto(`/en/${user.username}/collection`);
  await expect(visitor.getByText("Nothing here yet.")).toBeVisible();
  await visitor.goto(`/en/${user.username}`);
  await expect(visitor.getByRole("link", { name: /^0\s*Wishlist$/ })).toBeVisible();
  await visitor.close();

  // --- Top four --------------------------------------------------------------
  await page.goto("/en/settings/favorites");
  await page.getByLabel("Favourite 1").selectOption({ label: "Guerlain — Habit Rouge (EDT)" });
  await page.getByRole("button", { name: "Save top four" }).click();
  await expect(page.getByRole("status")).toHaveText("Top four saved.");
  await page.goto(`/en/${user.username}`);
  await expect(page.getByRole("link", { name: "Guerlain Habit Rouge" })).toBeVisible();

  // --- Remove from diary ---------------------------------------------------
  await page.goto(`/en/fragrances/${slug}`);
  page.once("dialog", (dialog) => dialog.accept());
  await form.getByRole("button", { name: "Remove from diary" }).click();
  await expect(form.getByRole("button", { name: "Add to diary" })).toBeVisible();
  await page.goto(`/en/${user.username}/collection`);
  await expect(page.getByText("Nothing here yet.")).toBeVisible();
});
