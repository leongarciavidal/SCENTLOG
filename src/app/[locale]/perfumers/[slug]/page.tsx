import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FragranceGrid } from "@/components/fragrance/FragranceGrid";
import { Container } from "@/components/ui/Container";
import { getPerfumerBySlug, getPerfumerFragrances } from "@/features/fragrances/queries";
import type { Locale } from "@/i18n/routing";
import { alternatesFor } from "@/lib/seo";

type Props = PageProps<"/[locale]/perfumers/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const perfumer = await getPerfumerBySlug(slug);
  return perfumer
    ? { title: perfumer.name, alternates: alternatesFor(locale, `/perfumers/${slug}`) }
    : {};
}

export default async function PerfumerPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);

  const perfumer = await getPerfumerBySlug(slug);
  if (!perfumer) notFound();

  const [t, fragrances] = await Promise.all([
    getTranslations("Perfumer"),
    getPerfumerFragrances(perfumer.id),
  ]);

  return (
    <>
      <section className="border-b border-line">
        <Container className="flex flex-col gap-6 py-16 sm:py-24">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="font-serif text-6xl leading-[0.9] sm:text-8xl">{perfumer.name}</h1>
          <p className="text-paper-muted">{t("fragrances", { count: fragrances.length })}</p>
        </Container>
      </section>
      <Container className="py-16 sm:py-20">
        <FragranceGrid items={fragrances} />
      </Container>
    </>
  );
}
