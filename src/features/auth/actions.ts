"use server";

import type { AuthError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { routing, type Locale } from "@/i18n/routing";
import { siteUrl } from "@/lib/env";
import { text, toFieldErrors, type ErrorCode, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

import { safeNextPath } from "./redirects";
import { requestResetSchema, signInSchema, signUpSchema, updatePasswordSchema } from "./schemas";

/** Only accept locales we support (the value comes from the client). */
function asLocale(value: string): Locale {
  return (routing.locales as readonly string[]).includes(value)
    ? (value as Locale)
    : routing.defaultLocale;
}

/** Translates Supabase Auth errors into our error codes. */
function authErrorCode(error: AuthError): ErrorCode {
  switch (error.code) {
    case "invalid_credentials":
      return "invalidCredentials";
    case "email_not_confirmed":
      return "emailNotConfirmed";
    case "weak_password":
      return "passwordWeak";
    case "same_password":
      return "samePassword";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "rateLimited";
    case "email_address_invalid":
      return "emailInvalid";
    case "session_not_found":
    case "session_expired":
      return "sessionExpired";
    default:
      console.error("[auth]", error.code, error.message);
      return "unknown";
  }
}

// ---------------------------------------------------------------------------
// Sign up
// ---------------------------------------------------------------------------
type SignUpField = "username" | "email" | "password";

export async function signUp(
  localeValue: string,
  _prev: FormState<SignUpField>,
  formData: FormData,
): Promise<FormState<SignUpField>> {
  const locale = asLocale(localeValue);
  const values = { username: text(formData, "username"), email: text(formData, "email") };
  const parsed = signUpSchema.safeParse({ ...values, password: text(formData, "password") });

  if (!parsed.success) {
    return { status: "error", fieldErrors: toFieldErrors(parsed.error), values };
  }

  const { username, email, password } = parsed.data;
  const supabase = await createClient();

  // Friendly early check; the unique constraint in the database is the real guarantee.
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existing) {
    return { status: "error", fieldErrors: { username: "usernameTaken" }, values };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/confirm?next=/${locale}/${username}`,
      data: { username, locale },
    },
  });

  if (error) return { status: "error", formError: authErrorCode(error), values };

  // Email confirmation disabled → the user is signed in straight away.
  if (data.session) redirect(`/${locale}/${username}`);

  // Email confirmation enabled. For privacy, the same message is shown even if
  // the email was already registered (Supabase does not reveal it either).
  return { status: "success", success: "checkEmail", values };
}

// ---------------------------------------------------------------------------
// Sign in / sign out
// ---------------------------------------------------------------------------
type SignInField = "email" | "password";

export async function signIn(
  localeValue: string,
  _prev: FormState<SignInField>,
  formData: FormData,
): Promise<FormState<SignInField>> {
  const locale = asLocale(localeValue);
  const values = { email: text(formData, "email") };
  const parsed = signInSchema.safeParse({ ...values, password: text(formData, "password") });

  if (!parsed.success) {
    return { status: "error", fieldErrors: toFieldErrors(parsed.error), values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { status: "error", formError: authErrorCode(error), values };

  redirect(safeNextPath(text(formData, "next"), `/${locale}`));
}

export async function signOut(localeValue: string) {
  const locale = asLocale(localeValue);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}`);
}

// ---------------------------------------------------------------------------
// Password recovery
// ---------------------------------------------------------------------------
export async function requestPasswordReset(
  localeValue: string,
  _prev: FormState<"email">,
  formData: FormData,
): Promise<FormState<"email">> {
  const locale = asLocale(localeValue);
  const values = { email: text(formData, "email") };
  const parsed = requestResetSchema.safeParse(values);

  if (!parsed.success) {
    return { status: "error", fieldErrors: toFieldErrors(parsed.error), values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/${locale}/reset-password`,
  });

  // Never reveal whether an account exists; only surface rate limiting.
  if (error && authErrorCode(error) === "rateLimited") {
    return { status: "error", formError: "rateLimited", values };
  }
  return { status: "success", success: "resetEmailSent", values };
}

type PasswordField = "password" | "confirmPassword";

export async function updatePassword(
  _prev: FormState<PasswordField>,
  formData: FormData,
): Promise<FormState<PasswordField>> {
  const parsed = updatePasswordSchema.safeParse({
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: toFieldErrors(parsed.error) };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return { status: "error", formError: "sessionExpired" };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: "error", formError: authErrorCode(error) };

  return { status: "success", success: "passwordUpdated" };
}
