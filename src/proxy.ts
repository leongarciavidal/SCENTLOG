import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/proxy";

const handleI18nRouting = createIntlMiddleware(routing);

/**
 * Runs before every page request:
 *  1. next-intl resolves the language (and redirects "/" → "/en" or "/es").
 *  2. Supabase refreshes the auth session cookies on that same response.
 */
export async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);
  return updateSession(request, response);
}

export const config = {
  // Skip API routes, Next.js internals and files with an extension (images…).
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
