import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Container } from "@/components/ui/Container";
import { USERNAME_PATTERN } from "@/features/auth/constants";
import { getCurrentUser } from "@/features/auth/session";
import { getProfileByUsername } from "@/features/profiles/queries";
import { PeopleList } from "@/features/social/components/PeopleList";
import { getFollowers, getFollowedIds } from "@/features/social/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

type Props = PageProps<"/[locale]/[username]/followers">;

async function loadProfile(username: string) {
  if (!USERNAME_PATTERN.test(username.toLowerCase())) return null;
  return getProfileByUsername(username);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username } = await params;
  const profile = await loadProfile(username);
  if (!profile) return {};
  const t = await getTranslations({ locale: locale as Locale, namespace: "Social" });
  return {
    title: t("followersTitle", { name: profile.display_name || profile.username }),
    robots: { index: false },
  };
}

export default async function Page({ params }: Props) {
  const { locale, username } = await params;
  setRequestLocale(locale as Locale);
  const profile = await loadProfile(username);
  if (!profile) notFound();

  const [t, viewer, people] = await Promise.all([
    getTranslations("Social"),
    getCurrentUser(),
    getFollowers(profile.id),
  ]);
  const followedIds = await getFollowedIds(
    viewer?.id,
    people.map((p) => p.id),
  );

  return (
    <Container className="py-16 sm:py-20">
      <div className="max-w-3xl">
        <header className="mb-10 flex flex-col gap-4">
          <Link href={`/${profile.username}`} className="eyebrow self-start hover:text-paper">
            ← @{profile.username}
          </Link>
          <h1 className="font-serif text-5xl leading-none sm:text-6xl">
            {t("followersTitle", { name: profile.display_name || profile.username })}
          </h1>
        </header>
        {people.length === 0 ? (
          <p className="font-serif text-2xl text-paper-muted italic">{t("emptyFollowers")}</p>
        ) : (
          <PeopleList people={people} viewerId={viewer?.id ?? null} followedIds={followedIds} />
        )}
      </div>
    </Container>
  );
}
