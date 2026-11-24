import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { FragranceArtwork } from "@/components/fragrance/FragranceArtwork";
import { FragranceGrid } from "@/components/fragrance/FragranceGrid";
import { Container } from "@/components/ui/Container";
import { RatingStars } from "@/components/ui/RatingStars";
import { buttonClasses } from "@/components/ui/Button";
import { getCurrentProfile } from "@/features/auth/session";
import { DiaryPanel } from "@/features/diary/components/DiaryPanel";
import { getMyDiaryEntry } from "@/features/diary/queries";
import { AddToListMenu } from "@/features/lists/components/AddToListMenu";
import { getMyListsFor } from "@/features/lists/queries";
import { ReviewCard } from "@/features/reviews/components/ReviewCard";
import { ReviewEditor } from "@/features/reviews/components/ReviewEditor";
import { getFragranceReviews, getLikedReviewIds, getMyReview } from "@/features/reviews/queries";
import { FragranceImageAdmin } from "@/features/fragrances/components/FragranceImageAdmin";
import { NotesPyramid } from "@/features/fragrances/components/NotesPyramid";
import {
  getFragranceBySlug,
  getMoreFromBrand,
  getRelatedEditions,
} from "@/features/fragrances/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { localized } from "@/lib/localized";

type Props = PageProps<"/[locale]/fragrances/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const fragrance = await getFragranceBySlug(slug);
  if (!fragrance) return {};
  const tc = await getTranslations({
    locale: locale as Locale,
    namespace: "Fragrance.concentration",
  });
  const title = `${fragrance.name} ${tc(fragrance.concentration)} — ${fragrance.brand.name}`;
  return {
    title,
    description: localized(fragrance, "description", locale) ?? undefined,
    openGraph: fragrance.image_url ? { images: [fragrance.image_url] } : undefined,
  };
}

