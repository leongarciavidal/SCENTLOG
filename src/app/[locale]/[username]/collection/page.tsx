import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { z } from "zod";

import { FragranceCard } from "@/components/fragrance/FragranceCard";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Pagination } from "@/components/ui/Pagination";
import { USERNAME_PATTERN } from "@/features/auth/constants";
import { getCurrentUser } from "@/features/auth/session";
import { DiaryEntryMeta } from "@/features/diary/components/DiaryEntryMeta";
import { COLLECTION_SORTS, getCollection } from "@/features/diary/queries";
import { DIARY_STATUSES } from "@/features/diary/schemas";
import { getProfileByUsername, getProfileStats } from "@/features/profiles/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type Props = PageProps<"/[locale]/[username]/collection">;

const querySchema = z.object({
  status: z.enum(DIARY_STATUSES).optional().catch(undefined),
  sort: z.enum(COLLECTION_SORTS).catch("recent"),
  page: z.coerce.number().int().min(1).max(1000).catch(1),
});

async function loadProfile(username: string) {
  if (!USERNAME_PATTERN.test(username.toLowerCase())) return null;
  return getProfileByUsername(username);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username } = await params;
  const profile = await loadProfile(username);
  if (!profile) return {};
  const t = await getTranslations({ locale: locale as Locale, namespace: "Collection" });
  return { title: t("metaTitle", { name: profile.display_name || profile.username }) };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { locale, username } = await params;
  setRequestLocale(locale as Locale);

  const profile = await loadProfile(username);
  if (!profile) notFound();

  const raw = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const query = querySchema.parse({
    status: first(raw.status) || undefined,
    sort: first(raw.sort) ?? "recent",
    page: first(raw.page) ?? 1,
  });

  const [t, td, viewer, stats, collection] = await Promise.all([
    getTranslations("Collection"),
    getTranslations("Diary"),
    getCurrentUser(),
    getProfileStats(profile.id),
    getCollection(profile.id, query),
  ]);
  const isOwn = viewer?.id === profile.id;
  const name = profile.display_name || profile.username;
  const base = `/${profile.username}/collection`;
  const href = (next: Partial<typeof query>) => {
    const merged = { ...query, ...next };
    const search = new URLSearchParams();
    if (merged.status) search.set("status", merged.status);
    if (merged.sort !== "recent") search.set("sort", merged.sort);
    if (merged.page > 1) search.set("page", String(merged.page));
    const value = search.toString();
    return value ? `${base}?${value}` : base;
  };
  const total = stats.owned + stats.tested + stats.wishlist + stats.finished;
  const tabs = [
    { key: undefined, label: t("all"), count: total },
    ...DIARY_STATUSES.map((status) => ({
      key: status,
      label: td(`statuses.${status}`),
      count: stats[status],
    })),
  ];

  return (
    <Container className="py-16 sm:py-20">
      <header className="mb-10 flex flex-col gap-4 border-b border-line pb-8">
        <Link href={`/${profile.username}`} className="eyebrow self-start hover:text-paper">
          ← @{profile.username}
        </Link>
        <h1 className="font-serif text-5xl leading-none sm:text-7xl">
          {isOwn ? t("titleOwn") : t("title", { name })}
        </h1>
      </header>

      <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <nav aria-label={t("eyebrow")} className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = query.status === tab.key;
            return (
              <Link
                key={tab.key ?? "all"}
                href={href({ status: tab.key, page: 1 })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center gap-2 border px-4 text-sm transition-colors",
                  active
                    ? "border-paper bg-paper text-ink"
                    : "border-line-strong text-paper-muted hover:text-paper",
                )}
              >
                {tab.label}
                <span className={cn("tabular-nums", active ? "text-ink/60" : "text-paper-faint")}>
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[0.625rem] tracking-[0.2em] text-paper-faint uppercase">
            {t("sort")}
          </span>
          {COLLECTION_SORTS.map((sort) => (
            <Link
              key={sort}
              href={href({ sort, page: 1 })}
              aria-current={query.sort === sort ? "true" : undefined}
              className={query.sort === sort ? "text-paper" : "text-paper-faint hover:text-paper"}
            >
              {isOwn && sort === "rating" ? t("sortsOwn.rating") : t(`sorts.${sort}`)}
            </Link>
          ))}
        </div>
      </div>

      {collection.items.length === 0 ? (
        <div className="flex flex-col items-start gap-6 py-10">
          <p className="max-w-lg font-serif text-3xl leading-snug text-paper-muted italic">
            {isOwn ? t("emptyOwn") : t("empty")}
          </p>
          {isOwn ? (
            <Link href="/fragrances" className={buttonClasses("secondary")}>
              {t("browse")}
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-16">
          <div className="grid grid-cols-2 gap-x-4 gap-y-14 sm:gap-x-6 lg:grid-cols-4">
            {collection.items.map((entry) => (
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
          <Pagination
            page={query.page}
            pageCount={collection.pageCount}
            hrefForPage={(page) => href({ page })}
          />
        </div>
      )}
    </Container>
  );
}
