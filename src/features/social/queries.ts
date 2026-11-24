import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function isFollowing(viewerId: string | null | undefined, targetId: string) {
  if (!viewerId || viewerId === targetId) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", viewerId)
    .eq("following_id", targetId)
    .maybeSingle();
  return Boolean(data);
}

const PERSON = "id, username, display_name, avatar_url, bio";

export async function getFollowers(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select(`created_at, person:profiles!follows_follower_id_fkey ( ${PERSON} )`)
    .eq("following_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []).map((row) => row.person);
}

export async function getFollowing(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select(`created_at, person:profiles!follows_following_id_fkey ( ${PERSON} )`)
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []).map((row) => row.person);
}

/** Which of these people the viewer follows (for the buttons in a list). */
export async function getFollowedIds(viewerId: string | null | undefined, ids: string[]) {
  if (!viewerId || ids.length === 0) return new Set<string>();
  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", viewerId)
    .in("following_id", ids);
  return new Set((data ?? []).map((row) => row.following_id));
}

// ---------------------------------------------------------------------------
// Activity feed
// ---------------------------------------------------------------------------
export const FEED_PAGE_SIZE = 30;

export async function getFeed(beforeId?: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("feed_events", { page_size: FEED_PAGE_SIZE, before_id: beforeId ?? undefined })
    .select(
      `
      id, type, created_at, actor_id,
      actor:profiles!activity_events_actor_id_fkey ( username, display_name, avatar_url ),
      target:profiles!activity_events_target_user_id_fkey ( username, display_name ),
      fragrance:fragrances!activity_events_fragrance_id_fkey ( slug, name, image_url, concentration, release_year, brand:brands!inner ( name ), family:fragrance_families ( slug ) ),
      entry:user_fragrances!activity_events_user_fragrance_id_fkey ( status, rating ),
      review:reviews!activity_events_review_id_fkey ( id, body )
    `,
    );
  if (error) throw new Error(error.message);
  return data ?? [];
}

export type FeedEvent = Awaited<ReturnType<typeof getFeed>>[number];
