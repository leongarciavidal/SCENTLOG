"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { FormAlert } from "@/components/ui/FormAlert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { initialFormState } from "@/lib/forms";

import { addComment } from "../actions";

export function CommentForm({ reviewId }: { reviewId: string }) {
  const t = useTranslations("Reviews");
  const te = useTranslations("Forms.errors");
  const [state, action] = useActionState(addComment.bind(null, reviewId), initialFormState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormAlert state={state} />
      <label className="flex flex-col gap-2">
        <span className="eyebrow text-paper">{t("commentLabel")}</span>
        <textarea
          name="body"
          required
          maxLength={2000}
          defaultValue={state.values?.body ?? ""}
          placeholder={t("commentPlaceholder")}
          className="min-h-24 resize-y rounded-xs border border-line-strong bg-ink-sunken px-4 py-3 leading-relaxed text-paper placeholder:text-paper-faint focus:border-paper focus:outline-none"
        />
        {state.fieldErrors?.body ? (
          <span className="text-sm text-amber">{te(state.fieldErrors.body)}</span>
        ) : null}
      </label>
      <SubmitButton className="self-start">{t("postComment")}</SubmitButton>
    </form>
  );
}
