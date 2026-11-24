import { cn } from "@/lib/utils";

import type { ListCardData } from "../queries";

const TONES: Record<string, string> = {
  amber: "#2a1f14",
  gourmand: "#2a1d12",
  leather: "#251c16",
  floral: "#261e21",
  chypre: "#1f2219",
  citrus: "#24231a",
  green: "#19221b",
  aromatic: "#1a201d",
  woody: "#211e19",
};
function tone(slug?: string | null) {
  const key = Object.keys(TONES).find((prefix) => slug?.startsWith(prefix));
  return key ? TONES[key] : "#1c1c19";
}

/**
 * List cover: the uploaded image, or an editorial composition built from the
 * list itself — a strip of family tones plus the first fragrance names.
 */
export function ListCover({
  list,
  className,
  large = false,
}: {
  list: ListCardData;
  className?: string;
  large?: boolean;
}) {
  if (list.cover_image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={list.cover_image_url}
        alt=""
        className={cn("aspect-[3/2] w-full object-cover", className)}
      />
    );
  }

  const preview = [...list.preview].sort((a, b) => a.position - b.position).slice(0, 4);
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative flex aspect-[3/2] w-full flex-col justify-between overflow-hidden bg-ink-raised p-5",
        large && "p-8 sm:p-10",
        className,
      )}
    >
      <div className="absolute inset-y-0 right-0 flex w-1/3">
        {(preview.length ? preview : [{ fragrance: null }]).map((item, index) => (
          <span
            key={index}
            className="flex-1"
            style={{ backgroundColor: tone(item.fragrance?.family?.slug) }}
          />
        ))}
      </div>
      <span
        className={cn(
          "relative max-w-[60%] font-serif leading-[0.95] text-paper/90",
          large ? "text-4xl sm:text-6xl" : "text-2xl",
        )}
      >
        {list.title}
      </span>
      <ol className="relative flex max-w-[60%] flex-col gap-0.5">
        {preview.map((item, index) =>
          item.fragrance ? (
            <li
              key={index}
              className="truncate text-[0.625rem] tracking-[0.15em] text-paper/50 uppercase"
            >
              {item.fragrance.name}
            </li>
          ) : null,
        )}
      </ol>
    </div>
  );
}
