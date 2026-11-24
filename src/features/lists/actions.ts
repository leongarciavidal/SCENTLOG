"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { routing, type Locale } from "@/i18n/routing";
import { text, toFieldErrors, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

import { listSchema } from "./schemas";

type ListField = "title" | "description";
const uuid = z.uuid();

async function session() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, userId: data?.claims?.sub ?? null };
}

function asLocale(value: string): Locale {
  return (routing.locales as readonly string[]).includes(value)
    ? (value as Locale)
    : routing.defaultLocale;
}

function parseList(formData: FormData) {
  const values = { title: text(formData, "title"), description: text(formData, "description") };
  const parsed = listSchema.safeParse({
    ...values,
    is_public: formData.get("is_public") === "on",
    is_ranked: formData.get("is_ranked") === "on",
  });
  return { values, parsed };
}

/** Creates a list (optionally with a first fragrance) and opens its editor. */
export async function createList(
  localeValue: string,
  _prev: FormState<ListField>,
  formData: FormData,
): Promise<FormState<ListField>> {
  const locale = asLocale(localeValue);
  const { values, parsed } = parseList(formData);
  if (!parsed.success) return { status: "error", fieldErrors: toFieldErrors(parsed.error), values };

  const { supabase, userId } = await session();
  if (!userId) return { status: "error", formError: "sessionExpired", values };

  const { data, error } = await supabase
    .from("lists")
    .insert({ ...parsed.data, user_id: userId })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[lists] create", error?.code, error?.message);
    return { status: "error", formError: "unknown", values };
  }

  const firstFragrance = text(formData, "add");
  if (uuid.safeParse(firstFragrance).success) {
    await supabase.rpc("add_list_item", { p_list_id: data.id, p_fragrance_id: firstFragrance });
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/lists/${data.id}/edit`);
}

export async function updateList(
  listId: string,
  _prev: FormState<ListField>,
  formData: FormData,
): Promise<FormState<ListField>> {
  const { values, parsed } = parseList(formData);
  if (!parsed.success) return { status: "error", fieldErrors: toFieldErrors(parsed.error), values };
  if (!uuid.safeParse(listId).success) return { status: "error", formError: "unknown", values };

  const { supabase, userId } = await session();
  if (!userId) return { status: "error", formError: "sessionExpired", values };

  const { error } = await supabase
    .from("lists")
    .update(parsed.data)
    .eq("id", listId)
    .eq("user_id", userId);
  if (error) return { status: "error", formError: "unknown", values };

  revalidatePath("/", "layout");
  return { status: "success", success: "listSaved", values };
}

export async function deleteList(localeValue: string, listId: string) {
  const locale = asLocale(localeValue);
  const { supabase, userId } = await session();
  if (!userId || !uuid.safeParse(listId).success) return { ok: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .single();
  const { error } = await supabase.from("lists").delete().eq("id", listId).eq("user_id", userId);
  if (error) return { ok: false };

  await removeCoverFiles(userId, listId, null);
  revalidatePath("/", "layout");
  redirect(`/${locale}/${profile?.username ?? ""}/lists`);
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------
export async function addToList(listId: string, fragranceId: string): Promise<{ ok: boolean }> {
  if (!uuid.safeParse(listId).success || !uuid.safeParse(fragranceId).success) return { ok: false };
  const { supabase, userId } = await session();
  if (!userId) return { ok: false };
  const { error } = await supabase.rpc("add_list_item", {
    p_list_id: listId,
    p_fragrance_id: fragranceId,
  });
  if (error) return { ok: false };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeFromList(
  listId: string,
  fragranceId: string,
): Promise<{ ok: boolean }> {
  if (!uuid.safeParse(listId).success || !uuid.safeParse(fragranceId).success) return { ok: false };
  const { supabase, userId } = await session();
  if (!userId) return { ok: false };
  const { error } = await supabase
    .from("list_fragrances")
    .delete()
    .eq("list_id", listId)
    .eq("fragrance_id", fragranceId);
  if (error) return { ok: false };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function reorderList(
  listId: string,
  fragranceIds: string[],
): Promise<{ ok: boolean }> {
  const parsed = z.array(uuid).max(500).safeParse(fragranceIds);
  if (!uuid.safeParse(listId).success || !parsed.success) return { ok: false };
  const { supabase, userId } = await session();
  if (!userId) return { ok: false };
  const { error } = await supabase.rpc("reorder_list_items", {
    p_list_id: listId,
    p_fragrance_ids: parsed.data,
  });
  if (error) {
    console.error("[lists] reorder", error.code, error.message);
    return { ok: false };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Fragrance search for the list editor ("add a fragrance" box). */
export async function searchFragrancesForList(query: string) {
  const q = query
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .slice(0, 100);
  if (q.length < 2) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("fragrances")
    .select("id, name, concentration, release_year, brand:brands!inner ( name )")
    .ilike("search_text", `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`)
    .order("diary_count", { ascending: false })
    .limit(8);
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Likes
// ---------------------------------------------------------------------------
export async function setListLike(listId: string, like: boolean): Promise<{ ok: boolean }> {
  if (!uuid.safeParse(listId).success) return { ok: false };
  const { supabase, userId } = await session();
  if (!userId) return { ok: false };
  const { error } = like
    ? await supabase.from("list_likes").insert({ user_id: userId, list_id: listId })
    : await supabase.from("list_likes").delete().eq("user_id", userId).eq("list_id", listId);
  if (error && error.code !== "23505") return { ok: false };
  revalidatePath("/", "layout");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Cover image (stored at list-covers/<user id>/<list id>-<timestamp>.<ext>)
// ---------------------------------------------------------------------------
const COVER_MAX_BYTES = 1024 * 1024;
const COVER_TYPES = ["image/webp", "image/jpeg", "image/png"];

export async function uploadListCover(
  listId: string,
  formData: FormData,
): Promise<{ ok: boolean; url?: string }> {
  const file = formData.get("cover");
  if (!uuid.safeParse(listId).success || !(file instanceof File) || file.size === 0)
    return { ok: false };
  if (!COVER_TYPES.includes(file.type) || file.size > COVER_MAX_BYTES) return { ok: false };

  const { supabase, userId } = await session();
  if (!userId) return { ok: false };

  const path = `${userId}/${listId}-${Date.now()}.${file.type.split("/")[1].replace("jpeg", "jpg")}`;
  const storage = supabase.storage.from("list-covers");
  const { error: uploadError } = await storage.upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
  });
  if (uploadError) return { ok: false };

  const url = storage.getPublicUrl(path).data.publicUrl;
  const { error } = await supabase
    .from("lists")
    .update({ cover_image_url: url })
    .eq("id", listId)
    .eq("user_id", userId);
  if (error) {
    await storage.remove([path]);
    return { ok: false };
  }
  await removeCoverFiles(userId, listId, path);
  revalidatePath("/", "layout");
  return { ok: true, url };
}

export async function removeListCover(listId: string): Promise<{ ok: boolean }> {
  if (!uuid.safeParse(listId).success) return { ok: false };
  const { supabase, userId } = await session();
  if (!userId) return { ok: false };
  const { error } = await supabase
    .from("lists")
    .update({ cover_image_url: null })
    .eq("id", listId)
    .eq("user_id", userId);
  if (error) return { ok: false };
  await removeCoverFiles(userId, listId, null);
  revalidatePath("/", "layout");
  return { ok: true };
}

async function removeCoverFiles(userId: string, listId: string, keepPath: string | null) {
  const supabase = await createClient();
  const storage = supabase.storage.from("list-covers");
  const { data } = await storage.list(userId, { search: listId });
  const stale = (data ?? [])
    .map((f) => `${userId}/${f.name}`)
    .filter((p) => p !== keepPath && p.includes(listId));
  if (stale.length > 0) await storage.remove(stale);
}
