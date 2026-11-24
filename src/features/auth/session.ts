import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = { id: string; email: string | null };

/**
 * The signed-in user for this request, or null.
 *
 * Uses getClaims(), which verifies the session token's signature, so the
 * result can be trusted on the server (unlike getSession()).
 * Wrapped in React's cache() so it runs once per request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!getSupabaseConfig()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return { id: data.claims.sub, email: (data.claims.email as string | undefined) ?? null };
});

/** Use at the top of protected pages: sends visitors to the login page. */
export async function requireUser(locale: string, returnTo: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

/** The signed-in user's own profile (for the header, settings…). */
export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url, locale, is_admin")
    .eq("id", user.id)
    .maybeSingle();
  return data;
});
