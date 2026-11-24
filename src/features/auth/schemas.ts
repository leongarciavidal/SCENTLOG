import { z } from "zod";

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  RESERVED_USERNAMES,
  USERNAME_PATTERN,
} from "./constants";

// Error messages are ErrorCodes (see src/lib/forms.ts), translated in the UI.

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, { error: "required" })
  .regex(USERNAME_PATTERN, { error: "usernameFormat" })
  .refine((value) => !RESERVED_USERNAMES.has(value), { error: "usernameReserved" });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, { error: "required" })
  .pipe(z.email({ error: "emailInvalid" }));

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, { error: "passwordTooShort" })
  .max(PASSWORD_MAX_LENGTH, { error: "passwordTooLong" });

export const signUpSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "required" }),
});

export const requestResetSchema = z.object({ email: emailSchema });

export const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, { error: "required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "passwordMismatch",
    path: ["confirmPassword"],
  });
