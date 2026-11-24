"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { Field, TextAreaField } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { FormState } from "@/lib/forms";

import { createList, updateList } from "../actions";

type Values = { title: string; description: string; is_public: boolean; is_ranked: boolean };

/** Create (no listId) or edit (listId) a list's title, description and settings. */
export function ListForm({
  listId,
  initial,
  addFragranceId,
}: {
  listId?: string;
  initial?: Values;
  addFragranceId?: string;
}) {
  const t = useTranslations("Lists");
  const locale = useLocale();
  const action = listId ? updateList.bind(null, listId) : createList.bind(null, locale);
  const [state, formAction] = useActionState(action, { status: "idle" } as FormState<
    "title" | "description"
  >);

  return (
    <form action={formAction} className="flex flex-col gap-7" noValidate>
      <FormAlert state={state} />
      {addFragranceId ? <input type="hidden" name="add" value={addFragranceId} /> : null}
      <Field
        label={t("titleLabel")}
        name="title"
        required
        maxLength={120}
        defaultValue={state.values?.title ?? initial?.title ?? ""}
        error={state.fieldErrors?.title}
      />
      <TextAreaField
        label={t("descriptionLabel")}
        hint={t("descriptionHint")}
        name="description"
        maxLength={2000}
        defaultValue={state.values?.description ?? initial?.description ?? ""}
        error={state.fieldErrors?.description}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        {(["is_public", "is_ranked"] as const).map((name) => (
          <label key={name} className="flex items-start gap-3">
            <input
              type="checkbox"
              name={name}
              defaultChecked={initial ? initial[name] : name === "is_public"}
              className="mt-1 size-4 accent-moss-bright"
            />
            <span className="flex flex-col gap-1">
              <span className="text-sm text-paper">
                {name === "is_public" ? t("public") : t("ranked")}
              </span>
              <span className="text-xs text-paper-faint">
                {name === "is_public" ? t("publicHint") : t("rankedHint")}
              </span>
            </span>
          </label>
        ))}
      </div>
      <SubmitButton className="self-start">{listId ? t("save") : t("create")}</SubmitButton>
    </form>
  );
}
