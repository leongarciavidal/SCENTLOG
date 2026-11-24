import { expect, test } from "@playwright/test";

import { signUpAndConfirm } from "./helpers";

test("review, follow, like, comment and see it in the activity feed", async ({ browser }) => {
  const anaContext = await browser.newContext();
  const benContext = await browser.newContext();
  const ana = await anaContext.newPage();
  const ben = await benContext.newPage();
  const anaUser = await signUpAndConfirm(ana);
  const benUser = await signUpAndConfirm(ben);
  const slug = "byredo-mojave-ghost-edp";

  // --- Ana writes a review (no diary entry yet → created as "Tested") ------
  await ana.goto(`/en/fragrances/${slug}`);
  const editor = ana.getByRole("form", { name: "Write a review" });
  await editor.getByLabel("Review").fill("A soft desert haze: ambrette, magnolia and clean woods.");
  await editor.getByLabel("Longevity: 4/5").check({ force: true });
  await editor.getByLabel("Sillage: 2/5").check({ force: true });
  await editor.getByRole("button", { name: "Publish review" }).click();
  await expect(ana.getByRole("form", { name: "Your review" }).getByRole("status")).toHaveText(
    "Review published.",
  );
  await expect(
    ana.getByRole("form", { name: "Your diary" }).getByText("In your diary"),
  ).toBeVisible();
  const anaReview = ana.locator("article", { hasText: "A soft desert haze" });
  await expect(anaReview.getByText("Longevity")).toBeVisible();
  // You cannot like your own review.
  await expect(anaReview.getByRole("button", { name: /Like/ })).toHaveCount(0);

  // --- Ben follows Ana ------------------------------------------------------
  await ben.goto(`/en/${anaUser.username}`);
  await ben.getByRole("button", { name: "Follow" }).click();
  await expect(ben.getByRole("button", { name: /Following|Unfollow/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await ben.reload();
  await expect(ben.getByRole("button", { name: /Following|Unfollow/ })).toBeVisible();
  await ben.getByRole("link", { name: /^1\s*Followers$/ }).click();
  await expect(ben.getByRole("link", { name: new RegExp(benUser.username) })).toBeVisible();

  // --- Ben's feed shows Ana's activity -----------------------------------
  await ben.goto("/en/feed");
  await expect(ben.getByText(/reviewed Byredo Mojave Ghost/)).toBeVisible();
  await expect(ben.getByText(/You\s+started following/)).toBeVisible();

  // --- Ben likes and comments ---------------------------------------------
  await ben.goto(`/en/fragrances/${slug}`);
  const review = ben.locator("article", { hasText: "A soft desert haze" });
  await review.getByRole("button", { name: /Like · No likes/ }).click();
  await expect(review.getByRole("button", { name: /Unlike · 1 like/ })).toBeVisible();
  await ben.reload();
  await expect(review.getByRole("button", { name: /Unlike · 1 like/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await review.getByRole("link", { name: /Read review/ }).click();
  await expect(ben).toHaveURL(/\/en\/reviews\//);
  await ben.getByLabel("Add a comment").fill("Exactly how I'd describe it.");
  await ben.getByRole("button", { name: "Post comment" }).click();
  await expect(ben.getByText("Exactly how I'd describe it.")).toBeVisible();
  await expect(ben.getByLabel("Add a comment")).toHaveValue("");
  await expect(ben.getByText("1 comment", { exact: true })).toBeVisible();

  // Ana sees the like and the comment.
  await ana.goto(ben.url());
  await expect(ana.getByText("Exactly how I'd describe it.")).toBeVisible();
  await expect(ana.getByText("1 like")).toBeVisible();
  // Ana cannot delete Ben's comment.
  await expect(
    ana.locator("li", { hasText: "Exactly how" }).getByRole("button", { name: "Delete" }),
  ).toHaveCount(0);

  // Ben deletes his comment.
  ben.once("dialog", (d) => d.accept());
  await ben
    .locator("li", { hasText: "Exactly how" })
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(ben.getByText("No comments yet.")).toBeVisible();

  // --- Ana edits and then deletes her review -----------------------------
  await ana.goto(`/en/fragrances/${slug}`);
  const edit = ana.getByRole("form", { name: "Your review" });
  await edit.getByLabel("Review").fill("Edited: even softer on the second wear.");
  await edit.getByRole("button", { name: "Update review" }).click();
  await expect(ana.locator("article", { hasText: "Edited: even softer" })).toBeVisible();
  ana.once("dialog", (d) => d.accept());
  await ana
    .locator("article", { hasText: "Edited: even softer" })
    .getByRole("button", { name: "Delete review" })
    .click();
  await expect(ana.locator("article", { hasText: "Edited: even softer" })).toHaveCount(0);

  // --- Ben unfollows: Ana's events leave his feed -------------------------
  await ben.goto(`/en/${anaUser.username}`);
  await ben.getByRole("button", { name: /Following|Unfollow/ }).click();
  await expect(ben.getByRole("button", { name: "Follow" })).toBeVisible();
  await ben.goto("/en/feed");
  await expect(ben.getByText("Your feed is quiet.", { exact: false })).toBeVisible();

  // Clean up Ana's auto-created diary entry so the catalogue stays tidy.
  await ana.goto(`/en/fragrances/${slug}`);
  ana.once("dialog", (d) => d.accept());
  await ana
    .getByRole("form", { name: "Your diary" })
    .getByRole("button", { name: "Remove from diary" })
    .click();
  await expect(
    ana.getByRole("form", { name: "Your diary" }).getByRole("button", { name: "Add to diary" }),
  ).toBeVisible();

  await anaContext.close();
  await benContext.close();
});

test("visitors see reviews but need an account to like or comment", async ({ page }) => {
  await page.goto("/en/feed");
  await expect(page).toHaveURL(/\/en\/login\?next=/);
  await page.goto("/en/fragrances/chanel-coco-mademoiselle-edp");
  await expect(page.getByRole("link", { name: "Sign in to write a review." })).toBeVisible();
  const missing = await page.goto("/en/reviews/not-a-uuid");
  expect(missing?.status()).toBe(404);
});
