"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { Field } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { initialFormState } from "@/lib/forms";

import { requestPasswordReset } from "../actions";

export function ForgotPasswordForm() {
  const locale = useLocale();
  const t = useTranslations("Auth.forgot");
  const tl = useTranslations("Forms.labels");
  const [state, action] = useActionState(requestPasswordReset.bind(null, locale), initialFormState);

  if (state.status === "success") return <FormAlert state={state} />;

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <FormAlert state={state} />
      <Field
        label={tl("email")}
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <SubmitButton className="mt-2">{t("submit")}</SubmitButton>
    </form>
  );
}
