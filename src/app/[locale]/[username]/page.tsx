import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { FragranceArtwork } from "@/components/fragrance/FragranceArtwork";
import { FragranceCard } from "@/components/fragrance/FragranceCard";
import { Avatar } from "@/components/profile/Avatar";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { USERNAME_PATTERN } from "@/features/auth/constants";
import { getCurrentUser } from "@/features/auth/session";
import { DiaryEntryMeta } from "@/features/diary/components/DiaryEntryMeta";
import { getRecentEntries } from "@/features/diary/queries";
import { ListCard } from "@/features/lists/components/ListCard";
import { getUserLists } from "@/features/lists/queries";
import { ReviewCard } from "@/features/reviews/components/ReviewCard";
import { getLikedReviewIds, getUserReviews } from "@/features/reviews/queries";
import { FollowButton } from "@/features/social/components/FollowButton";
import { isFollowing } from "@/features/social/queries";
import {
  getProfileByUsername,
  getProfileFavorites,
  getProfileStats,
  type ProfileStats,
} from "@/features/profiles/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

type Props = PageProps<"/[locale]/[username]">;

async function loadProfile(username: string) {
  // Skip the database for values that can never be a username.
  if (!USERNAME_PATTERN.test(username.toLowerCase())) return null;
  return getProfileByUsername(username);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await loadProfile(username);
  if (!profile) return {};
  const name = profile.display_name || profile.username;
  return {
    title: `${name} (@${profile.username})`,
    description: profile.bio ?? undefined,
  };
}

const DIARY_STATS = ["owned", "tested", "wishlist", "finished"] as const;
const SOCIAL_STATS = ["reviews", "lists", "followers", "following"] as const;

