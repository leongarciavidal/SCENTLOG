"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { FormState } from "@/lib/forms";
import { cn } from "@/lib/utils";

import { removeDiaryEntry, saveDiaryEntry } from "../actions";
import { DIARY_STATUSES, type DiaryStatus } from "../schemas";
import { RatingInput } from "./RatingInput";

type Entry = {
  status: DiaryStatus;
  rating: number | null;
  notes: string | null;
  is_private: boolean;
  added_on: string;
};

export function DiaryPanel({
  fragranceId,
  entry,
  today,
}: {
  fragranceId: string;
  entry: Entry | null;
  today: string;
}) {
  const t = useTranslations("Diary");
  const te = useTranslations("Forms.errors");
  const [state, action] = useActionState(saveDiaryEntry.bind(null, fragranceId), {
    status: "idle",
  } as FormState);
  const [status, setStatus] = useState<DiaryStatus>(entry?.status ?? "owned");
  const [removing, startRemoving] = useTransition();
  const exists = Boolean(entry);

  function handleRemove() {
    if (!window.confirm(t("removeConfirm"))) return;
    startRemoving(async () => {
      await removeDiaryEntry(fragranceId);
    });
  }

  return (
    <form
      action={action}
      aria-label={t("title")}
      className="flex flex-col gap-7 border border-line-strong bg-ink-raised/40 p-6 sm:p-8"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-serif text-3xl">{t("title")}</h2>
        {exists ? <span className="eyebrow text-moss-bright">{t("inDiary")}</span> : null}
      </div>

      <FormAlert state={state} />

      <fieldset className="flex flex-col gap-3">
        <legend className="eyebrow mb-3 text-paper">{t("status")}</legend>
        <div className="grid grid-cols-2 gap-px border border-line-strong bg-line-strong sm:grid-cols-4">
          {DIARY_STATUSES.map((code) => (
            <label key={code} className="relative">
              <input
                type="radio"
                name="status"
                value={code}
                checked={status === code}
                onChange={() => setStatus(code)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "flex h-11 cursor-pointer items-center justify-center bg-ink text-sm transition-colors peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:-outline-offset-4 peer-focus-visible:outline-moss-bright",
                  status === code ? "bg-paper text-ink" : "text-paper-muted hover:text-paper",
                )}
              >
                {t(`statuses.${code}`)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <RatingInput name="rating" defaultValue={entry?.rating ?? null} />

      <label className="flex flex-col gap-2">
        <span className="eyebrow text-paper">{t("notes")}</span>
        <textarea
          name="notes"
          defaultValue={state.values?.notes ?? entry?.notes ?? ""}
          maxLength={2000}
          placeholder={t("notesPlaceholder")}
          className="min-h-28 resize-y rounded-xs border border-line-strong bg-ink-sunken px-4 py-3 leading-relaxed text-paper placeholder:text-paper-faint focus:border-paper focus:outline-none"
        />
        {state.fieldErrors?.notes ? (
          <span className="text-sm text-amber">{te(state.fieldErrors.notes)}</span>
        ) : null}
      </label>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="eyebrow text-paper">{t("date")}</span>
          <input
            type="date"
            name="added_on"
            max={today}
            defaultValue={state.values?.added_on ?? entry?.added_on ?? today}
            className="h-11 rounded-xs border border-line-strong bg-ink-sunken px-3 text-paper [color-scheme:dark] focus:border-paper focus:outline-none"
          />
          {state.fieldErrors?.added_on ? (
            <span className="text-sm text-amber">{te(state.fieldErrors.added_on)}</span>
          ) : null}
        </label>
        <label className="flex items-start gap-3 sm:pt-7">
          <input
            type="checkbox"
            name="is_private"
            defaultChecked={entry?.is_private ?? false}
            className="mt-1 size-4 accent-moss-bright"
          />
          <span className="flex flex-col gap-1">
            <span className="text-sm text-paper">{t("private")}</span>
            <span className="text-xs text-paper-faint">{t("privateHint")}</span>
          </span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>{exists ? t("update") : t("save")}</SubmitButton>
        {exists ? (
          <Button variant="ghost" onClick={handleRemove} disabled={removing}>
            {t("remove")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
