"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { Field, SelectField, TextAreaField } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { routing } from "@/i18n/routing";
import type { FormState } from "@/lib/forms";

import { updateProfile } from "../actions";

type Values = { username: string; display_name: string; bio: string; locale: string };

export function ProfileForm({ initial }: { initial: Values }) {
  const locale = useLocale();
  const t = useTranslations("Settings");
  const tl = useTranslations("Forms.labels");
  const th = useTranslations("Forms.hints");
  const tLang = useTranslations("Languages");
  const [state, action] = useActionState(updateProfile, {
    status: "idle",
    values: initial,
  } as FormState<keyof Values>);
  const values = { ...initial, ...state.values };

  return (
    <form action={action} className="flex flex-col gap-7" noValidate>
      <input type="hidden" name="currentLocale" value={locale} />
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
        defaultValue={values.username}
        error={state.fieldErrors?.username}
      />
      <Field
        label={tl("displayName")}
        hint={th("displayName")}
        name="display_name"
        autoComplete="name"
        maxLength={60}
        defaultValue={values.display_name}
        error={state.fieldErrors?.display_name}
      />
      <TextAreaField
        label={tl("bio")}
        hint={th("bio")}
        name="bio"
        maxLength={500}
        defaultValue={values.bio}
        error={state.fieldErrors?.bio}
      />
      <SelectField
        label={tl("locale")}
        hint={th("locale")}
        name="locale"
        defaultValue={values.locale}
        error={state.fieldErrors?.locale}
      >
        {routing.locales.map((code) => (
          <option key={code} value={code}>
            {tLang(code)}
          </option>
        ))}
      </SelectField>
      <SubmitButton className="self-start">{t("save")}</SubmitButton>
    </form>
  );
}
