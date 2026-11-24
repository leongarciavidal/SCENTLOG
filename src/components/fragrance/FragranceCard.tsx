import { useTranslations } from "next-intl";

import { RatingStars } from "@/components/ui/RatingStars";
import { Link } from "@/i18n/navigation";
import type { FragranceCardData } from "@/features/fragrances/queries";
import { cn } from "@/lib/utils";

import { FragranceArtwork } from "./FragranceArtwork";

/** Catalogue card linking to the fragrance page. */
export function FragranceCard({
  fragrance,
  size = "default",
  priority,
  className,
}: {
  fragrance: FragranceCardData;
  size?: "default" | "large";
  priority?: boolean;
  className?: string;
}) {
  const t = useTranslations("Fragrance");
  const rating = fragrance.rating_avg === null ? null : Number(fragrance.rating_avg);

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <FragranceArtwork
        name={fragrance.name}
        brand={fragrance.brand.name}
        concentrationShort={fragrance.concentration.toUpperCase()}
        year={fragrance.release_year}
        imageUrl={fragrance.image_url}
        familySlug={fragrance.family?.slug}
        size={size}
        priority={priority}
      />

      <div className="mt-4 flex flex-col gap-1.5">
        <p className="eyebrow">{fragrance.brand.name}</p>
        <h3
          className={cn(
            "font-serif leading-tight text-paper",
            size === "large" ? "text-3xl sm:text-4xl" : "text-xl",
          )}
        >
          <Link
            href={`/fragrances/${fragrance.slug}`}
            className="transition-colors group-hover:text-paper-muted after:absolute after:inset-0"
          >
            {fragrance.name}
          </Link>
        </h3>
        <p className="text-sm text-paper-muted">
          {t(`concentration.${fragrance.concentration}`)}
          {fragrance.release_year ? ` · ${fragrance.release_year}` : null}
        </p>
        <div className="mt-1 flex items-center gap-2 text-xs text-paper-faint">
          {rating === null ? (
            <span>{t("notRated")}</span>
          ) : (
            <>
              <RatingStars
                rating={rating}
                label={t("ratingLabel", { rating: rating.toFixed(1) })}
              />
              <span className="tabular-nums">
                {t("ratingCount", { count: fragrance.rating_count })}
              </span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
