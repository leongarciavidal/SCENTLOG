import path from "node:path";

import { expect, test } from "@playwright/test";

import { makeAdmin, signOut, signUpAndConfirm } from "./helpers";

const cards = (page: import("@playwright/test").Page) => page.locator("main article");

test("catalogue lists, searches accent-insensitively and filters", async ({ page }) => {
  await page.goto("/en/fragrances");
  await expect(page.getByText("23 fragrances")).toBeVisible();
  await expect(cards(page)).toHaveCount(23);

  // "hermes" (no accent) finds "Hermès" fragrances; brand name is searchable.
  await page.getByRole("searchbox").fill("hermes");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/q=hermes/);
  await expect(cards(page)).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Un Jardin sur le Nil" })).toBeVisible();

  // Selecting a concentration submits immediately and narrows the results.
  await page.getByLabel("Concentration").selectOption("parfum");
  await expect(page).toHaveURL(/concentration=parfum/);
  await expect(cards(page)).toHaveCount(1);
  await expect(page.getByText("Parfum · 2009")).toBeVisible();

  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(cards(page)).toHaveCount(23);

  await page.goto("/en/fragrances?q=zzzz");
  await expect(page.getByText("No fragrances match these filters.")).toBeVisible();

  // Sorting A–Z puts "Another 13" first.
  await page.goto("/en/fragrances?sort=az");
  await expect(cards(page).first()).toContainText("Another 13");

  // Invalid parameters are ignored instead of breaking the page.
  const response = await page.goto("/en/fragrances?sort=hack&page=-4&concentration=x");
  expect(response?.status()).toBe(200);
  await expect(cards(page)).toHaveCount(23);
});

test("fragrance page: details, notes, editions, perfumer and brand links", async ({ page }) => {
  await page.goto("/en/fragrances/dior-sauvage-edt");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sauvage");
  await expect(page.getByText("Eau de Toilette · 2015").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Aromatic Fougère" })).toBeVisible();

  // The EDP is listed as another edition of the EDT.
  const editions = page.locator("section", {
    has: page.getByRole("heading", { name: "Other editions" }),
  });
  await expect(editions.getByText("Eau de Parfum · 2018")).toBeVisible();

  // Clicking a note opens the catalogue filtered by that note.
  await page.getByRole("link", { name: "Ambroxan" }).click();
  await expect(page).toHaveURL(/note=ambroxan/);
  await expect(page.getByRole("link", { name: "Remove filter" })).toContainText("Ambroxan");
  await expect(cards(page)).toHaveCount(4);

  await page.goto("/en/fragrances/dior-sauvage-edt");
  await page.getByRole("link", { name: "François Demachy" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("François Demachy");
  await expect(page.getByText("2 fragrances in the catalogue")).toBeVisible();

  await page.goto("/en/fragrances/dior-sauvage-edt");
  await page.locator("main").getByRole("link", { name: "Dior", exact: true }).first().click();
  await expect(page).toHaveURL(/\/en\/brands\/dior$/);
  await expect(cards(page)).toHaveCount(3);
});

test("brand index and Spanish fragrance page", async ({ page }) => {
  await page.goto("/en/brands");
  await expect(page.getByRole("link", { name: /Maison Francis Kurkdjian/ })).toBeVisible();
  await expect(page.locator("main li")).toHaveCount(12);

  await page.goto("/es/fragrances/chanel-no-5-edp");
  await expect(page.getByText("Salida")).toBeVisible();
  await expect(page.getByText("Corazón")).toBeVisible();
  await expect(page.getByText("Fondo", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Aldehídos" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Floral aldehídica" })).toBeVisible();

  const missing = await page.goto("/es/fragrances/no-existe");
  expect(missing?.status()).toBe(404);
});

test("admins can upload a fragrance image; others cannot see the panel", async ({ page }) => {
  const user = await signUpAndConfirm(page);
  await page.goto("/en/fragrances/le-labo-santal-33-edp");
  await expect(page.getByRole("form", { name: "Admin · Image" })).toHaveCount(0);

  await makeAdmin(user.username);
  await page.reload();
  const panel = page.getByRole("form", { name: "Admin · Image" });
  await expect(panel).toBeVisible();

  // A credit is mandatory (clear any value left by an earlier run).
  await panel.getByLabel("Credit / source").fill("");
  await panel
    .locator('input[type="file"]')
    .setInputFiles(path.join(__dirname, "fixtures/avatar.png"));
  await panel.getByRole("button", { name: "Save image" }).click();
  await expect(panel.getByRole("alert")).toHaveText("Add a credit or source for the image.");

  await panel.getByLabel("Credit / source").fill("Photo: SCENTLOG test");
  await panel
    .locator('input[type="file"]')
    .setInputFiles(path.join(__dirname, "fixtures/avatar.png"));
  await panel.getByRole("button", { name: "Save image" }).click();
  await expect(panel.getByRole("status")).toHaveText("Image saved.");

  const image = page.getByRole("img", { name: "Le Labo Santal 33" });
  await expect(image).toBeVisible();
  await expect(page.getByText("Image: Photo: SCENTLOG test")).toBeVisible();

  // Visitors see the image but not the admin panel.
  await signOut(page);
  await page.goto("/en/fragrances/le-labo-santal-33-edp");
  await expect(page.getByRole("img", { name: "Le Labo Santal 33" })).toBeVisible();
  await expect(page.getByRole("form", { name: "Admin · Image" })).toHaveCount(0);

  // Clean up so other tests see the typographic placeholder again.
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByLabel("Account")).toBeVisible();
  await page.goto("/en/fragrances/le-labo-santal-33-edp");
  await page
    .getByRole("form", { name: "Admin · Image" })
    .getByRole("button", { name: "Remove image" })
    .click();
  await expect(page.getByRole("form", { name: "Admin · Image" }).getByRole("status")).toHaveText(
    "Image saved.",
  );
});
