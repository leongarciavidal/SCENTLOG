"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";

import { addToList, removeFromList, reorderList, searchFragrancesForList } from "../actions";

type Item = { id: string; name: string; brand: string; concentration: string };
type Result = Awaited<ReturnType<typeof searchFragrancesForList>>[number];

/** Search-and-add box plus the ordered list of items with move/remove controls. */
export function ListItemsEditor({ listId, items }: { listId: string; items: Item[] }) {
  const t = useTranslations("Lists");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searched, setSearched] = useState(false);
  const [pending, startTransition] = useTransition();
  const inList = new Set(items.map((i) => i.id));

  // Debounced search: waits 250 ms after the last keystroke.
  useEffect(() => {
    if (query.trim().length < 2) return;
    const timer = setTimeout(async () => {
      setResults(await searchFragrancesForList(query));
      setSearched(true);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const move = (index: number, delta: number) => {
    const order = items.map((i) => i.id);
    const [moved] = order.splice(index, 1);
    order.splice(index + delta, 0, moved);
    startTransition(async () => void (await reorderList(listId, order)));
  };

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-4" aria-labelledby="add-title">
        <h2 id="add-title" className="eyebrow text-paper">
          {t("addTitle")}
        </h2>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length < 2) {
              setResults([]);
              setSearched(false);
            }
          }}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="h-12 rounded-xs border border-line-strong bg-ink-sunken px-4 text-paper placeholder:text-paper-faint focus:border-paper focus:outline-none"
        />
        {results.length > 0 ? (
          <ul
            className="flex flex-col divide-y divide-line border border-line"
            aria-label={t("addTitle")}
          >
            {results.map((result) => (
              <li key={result.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="min-w-0">
                  <span className="eyebrow mr-2">{result.brand.name}</span>
                  <span className="font-serif text-lg">{result.name}</span>
                  <span className="ml-2 text-xs text-paper-faint">
                    {result.concentration.toUpperCase()}
                    {result.release_year ? ` · ${result.release_year}` : ""}
                  </span>
                </span>
                {inList.has(result.id) ? (
                  <span className="text-xs text-moss-bright">{t("added")}</span>
                ) : (
                  <Button
                    variant="secondary"
                    className="h-9 px-4 text-xs"
                    disabled={pending}
                    aria-label={`${t("add")}: ${result.brand.name} ${result.name}`}
                    onClick={() =>
                      startTransition(async () => void (await addToList(listId, result.id)))
                    }
                  >
                    {t("add")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : searched ? (
          <p className="text-sm text-paper-faint">{t("noResults")}</p>
        ) : null}
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="items-title">
        <h2 id="items-title" className="eyebrow text-paper">
          {t("items")} · {t("count", { count: items.length })}
        </h2>
        {items.length === 0 ? (
          <p className="text-sm text-paper-faint">{t("emptyListOwn")}</p>
        ) : (
          <ol className="flex flex-col divide-y divide-line border-y border-line">
            {items.map((item, index) => (
              <li key={item.id} className="flex items-center gap-4 py-3">
                <span className="w-8 font-serif text-2xl text-paper-faint tabular-nums">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="eyebrow mr-2">{item.brand}</span>
                  <span className="font-serif text-lg">{item.name}</span>
                  <span className="ml-2 text-xs text-paper-faint">
                    {item.concentration.toUpperCase()}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <IconButton
                    label={`${t("moveUp")}: ${item.name}`}
                    disabled={pending || index === 0}
                    onClick={() => move(index, -1)}
                  >
                    ↑
                  </IconButton>
                  <IconButton
                    label={`${t("moveDown")}: ${item.name}`}
                    disabled={pending || index === items.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    ↓
                  </IconButton>
                  <IconButton
                    label={`${t("remove")}: ${item.name}`}
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => void (await removeFromList(listId, item.id)))
                    }
                  >
                    ×
                  </IconButton>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-9 items-center justify-center border border-line-strong text-paper-muted transition-colors hover:border-paper hover:text-paper disabled:opacity-30"
    >
      {children}
    </button>
  );
}
