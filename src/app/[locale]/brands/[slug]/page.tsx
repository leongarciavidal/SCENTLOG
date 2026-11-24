import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FragranceGrid } from "@/components/fragrance/FragranceGrid";
import { Container } from "@/components/ui/Container";
import { getBrandBySlug, getBrandFragrances } from "@/features/fragrances/queries";
import type { Locale } from "@/i18n/routing";
import { alternatesFor, openGraphFor } from "@/lib/seo";
import { countryName, localized } from "@/lib/localized";

type Props = PageProps<"/[locale]/brands/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) return {};
  return {
    title: brand.name,
    alternates: alternatesFor(locale, `/brands/${slug}`),
    openGraph: openGraphFor(locale, { title: brand.name }),
    description: localized(brand, "description", locale) ?? undefined,
  };
}

export default async function BrandPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);

  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const [t, fragrances] = await Promise.all([
    getTranslations("Brands"),
    getBrandFragrances(brand.id),
  ]);
  const description = localized(brand, "description", locale);
  const meta = [
    countryName(brand.country, locale),
    brand.founded_year ? t("founded", { year: brand.founded_year }) : null,
  ].filter(Boolean);

  return (
    <>
      <section className="border-b border-line">
        <Container className="flex flex-col gap-6 py-16 sm:py-24">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="font-serif text-6xl leading-[0.9] sm:text-8xl">{brand.name}</h1>
          {meta.length > 0 ? <p className="text-paper-muted">{meta.join(" · ")}</p> : null}
          {description ? (
            <p className="max-w-2xl font-serif text-2xl leading-snug text-paper/90">
              {description}
            </p>
          ) : null}
          {brand.website_url ? (
            <a
              href={brand.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline self-start text-sm text-paper-muted"
            >
              {t("website")} ↗
            </a>
          ) : null}
        </Container>
      </section>

      <Container className="py-16 sm:py-20">
        <div className="mb-10 flex items-end justify-between gap-6 border-b border-line pb-4">
          <h2 className="font-serif text-4xl leading-none sm:text-5xl">{t("fragrances")}</h2>
          <p className="text-sm text-paper-faint tabular-nums">
            {t("count", { count: fragrances.length })}
          </p>
        </div>
        {fragrances.length > 0 ? (
          <FragranceGrid items={fragrances} />
        ) : (
          <p className="font-serif text-2xl text-paper-muted italic">{t("empty")}</p>
        )}
      </Container>
    </>
  );
}
