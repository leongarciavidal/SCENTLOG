"use client";

import { useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { setReviewLike } from "../actions";

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 20.5s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1z" />
    </svg>
  );
}

/**
 * Like toggle with an optimistic update: the heart changes instantly and the
 * server confirms in the background (it reverts if the request fails).
 */
export function LikeButton({
  reviewId,
  liked,
  count,
  mode,
}: {
  reviewId: string;
  liked: boolean;
  count: number;
  /** "interactive" for other users' reviews, "readonly" for your own, "signin" for visitors. */
  mode: "interactive" | "readonly" | "signin";
}) {
  const t = useTranslations("Reviews");
  const [pending, startTransition] = useTransition();
  const [state, setOptimistic] = useOptimistic({ liked, count });
  const label = t("likes", { count: state.count });

  if (mode !== "interactive") {
    const content = (
      <>
        <Heart filled={false} />
        <span className="tabular-nums">{label}</span>
      </>
    );
    return mode === "signin" ? (
      <Link
        href="/login"
        className="relative z-10 inline-flex items-center gap-2 text-xs text-paper-faint hover:text-paper"
      >
        {content}
      </Link>
    ) : (
      <span className="inline-flex items-center gap-2 text-xs text-paper-faint">{content}</span>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={state.liked}
      aria-label={`${state.liked ? t("unlike") : t("like")} · ${label}`}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const next = !state.liked;
          setOptimistic({ liked: next, count: state.count + (next ? 1 : -1) });
          await setReviewLike(reviewId, next);
        })
      }
      className={cn(
        "relative z-10 inline-flex items-center gap-2 text-xs transition-colors",
        state.liked ? "text-moss-bright" : "text-paper-faint hover:text-paper",
      )}
    >
      <Heart filled={state.liked} />
      <span className="tabular-nums">{label}</span>
    </button>
  );
}
