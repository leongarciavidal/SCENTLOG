import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Page links: first, last, and two pages around the current one. */
function visiblePages(current: number, total: number): (number | "gap")[] {
  const pages = new Set(
    [1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total),
  );
  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push("gap");
    result.push(page);
  });
  return result;
}

export async function Pagination({
  page,
  pageCount,
  hrefForPage,
}: {
  page: number;
  pageCount: number;
  hrefForPage: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  const t = await getTranslations("Catalogue");
  const linkClass =
    "inline-flex h-10 min-w-10 items-center justify-center px-3 text-sm transition-colors";

  return (
    <nav
      aria-label={t("pagination")}
      className="flex items-center justify-between gap-4 border-t border-line pt-8"
    >
      {page > 1 ? (
        <Link
          href={hrefForPage(page - 1)}
          rel="prev"
          className="link-underline text-sm text-paper-muted"
        >
          ← {t("previous")}
        </Link>
      ) : (
        <span />
      )}
      <ol className="hidden items-center gap-1 sm:flex">
        {visiblePages(page, pageCount).map((item, index) =>
          item === "gap" ? (
            <li key={`gap-${index}`} className="px-2 text-paper-faint" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={hrefForPage(item)}
                aria-current={item === page ? "page" : undefined}
                className={cn(
                  linkClass,
                  item === page
                    ? "border border-line-strong text-paper"
                    : "text-paper-faint hover:text-paper",
                )}
              >
                {item}
              </Link>
            </li>
          ),
        )}
      </ol>
      <span className="text-xs text-paper-faint sm:hidden">
        {t("pageOf", { page, pages: pageCount })}
      </span>
      {page < pageCount ? (
        <Link
          href={hrefForPage(page + 1)}
          rel="next"
          className="link-underline text-sm text-paper-muted"
        >
          {t("next")} →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
