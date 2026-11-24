import type { FragranceCardData } from "@/features/fragrances/queries";
import { cn } from "@/lib/utils";

import { FragranceCard } from "./FragranceCard";

export function FragranceGrid({
  items,
  className,
}: {
  items: FragranceCardData[];
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-4 gap-y-14 sm:gap-x-6 lg:grid-cols-4", className)}>
      {items.map((fragrance) => (
        <FragranceCard key={fragrance.id} fragrance={fragrance} />
      ))}
    </div>
  );
}
