"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import { FormAlert } from "@/components/ui/FormAlert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { FormState } from "@/lib/forms";
import { cn } from "@/lib/utils";

import { saveReview } from "../actions";
import { REVIEW_DIMENSIONS, type ReviewDimension } from "../schemas";

type Existing = { body: string } & Record<ReviewDimension, number | null>;

function DimensionInput({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: number | null;
}) {
  const t = useTranslations("Reviews");
  const [value, setValue] = useState<number | null>(defaultValue);
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-xs text-paper-muted">{label}</legend>
      <div className="flex border border-line-strong">
        {[null, 1, 2, 3, 4, 5].map((option) => (
          <label key={option ?? "none"} className="flex-1">
            <input
              type="radio"
              name={`${name}-choice`}
              checked={value === option}
              onChange={() => setValue(option)}
              className="peer sr-only"
              aria-label={
                option === null ? `${label}: ${t("dimensionNone")}` : `${label}: ${option}/5`
              }
            />
            <span
              className={cn(
                "flex h-9 cursor-pointer items-center justify-center border-l border-line-strong text-xs transition-colors peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-moss-bright first:border-l-0",
                value === option ? "bg-paper text-ink" : "text-paper-faint hover:text-paper",
              )}
            >
              {option ?? t("dimensionNone")}
            </span>
          </label>
        ))}
      </div>
      <input type="hidden" name={name} value={value ?? ""} />
    </fieldset>
  );
}

export function ReviewEditor({
  fragranceId,
  existing,
}: {
  fragranceId: string;
  existing: Existing | null;
}) {
  const t = useTranslations("Reviews");
  const te = useTranslations("Forms.errors");
  const [state, action] = useActionState(saveReview.bind(null, fragranceId), {
    status: "idle",
  } as FormState);

  return (
    <form
      id="review"
      action={action}
      aria-label={existing ? t("edit") : t("write")}
      className="flex scroll-mt-24 flex-col gap-6 border border-line-strong p-6 sm:p-8"
    >
      <h2 className="font-serif text-3xl">{existing ? t("edit") : t("write")}</h2>
      <FormAlert state={state} />
      <label className="flex flex-col gap-2">
        <span className="eyebrow text-paper">{t("bodyLabel")}</span>
        <textarea
          name="body"
          required
          maxLength={10000}
          defaultValue={state.values?.body ?? existing?.body ?? ""}
          placeholder={t("bodyPlaceholder")}
          aria-invalid={state.fieldErrors?.body ? true : undefined}
          className="min-h-40 resize-y rounded-xs border border-line-strong bg-ink-sunken px-4 py-3 leading-relaxed text-paper placeholder:text-paper-faint focus:border-paper focus:outline-none aria-invalid:border-amber"
        />
        {state.fieldErrors?.body ? (
          <span className="text-sm text-amber">{te(state.fieldErrors.body)}</span>
        ) : null}
      </label>
      <div className="flex flex-col gap-4">
        <span className="eyebrow text-paper">{t("dimensionsTitle")}</span>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REVIEW_DIMENSIONS.map((key) => (
            <DimensionInput
              key={key}
              name={key}
              label={t(`dimensions.${key}`)}
              defaultValue={existing?.[key] ?? null}
            />
          ))}
        </div>
      </div>
      {!existing ? <p className="text-xs text-paper-faint">{t("autoDiary")}</p> : null}
      <SubmitButton className="self-start">{existing ? t("update") : t("publish")}</SubmitButton>
    </form>
  );
}
