import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Container } from "@/components/ui/Container";
import { USERNAME_PATTERN } from "@/features/auth/constants";
import { getCurrentUser } from "@/features/auth/session";
import { getProfileByUsername } from "@/features/profiles/queries";
import { ReviewCard } from "@/features/reviews/components/ReviewCard";
import { getLikedReviewIds, getUserReviews } from "@/features/reviews/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

type Props = PageProps<"/[locale]/[username]/reviews">;

async function loadProfile(username: string) {
  if (!USERNAME_PATTERN.test(username.toLowerCase())) return null;
  return getProfileByUsername(username);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username } = await params;
  const profile = await loadProfile(username);
  if (!profile) return {};
  const t = await getTranslations({ locale: locale as Locale, namespace: "Reviews" });
  return { title: t("userReviewsTitle", { name: profile.display_name || profile.username }) };
}

export default async function UserReviewsPage({ params }: Props) {
  const { locale, username } = await params;
  setRequestLocale(locale as Locale);
  const profile = await loadProfile(username);
  if (!profile) notFound();

  const [t, viewer, reviews] = await Promise.all([
    getTranslations("Reviews"),
    getCurrentUser(),
    getUserReviews(profile.id),
  ]);
  const liked = await getLikedReviewIds(
    viewer?.id,
    reviews.map((r) => r.id),
  );
  const isOwn = viewer?.id === profile.id;

  return (
    <Container className="py-16 sm:py-20">
      <header className="mb-6 flex flex-col gap-4 border-b border-line pb-8">
        <Link href={`/${profile.username}`} className="eyebrow self-start hover:text-paper">
          ← @{profile.username}
        </Link>
        <h1 className="font-serif text-5xl leading-none sm:text-7xl">
          {isOwn
            ? t("userReviewsTitleOwn")
            : t("userReviewsTitle", { name: profile.display_name || profile.username })}
        </h1>
      </header>
      {reviews.length === 0 ? (
        <p className="py-10 font-serif text-3xl text-paper-muted italic">{t("userReviewsEmpty")}</p>
      ) : (
        <div className="flex max-w-3xl flex-col divide-y divide-line">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              liked={liked.has(review.id)}
              viewerId={viewer?.id ?? null}
              showFragrance
            />
          ))}
        </div>
      )}
    </Container>
  );
}
