import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { z } from "zod";

import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { requireUser } from "@/features/auth/session";
import { FeedItem } from "@/features/social/components/FeedItem";
import { FEED_PAGE_SIZE, getFeed } from "@/features/social/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: PageProps<"/[locale]/feed">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Feed" });
  return { title: t("metaTitle"), robots: { index: false } };
}

export default async function FeedPage({ params, searchParams }: PageProps<"/[locale]/feed">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const user = await requireUser(locale, `/${locale}/feed`);

  const raw = (await searchParams).before;
  const before = z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .catch(undefined)
    .parse(Array.isArray(raw) ? raw[0] : raw);
  const [t, events] = await Promise.all([getTranslations("Feed"), getFeed(before)]);
  const last = events.at(-1);

  return (
    <Container className="py-16 sm:py-20">
      <div className="max-w-2xl">
        <header className="mb-10 flex flex-col gap-4 border-b border-line pb-8">
          <p className="eyebrow text-moss-bright">{t("eyebrow")}</p>
          <h1 className="font-serif text-5xl leading-none sm:text-7xl">{t("title")}</h1>
          <p className="text-paper-muted">{t("intro")}</p>
        </header>

        {events.length === 0 ? (
          <div className="flex flex-col items-start gap-5 py-6">
            <p className="font-serif text-3xl leading-snug text-paper-muted italic">{t("empty")}</p>
            <p className="text-sm text-paper-faint">{t("emptyHint")}</p>
            <Link href="/fragrances" className={buttonClasses("secondary")}>
              {t("browse")}
            </Link>
          </div>
        ) : (
          <>
            <ol className="flex flex-col divide-y divide-line">
              {events.map((event) => (
                <FeedItem key={event.id} event={event} viewerId={user.id} />
              ))}
            </ol>
            {events.length === FEED_PAGE_SIZE && last ? (
              <Link
                href={`/feed?before=${last.id}`}
                className="link-underline mt-10 inline-block text-sm text-paper-muted"
              >
                {t("older")} →
              </Link>
            ) : null}
          </>
        )}
      </div>
    </Container>
  );
}