export default async function ProfilePage({ params }: Props) {
  const { locale, username } = await params;
  setRequestLocale(locale as Locale);

  const profile = await loadProfile(username);
  if (!profile) notFound();

  const [t, format, viewer, stats, favorites, recent, reviews, lists] = await Promise.all([
    getTranslations("Profile"),
    getFormatter(),
    getCurrentUser(),
    getProfileStats(profile.id),
    getProfileFavorites(profile.id),
    getRecentEntries(profile.id, 8),
    getUserReviews(profile.id),
    getUserLists(profile.id),
  ]);
  const [following, likedReviewIds] = await Promise.all([
    isFollowing(viewer?.id, profile.id),
    getLikedReviewIds(
      viewer?.id,
      reviews.slice(0, 3).map((r) => r.id),
    ),
  ]);
  const isOwn = viewer?.id === profile.id;
  const name = profile.display_name || profile.username;

  return (
    <>
      {/* ------------------------------------------------------------- Header */}
      <section className="border-b border-line">
        <Container className="flex flex-col gap-10 py-16 sm:py-20 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end">
            <Avatar url={profile.avatar_url} name={name} size="lg" />
            <div className="flex flex-col gap-4">
              <p className="eyebrow">@{profile.username}</p>
              <h1 className="font-serif text-5xl leading-none sm:text-7xl">{name}</h1>
              {profile.bio ? (
                <p className="max-w-xl leading-relaxed whitespace-pre-line text-paper-muted">
                  {profile.bio}
                </p>
              ) : null}
              <p className="text-xs text-paper-faint">
                {t("memberSince", {
                  date: format.dateTime(new Date(profile.created_at), {
                    month: "long",
                    year: "numeric",
                  }),
                })}
              </p>
            </div>
          </div>
          {isOwn ? (
            <Link
              href="/settings/profile"
              className={buttonClasses("secondary", "self-start lg:self-end")}
            >
              {t("edit")}
            </Link>
          ) : viewer ? (
            <div className="self-start lg:self-end">
              <FollowButton targetId={profile.id} following={following} />
            </div>
          ) : null}
        </Container>
      </section>

      {/* -------------------------------------------------------------- Stats */}
      <section className="border-b border-line">
        <Container>
          <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4 lg:grid-cols-8">
            {DIARY_STATS.map((key) => (
              <Stat
                key={key}
                label={t(`stats.${key}`)}
                value={stats[key]}
                href={`/${profile.username}/collection?status=${key}`}
              />
            ))}
            {SOCIAL_STATS.map((key) => (
              <Stat
                key={key}
                label={t(`stats.${key}`)}
                value={stats[key as keyof ProfileStats]}
                href={`/${profile.username}/${key}`}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------ Top four */}
      <section aria-labelledby="top-four">
        <Container className="py-16 sm:py-20">
          <div className="mb-8 flex items-end justify-between gap-4 border-b border-line pb-4">
            <h2 id="top-four" className="eyebrow">
              {t("topFour")}
            </h2>
            {isOwn ? (
              <Link href="/settings/favorites" className="link-underline text-xs text-paper-muted">
                {t("editTopFour")}
              </Link>
            ) : null}
          </div>
          <ol className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {[1, 2, 3, 4].map((position) => {
              const fragrance = favorites.find((f) => f.position === position)?.fragrance;
              return (
                <li key={position}>
                  {fragrance ? (
                    <Link
                      href={`/fragrances/${fragrance.slug}`}
                      className="group block"
                      aria-label={`${fragrance.brand.name} ${fragrance.name}`}
                    >
                      <FragranceArtwork
                        name={fragrance.name}
                        brand={fragrance.brand.name}
                        concentrationShort={fragrance.concentration.toUpperCase()}
                        year={fragrance.release_year}
                        imageUrl={fragrance.image_url}
                        familySlug={fragrance.family?.slug}
                      />
                    </Link>
                  ) : (
                    <div className="flex aspect-[4/5] items-end border border-dashed border-line-strong p-4">
                      <span className="font-serif text-3xl text-paper-faint">{position}</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          {favorites.length === 0 ? (
            <p className="mt-6 text-sm text-paper-faint">
              {isOwn ? t("topFourEmptyOwn") : t("topFourEmpty")}
            </p>
          ) : null}
        </Container>
      </section>

      {/* --------------------------------------------------------------- Lists */}
      {lists.length > 0 ? (
        <section aria-labelledby="profile-lists" className="border-t border-line">
          <Container className="py-16 sm:py-20">
            <div className="mb-8 flex items-end justify-between gap-4 border-b border-line pb-4">
              <h2 id="profile-lists" className="eyebrow">
                {t("listsTitle")}
              </h2>
              <Link
                href={`/${profile.username}/lists`}
                className="link-underline text-xs text-paper-muted"
              >
                {t("viewAllLists")}
              </Link>
            </div>
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {lists.slice(0, 3).map((list) => (
                <ListCard key={list.id} list={list} showAuthor={false} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* ------------------------------------------------------------- Reviews */}
      {reviews.length > 0 ? (
        <section aria-labelledby="profile-reviews" className="border-t border-line">
          <Container className="py-16 sm:py-20">
            <div className="mb-2 flex items-end justify-between gap-4 border-b border-line pb-4">
              <h2 id="profile-reviews" className="eyebrow">
                {t("reviewsTitle")}
              </h2>
              <Link
                href={`/${profile.username}/reviews`}
                className="link-underline text-xs text-paper-muted"
              >
                {t("viewAllReviews")}
              </Link>
            </div>
            <div className="flex max-w-3xl flex-col divide-y divide-line">
              {reviews.slice(0, 3).map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  liked={likedReviewIds.has(review.id)}
                  viewerId={viewer?.id ?? null}
                  showFragrance
                />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* --------------------------------------------------------------- Diary */}
      <section aria-labelledby="diary" className="border-t border-line">
        <Container className="py-16 sm:py-20">
          <div className="mb-8 flex items-end justify-between gap-4 border-b border-line pb-4">
            <h2 id="diary" className="eyebrow">
              {t("recent")}
            </h2>
            {recent.length > 0 ? (
              <Link
                href={`/${profile.username}/collection`}
                className="link-underline text-xs text-paper-muted"
              >
                {t("viewCollection")}
              </Link>
            ) : null}
          </div>
          {recent.length === 0 ? (
            <div className="flex flex-col items-start gap-6">
              <p className="max-w-lg font-serif text-2xl leading-snug text-paper-muted italic">
                {isOwn ? t("diaryEmptyOwn") : t("diaryEmpty")}
              </p>
              {isOwn ? (
                <Link href="/fragrances" className={buttonClasses("secondary")}>
                  {t("browseCatalogue")}
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-14 sm:gap-x-6 lg:grid-cols-4">
              {recent.map((entry) => (
                <FragranceCard
                  key={entry.id}
                  fragrance={entry.fragrance}
                  meta={
                    <DiaryEntryMeta
                      rating={entry.rating === null ? null : Number(entry.rating)}
                      status={entry.status}
                      isPrivate={entry.is_private}
                    />
                  }
                />
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const content = (
    <>
      <span className="font-serif text-4xl tabular-nums">{value}</span>
      <span className="text-[0.6875rem] tracking-[0.18em] text-paper-faint uppercase">{label}</span>
    </>
  );
  const className = "flex flex-col gap-2 bg-ink px-4 py-6 sm:px-5";
  return href ? (
    <Link href={href} className={`${className} transition-colors hover:bg-ink-raised`}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
