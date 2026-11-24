"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { Field } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { initialFormState } from "@/lib/forms";

import { signUp } from "../actions";

export function SignUpForm() {
  const locale = useLocale();
  const t = useTranslations("Auth.signup");
  const tl = useTranslations("Forms.labels");
  const th = useTranslations("Forms.hints");
  const [state, action] = useActionState(signUp.bind(null, locale), initialFormState);

  // After a successful sign-up we only show the "check your email" message.
  if (state.status === "success") return <FormAlert state={state} />;

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <FormAlert state={state} />
      <Field
        label={tl("username")}
        hint={th("username")}
        name="username"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
        maxLength={30}
        defaultValue={state.values?.username}
        error={state.fieldErrors?.username}
      />
      <Field
        label={tl("email")}
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <Field
        label={tl("password")}
        hint={th("password")}
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        error={state.fieldErrors?.password}
      />
      <SubmitButton className="mt-2">{t("submit")}</SubmitButton>
      <p className="text-xs leading-relaxed text-paper-faint">{t("terms")}</p>
    </form>
  );
}
