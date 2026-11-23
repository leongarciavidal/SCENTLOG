import { defineRouting } from "next-intl/routing";

export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  // Every URL carries its language: /en/…, /es/…
  // Visiting "/" redirects using the saved cookie or the browser language.
  localePrefix: "always",
});
