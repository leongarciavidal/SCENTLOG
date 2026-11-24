"use client";

import { useTranslations } from "next-intl";

import type { FormState } from "@/lib/forms";

/** Form-level message: an error (e.g. wrong password) or a success notice. */
export function FormAlert({ state }: { state: FormState }) {
  const t = useTranslations("Forms");

  if (state.status === "error" && state.formError) {
    return (
      <p role="alert" className="border-l border-amber py-1 pl-4 text-sm text-paper">
        {t(`errors.${state.formError}`)}
      </p>
    );
  }
  if (state.status === "success" && state.success) {
    return (
      <p role="status" className="border-l border-moss-bright py-1 pl-4 text-sm text-paper">
        {t(`success.${state.success}`)}
      </p>
    );
  }
  return null;
}
