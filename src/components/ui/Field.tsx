"use client";

import { useTranslations } from "next-intl";
import { useId, type ComponentPropsWithoutRef } from "react";

import type { ErrorCode } from "@/lib/forms";
import { cn } from "@/lib/utils";

const CONTROL =
  "w-full rounded-xs border border-line-strong bg-ink-sunken px-4 text-paper placeholder:text-paper-faint transition-colors duration-200 hover:border-paper-faint focus:border-paper focus:outline-none aria-invalid:border-amber";

type BaseProps = {
  label: string;
  hint?: string;
  error?: ErrorCode;
};

function useFieldIds(error?: ErrorCode, hint?: string) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return {
    id,
    hintId,
    errorId,
    describedBy: [errorId, hintId].filter(Boolean).join(" ") || undefined,
  };
}

function FieldShell({
  id,
  label,
  hint,
  hintId,
  error,
  errorId,
  children,
}: BaseProps & { id: string; hintId?: string; errorId?: string; children: React.ReactNode }) {
  const t = useTranslations("Forms.errors");
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="eyebrow text-paper">
        {label}
      </label>
      {children}
      {error ? (
        <p id={errorId} className="text-sm text-amber">
          {t(error)}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-paper-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Labelled text input with accessible hint and error message. */
export function Field({
  label,
  hint,
  error,
  className,
  ...props
}: BaseProps & ComponentPropsWithoutRef<"input">) {
  const ids = useFieldIds(error, hint);
  return (
    <FieldShell {...ids} label={label} hint={hint} error={error}>
      <input
        id={ids.id}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cn(CONTROL, "h-12", className)}
        {...props}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  className,
  ...props
}: BaseProps & ComponentPropsWithoutRef<"textarea">) {
  const ids = useFieldIds(error, hint);
  return (
    <FieldShell {...ids} label={label} hint={hint} error={error}>
      <textarea
        id={ids.id}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cn(CONTROL, "min-h-32 resize-y py-3 leading-relaxed", className)}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  hint,
  error,
  className,
  children,
  ...props
}: BaseProps & ComponentPropsWithoutRef<"select">) {
  const ids = useFieldIds(error, hint);
  return (
    <FieldShell {...ids} label={label} hint={hint} error={error}>
      <select
        id={ids.id}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cn(CONTROL, "h-12 appearance-none", className)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}
