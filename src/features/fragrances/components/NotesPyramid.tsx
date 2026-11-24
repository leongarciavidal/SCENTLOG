import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { localized } from "@/lib/localized";

import type { FragranceDetail } from "../queries";

const LAYERS = ["top", "heart", "base"] as const;

/** Top / heart / base notes. Each note links to the catalogue filtered by it. */
export async function NotesPyramid({ notes }: { notes: FragranceDetail["notes"] }) {
  const t = await getTranslations("FragrancePage");
  const locale = await getLocale();

  if (notes.length === 0) return <p className="text-sm text-paper-faint">{t("noNotes")}</p>;

  return (
    <dl className="flex flex-col">
      {LAYERS.map((layer) => {
        const items = notes
          .filter((n) => n.layer === layer)
          .sort((a, b) => a.position - b.position);
        if (items.length === 0) return null;
        return (
          <div
            key={layer}
            className="grid grid-cols-[6rem_1fr] gap-4 border-t border-line py-4 first:border-t-0 first:pt-0 sm:grid-cols-[8rem_1fr]"
          >
            <dt className="eyebrow pt-1">{t(`layers.${layer}`)}</dt>
            <dd className="flex flex-wrap gap-x-4 gap-y-1.5">
              {items.map(({ note }) => {
                const name = localized(note, "name", locale) ?? note.slug;
                return (
                  <Link
                    key={note.slug}
                    href={`/fragrances?note=${note.slug}`}
                    title={t("noteLink", { note: name })}
                    className="font-serif text-xl text-paper transition-colors hover:text-moss-bright"
                  >
                    {name}
                  </Link>
                );
              })}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
