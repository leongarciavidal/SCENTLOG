import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { FragranceArtwork } from "@/components/fragrance/FragranceArtwork";
import { Avatar } from "@/components/profile/Avatar";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { USERNAME_PATTERN } from "@/features/auth/constants";
import { getCurrentUser } from "@/features/auth/session";
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

  const [t, format, viewer, stats, favorites] = await Promise.all([
    getTranslations("Profile"),
    getFormatter(),
    getCurrentUser(),
    getProfileStats(profile.id),
    getProfileFavorites(profile.id),
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
          ) : null}
        </Container>
      </section>

      {/* -------------------------------------------------------------- Stats */}
      <section className="border-b border-line">
        <Container>
          <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4 lg:grid-cols-8">
            {[...DIARY_STATS, ...SOCIAL_STATS].map((key) => (
              <Stat key={key} label={t(`stats.${key}`)} value={stats[key as keyof ProfileStats]} />
            ))}
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------ Top four */}
      <section aria-labelledby="top-four">
        <Container className="py-16 sm:py-20">
          <h2 id="top-four" className="eyebrow mb-8 border-b border-line pb-4">
            {t("topFour")}
          </h2>
          <ol className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {[1, 2, 3, 4].map((position) => {
              const fragrance = favorites.find((f) => f.position === position)?.fragrance;
              return (
                <li key={position}>
                  {fragrance ? (
                    <FragranceArtwork
                      name={fragrance.name}
                      brand={fragrance.brand.name}
                      concentrationShort={fragrance.concentration.toUpperCase()}
                      year={fragrance.release_year}
                      imageUrl={fragrance.image_url}
                      familySlug={fragrance.family?.slug}
                    />
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

      {/* --------------------------------------------------------------- Diary */}
      <section aria-labelledby="diary" className="border-t border-line">
        <Container className="py-16 sm:py-20">
          <h2 id="diary" className="eyebrow mb-8 border-b border-line pb-4">
            {t("diary")}
          </h2>
          <p className="max-w-lg font-serif text-2xl leading-snug text-paper-muted italic">
            {isOwn ? t("diaryEmptyOwn") : t("diaryEmpty")}
          </p>
        </Container>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-2 bg-ink px-4 py-6 sm:px-5">
      <span className="font-serif text-4xl tabular-nums">{value}</span>
      <span className="text-[0.6875rem] tracking-[0.18em] text-paper-faint uppercase">{label}</span>
    </div>
  );
}
