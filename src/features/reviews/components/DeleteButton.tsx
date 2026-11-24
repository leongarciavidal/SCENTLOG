"use client";

import { useTransition } from "react";

/** Small destructive action with a confirmation dialog. */
export function DeleteButton({
  label,
  confirm,
  action,
}: {
  label: string;
  confirm: string;
  action: () => Promise<{ ok: boolean }>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(confirm)) startTransition(async () => void (await action()));
      }}
      className="relative z-10 text-xs text-paper-faint transition-colors hover:text-amber disabled:opacity-50"
    >
      {label}
    </button>
  );
}
