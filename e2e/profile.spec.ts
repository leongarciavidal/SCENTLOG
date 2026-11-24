import path from "node:path";

import { expect, test } from "@playwright/test";

import { signUpAndConfirm } from "./helpers";

test("edit profile details, upload an avatar and switch language", async ({ page }) => {
  const user = await signUpAndConfirm(page);

  await page.goto("/en/settings/profile");
  await page.getByLabel("Display name").fill("Léa Iris");
  await page.getByLabel("Biography").fill("Vetiver, iris and old libraries.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toHaveText("Profile saved.");

  // Avatar: the browser resizes the image, the server stores it in Storage.
  await page
    .locator('input[type="file"]')
    .setInputFiles(path.join(__dirname, "fixtures/avatar.png"));
  const avatar = page.locator("main img").first();
  await expect(avatar).toHaveAttribute("src", /\/storage\/v1\/object\/public\/avatars\//);
  const avatarUrl = await avatar.getAttribute("src");
  const imageResponse = await page.request.get(avatarUrl!);
  expect(imageResponse.ok()).toBe(true);

  // Public profile shows the new details (also to signed-out visitors).
  await page.goto(`/en/${user.username}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Léa Iris");
  await expect(page.getByText("Vetiver, iris and old libraries.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Edit profile" })).toBeVisible();

  // Too-long display name is rejected on the server (bypassing maxLength).
  await page.goto("/en/settings/profile");
  await page.getByLabel("Display name").evaluate((el) => el.removeAttribute("maxlength"));
  await page.getByLabel("Display name").fill("x".repeat(61));
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Use at most 60 characters.")).toBeVisible();

  // Changing the preferred language moves the interface to Spanish.
  await page.getByLabel("Display name").fill("Léa Iris");
  await page.getByLabel("Preferred language").selectOption("es");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/es\/settings\/profile$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Editar perfil");

  // Visitors who are not the owner do not see the edit button.
  await page.context().clearCookies();
  await page.goto(`/es/${user.username}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Léa Iris");
  await expect(page.getByRole("link", { name: "Editar perfil" })).toHaveCount(0);
});
