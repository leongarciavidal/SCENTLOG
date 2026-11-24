import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { requireUser } from "@/features/auth/session";
import { FavoritesForm } from "@/features/diary/components/FavoritesForm";
import { getFavoriteCandidates } from "@/features/diary/queries";
import { getProfileFavorites } from "@/features/profiles/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings/favorites">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Favorites" });
  return { title: t("metaTitle"), robots: { index: false } };
}

export default async function FavoritesPage({ params }: PageProps<"/[locale]/settings/favorites">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const user = await requireUser(locale, `/${locale}/settings/favorites`);

  const [t, candidates, favorites] = await Promise.all([
    getTranslations("Favorites"),
    getFavoriteCandidates(user.id),
    getProfileFavorites(user.id),
  ]);
  const current = [1, 2, 3, 4].map(
    (p) => favorites.find((f) => f.position === p)?.fragrance?.id ?? null,
  );

  return (
    <Container className="py-16 sm:py-24">
      <div className="max-w-2xl">
        <header className="mb-12 flex flex-col gap-4 border-b border-line pb-10">
          <p className="eyebrow text-moss-bright">{t("eyebrow")}</p>
          <h1 className="font-serif text-5xl leading-none sm:text-6xl">{t("title")}</h1>
          <p className="leading-relaxed text-paper-muted">{t("intro")}</p>
        </header>
        {candidates.length === 0 ? (
          <div className="flex flex-col items-start gap-6">
            <p className="text-paper-muted">{t("emptyDiary")}</p>
            <Link href="/fragrances" className={buttonClasses("secondary")}>
              {t("browse")}
            </Link>
          </div>
        ) : (
          <FavoritesForm candidates={candidates} current={current} />
        )}
      </div>
    </Container>
  );
}
