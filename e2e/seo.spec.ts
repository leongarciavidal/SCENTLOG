import { expect, test } from "@playwright/test";

test("canonical and hreflang point to the page itself", async ({ page }) => {
  await page.goto("/es/fragrances/dior-sauvage-edt");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/es\/fragrances\/dior-sauvage-edt$/,
  );
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    "href",
    /\/en\/fragrances\/dior-sauvage-edt$/,
  );
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
    "href",
    /\/en\/fragrances\/dior-sauvage-edt$/,
  );
  await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute(
    "content",
    /opengraph-image/,
  );
});

test("sitemap and robots", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/en/fragrances/dior-sauvage-edt");
  expect(sitemap).toContain('hreflang="es"');
  expect(sitemap).not.toContain("/settings");

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /*/settings");
  expect(robots).toContain("Sitemap:");

  const og = await request.get("/en/opengraph-image");
  expect(og.headers()["content-type"]).toBe("image/png");
});

test("legal pages are linked from the footer and from sign-up", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("contentinfo").getByRole("link", { name: "Privacidad" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Política de privacidad");
  await expect(page.getByRole("heading", { name: "Tus derechos" })).toBeVisible();

  await page.goto("/en/signup");
  await page.getByRole("link", { name: "Terms of use" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Terms of use");

  await page.goto("/en/cookies");
  await expect(page.getByText("NEXT_LOCALE")).toBeVisible();
});
