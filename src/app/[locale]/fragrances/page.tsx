import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

import { FragranceGrid } from "@/components/fragrance/FragranceGrid";
import { Container } from "@/components/ui/Container";
import { Pagination } from "@/components/ui/Pagination";
import { CatalogueFilters } from "@/features/fragrances/components/CatalogueFilters";
import {
  getCatalogueFilterOptions,
  getNoteBySlug,
  searchCatalogue,
} from "@/features/fragrances/queries";
import { catalogueQuery, parseCatalogueParams } from "@/features/fragrances/search-params";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { localized } from "@/lib/localized";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/fragrances">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Catalogue" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function CataloguePage({
  params,
  searchParams,
}: PageProps<"/[locale]/fragrances">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const filters = parseCatalogueParams(await searchParams);

  const [t, result, options, note] = await Promise.all([
    getTranslations("Catalogue"),
    searchCatalogue(filters),
    getCatalogueFilterOptions(),
    filters.note ? getNoteBySlug(filters.note) : null,
  ]);
  const activeLocale = await getLocale();

  return (
    <Container className="py-16 sm:py-20">
      <header className="mb-10 flex items-end justify-between gap-6 border-b border-line pb-8">
        <div className="flex flex-col gap-4">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="font-serif text-5xl leading-none sm:text-7xl">{t("title")}</h1>
        </div>
        {result.status === "ok" ? (
          <p className="shrink-0 text-sm text-paper-faint tabular-nums" aria-live="polite">
            {t("count", { count: result.data.total })}
          </p>
        ) : null}
      </header>

      <div className="mb-14 flex flex-col gap-5">
        <CatalogueFilters key={JSON.stringify(filters)} params={filters} options={options} />
        {filters.note ? (
          <Link
            href={`/fragrances${catalogueQuery({ ...filters, note: undefined, page: 1 })}`}
            aria-label={t("removeFilter")}
            className="inline-flex items-center gap-3 self-start border border-moss-bright/60 px-3 py-1.5 text-sm text-paper transition-colors hover:border-paper"
          >
            {t("noteFilter", {
              note: note ? (localized(note, "name", activeLocale) ?? filters.note) : filters.note,
            })}
            <span aria-hidden="true" className="text-paper-faint">
              ×
            </span>
          </Link>
        ) : null}
      </div>

      {result.status === "error" ? (
        <p role="alert" className="border-l border-amber pl-4 text-sm text-paper-muted">
          {result.message}
        </p>
      ) : null}

      {result.status === "ok" && result.data.items.length === 0 ? (
        <div className="flex flex-col gap-3 py-10">
          <p className="font-serif text-3xl text-paper-muted italic">{t("empty")}</p>
          <p className="text-sm text-paper-faint">{t("emptyHint")}</p>
        </div>
      ) : null}

      {result.status === "ok" && result.data.items.length > 0 ? (
        <div className="flex flex-col gap-16">
          <FragranceGrid items={result.data.items} />
          <Pagination
            page={filters.page}
            pageCount={result.data.pageCount}
            hrefForPage={(page) => `/fragrances${catalogueQuery({ ...filters, page })}`}
          />
        </div>
      ) : null}
    </Container>
  );
}
