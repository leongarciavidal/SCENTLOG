"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { Field } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { initialFormState } from "@/lib/forms";

import { deleteAccount } from "../actions";

export function DeleteAccountForm({ username }: { username: string }) {
  const t = useTranslations("Account");
  const locale = useLocale();
  const [state, action] = useActionState(deleteAccount.bind(null, locale), initialFormState);

  return (
    <form
      action={action}
      className="flex flex-col gap-5 border border-amber/40 p-6"
      aria-label={t("deleteTitle")}
    >
      <div className="flex flex-col gap-2">
        <h3 className="font-serif text-2xl">{t("deleteTitle")}</h3>
        <p className="text-sm leading-relaxed text-paper-muted">{t("deleteBody")}</p>
      </div>
      <FormAlert state={state} />
      <Field
        label={t("deleteConfirmLabel", { username })}
        name="confirm"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        error={state.fieldErrors?.confirm}
      />
      <SubmitButton className="self-start bg-amber text-ink hover:bg-amber/85">
        {t("deleteButton")}
      </SubmitButton>
    </form>
  );
}