export default async function FragrancePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);

  const fragrance = await getFragranceBySlug(slug);
  if (!fragrance) notFound();

  const [t, tc, tr, editions, profile, reviews] = await Promise.all([
    getTranslations("FragrancePage"),
    getTranslations("Fragrance.concentration"),
    getTranslations("Fragrance"),
    getRelatedEditions(fragrance),
    getCurrentProfile(),
    getFragranceReviews(fragrance.id),
  ]);
  const [moreFromBrand, diaryEntry, td, tReviews, myReview, likedIds, myLists] = await Promise.all([
    getMoreFromBrand(fragrance.brand_id, [fragrance.id, ...editions.map((e) => e.id)]),
    profile ? getMyDiaryEntry(profile.id, fragrance.id) : null,
    getTranslations("Diary"),
    getTranslations("Reviews"),
    profile ? getMyReview(profile.id, fragrance.id) : null,
    getLikedReviewIds(
      profile?.id,
      reviews.map((r) => r.id),
    ),
    profile ? getMyListsFor(profile.id, fragrance.id) : [],
  ]);

  const format = await getFormatter();
  const oneDecimal = (n: number) =>
    format.number(n, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const description = localized(fragrance, "description", locale);
  const rating = fragrance.rating_avg === null ? null : Number(fragrance.rating_avg);
  const perfumers = fragrance.perfumers.map((p) => p.perfumer).filter(Boolean);

  return (
    <>
      <section className="border-b border-line">
        <Container className="grid gap-12 py-12 sm:py-16 lg:grid-cols-12 lg:gap-16">
          {/* ---------------------------------------------------------- Visual */}
          <div className="flex flex-col gap-3 lg:col-span-5">
            <FragranceArtwork
              name={fragrance.name}
              brand={fragrance.brand.name}
              concentrationShort={fragrance.concentration.toUpperCase()}
              year={fragrance.release_year}
              imageUrl={fragrance.image_url}
              familySlug={fragrance.family?.slug}
              size="large"
              priority
            />
            {fragrance.image_url && fragrance.image_credit ? (
              <p className="text-xs text-paper-faint">
                {t("imageCredit", { credit: fragrance.image_credit })}
              </p>
            ) : null}
            {profile?.is_admin ? (
              <FragranceImageAdmin
                fragranceId={fragrance.id}
                slug={fragrance.slug}
                imageUrl={fragrance.image_url}
                credit={fragrance.image_credit}
              />
            ) : null}
          </div>

          {/* --------------------------------------------------------- Details */}
          <div className="flex flex-col gap-10 lg:col-span-7 lg:pt-4">
            <header className="flex flex-col gap-5">
              <Link
                href={`/brands/${fragrance.brand.slug}`}
                className="eyebrow self-start transition-colors hover:text-paper"
              >
                {fragrance.brand.name}
              </Link>
              <h1 className="font-serif text-6xl leading-[0.9] text-balance sm:text-8xl">
                {fragrance.name}
              </h1>
              <p className="text-lg text-paper-muted">
                {tc(fragrance.concentration)}
                {fragrance.release_year ? ` · ${fragrance.release_year}` : null}
              </p>
            </header>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-line py-5">
              <span className="eyebrow">{t("communityRating")}</span>
              {rating === null ? (
                <span className="text-sm text-paper-faint">{tr("notRated")}</span>
              ) : (
                <span className="flex items-center gap-3">
                  <span className="font-serif text-3xl tabular-nums">{oneDecimal(rating)}</span>
                  <RatingStars
                    rating={rating}
                    label={tr("ratingLabel", { rating: oneDecimal(rating) })}
                  />
                  <span className="text-xs text-paper-faint">
                    {tr("ratingCount", { count: fragrance.rating_count })}
                  </span>
                </span>
              )}
              <span className="text-xs text-paper-faint sm:ml-auto">
                {t("inDiaries", { count: fragrance.diary_count })}
              </span>
            </div>

            {profile ? <AddToListMenu fragranceId={fragrance.id} lists={myLists} /> : null}

            {description ? (
              <p className="max-w-2xl font-serif text-2xl leading-snug text-paper/90">
                {description}
              </p>
            ) : null}

            <dl className="grid gap-6 sm:grid-cols-3">
              {fragrance.family ? (
                <Fact label={t("family")}>
                  <Link
                    href={`/fragrances?family=${fragrance.family.slug}`}
                    className="link-underline"
                  >
                    {localized(fragrance.family, "name", locale)}
                  </Link>
                </Fact>
              ) : null}
              {perfumers.length > 0 ? (
                <Fact label={t("perfumers")}>
                  <span className="flex flex-col gap-1">
                    {perfumers.map((perfumer) => (
                      <Link
                        key={perfumer.slug}
                        href={`/perfumers/${perfumer.slug}`}
                        className="link-underline self-start"
                      >
                        {perfumer.name}
                      </Link>
                    ))}
                  </span>
                </Fact>
              ) : null}
              {fragrance.release_year ? (
                <Fact label={t("released")}>{fragrance.release_year}</Fact>
              ) : null}
            </dl>

            <section aria-labelledby="notes-title" className="flex flex-col gap-5">
              <h2 id="notes-title" className="eyebrow border-b border-line pb-3 text-paper">
                {t("notes")}
              </h2>
              <NotesPyramid notes={fragrance.notes} />
            </section>

            {/* -------------------------------------------------------- Diary */}
            {profile ? (
              <DiaryPanel
                fragranceId={fragrance.id}
                entry={diaryEntry}
                today={new Date().toISOString().slice(0, 10)}
              />
            ) : (
              <div className="flex flex-col items-start gap-5 border border-line-strong p-6 sm:p-8">
                <h2 className="font-serif text-3xl">{td("title")}</h2>
                <p className="text-paper-muted">{td("signInPrompt")}</p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/login?next=${encodeURIComponent(`/${locale}/fragrances/${fragrance.slug}`)}`}
                    className={buttonClasses("primary")}
                  >
                    {td("signIn")}
                  </Link>
                  <Link href="/signup" className={buttonClasses("secondary")}>
                    {td("join")}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* -------------------------------------------------------- Editions */}
      {editions.length > 0 ? (
        <Section title={t("editions")}>
          <FragranceGrid items={editions} />
        </Section>
      ) : null}

      {/* ---------------------------------------------------------- Reviews */}
      <Section title={t("reviews")}>
        <div className="flex flex-col gap-10">
          {profile ? (
            <ReviewEditor fragranceId={fragrance.id} existing={myReview} />
          ) : (
            <p className="text-sm text-paper-muted">
              <Link
                href={`/login?next=${encodeURIComponent(`/${locale}/fragrances/${fragrance.slug}`)}`}
                className="link-underline text-paper"
              >
                {tReviews("signInPrompt")}
              </Link>
            </p>
          )}
          {reviews.length === 0 ? (
            <p className="max-w-lg font-serif text-2xl leading-snug text-paper-muted italic">
              {t("reviewsEmpty")}
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-line border-t border-line">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  liked={likedIds.has(review.id)}
                  viewerId={profile?.id ?? null}
                />
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* ---------------------------------------------------- More from brand */}
      {moreFromBrand.length > 0 ? (
        <Section
          title={t("moreFrom", { brand: fragrance.brand.name })}
          aside={
            <Link
              href={`/brands/${fragrance.brand.slug}`}
              className="link-underline text-sm text-paper-muted"
            >
              {t("viewBrand", { brand: fragrance.brand.name })}
            </Link>
          }
        >
          <FragranceGrid items={moreFromBrand} />
        </Section>
      ) : null}
    </>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <dt className="eyebrow">{label}</dt>
      <dd className="text-paper">{children}</dd>
    </div>
  );
}

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-line last:border-b-0">
      <Container className="py-16 sm:py-20">
        <div className="mb-10 flex items-end justify-between gap-6 border-b border-line pb-4">
          <h2 className="font-serif text-4xl leading-none sm:text-5xl">{title}</h2>
          {aside}
        </div>
        {children}
      </Container>
    </section>
  );
}
