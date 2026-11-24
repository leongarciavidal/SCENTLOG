"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { SelectField } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { initialFormState } from "@/lib/forms";

import { saveFavorites } from "../actions";

type Candidate = { id: string; name: string; concentration: string; brand: { name: string } };

export function FavoritesForm({
  candidates,
  current,
}: {
  candidates: Candidate[];
  current: (string | null)[];
}) {
  const t = useTranslations("Favorites");
  const [state, action] = useActionState(saveFavorites, initialFormState);

  return (
    <form action={action} className="flex flex-col gap-6">
      <FormAlert state={state} />
      {[1, 2, 3, 4].map((position) => (
        <SelectField
          key={position}
          label={t("slot", { position })}
          name={`position-${position}`}
          defaultValue={current[position - 1] ?? ""}
        >
          <option value="">{t("none")}</option>
          {candidates.map((fragrance) => (
            <option key={fragrance.id} value={fragrance.id}>
              {fragrance.brand.name} — {fragrance.name} ({fragrance.concentration.toUpperCase()})
            </option>
          ))}
        </SelectField>
      ))}
      <SubmitButton className="self-start">{t("save")}</SubmitButton>
    </form>
  );
}
