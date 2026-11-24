"use client";

import { useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";

import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

import { setListLike } from "../actions";

export function ListLikeButton({
  listId,
  liked,
  count,
}: {
  listId: string;
  liked: boolean;
  count: number;
}) {
  const t = useTranslations("Lists");
  const [pending, startTransition] = useTransition();
  const [state, setOptimistic] = useOptimistic({ liked, count });
  return (
    <button
      type="button"
      aria-pressed={state.liked}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const next = !state.liked;
          setOptimistic({ liked: next, count: state.count + (next ? 1 : -1) });
          await setListLike(listId, next);
        })
      }
      className={cn(
        buttonClasses("secondary"),
        state.liked && "border-moss-bright text-moss-bright",
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        aria-hidden="true"
        fill={state.liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M12 20.5s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1z" />
      </svg>
      {state.liked ? t("unlike") : t("like")} · {t("likes", { count: state.count })}
    </button>
  );
}
