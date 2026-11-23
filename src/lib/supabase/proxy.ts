import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

import { getSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Refreshes the Supabase auth session on every request and writes any updated
 * auth cookies onto `response` (the response produced by the i18n proxy).
 *
 * Without this, sessions would silently expire for Server Components, which
 * cannot write cookies themselves.
 */
export async function updateSession(request: NextRequest, response: NextResponse) {
  const config = getSupabaseConfig();
  if (!config) return response;

  const supabase = createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        // Prevent CDNs from caching responses that carry auth cookies.
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Do not put code between createServerClient and getClaims(): getClaims()
  // validates the JWT and triggers the token refresh when needed.
  await supabase.auth.getClaims();

  return response;
}
