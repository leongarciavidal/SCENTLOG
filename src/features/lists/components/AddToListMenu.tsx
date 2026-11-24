"use client";

import { useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";

import { buttonClasses } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";

import { addToList, removeFromList } from "../actions";

type MyList = { id: string; title: string; is_public: boolean; contains: boolean };

/** Dropdown on a fragrance page to add it to (or remove it from) your lists. */
export function AddToListMenu({ fragranceId, lists }: { fragranceId: string; lists: MyList[] }) {
  const t = useTranslations("Lists");
  const [pending, startTransition] = useTransition();
  const [state, setOptimistic] = useOptimistic(lists);

  return (
    <details className="group relative">
      <summary
        className={`${buttonClasses("secondary")} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
      >
        + {t("addToList")}
      </summary>
      <div
        className="absolute left-0 z-30 mt-2 w-72 border border-line-strong bg-ink py-2 shadow-2xl shadow-black/50"
        role="group"
        aria-label={t("addToListTitle")}
      >
        <p className="eyebrow px-4 py-2">{t("addToListTitle")}</p>
        {state.length === 0 ? (
          <p className="px-4 py-2 text-sm text-paper-faint">{t("noLists")}</p>
        ) : null}
        <ul className="max-h-64 overflow-y-auto">
          {state.map((list) => (
            <li key={list.id}>
              <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-paper-muted hover:bg-ink-raised hover:text-paper">
                <input
                  type="checkbox"
                  checked={list.contains}
                  disabled={pending}
                  className="size-4 accent-moss-bright"
                  onChange={() =>
                    startTransition(async () => {
                      const next = !list.contains;
                      setOptimistic((current) =>
                        current.map((l) => (l.id === list.id ? { ...l, contains: next } : l)),
                      );
                      await (next
                        ? addToList(list.id, fragranceId)
                        : removeFromList(list.id, fragranceId));
                    })
                  }
                />
                <span className="truncate">{list.title}</span>
              </label>
            </li>
          ))}
        </ul>
        <div className="my-2 h-px bg-line" />
        <Link
          href={`/lists/new?add=${fragranceId}`}
          className="block px-4 py-2.5 text-sm text-paper hover:bg-ink-raised"
        >
          + {t("createWith")}
        </Link>
      </div>
    </details>
  );
}
