import { routing } from "@/i18n/routing";

/**
 * Canonical URL + hreflang alternates for a page that exists in every
 * language. `path` is the part after the locale, e.g. "/fragrances/x" or "".
 */
export function alternatesFor(locale: string, path: string) {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`])),
      "x-default": `/${routing.defaultLocale}${path}`,
    },
  };
}

/**
 * Open Graph data for a page. When a page defines its own `openGraph`, Next.js
 * no longer inherits the site-wide image, so it is always included here.
 */
export function openGraphFor(
  locale: string,
  { title, description, image }: { title: string; description?: string; image?: string | null },
) {
  return {
    title,
    description,
    siteName: "SCENTLOG",
    images: [image ?? `/${locale}/opengraph-image`],
  };
}
