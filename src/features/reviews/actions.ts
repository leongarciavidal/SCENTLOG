"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { text, toFieldErrors, type FormState } from "@/lib/forms";
import { isRateLimited } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

import { commentSchema, REVIEW_DIMENSIONS, reviewSchema } from "./schemas";

type ReviewField = "body" | (typeof REVIEW_DIMENSIONS)[number];

async function session() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, userId: data?.claims?.sub ?? null };
}

const uuid = z.uuid();

/**
 * Writes or edits the user's review of a fragrance. A review needs a diary
 * entry (database rule); if there is none yet, one is created as "tested".
 */
export async function saveReview(
  fragranceId: string,
  _prev: FormState<ReviewField>,
  formData: FormData,
): Promise<FormState<ReviewField>> {
  const values = Object.fromEntries(
    ["body", ...REVIEW_DIMENSIONS].map((key) => [key, text(formData, key)]),
  ) as Record<ReviewField, string>;
  const parsed = reviewSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: toFieldErrors(parsed.error), values };
  if (!uuid.safeParse(fragranceId).success)
    return { status: "error", formError: "unknown", values };

  const { supabase, userId } = await session();
  if (!userId) return { status: "error", formError: "sessionExpired", values };

  const { data: entry } = await supabase
    .from("user_fragrances")
    .select("id")
    .eq("user_id", userId)
    .eq("fragrance_id", fragranceId)
    .maybeSingle();
  if (!entry) {
    const { error } = await supabase
      .from("user_fragrances")
      .insert({ user_id: userId, fragrance_id: fragranceId, status: "tested" });
    if (error) {
      console.error("[review] diary entry", error.code, error.message);
      return { status: "error", formError: "unknown", values };
    }
  }

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", userId)
    .eq("fragrance_id", fragranceId)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("reviews").update(parsed.data).eq("id", existing.id)
    : await supabase
        .from("reviews")
        .insert({ ...parsed.data, user_id: userId, fragrance_id: fragranceId });
  if (error) {
    if (isRateLimited(error)) return { status: "error", formError: "rateLimited", values };
    console.error("[review]", error.code, error.message);
    return { status: "error", formError: "unknown", values };
  }

  revalidatePath("/", "layout");
  return { status: "success", success: "reviewSaved", values };
}

export async function deleteReview(reviewId: string): Promise<{ ok: boolean }> {
  if (!uuid.safeParse(reviewId).success) return { ok: false };
  const { supabase, userId } = await session();
  if (!userId) return { ok: false };
  // RLS allows the author or an admin.
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
  if (error) return { ok: false };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Likes (like = true) or unlikes a review as the signed-in user. */
export async function setReviewLike(reviewId: string, like: boolean): Promise<{ ok: boolean }> {
  if (!uuid.safeParse(reviewId).success) return { ok: false };
  const { supabase, userId } = await session();
  if (!userId) return { ok: false };

  const { error } = like
    ? await supabase.from("review_likes").insert({ user_id: userId, review_id: reviewId })
    : await supabase.from("review_likes").delete().eq("user_id", userId).eq("review_id", reviewId);
  // A duplicate like (double click) is not an error for the user.
  if (error && error.code !== "23505") return { ok: false };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function addComment(
  reviewId: string,
  _prev: FormState<"body">,
  formData: FormData,
): Promise<FormState<"body">> {
  const values = { body: text(formData, "body") };
  const parsed = commentSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: toFieldErrors(parsed.error), values };
  if (!uuid.safeParse(reviewId).success) return { status: "error", formError: "unknown", values };

  const { supabase, userId } = await session();
  if (!userId) return { status: "error", formError: "sessionExpired", values };

  const { error } = await supabase
    .from("review_comments")
    .insert({ review_id: reviewId, user_id: userId, body: parsed.data.body });
  if (error) {
    if (isRateLimited(error)) return { status: "error", formError: "rateLimited", values };
    console.error("[comment]", error.code, error.message);
    return { status: "error", formError: "unknown", values };
  }
  revalidatePath("/", "layout");
  // Empty values clear the textarea after posting.
  return { status: "success", success: "commentAdded", values: { body: "" } };
}

export async function deleteComment(commentId: string): Promise<{ ok: boolean }> {
  if (!uuid.safeParse(commentId).success) return { ok: false };
  const { supabase, userId } = await session();
  if (!userId) return { ok: false };
  // RLS allows the author or an admin.
  const { error } = await supabase.from("review_comments").delete().eq("id", commentId);
  if (error) return { ok: false };
  revalidatePath("/", "layout");
  return { ok: true };
}
