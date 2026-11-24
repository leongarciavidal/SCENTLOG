"use client";

import { useTranslations } from "next-intl";
import type { ComponentPropsWithoutRef } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "./Button";

/** Submit button that disables itself while its form is being sent. */
export function SubmitButton({
  children,
  ...props
}: Omit<ComponentPropsWithoutRef<typeof Button>, "type">) {
  const { pending } = useFormStatus();
  const t = useTranslations("Forms");

  return (
    <Button type="submit" disabled={pending} aria-disabled={pending} {...props}>
      {pending ? t("submitting") : children}
    </Button>
  );
}
