import type { Locale } from "@/i18n/routing";

/**
 * Picks the column for the active language from rows that store translations
 * side by side (name_en / name_es, description_en / description_es…).
 * Falls back to English when the Spanish text is missing.
 */
export function localized<K extends string>(
  row: { [P in `${K}_en` | `${K}_es`]?: string | null },
  key: K,
  locale: Locale | string,
): string | null {
  const record = row as Record<string, string | null | undefined>;
  const value = locale === "es" ? record[`${key}_es`] : record[`${key}_en`];
  return value ?? record[`${key}_en`] ?? null;
}

/** "FR" → "Francia" / "France", using the browser/server's built-in country names. */
export function countryName(code: string | null | undefined, locale: string): string | null {
  if (!code) return null;
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
