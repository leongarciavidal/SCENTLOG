import "server-only";

import { getSupabaseConfig } from "@/lib/env";
import type { QueryResult } from "@/lib/result";
import { createClient } from "@/lib/supabase/server";

async function fetchRecent(limit: number) {
  const supabase = await createClient();
  return supabase
    .from("reviews")
    .select(
      `
      id, body, created_at, like_count,
      author:profiles!reviews_user_id_fkey ( username, display_name, avatar_url ),
      fragrance:fragrances!reviews_fragrance_id_fkey ( slug, name, brand:brands ( name ) )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);
}

export type RecentReview = NonNullable<Awaited<ReturnType<typeof fetchRecent>>["data"]>[number];

export async function getRecentReviews(limit = 3): Promise<QueryResult<RecentReview[]>> {
  if (!getSupabaseConfig()) return { status: "unconfigured" };

  const { data, error } = await fetchRecent(limit);
  if (error) return { status: "error", message: error.message };
  return { status: "ok", data };
}
