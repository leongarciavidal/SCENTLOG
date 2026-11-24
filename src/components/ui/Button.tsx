import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-paper text-ink hover:bg-paper/85",
  secondary: "border border-line-strong text-paper hover:border-paper",
  ghost: "text-paper-muted hover:text-paper",
};

export function buttonClasses(variant: Variant = "primary", className?: string) {
  return cn(
    "inline-flex h-11 items-center justify-center gap-2 rounded-xs px-6 text-sm font-medium tracking-wide transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    className,
  );
}

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ComponentPropsWithoutRef<"button"> & { variant?: Variant }) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}
