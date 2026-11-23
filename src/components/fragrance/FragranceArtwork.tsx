import Image from "next/image";

import { cn } from "@/lib/utils";

/** Muted background tones per olfactive family, used when there is no photo. */
const FAMILY_TONES: Array<[prefix: string, tone: string]> = [
  ["amber", "#211a12"],
  ["gourmand", "#22180f"],
  ["leather", "#1f1814"],
  ["floral", "#201a1c"],
  ["chypre", "#1a1c15"],
  ["citrus", "#1e1d14"],
  ["green", "#151c16"],
  ["aromatic", "#161b19"],
  ["woody", "#1b1915"],
];

function toneFor(familySlug: string | null | undefined) {
  if (!familySlug) return "#171715";
  return FAMILY_TONES.find(([prefix]) => familySlug.startsWith(prefix))?.[1] ?? "#171715";
}

type Props = {
  name: string;
  brand: string;
  concentrationShort: string;
  year: number | null;
  imageUrl: string | null;
  familySlug?: string | null;
  size?: "default" | "large";
  priority?: boolean;
  className?: string;
};

/**
 * Fragrance visual. Shows the photo when one exists; otherwise renders an
 * editorial "label" composed from the fragrance's own data — never a stock
 * or third-party image.
 */
export function FragranceArtwork({
  name,
  brand,
  concentrationShort,
  year,
  imageUrl,
  familySlug,
  size = "default",
  priority,
  className,
}: Props) {
  if (imageUrl) {
    return (
      <div className={cn("relative aspect-[4/5] overflow-hidden bg-ink-raised", className)}>
        <Image
          src={imageUrl}
          alt={`${brand} ${name}`}
          fill
          priority={priority}
          sizes={
            size === "large" ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"
          }
          className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn("relative aspect-[4/5] overflow-hidden", className)}
      style={{ backgroundColor: toneFor(familySlug) }}
    >
      {/* Soft vignette for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(237,232,223,0.06),transparent_65%)]" />

      <div
        className={cn(
          "absolute flex flex-col justify-between border border-paper/12 transition-colors duration-500 ease-editorial group-hover:border-paper/25",
          size === "large" ? "inset-6 p-6 sm:inset-8 sm:p-8" : "inset-3 p-3 sm:inset-4 sm:p-4",
        )}
      >
        <span className="eyebrow truncate text-paper/55">{brand}</span>

        <span
          className={cn(
            "font-serif leading-[0.95] text-balance text-paper/90",
            size === "large" ? "text-5xl sm:text-6xl lg:text-7xl" : "text-2xl sm:text-[1.75rem]",
          )}
        >
          {name}
        </span>

        <span className="flex items-end justify-between text-paper/45">
          <span className="text-[0.625rem] font-medium tracking-[0.2em] uppercase">
            {concentrationShort}
          </span>
          {year ? (
            <span className="text-[0.625rem] tracking-[0.2em] tabular-nums">{year}</span>
          ) : null}
        </span>
      </div>
    </div>
  );
}
