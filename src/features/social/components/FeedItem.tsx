import { getFormatter, getTranslations } from "next-intl/server";

import { Avatar } from "@/components/profile/Avatar";
import { RatingStars } from "@/components/ui/RatingStars";
import { Link } from "@/i18n/navigation";

import type { FeedEvent } from "../queries";

const linkClass = "font-serif text-lg text-paper hover:text-moss-bright";

/** One line of activity: "<avatar> Léa added Shalimar to their collection ★★★★ · 2 h". */
export async function FeedItem({ event, viewerId }: { event: FeedEvent; viewerId: string }) {
  const [t, tr, format] = await Promise.all([
    getTranslations("Feed"),
    getTranslations("Fragrance"),
    getFormatter(),
  ]);
  // Own activity uses second-person phrasing ("You reviewed…", "Tú reseñaste…").
  const isSelf = event.actor_id === viewerId;
  const actorName = isSelf ? t("you") : event.actor.display_name || event.actor.username;
  const fragrance = event.fragrance;
  const fragranceLink = (chunks: React.ReactNode) =>
    fragrance ? (
      <Link href={`/fragrances/${fragrance.slug}`} className={linkClass}>
        {chunks}
      </Link>
    ) : (
      chunks
    );

  let sentence: React.ReactNode = null;
  if (event.type === "diary_entry" && event.entry && fragrance) {
    const values = { fragrance: `${fragrance.brand.name} ${fragrance.name}`, f: fragranceLink };
    sentence = isSelf
      ? t.rich(`self.diary.${event.entry.status}`, values)
      : t.rich(`diary.${event.entry.status}`, values);
  } else if (event.type === "review" && fragrance) {
    const values = { fragrance: `${fragrance.brand.name} ${fragrance.name}`, f: fragranceLink };
    sentence = isSelf ? t.rich("self.review", values) : t.rich("review", values);
  } else if (event.type === "follow" && event.target) {
    const target = event.target;
    const values = {
      user: target.display_name || target.username,
      u: (chunks: React.ReactNode) => (
        <Link href={`/${target.username}`} className={linkClass}>
          {chunks}
        </Link>
      ),
    };
    sentence = isSelf ? t.rich("self.follow", values) : t.rich("follow", values);
  } else if (event.type === "list") {
    sentence = t("list");
  }
  if (!sentence) return null;

  const rating =
    event.entry?.rating === null || event.entry?.rating === undefined
      ? null
      : Number(event.entry.rating);

  return (
    <li className="flex gap-4 py-6">
      <Link href={`/${event.actor.username}`} className="shrink-0">
        <Avatar
          url={event.actor.avatar_url}
          name={event.actor.display_name || event.actor.username}
          size="sm"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="leading-relaxed text-paper-muted">
          <Link href={`/${event.actor.username}`} className="text-paper hover:text-paper-muted">
            {actorName}
          </Link>{" "}
          {sentence}
        </p>
        {event.type === "diary_entry" && rating !== null ? (
          <RatingStars
            rating={rating}
            label={tr("ratingLabel", {
              rating: format.number(rating, { minimumFractionDigits: 1 }),
            })}
          />
        ) : null}
        {event.type === "review" && event.review ? (
          <Link
            href={`/reviews/${event.review.id}`}
            className="line-clamp-3 border-l border-line-strong pl-4 font-serif text-lg leading-snug text-paper/80 italic hover:text-paper"
          >
            {event.review.body}
          </Link>
        ) : null}
        <time dateTime={event.created_at} className="text-xs text-paper-faint">
          {format.relativeTime(new Date(event.created_at))}
        </time>
      </div>
    </li>
  );
}
