import "server-only";

import { getSupabaseConfig } from "@/lib/env";
import type { QueryResult } from "@/lib/result";
import { createClient } from "@/lib/supabase/server";

const FRAGRANCE_CARD_COLUMNS = `
  id, slug, name, concentration, release_year, image_url, rating_avg, rating_count,
  brand:brands!inner ( name, slug ),
  family:fragrance_families ( slug, name_en, name_es )
` as const;

async function fetchFeatured(limit: number) {
  const supabase = await createClient();
  return supabase
    .from("fragrances")
    .select(FRAGRANCE_CARD_COLUMNS, { count: "exact" })
    .order("diary_count", { ascending: false })
    .order("rating_avg", { ascending: false, nullsFirst: false })
    .order("release_year", { ascending: false, nullsFirst: false })
    .limit(limit);
}

export type FragranceCardData = NonNullable<
  Awaited<ReturnType<typeof fetchFeatured>>["data"]
>[number];

/** Fragrances for the homepage: most logged first, then best rated. */
export async function getFeaturedFragrances(
  limit = 9,
): Promise<QueryResult<{ items: FragranceCardData[]; total: number }>> {
  if (!getSupabaseConfig()) return { status: "unconfigured" };

  const { data, error, count } = await fetchFeatured(limit);
  if (error) return { status: "error", message: error.message };
  return { status: "ok", data: { items: data, total: count ?? data.length } };
}
