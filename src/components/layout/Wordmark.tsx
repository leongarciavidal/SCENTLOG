import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "font-sans text-[0.8125rem] font-semibold tracking-[0.42em] text-paper uppercase transition-opacity hover:opacity-70",
        className,
      )}
    >
      Scentlog
    </Link>
  );
}
