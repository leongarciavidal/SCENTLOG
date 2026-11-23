import { cn } from "@/lib/utils";

const STAR_PATH =
  "M12 2.5l2.94 6.26 6.81.83-5.02 4.7 1.3 6.76L12 17.77l-6.03 3.28 1.3-6.76-5.02-4.7 6.81-.83L12 2.5z";

function StarRow({ className }: { className?: string }) {
  return (
    <span className={cn("flex gap-[3px]", className)} aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" className="size-3.5 shrink-0" fill="currentColor">
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}

/**
 * Read-only star rating (0–5, half-star precision).
 * A filled row is clipped over an empty row so half stars render exactly.
 */
export function RatingStars({
  rating,
  label,
  className,
}: {
  rating: number;
  label: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(5, Math.round(rating * 2) / 2));
  // Each star is 14px wide with a 3px gap: compute the visible width precisely.
  const width = clamped * 14 + Math.max(0, Math.ceil(clamped) - 1) * 3;

  return (
    <span role="img" aria-label={label} className={cn("relative inline-flex", className)}>
      <StarRow className="text-line-strong" />
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width }}>
        <StarRow className="text-amber" />
      </span>
    </span>
  );
}
