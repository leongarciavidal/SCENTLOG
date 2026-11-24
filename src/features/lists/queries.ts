import "server-only";

import { cache } from "react";

import { FRAGRANCE_CARD_COLUMNS } from "@/features/fragrances/queries";
import { createClient } from "@/lib/supabase/server";

/** Columns for a list card, including the first few fragrance names for the cover. */
const LIST_CARD_COLUMNS = `
  id, title, description, cover_image_url, is_public, is_ranked, item_count, like_count, created_at, updated_at, user_id,
  author:profiles!lists_user_id_fkey ( username, display_name, avatar_url ),
  preview:list_fragrances ( position, fragrance:fragrances ( name, brand:brands ( name ), family:fragrance_families ( slug ) ) )
` as const;

type ServerClient = Awaited<ReturnType<typeof createClient>>;
function listCards(supabase: ServerClient) {
  return supabase
    .from("lists")
    .select(LIST_CARD_COLUMNS)
    .order("position", { referencedTable: "list_fragrances" })
    .limit(4, { referencedTable: "list_fragrances" });
}

export type ListCardData = NonNullable<Awaited<ReturnType<typeof listCards>>["data"]>[number];

/** A list by id, or null when it does not exist or is private to someone else (RLS). */
export const getListById = cache(async (id: string) => {
  const { data, error } = await listCards(await createClient())
    .eq("id", id)
    .maybeSingle();
  if (error && error.code !== "22P02") throw new Error(error.message);
  return data ?? null;
});

export async function getListItems(listId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("list_fragrances")
    .select(`position, note, fragrance:fragrances!inner ( ${FRAGRANCE_CARD_COLUMNS} )`)
    .eq("list_id", listId)
    .order("position");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getUserLists(userId: string) {
  const { data } = await listCards(await createClient())
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  return data ?? [];
}

export async function getPopularLists(limit = 6) {
  const { data } = await listCards(await createClient())
    .eq("is_public", true)
    .gt("item_count", 0)
    .order("like_count", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getRecentLists(limit = 12) {
  const { data } = await listCards(await createClient())
    .eq("is_public", true)
    .gt("item_count", 0)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function hasLikedList(userId: string | null | undefined, listId: string) {
  if (!userId) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("list_likes")
    .select("list_id")
    .eq("user_id", userId)
    .eq("list_id", listId)
    .maybeSingle();
  return Boolean(data);
}

/** The user's lists, flagged with whether each already contains the fragrance. */
export async function getMyListsFor(userId: string, fragranceId: string) {
  const supabase = await createClient();
  const [{ data: lists }, { data: memberships }] = await Promise.all([
    supabase
      .from("lists")
      .select("id, title, is_public")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("list_fragrances")
      .select("list_id, lists!inner ( user_id )")
      .eq("fragrance_id", fragranceId)
      .eq("lists.user_id", userId),
  ]);
  const inList = new Set((memberships ?? []).map((m) => m.list_id));
  return (lists ?? []).map((list) => ({ ...list, contains: inList.has(list.id) }));
}
