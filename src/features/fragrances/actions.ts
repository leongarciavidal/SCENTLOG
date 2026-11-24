"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const IMAGE_MAX_BYTES = 1024 * 1024; // after client-side resizing
const IMAGE_TYPES = ["image/webp", "image/jpeg", "image/png"];

export type ImageAdminResult =
  { ok: true } | { ok: false; error: "forbidden" | "creditRequired" | "invalid" | "unknown" };

const inputSchema = z.object({
  fragranceId: z.uuid(),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  credit: z.string().trim().min(1).max(200),
});

async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_admin");
  return { supabase, isAdmin: !error && data === true };
}

/**
 * Admin-only: stores a fragrance image in the `fragrance-images` bucket and
 * saves its URL + credit. RLS and storage policies enforce the admin check
 * again in the database.
 */
export async function saveFragranceImage(formData: FormData): Promise<ImageAdminResult> {
  const parsed = inputSchema.safeParse({
    fragranceId: formData.get("fragranceId"),
    slug: formData.get("slug"),
    credit: formData.get("credit"),
  });
  if (!parsed.success) {
    const creditIssue = parsed.error.issues.some((issue) => issue.path[0] === "credit");
    return { ok: false, error: creditIssue ? "creditRequired" : "invalid" };
  }

  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, error: "forbidden" };

  const { fragranceId, slug, credit } = parsed.data;
  const file = formData.get("image");
  const update: { image_credit: string; image_url?: string } = { image_credit: credit };
  const storage = supabase.storage.from("fragrance-images");
  let newPath: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (!IMAGE_TYPES.includes(file.type) || file.size > IMAGE_MAX_BYTES) {
      return { ok: false, error: "invalid" };
    }
    newPath = `${slug}/${Date.now()}.${file.type.split("/")[1].replace("jpeg", "jpg")}`;
    const { error } = await storage.upload(newPath, file, {
      contentType: file.type,
      cacheControl: "31536000",
    });
    if (error) {
      console.error("[fragrance-image]", error.message);
      return { ok: false, error: "unknown" };
    }
    update.image_url = storage.getPublicUrl(newPath).data.publicUrl;
  }

  const { error } = await supabase.from("fragrances").update(update).eq("id", fragranceId);
  if (error) {
    if (newPath) await storage.remove([newPath]);
    console.error("[fragrance-image]", error.code, error.message);
    return { ok: false, error: "unknown" };
  }

  if (newPath) await removeStaleImages(slug, newPath);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeFragranceImage(
  fragranceId: string,
  slug: string,
): Promise<ImageAdminResult> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, error: "forbidden" };

  const { error } = await supabase
    .from("fragrances")
    .update({ image_url: null, image_credit: null })
    .eq("id", fragranceId);
  if (error) return { ok: false, error: "unknown" };

  await removeStaleImages(slug, null);
  revalidatePath("/", "layout");
  return { ok: true };
}

async function removeStaleImages(slug: string, keepPath: string | null) {
  const supabase = await createClient();
  const storage = supabase.storage.from("fragrance-images");
  const { data } = await storage.list(slug);
  const stale = (data ?? []).map((f) => `${slug}/${f.name}`).filter((p) => p !== keepPath);
  if (stale.length > 0) await storage.remove(stale);
}
