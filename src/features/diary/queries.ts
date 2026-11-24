import "server-only";

import { FRAGRANCE_CARD_COLUMNS } from "@/features/fragrances/queries";
import { createClient } from "@/lib/supabase/server";

import type { DiaryStatus } from "./schemas";

/** The signed-in user's entry for a fragrance (or null). */
export async function getMyDiaryEntry(userId: string, fragranceId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_fragrances")
    .select("id, status, rating, notes, is_private, added_on")
    .eq("user_id", userId)
    .eq("fragrance_id", fragranceId)
    .maybeSingle();
  return data;
}

export const COLLECTION_SORTS = ["recent", "rating", "az"] as const;
export type CollectionSort = (typeof COLLECTION_SORTS)[number];
export const COLLECTION_PAGE_SIZE = 24;

const ENTRY_COLUMNS =
  `id, status, rating, notes, is_private, added_on, fragrance:fragrances!inner ( ${FRAGRANCE_CARD_COLUMNS} )` as const;

/**
 * A user's diary, optionally filtered by status. RLS hides private entries
 * from everyone except their owner.
 */
export async function getCollection(
  userId: string,
  { status, sort, page }: { status?: DiaryStatus; sort: CollectionSort; page: number },
) {
  const supabase = await createClient();
  let query = supabase
    .from("user_fragrances")
    .select(ENTRY_COLUMNS, { count: "exact" })
    .eq("user_id", userId);
  if (status) query = query.eq("status", status);

  if (sort === "rating") {
    query = query
      .order("rating", { ascending: false, nullsFirst: false })
      .order("added_on", { ascending: false });
  } else if (sort === "az") {
    query = query.order("name", { referencedTable: "fragrance" });
  } else {
    query = query.order("added_on", { ascending: false }).order("created_at", { ascending: false });
  }

  const from = (page - 1) * COLLECTION_PAGE_SIZE;
  const { data, count, error } = await query
    .order("id")
    .range(from, from + COLLECTION_PAGE_SIZE - 1);
  if (error && error.code !== "PGRST103") throw new Error(error.message);

  let items = data ?? [];
  // Ordering by a joined column sorts inside the join only; sort the page here.
  if (sort === "az")
    items = [...items].sort((a, b) => a.fragrance.name.localeCompare(b.fragrance.name));
  const total = count ?? 0;
  return { items, total, pageCount: Math.ceil(total / COLLECTION_PAGE_SIZE) };
}

export type CollectionEntry = Awaited<ReturnType<typeof getCollection>>["items"][number];

export async function getRecentEntries(userId: string, limit = 8) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_fragrances")
    .select(ENTRY_COLUMNS)
    .eq("user_id", userId)
    .order("added_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

/** All of a user's diary fragrances (for the top-four picker). */
export async function getFavoriteCandidates(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_fragrances")
    .select("fragrance:fragrances!inner ( id, name, concentration, brand:brands!inner ( name ) )")
    .eq("user_id", userId);
  return (data ?? [])
    .map((row) => row.fragrance)
    .sort((a, b) => `${a.brand.name} ${a.name}`.localeCompare(`${b.brand.name} ${b.name}`));
}
