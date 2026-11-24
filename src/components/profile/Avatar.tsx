import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-8 text-xs",
  md: "size-14 text-lg",
  lg: "size-28 text-4xl sm:size-36 sm:text-5xl",
};

/**
 * Round profile picture. Falls back to the first letter of the name.
 * A plain <img> is used on purpose: avatars are already resized to 512px
 * WebP before upload, so Next's image optimiser adds nothing here.
 */
export function Avatar({
  url,
  name,
  size = "md",
  className,
}: {
  url: string | null | undefined;
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const base = cn(
    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-ink-raised",
    SIZES[size],
    className,
  );

  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className={cn(base, "object-cover")} />;
  }
  return (
    <span aria-hidden="true" className={cn(base, "font-serif text-paper-muted uppercase")}>
      {name.charAt(0)}
    </span>
  );
}
