import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FragranceGrid } from "@/components/fragrance/FragranceGrid";
import { Container } from "@/components/ui/Container";
import { getCurrentUser } from "@/features/auth/session";
import {
  getBrandsWithCounts,
  getFeaturedFragrances,
  getPopularFragrances,
  getTopRatedFragrances,
  TOP_RATED_MIN_RATINGS,
} from "@/features/fragrances/queries";
import { ListCard } from "@/features/lists/components/ListCard";
import { getPopularLists } from "@/features/lists/queries";
import { ReviewCard } from "@/features/reviews/components/ReviewCard";
import { getLikedReviewIds, getRecentReviews } from "@/features/reviews/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/discover">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Discover" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternatesFor(locale, "/discover"),
  };
}

export default async function DiscoverPage({ params }: PageProps<"/[locale]/discover">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const [t, viewer, popularLogged, topRated, reviews, lists, brands] = await Promise.all([
    getTranslations("Discover"),
    getCurrentUser(),
    getPopularFragrances(8),
    getTopRatedFragrances(8),
    getRecentReviews(4),
    getPopularLists(3),
    getBrandsWithCounts(),
  ]);
  // Early on, few fragrances are in diaries: fill "popular" from the catalogue.
  const featured = popularLogged.length >= 4 ? null : await getFeaturedFragrances(8);
  const popular = featured?.status === "ok" ? featured.data.items : popularLogged;
  const reviewItems = reviews.status === "ok" ? reviews.data : [];
  const liked = await getLikedReviewIds(
    viewer?.id,
    reviewItems.map((r) => r.id),
  );
  const topBrands = [...brands].sort((a, b) => b.count - a.count).slice(0, 12);

  return (
    <>
      <section className="border-b border-line">
        <Container className="flex flex-col gap-5 py-16 sm:py-24">
          <p className="eyebrow text-moss-bright">{t("eyebrow")}</p>
          <h1 className="max-w-4xl font-serif text-5xl leading-[0.92] text-balance sm:text-8xl">
            {t("title")}
          </h1>
        </Container>
      </section>

      <Section
        title={t("popular")}
        hint={t("popularHint")}
        href="/fragrances"
        viewAll={t("viewAll")}
      >
        <FragranceGrid items={popular} />
      </Section>

      <Section
        title={t("topRated")}
        hint={t("topRatedHint", { count: TOP_RATED_MIN_RATINGS })}
        href="/fragrances?sort=rating"
        viewAll={t("viewAll")}
      >
        {topRated.length === 0 ? <Empty>{t("noRated")}</Empty> : <FragranceGrid items={topRated} />}
      </Section>

      <Section title={t("lists")} href="/lists" viewAll={t("viewAll")}>
        {lists.length === 0 ? (
          <Empty>{t("noLists")}</Empty>
        ) : (
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <ListCard key={list.id} list={list} />
            ))}
          </div>
        )}
      </Section>

      <Section title={t("reviews")}>
        {reviewItems.length === 0 ? (
          <Empty>{t("noReviews")}</Empty>
        ) : (
          <div className="grid gap-x-12 lg:grid-cols-2">
            {reviewItems.map((review) => (
              <div key={review.id} className="border-t border-line">
                <ReviewCard
                  review={review}
                  liked={liked.has(review.id)}
                  viewerId={viewer?.id ?? null}
                  showFragrance
                />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={t("houses")} href="/brands" viewAll={t("viewAll")}>
        <ul className="flex flex-wrap gap-x-8 gap-y-4">
          {topBrands.map((brand) => (
            <li key={brand.slug}>
              <Link
                href={`/brands/${brand.slug}`}
                className="font-serif text-3xl text-paper-muted transition-colors hover:text-paper"
              >
                {brand.name}
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

function Section({
  title,
  hint,
  href,
  viewAll,
  children,
}: {
  title: string;
  hint?: string;
  href?: string;
  viewAll?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-line last:border-b-0">
      <Container className="py-16 sm:py-20">
        <div className="mb-10 flex items-end justify-between gap-6 border-b border-line pb-4">
          <div className="flex flex-col gap-2">
            <h2 className="font-serif text-4xl leading-none sm:text-5xl">{title}</h2>
            {hint ? <p className="text-xs text-paper-faint">{hint}</p> : null}
          </div>
          {href && viewAll ? (
            <Link href={href} className="link-underline shrink-0 text-sm text-paper-muted">
              {viewAll}
            </Link>
          ) : null}
        </div>
        {children}
      </Container>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="font-serif text-2xl text-paper-muted italic">{children}</p>;
}
