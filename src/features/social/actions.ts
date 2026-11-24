"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

/** Follows (follow = true) or unfollows another user. */
export async function setFollow(targetId: string, follow: boolean): Promise<{ ok: boolean }> {
  if (!z.uuid().safeParse(targetId).success) return { ok: false };
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId || userId === targetId) return { ok: false };

  const { error } = follow
    ? await supabase.from("follows").insert({ follower_id: userId, following_id: targetId })
    : await supabase
        .from("follows")
        .delete()
        .eq("follower_id", userId)
        .eq("following_id", targetId);
  if (error && error.code !== "23505") return { ok: false };

  revalidatePath("/", "layout");
  return { ok: true };
}
