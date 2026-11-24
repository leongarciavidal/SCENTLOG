import type { z } from "zod";

/**
 * Codes for every validation / server error a form can show.
 * Each code has a translation in messages → Forms.errors.
 */
export type ErrorCode =
  | "required"
  | "emailInvalid"
  | "usernameFormat"
  | "usernameReserved"
  | "usernameTaken"
  | "passwordTooShort"
  | "passwordTooLong"
  | "passwordWeak"
  | "passwordMismatch"
  | "samePassword"
  | "invalidCredentials"
  | "emailNotConfirmed"
  | "rateLimited"
  | "sessionExpired"
  | "displayNameTooLong"
  | "bioTooLong"
  | "avatarInvalid"
  | "avatarTooLarge"
  | "notesTooLong"
  | "dateInvalid"
  | "favoritesDuplicate"
  | "unknown";

/** Codes for success messages → Forms.success */
export type SuccessCode =
  | "checkEmail"
  | "resetEmailSent"
  | "passwordUpdated"
  | "profileSaved"
  | "diarySaved"
  | "favoritesSaved";

/** State returned by every form Server Action (used with React's useActionState). */
export type FormState<Field extends string = string> = {
  status: "idle" | "error" | "success";
  fieldErrors?: Partial<Record<Field, ErrorCode>>;
  formError?: ErrorCode;
  success?: SuccessCode;
  /** Submitted values echoed back so fields keep their content after an error. Never passwords. */
  values?: Partial<Record<Field, string>>;
};

export const initialFormState: FormState = { status: "idle" };

/** Converts Zod issues (whose messages are ErrorCodes) into one error per field. */
export function toFieldErrors<Field extends string>(
  error: z.ZodError,
): Partial<Record<Field, ErrorCode>> {
  const result: Partial<Record<Field, ErrorCode>> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "") as Field;
    if (field && !result[field]) result[field] = issue.message as ErrorCode;
  }
  return result;
}

/** Reads a text field from FormData ("" when missing or not text). */
export function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
