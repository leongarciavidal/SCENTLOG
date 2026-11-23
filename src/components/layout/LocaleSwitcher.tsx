"use client";

import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Language selector. Plain links (not a dropdown) so it works without
 * JavaScript and keeps the user on the same page in the other language.
 * next-intl remembers the choice in a cookie.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={t("language")} className={cn("flex items-center gap-3", className)}>
      {routing.locales.map((code, index) => (
        <span key={code} className="flex items-center gap-3">
          {index > 0 ? <span aria-hidden="true" className="h-3 w-px bg-line-strong" /> : null}
          <Link
            href={pathname}
            locale={code}
            hrefLang={code}
            aria-current={code === locale ? "true" : undefined}
            className={cn(
              "text-[0.6875rem] font-medium tracking-[0.22em] uppercase transition-colors duration-200",
              code === locale ? "text-paper" : "text-paper-faint hover:text-paper",
            )}
          >
            {code}
          </Link>
        </span>
      ))}
    </nav>
  );
}
