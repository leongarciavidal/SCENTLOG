import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Container } from "@/components/ui/Container";
import { getBrandsWithCounts } from "@/features/fragrances/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { alternatesFor } from "@/lib/seo";
import { countryName } from "@/lib/localized";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/brands">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Brands" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternatesFor(locale, "/brands"),
  };
}

export default async function BrandsPage({ params }: PageProps<"/[locale]/brands">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const [t, brands] = await Promise.all([getTranslations("Brands"), getBrandsWithCounts()]);

  // Group alphabetically: A, B, C…
  const groups = new Map<string, typeof brands>();
  for (const brand of brands) {
    const letter = brand.name.normalize("NFD").charAt(0).toUpperCase();
    groups.set(letter, [...(groups.get(letter) ?? []), brand]);
  }

  return (
    <Container className="py-16 sm:py-20">
      <header className="mb-14 flex flex-col gap-4 border-b border-line pb-8">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="font-serif text-5xl leading-none sm:text-7xl">{t("title")}</h1>
      </header>

      <div className="flex flex-col">
        {[...groups.entries()].map(([letter, items]) => (
          <section
            key={letter}
            className="grid gap-6 border-b border-line py-8 sm:grid-cols-[6rem_1fr]"
          >
            <h2 className="font-serif text-4xl text-paper-faint">{letter}</h2>
            <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((brand) => (
                <li key={brand.slug}>
                  <Link href={`/brands/${brand.slug}`} className="group flex flex-col gap-1">
                    <span className="font-serif text-2xl transition-colors group-hover:text-paper-muted">
                      {brand.name}
                    </span>
                    <span className="text-xs text-paper-faint">
                      {t("count", { count: brand.count })}
                      {brand.country ? ` · ${countryName(brand.country, locale)}` : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Container>
  );
}
