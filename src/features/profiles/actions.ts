"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { text, toFieldErrors, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

import { AVATAR_MAX_BYTES, AVATAR_MIME_TYPES, profileSchema } from "./schemas";

type ProfileField = "username" | "display_name" | "bio" | "locale";

export async function updateProfile(
  _prev: FormState<ProfileField>,
  formData: FormData,
): Promise<FormState<ProfileField>> {
  const values = {
    username: text(formData, "username"),
    display_name: text(formData, "display_name"),
    bio: text(formData, "bio"),
    locale: text(formData, "locale"),
  };
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: toFieldErrors(parsed.error), values };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return { status: "error", formError: "sessionExpired", values };

  // RLS guarantees only the user's own row can be updated.
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", userId);

  if (error) {
    if (error.code === "23505") {
      return { status: "error", fieldErrors: { username: "usernameTaken" }, values };
    }
    console.error("[profile]", error.code, error.message);
    return { status: "error", formError: "unknown", values };
  }

  revalidatePath("/", "layout");

  // Switch the interface to the newly chosen language if it changed.
  const currentLocale = text(formData, "currentLocale");
  if (parsed.data.locale !== currentLocale) redirect(`/${parsed.data.locale}/settings/profile`);

  return {
    status: "success",
    success: "profileSaved",
    values: { ...values, ...stringify(parsed.data) },
  };
}

function stringify(data: Record<string, string | null>) {
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? ""]));
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------
export type AvatarResult =
  | { ok: true; url: string }
  | { ok: false; error: "avatarInvalid" | "avatarTooLarge" | "sessionExpired" | "unknown" };

/**
 * Receives an image already resized in the browser, re-validates it on the
 * server and stores it at avatars/<user id>/<timestamp>.<ext>.
 */
export async function uploadAvatar(formData: FormData): Promise<AvatarResult> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "avatarInvalid" };
  if (!(AVATAR_MIME_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: "avatarInvalid" };
  }
  if (file.size > AVATAR_MAX_BYTES) return { ok: false, error: "avatarTooLarge" };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return { ok: false, error: "sessionExpired" };

  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${userId}/${Date.now()}.${extension}`;
  const storage = supabase.storage.from("avatars");

  const { error: uploadError } = await storage.upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
  });
  if (uploadError) {
    console.error("[avatar]", uploadError.message);
    return { ok: false, error: "unknown" };
  }

  const { data: publicUrl } = storage.getPublicUrl(path);
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl.publicUrl })
    .eq("id", userId);
  if (updateError) {
    await storage.remove([path]);
    return { ok: false, error: "unknown" };
  }

  await removeOtherAvatars(userId, path);
  revalidatePath("/", "layout");
  return { ok: true, url: publicUrl.publicUrl };
}

export async function removeAvatar(): Promise<AvatarResult> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return { ok: false, error: "sessionExpired" };

  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
  if (error) return { ok: false, error: "unknown" };

  await removeOtherAvatars(userId, null);
  revalidatePath("/", "layout");
  return { ok: true, url: "" };
}

/** Deletes old avatar files so storage does not fill up with unused images. */
async function removeOtherAvatars(userId: string, keepPath: string | null) {
  const supabase = await createClient();
  const storage = supabase.storage.from("avatars");
  const { data: files } = await storage.list(userId);
  const stale = (files ?? []).map((f) => `${userId}/${f.name}`).filter((p) => p !== keepPath);
  if (stale.length > 0) await storage.remove(stale);
}
