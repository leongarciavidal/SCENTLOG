"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useId, useState } from "react";

import { cn } from "@/lib/utils";

const STAR_PATH =
  "M12 2.5l2.94 6.26 6.81.83-5.02 4.7 1.3 6.76L12 17.77l-6.03 3.28 1.3-6.76-5.02-4.7 6.81-.83L12 2.5z";

/**
 * Half-star rating input built from real radio buttons: it works with the
 * keyboard (arrow keys), screen readers and without JavaScript. Each star is
 * split into a left (x.5) and right (x.0) clickable half.
 */
export function RatingInput({ name, defaultValue }: { name: string; defaultValue: number | null }) {
  const t = useTranslations("Diary");
  const format = useFormatter();
  const groupId = useId();
  const [value, setValue] = useState<number | null>(defaultValue);
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="eyebrow mb-3 text-paper">{t("rating")}</legend>
      <div className="flex items-center gap-5">
        <div className="relative flex" onMouseLeave={() => setHover(null)}>
          {[1, 2, 3, 4, 5].map((star) => {
            const fill = Math.max(0, Math.min(1, shown - (star - 1)));
            return (
              <span key={star} className="relative size-9 px-0.5">
                <svg viewBox="0 0 24 24" className="size-8 text-line-strong" aria-hidden="true">
                  <path d={STAR_PATH} fill="currentColor" />
                </svg>
                <span
                  className="absolute inset-y-0 left-0.5 overflow-hidden"
                  style={{ width: `${fill * 32}px` }}
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" className="size-8 text-amber">
                    <path d={STAR_PATH} fill="currentColor" />
                  </svg>
                </span>
                {/* Two invisible radio halves per star */}
                {[star - 0.5, star].map((v, half) => (
                  <label
                    key={v}
                    className={cn(
                      "absolute inset-y-0 w-1/2 cursor-pointer",
                      half === 0 ? "left-0" : "right-0",
                    )}
                    onMouseEnter={() => setHover(v)}
                  >
                    <input
                      type="radio"
                      name={`${groupId}-stars`}
                      value={v}
                      checked={value === v}
                      onChange={() => setValue(v)}
                      className="peer sr-only"
                      aria-label={t("ratingStar", { value: v })}
                    />
                    <span className="absolute inset-0 rounded-xs peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-moss-bright" />
                  </label>
                ))}
              </span>
            );
          })}
        </div>
        <span className="min-w-14 font-serif text-2xl text-paper tabular-nums" aria-live="polite">
          {value === null ? (
            <span className="font-sans text-xs text-paper-faint">{t("ratingNone")}</span>
          ) : (
            format.number(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
          )}
        </span>
        {value !== null ? (
          <button
            type="button"
            onClick={() => setValue(null)}
            className="link-underline text-xs text-paper-muted"
          >
            {t("ratingClear")}
          </button>
        ) : null}
      </div>
      <input type="hidden" name={name} value={value === null ? "" : String(value)} />
    </fieldset>
  );
}
