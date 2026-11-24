import path from "node:path";

import { expect, test } from "@playwright/test";

import { signUpAndConfirm } from "./helpers";

test("create, fill, reorder, like and delete a list", async ({ browser }) => {
  test.setTimeout(90_000);
  const ownerContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  const ownerUser = await signUpAndConfirm(owner);

  // --- Start a list from a fragrance page ----------------------------------
  await owner.goto("/en/fragrances/diptyque-philosykos-edt");
  await owner.getByText("+ Add to list").click();
  await owner.getByRole("link", { name: "+ New list with this fragrance" }).click();
  await expect(owner).toHaveURL(/\/en\/lists\/new\?add=/);
  await owner.getByLabel("Title").fill("Summer figs and greens");
  await owner.getByLabel("Description").fill("Green, milky, sun-warmed.");
  await owner.getByLabel(/Ranked list/).check();
  await owner.getByRole("button", { name: "Create list" }).click();
  await expect(owner).toHaveURL(/\/en\/lists\/[0-9a-f-]+\/edit$/);
  const editUrl = owner.url();

  // The fragrance we started from is already in the list.
  const items = owner
    .getByRole("region", { name: /Fragrances/ })
    .or(owner.locator("section", { has: owner.getByRole("heading", { name: /Fragrances ·/ }) }));
  await expect(items.getByText("Philosykos")).toBeVisible();

  // --- Add two more via search ----------------------------------------------
  const search = owner.getByRole("searchbox", { name: "Search by name or house…" });
  await search.fill("jardin");
  await owner.getByRole("button", { name: "Add: Hermès Un Jardin sur le Nil" }).click();
  await expect(items.getByText("Un Jardin sur le Nil")).toBeVisible();
  await search.fill("terre");
  await owner
    .getByRole("button", { name: /Add: Hermès Terre d'Hermès/ })
    .first()
    .click();
  await expect(owner.getByRole("heading", { name: /Fragrances · 3 fragrances/ })).toBeVisible();

  // --- Reorder: move the last one up to second place -------------------------
  await owner.getByRole("button", { name: /Move up: Terre d'Hermès/ }).click();
  await expect(items.locator("li").nth(1)).toContainText("Terre d'Hermès");

  // --- Remove one -----------------------------------------------------------
  await owner.getByRole("button", { name: "Remove: Un Jardin sur le Nil" }).click();
  await expect(owner.getByRole("heading", { name: /Fragrances · 2 fragrances/ })).toBeVisible();

  // --- Cover upload ---------------------------------------------------------
  await owner
    .locator('input[type="file"]')
    .setInputFiles(path.join(__dirname, "fixtures/avatar.png"));
  await expect(owner.getByRole("button", { name: "Remove cover" })).toBeVisible();

  // --- Public page: ranked numbers, in order ---------------------------------
  await owner.getByRole("link", { name: "View list" }).click();
  await expect(owner).toHaveURL(/\/en\/lists\/[0-9a-f-]+$/);
  await expect(owner.getByRole("heading", { level: 1 })).toHaveText("Summer figs and greens");
  const cards = owner.locator("main ol > li");
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toContainText("1");
  await expect(cards.nth(0)).toContainText("Philosykos");
  await expect(cards.nth(1)).toContainText("Terre d'Hermès");
  const listUrl = owner.url();

  // --- Another user likes it; it shows on the profile and in the feed -------
  const fanContext = await browser.newContext();
  const fan = await fanContext.newPage();
  await signUpAndConfirm(fan);
  await fan.goto(listUrl);
  await fan.getByRole("button", { name: /Like list · No likes/ }).click();
  await expect(fan.getByRole("button", { name: /Unlike list · 1 like/ })).toBeVisible();
  await fan.goto(`/en/${ownerUser.username}`);
  await expect(fan.getByRole("link", { name: "Summer figs and greens" })).toBeVisible();
  await fan.getByRole("button", { name: "Follow" }).click();
  await expect(fan.getByRole("button", { name: /Following|Unfollow/ })).toBeVisible();
  await fan.goto("/en/feed");
  await expect(fan.getByText(/created the list\s+Summer figs and greens/)).toBeVisible();

  // --- Making it private hides it from others --------------------------------
  await owner.goto(editUrl);
  await owner.getByLabel(/Public list/).uncheck();
  await owner.getByRole("button", { name: "Save details" }).click();
  await expect(owner.getByRole("status")).toHaveText("List saved.");
  const hidden = await fan.goto(listUrl);
  expect(hidden?.status()).toBe(404);
  await fan.goto(`/en/${ownerUser.username}/lists`);
  await expect(fan.getByText("No lists yet.")).toBeVisible();
  // Non-owners cannot open the editor.
  await owner.goto(listUrl);
  const editAttempt = await fan.goto(editUrl);
  expect(editAttempt?.status()).toBe(404);

  // --- Delete -------------------------------------------------------------------
  await owner.goto(editUrl);
  owner.once("dialog", (d) => d.accept());
  await owner.getByRole("button", { name: "Delete list" }).click();
  await expect(owner).toHaveURL(new RegExp(`/en/${ownerUser.username}/lists$`));
  await expect(owner.getByText("No lists yet.")).toBeVisible();

  await ownerContext.close();
  await fanContext.close();
});

test("discover page and navigation", async ({ page }) => {
  await page.goto("/en");
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Discover" })
    .click();
  await expect(page).toHaveURL(/\/en\/discover$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What the community is wearing");
  await expect(page.getByRole("heading", { name: "Popular this season" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Highest rated" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Houses" })).toBeVisible();
  await page.getByRole("link", { name: "Hermès", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/brands\/hermes$/);

  await page.goto("/es/lists");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Listas");
});
