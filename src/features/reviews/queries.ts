import "server-only";

import { cache } from "react";

import { getSupabaseConfig } from "@/lib/env";
import type { QueryResult } from "@/lib/result";
import { createClient } from "@/lib/supabase/server";

/** Everything needed to render a review card. */
export const REVIEW_COLUMNS = `
  id, user_id, fragrance_id, body, created_at, updated_at, like_count, comment_count,
  longevity, projection, sillage, versatility, value,
  author:profiles!reviews_user_id_fkey ( username, display_name, avatar_url ),
  entry:user_fragrances!reviews_diary_entry_fk ( rating ),
  fragrance:fragrances!reviews_fragrance_id_fkey ( slug, name, concentration, brand:brands!inner ( name ) )
` as const;

type ServerClient = Awaited<ReturnType<typeof createClient>>;
function reviews(supabase: ServerClient) {
  return supabase.from("reviews").select(REVIEW_COLUMNS);
}

export type ReviewCardData = NonNullable<Awaited<ReturnType<typeof reviews>>["data"]>[number];

export async function getRecentReviews(limit = 3): Promise<QueryResult<ReviewCardData[]>> {
  if (!getSupabaseConfig()) return { status: "unconfigured" };
  const { data, error } = await reviews(await createClient())
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { status: "error", message: error.message };
  return { status: "ok", data };
}

export async function getFragranceReviews(fragranceId: string, limit = 30) {
  const { data } = await reviews(await createClient())
    .eq("fragrance_id", fragranceId)
    .order("like_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getMyReview(userId: string, fragranceId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, body, longevity, projection, sillage, versatility, value")
    .eq("user_id", userId)
    .eq("fragrance_id", fragranceId)
    .maybeSingle();
  return data;
}

export const getReviewById = cache(async (id: string) => {
  const { data, error } = await reviews(await createClient())
    .eq("id", id)
    .maybeSingle();
  if (error && error.code !== "22P02") throw new Error(error.message);
  return data ?? null;
});

export async function getUserReviews(userId: string) {
  const { data } = await reviews(await createClient())
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

/** Which of these reviews the user has liked (for the heart state). */
export async function getLikedReviewIds(userId: string | null | undefined, reviewIds: string[]) {
  if (!userId || reviewIds.length === 0) return new Set<string>();
  const supabase = await createClient();
  const { data } = await supabase
    .from("review_likes")
    .select("review_id")
    .eq("user_id", userId)
    .in("review_id", reviewIds);
  return new Set((data ?? []).map((row) => row.review_id));
}

export async function getReviewComments(reviewId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("review_comments")
    .select(
      "id, user_id, body, created_at, author:profiles!review_comments_user_id_fkey ( username, display_name, avatar_url )",
    )
    .eq("review_id", reviewId)
    .order("created_at", { ascending: true });
  return data ?? [];
}
