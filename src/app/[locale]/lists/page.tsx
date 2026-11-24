import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { getCurrentUser } from "@/features/auth/session";
import { ListCard } from "@/features/lists/components/ListCard";
import { getPopularLists, getRecentLists } from "@/features/lists/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lists">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Lists" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternatesFor(locale, "/lists"),
  };
}

export default async function ListsPage({ params }: PageProps<"/[locale]/lists">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const [t, viewer, popular, recent] = await Promise.all([
    getTranslations("Lists"),
    getCurrentUser(),
    getPopularLists(6),
    getRecentLists(12),
  ]);

  return (
    <Container className="py-16 sm:py-20">
      <header className="mb-14 flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-4">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="font-serif text-5xl leading-none sm:text-7xl">{t("title")}</h1>
        </div>
        {viewer ? (
          <Link href="/lists/new" className={buttonClasses("primary", "self-start sm:self-end")}>
            + {t("new")}
          </Link>
        ) : null}
      </header>

      {popular.length === 0 ? (
        <p className="font-serif text-3xl text-paper-muted italic">{t("empty")}</p>
      ) : (
        <div className="flex flex-col gap-20">
          <section aria-labelledby="popular-lists">
            <h2 id="popular-lists" className="eyebrow mb-8 border-b border-line pb-4">
              {t("popular")}
            </h2>
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {popular.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </div>
          </section>
          <section aria-labelledby="recent-lists">
            <h2 id="recent-lists" className="eyebrow mb-8 border-b border-line pb-4">
              {t("recent")}
            </h2>
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </div>
          </section>
        </div>
      )}
    </Container>
  );
}
