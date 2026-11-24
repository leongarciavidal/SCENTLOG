import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { USERNAME_PATTERN } from "@/features/auth/constants";
import { getCurrentUser } from "@/features/auth/session";
import { ListCard } from "@/features/lists/components/ListCard";
import { getUserLists } from "@/features/lists/queries";
import { getProfileByUsername } from "@/features/profiles/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

type Props = PageProps<"/[locale]/[username]/lists">;

async function loadProfile(username: string) {
  if (!USERNAME_PATTERN.test(username.toLowerCase())) return null;
  return getProfileByUsername(username);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username } = await params;
  const profile = await loadProfile(username);
  if (!profile) return {};
  const t = await getTranslations({ locale: locale as Locale, namespace: "Lists" });
  return { title: t("userListsTitle", { name: profile.display_name || profile.username }) };
}

export default async function UserListsPage({ params }: Props) {
  const { locale, username } = await params;
  setRequestLocale(locale as Locale);
  const profile = await loadProfile(username);
  if (!profile) notFound();

  const [t, viewer, lists] = await Promise.all([
    getTranslations("Lists"),
    getCurrentUser(),
    getUserLists(profile.id),
  ]);
  const isOwn = viewer?.id === profile.id;

  return (
    <Container className="py-16 sm:py-20">
      <header className="mb-12 flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-4">
          <Link href={`/${profile.username}`} className="eyebrow self-start hover:text-paper">
            ← @{profile.username}
          </Link>
          <h1 className="font-serif text-5xl leading-none sm:text-7xl">
            {isOwn
              ? t("userListsTitleOwn")
              : t("userListsTitle", { name: profile.display_name || profile.username })}
          </h1>
        </div>
        {isOwn ? (
          <Link href="/lists/new" className={buttonClasses("primary", "self-start sm:self-end")}>
            + {t("new")}
          </Link>
        ) : null}
      </header>
      {lists.length === 0 ? (
        <p className="font-serif text-3xl text-paper-muted italic">{t("userListsEmpty")}</p>
      ) : (
        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} showAuthor={false} />
          ))}
        </div>
      )}
    </Container>
  );
}
