import { routing, type Locale } from "@/i18n/routing";

/**
 * Accepts only same-site relative paths ("/en/settings"), rejecting values
 * such as "https://evil.com" or "//evil.com" to prevent open redirects.
 */
export function safeNextPath(value: string | null | undefined, fallback: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}

/** Extracts the locale from a path like "/es/settings", defaulting to English. */
export function localeFromPath(path: string): Locale {
  const segment = path.split("/")[1];
  return (routing.locales as readonly string[]).includes(segment)
    ? (segment as Locale)
    : routing.defaultLocale;
}
