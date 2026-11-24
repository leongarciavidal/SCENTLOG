"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { text, toFieldErrors, type FormState } from "@/lib/forms";
import { isRateLimited } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

import { diaryEntrySchema } from "./schemas";

type DiaryField = "status" | "rating" | "notes" | "is_private" | "added_on";

async function currentUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, userId: data?.claims?.sub ?? null };
}

/**
 * Creates or updates the signed-in user's diary entry for one fragrance.
 * (Not an upsert: users may only write the editable columns, and an upsert
 * would also try to update user_id / fragrance_id.)
 */
export async function saveDiaryEntry(
  fragranceId: string,
  _prev: FormState<DiaryField>,
  formData: FormData,
): Promise<FormState<DiaryField>> {
  const values = {
    status: text(formData, "status"),
    rating: text(formData, "rating"),
    notes: text(formData, "notes"),
    added_on: text(formData, "added_on"),
  };
  const parsed = diaryEntrySchema.safeParse({
    ...values,
    is_private: formData.get("is_private") === "on",
  });
  if (!parsed.success || !z.uuid().safeParse(fragranceId).success) {
    return {
      status: "error",
      fieldErrors: parsed.success ? {} : toFieldErrors(parsed.error),
      formError: parsed.success ? "unknown" : undefined,
      values,
    };
  }

  const { supabase, userId } = await currentUserId();
  if (!userId) return { status: "error", formError: "sessionExpired", values };

  const { data: existing } = await supabase
    .from("user_fragrances")
    .select("id")
    .eq("user_id", userId)
    .eq("fragrance_id", fragranceId)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("user_fragrances").update(parsed.data).eq("id", existing.id)
    : await supabase
        .from("user_fragrances")
        .insert({ ...parsed.data, user_id: userId, fragrance_id: fragranceId });

  if (error) {
    if (isRateLimited(error)) return { status: "error", formError: "rateLimited", values };
    console.error("[diary]", error.code, error.message);
    return { status: "error", formError: "unknown", values };
  }

  revalidatePath("/", "layout");
  return { status: "success", success: "diarySaved", values };
}

export async function removeDiaryEntry(fragranceId: string): Promise<{ ok: boolean }> {
  if (!z.uuid().safeParse(fragranceId).success) return { ok: false };
  const { supabase, userId } = await currentUserId();
  if (!userId) return { ok: false };

  const { error } = await supabase
    .from("user_fragrances")
    .delete()
    .eq("user_id", userId)
    .eq("fragrance_id", fragranceId);
  if (error) return { ok: false };

  revalidatePath("/", "layout");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Top four
// ---------------------------------------------------------------------------
export async function saveFavorites(
  _prev: FormState<"favorites">,
  formData: FormData,
): Promise<FormState<"favorites">> {
  const ids = [1, 2, 3, 4]
    .map((position) => text(formData, `position-${position}`))
    .filter(Boolean);
  const parsed = z.array(z.uuid()).max(4).safeParse(ids);
  if (!parsed.success) return { status: "error", formError: "unknown" };
  if (new Set(parsed.data).size !== parsed.data.length) {
    return { status: "error", formError: "favoritesDuplicate" };
  }

  const { supabase, userId } = await currentUserId();
  if (!userId) return { status: "error", formError: "sessionExpired" };

  const { error } = await supabase.rpc("set_profile_favorites", { fragrance_ids: parsed.data });
  if (error) {
    console.error("[favorites]", error.code, error.message);
    return { status: "error", formError: "unknown" };
  }

  revalidatePath("/", "layout");
  return { status: "success", success: "favoritesSaved" };
}
