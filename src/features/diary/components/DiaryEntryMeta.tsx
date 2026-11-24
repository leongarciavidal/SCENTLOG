import { useFormatter, useTranslations } from "next-intl";

import { RatingStars } from "@/components/ui/RatingStars";

import type { DiaryStatus } from "../schemas";

/** "★★★★½ · Owned · Private" line shown under a fragrance in a collection. */
export function DiaryEntryMeta({
  rating,
  status,
  isPrivate,
}: {
  rating: number | null;
  status: DiaryStatus;
  isPrivate: boolean;
}) {
  const t = useTranslations("Diary");
  const tr = useTranslations("Fragrance");
  const format = useFormatter();
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {rating !== null ? (
        <RatingStars
          rating={rating}
          label={tr("ratingLabel", {
            rating: format.number(rating, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
          })}
        />
      ) : null}
      <span className="text-paper-muted">{t(`statuses.${status}`)}</span>
      {isPrivate ? (
        <span className="border border-line-strong px-1.5 py-0.5 text-[0.625rem] tracking-[0.15em] uppercase">
          {t("private_badge")}
        </span>
      ) : null}
    </span>
  );
}
