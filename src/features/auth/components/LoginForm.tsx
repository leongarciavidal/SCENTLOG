"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { Field } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Link } from "@/i18n/navigation";
import { initialFormState } from "@/lib/forms";

import { signIn } from "../actions";

export function LoginForm({ next }: { next?: string }) {
  const locale = useLocale();
  const t = useTranslations("Auth.login");
  const tf = useTranslations("Forms.labels");
  const [state, action] = useActionState(signIn.bind(null, locale), initialFormState);

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <FormAlert state={state} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Field
        label={tf("email")}
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <div className="flex flex-col gap-3">
        <Field
          label={tf("password")}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={state.fieldErrors?.password}
        />
        <Link
          href="/forgot-password"
          className="link-underline self-start text-xs text-paper-muted"
        >
          {t("forgot")}
        </Link>
      </div>
      <SubmitButton className="mt-2">{t("submit")}</SubmitButton>
    </form>
  );
}
