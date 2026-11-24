import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { localeFromPath, safeNextPath } from "@/features/auth/redirects";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for links sent by email (confirm sign-up, reset password).
 *
 * Supports both formats Supabase can send:
 *  - ?code=…                 (default templates, PKCE flow)
 *  - ?token_hash=…&type=…    (custom templates; works across devices)
 * On success the user is signed in and sent to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"), "/");
  const locale = localeFromPath(next);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let ok = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  }

  const destination = ok ? next : `/${locale}/login?error=link`;
  return NextResponse.redirect(new URL(destination, origin));
}
