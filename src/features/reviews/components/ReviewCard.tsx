import { getFormatter, getTranslations } from "next-intl/server";

import { Avatar } from "@/components/profile/Avatar";
import { RatingStars } from "@/components/ui/RatingStars";
import { getCurrentProfile } from "@/features/auth/session";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { deleteReview } from "../actions";
import type { ReviewCardData } from "../queries";
import { REVIEW_DIMENSIONS } from "../schemas";
import { DeleteButton } from "./DeleteButton";
import { LikeButton } from "./LikeButton";

/** One review: author, rating, text, optional dimensions, likes and comments. */
export async function ReviewCard({
  review,
  liked,
  viewerId,
  showFragrance = false,
  full = false,
}: {
  review: ReviewCardData;
  liked: boolean;
  viewerId: string | null;
  showFragrance?: boolean;
  full?: boolean;
}) {
  const [t, tr, format] = await Promise.all([
    getTranslations("Reviews"),
    getTranslations("Fragrance"),
    getFormatter(),
  ]);
  const isOwn = viewerId === review.user_id;
  // Admins can remove any review (moderation); only the author can edit it.
  const canDelete = isOwn || Boolean(viewerId && (await getCurrentProfile())?.is_admin);
  const name = review.author.display_name || review.author.username;
  const rating =
    review.entry?.rating === null || review.entry?.rating === undefined
      ? null
      : Number(review.entry.rating);
  const dimensions = REVIEW_DIMENSIONS.filter((key) => review[key] !== null);
  const edited =
    new Date(review.updated_at).getTime() - new Date(review.created_at).getTime() > 60_000;

  return (
    <article className="group relative flex flex-col gap-5 py-8">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href={`/${review.author.username}`} className="relative z-10 flex items-center gap-3">
          <Avatar url={review.author.avatar_url} name={name} size="sm" />
          <span className="text-sm text-paper">{name}</span>
        </Link>
        {rating !== null ? (
          <RatingStars
            rating={rating}
            label={tr("ratingLabel", {
              rating: format.number(rating, { minimumFractionDigits: 1 }),
            })}
          />
        ) : null}
        <time dateTime={review.created_at} className="text-xs text-paper-faint">
          {format.dateTime(new Date(review.created_at), { dateStyle: "medium" })}
          {edited ? ` · ${t("edited")}` : null}
        </time>
      </header>

      {showFragrance ? (
        <h3 className="flex flex-col gap-1">
          <span className="eyebrow">{review.fragrance.brand.name}</span>
          <Link
            href={`/fragrances/${review.fragrance.slug}`}
            className="relative z-10 font-serif text-3xl leading-tight hover:text-paper-muted"
          >
            {review.fragrance.name}
          </Link>
        </h3>
      ) : null}

      <p
        className={cn(
          "max-w-3xl leading-relaxed whitespace-pre-line text-paper/90",
          !full && "line-clamp-6",
        )}
      >
        {review.body}
      </p>

      {dimensions.length > 0 ? (
        <dl className="flex flex-wrap gap-x-6 gap-y-3">
          {dimensions.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <dt className="text-[0.625rem] tracking-[0.18em] text-paper-faint uppercase">
                {t(`dimensions.${key}`)}
              </dt>
              <dd className="flex gap-0.5" aria-label={`${review[key]}/5`}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 w-3",
                      i <= (review[key] ?? 0) ? "bg-moss-bright" : "bg-line-strong",
                    )}
                  />
                ))}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      <footer className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <LikeButton
          reviewId={review.id}
          liked={liked}
          count={review.like_count}
          mode={!viewerId ? "signin" : isOwn ? "readonly" : "interactive"}
        />
        <Link
          href={`/reviews/${review.id}`}
          className="relative z-10 text-xs text-paper-faint hover:text-paper"
        >
          {full
            ? t("comments", { count: review.comment_count })
            : `${t("comments", { count: review.comment_count })} · ${t("readMore")}`}
        </Link>
        {isOwn ? (
          <Link
            href={`/fragrances/${review.fragrance.slug}#review`}
            className="relative z-10 text-xs text-paper-faint hover:text-paper"
          >
            {t("editLink")}
          </Link>
        ) : null}
        {canDelete ? (
          <DeleteButton
            label={t("delete")}
            confirm={t("deleteConfirm")}
            action={deleteReview.bind(null, review.id)}
          />
        ) : null}
      </footer>
    </article>
  );
}
