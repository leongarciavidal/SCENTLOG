import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { z } from "zod";

import { FragranceCard } from "@/components/fragrance/FragranceCard";
import { Avatar } from "@/components/profile/Avatar";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { getCurrentUser } from "@/features/auth/session";
import { ListCover } from "@/features/lists/components/ListCover";
import { ListLikeButton } from "@/features/lists/components/ListLikeButton";
import { getListById, getListItems, hasLikedList } from "@/features/lists/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { alternatesFor, openGraphFor } from "@/lib/seo";

type Props = PageProps<"/[locale]/lists/[id]">;

async function load(id: string) {
  return z.uuid().safeParse(id).success ? getListById(id) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const list = await load(id);
  if (!list) return {};
  return {
    title: list.title,
    alternates: alternatesFor(locale, `/lists/${id}`),
    openGraph: openGraphFor(locale, {
      title: list.title,
      description: list.description ?? undefined,
      image: list.cover_image_url,
    }),
    description: list.description ?? undefined,
    robots: list.is_public ? undefined : { index: false },
  };
}

export default async function ListPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  const list = await load(id);
  if (!list) notFound();

  const [t, format, viewer, items] = await Promise.all([
    getTranslations("Lists"),
    getFormatter(),
    getCurrentUser(),
    getListItems(list.id),
  ]);
  const liked = await hasLikedList(viewer?.id, list.id);
  const isOwn = viewer?.id === list.user_id;
  const author = list.author.display_name || list.author.username;

  return (
    <>
      <section className="border-b border-line">
        <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-6">
            <div className="border border-line">
              <ListCover list={list} large />
            </div>
          </div>
          <div className="flex flex-col justify-end gap-6 lg:col-span-6">
            <Link href={`/${list.author.username}`} className="flex items-center gap-3 self-start">
              <Avatar url={list.author.avatar_url} name={author} size="sm" />
              <span className="text-sm text-paper-muted">{t("by", { name: author })}</span>
            </Link>
            <h1 className="font-serif text-5xl leading-[0.92] text-balance sm:text-7xl">
              {list.title}
            </h1>
            {list.description ? (
              <p className="max-w-xl leading-relaxed whitespace-pre-line text-paper-muted">
                {list.description}
              </p>
            ) : null}
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-paper-faint">
              <span>{t("count", { count: list.item_count })}</span>
              <span aria-hidden="true">·</span>
              <span>
                {t("updated", {
                  date: format.dateTime(new Date(list.updated_at), { dateStyle: "medium" }),
                })}
              </span>
              {!list.is_public ? (
                <span className="border border-line-strong px-1.5 py-0.5 text-[0.625rem] tracking-[0.15em] uppercase">
                  {t("private")}
                </span>
              ) : null}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {viewer && !isOwn && list.is_public ? (
                <ListLikeButton listId={list.id} liked={liked} count={list.like_count} />
              ) : (
                <span className="text-sm text-paper-faint">
                  {t("likes", { count: list.like_count })}
                </span>
              )}
              {isOwn ? (
                <Link href={`/lists/${list.id}/edit`} className={buttonClasses("secondary")}>
                  {t("edit")}
                </Link>
              ) : null}
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-16 sm:py-20">
        {items.length === 0 ? (
          <p className="font-serif text-2xl text-paper-muted italic">
            {isOwn ? t("emptyListOwn") : t("emptyList")}
          </p>
        ) : (
          <ol className="grid grid-cols-2 gap-x-4 gap-y-14 sm:gap-x-6 lg:grid-cols-4">
            {items.map((item, index) => (
              <li key={item.fragrance.id} className="flex flex-col gap-3">
                {list.is_ranked ? (
                  <span className="font-serif text-4xl text-paper-faint tabular-nums">
                    {index + 1}
                  </span>
                ) : null}
                <FragranceCard fragrance={item.fragrance} />
                {item.note ? <p className="text-sm text-paper-muted italic">{item.note}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </Container>
    </>
  );
}
