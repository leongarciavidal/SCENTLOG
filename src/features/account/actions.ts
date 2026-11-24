"use server";

import { redirect } from "next/navigation";

import { routing, type Locale } from "@/i18n/routing";
import { text, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

/**
 * Permanently deletes the signed-in user's account and all their data.
 * The user must type their username to confirm.
 */
export async function deleteAccount(
  localeValue: string,
  _prev: FormState<"confirm">,
  formData: FormData,
): Promise<FormState<"confirm">> {
  const locale: Locale = (routing.locales as readonly string[]).includes(localeValue)
    ? (localeValue as Locale)
    : routing.defaultLocale;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return { status: "error", formError: "sessionExpired" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .single();
  if (!profile || text(formData, "confirm").trim().toLowerCase() !== profile.username) {
    return { status: "error", fieldErrors: { confirm: "confirmMismatch" } };
  }

  // 1. Uploaded files (avatars, list covers) live in folders named after the user.
  for (const bucket of ["avatars", "list-covers"]) {
    const { data: files } = await supabase.storage.from(bucket).list(userId, { limit: 1000 });
    const paths = (files ?? []).map((file) => `${userId}/${file.name}`);
    if (paths.length > 0) await supabase.storage.from(bucket).remove(paths);
  }

  // 2. The account itself; everything else is removed in cascade by the database.
  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    console.error("[account] delete", error.code, error.message);
    return { status: "error", formError: "unknown" };
  }

  // 3. Clear the session cookies in this browser.
  await supabase.auth.signOut({ scope: "local" });
  redirect(`/${locale}?accountDeleted=1`);
}
