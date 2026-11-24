import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

/** Public profile by username (usernames are stored lower-case). */
export const getProfileByUsername = cache(async (username: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url, created_at")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
});

export type ProfileStats = {
  owned: number;
  tested: number;
  wishlist: number;
  finished: number;
  reviews: number;
  lists: number;
  followers: number;
  following: number;
};

/**
 * Activity counters for a profile. Row Level Security applies, so visitors
 * never count another user's private diary entries or private lists.
 */
export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const supabase = await createClient();
  const count = { count: "exact", head: true } as const;

  const diary = (status: "owned" | "tested" | "wishlist" | "finished") =>
    supabase.from("user_fragrances").select("id", count).eq("user_id", userId).eq("status", status);

  const results = await Promise.all([
    diary("owned"),
    diary("tested"),
    diary("wishlist"),
    diary("finished"),
    supabase.from("reviews").select("id", count).eq("user_id", userId),
    supabase.from("lists").select("id", count).eq("user_id", userId),
    supabase.from("follows").select("follower_id", count).eq("following_id", userId),
    supabase.from("follows").select("following_id", count).eq("follower_id", userId),
  ]);

  const [owned, tested, wishlist, finished, reviews, lists, followers, following] = results.map(
    (r) => r.count ?? 0,
  );
  return { owned, tested, wishlist, finished, reviews, lists, followers, following };
}

/** The four favourite fragrances, in order. */
export async function getProfileFavorites(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_favorites")
    .select(
      "position, fragrance:fragrances ( id, slug, name, concentration, release_year, image_url, brand:brands ( name ), family:fragrance_families ( slug ) )",
    )
    .eq("user_id", userId)
    .order("position");
  return data ?? [];
}
