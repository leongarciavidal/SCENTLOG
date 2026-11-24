"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { buttonClasses } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Link } from "@/i18n/navigation";
import { initialFormState } from "@/lib/forms";

import { updatePassword } from "../actions";

export function ResetPasswordForm({ profileHref }: { profileHref: string }) {
  const t = useTranslations("Auth.reset");
  const tl = useTranslations("Forms.labels");
  const th = useTranslations("Forms.hints");
  const [state, action] = useActionState(updatePassword, initialFormState);

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-start gap-6">
        <FormAlert state={state} />
        <Link href={profileHref} className={buttonClasses("secondary")}>
          {t("continue")}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <FormAlert state={state} />
      <Field
        label={tl("newPassword")}
        hint={th("password")}
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        error={state.fieldErrors?.password}
      />
      <Field
        label={tl("confirmPassword")}
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.confirmPassword}
      />
      <SubmitButton className="mt-2">{t("submit")}</SubmitButton>
    </form>
  );
}
