import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * GDPR data export: everything SCENTLOG stores about the signed-in user, as a
 * downloadable JSON file. Row Level Security still applies to every query.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const fragrance = "fragrance:fragrances ( slug, name, concentration, brand:brands ( name ) )";
  const [
    profile,
    diary,
    reviews,
    comments,
    lists,
    following,
    followers,
    favorites,
    likedReviews,
    likedLists,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name, bio, avatar_url, locale, created_at")
      .eq("id", userId)
      .single(),
    supabase
      .from("user_fragrances")
      .select(`status, rating, notes, is_private, added_on, created_at, ${fragrance}`)
      .eq("user_id", userId),
    supabase
      .from("reviews")
      .select(
        `body, longevity, projection, sillage, versatility, value, created_at, updated_at, ${fragrance}`,
      )
      .eq("user_id", userId),
    supabase.from("review_comments").select("body, created_at, review_id").eq("user_id", userId),
    supabase
      .from("lists")
      .select(
        "title, description, is_public, is_ranked, created_at, items:list_fragrances ( position, note, fragrance:fragrances ( slug, name ) )",
      )
      .eq("user_id", userId),
    supabase
      .from("follows")
      .select("created_at, user:profiles!follows_following_id_fkey ( username )")
      .eq("follower_id", userId),
    supabase
      .from("follows")
      .select("created_at, user:profiles!follows_follower_id_fkey ( username )")
      .eq("following_id", userId),
    supabase.from("profile_favorites").select(`position, ${fragrance}`).eq("user_id", userId),
    supabase.from("review_likes").select("review_id, created_at").eq("user_id", userId),
    supabase.from("list_likes").select("list_id, created_at").eq("user_id", userId),
  ]);

  const body = {
    exported_at: new Date().toISOString(),
    account: { id: userId, email: auth?.claims?.email ?? null },
    profile: profile.data,
    diary: diary.data,
    reviews: reviews.data,
    comments: comments.data,
    lists: lists.data,
    following: following.data,
    followers: followers.data,
    top_four: favorites.data,
    liked_reviews: likedReviews.data,
    liked_lists: likedLists.data,
  };

  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="scentlog-data-${profile.data?.username ?? "export"}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
