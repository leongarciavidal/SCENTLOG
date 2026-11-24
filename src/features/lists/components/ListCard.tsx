import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import type { ListCardData } from "../queries";
import { ListCover } from "./ListCover";

export async function ListCard({
  list,
  showAuthor = true,
}: {
  list: ListCardData;
  showAuthor?: boolean;
}) {
  const t = await getTranslations("Lists");
  return (
    <article className="group relative flex flex-col gap-4">
      <div className="overflow-hidden border border-line transition-colors group-hover:border-line-strong">
        <ListCover list={list} />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="font-serif text-2xl leading-tight">
          <Link
            href={`/lists/${list.id}`}
            className="group-hover:text-paper-muted after:absolute after:inset-0"
          >
            {list.title}
          </Link>
        </h3>
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-paper-faint">
          {showAuthor ? <span>{list.author.display_name || list.author.username}</span> : null}
          {showAuthor ? <span aria-hidden="true">·</span> : null}
          <span>{t("count", { count: list.item_count })}</span>
          <span aria-hidden="true">·</span>
          <span>{t("likes", { count: list.like_count })}</span>
          {!list.is_public ? (
            <span className="border border-line-strong px-1.5 py-0.5 text-[0.625rem] tracking-[0.15em] uppercase">
              {t("private")}
            </span>
          ) : null}
        </p>
      </div>
    </article>
  );
}
