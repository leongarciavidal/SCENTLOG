"use client";

import { useTranslations } from "next-intl";
import { useOptimistic, useState, useTransition } from "react";

import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

import { setFollow } from "../actions";

/** Follow / unfollow with an instant (optimistic) state change. */
export function FollowButton({
  targetId,
  following,
  size = "default",
}: {
  targetId: string;
  following: boolean;
  size?: "default" | "small";
}) {
  const t = useTranslations("Social");
  const [pending, startTransition] = useTransition();
  const [state, setOptimistic] = useOptimistic(following);
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={state}
      disabled={pending}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!state);
          await setFollow(targetId, !state);
        })
      }
      className={cn(
        buttonClasses(state ? "secondary" : "primary"),
        size === "small" && "h-9 px-4 text-xs",
        state && hover && "border-amber text-amber",
      )}
    >
      {state ? (hover ? t("unfollow") : t("following")) : t("follow")}
    </button>
  );
}
