import { z } from "zod";

import { usernameSchema } from "@/features/auth/schemas";
import { routing } from "@/i18n/routing";

/** Empty strings become null so optional fields can be cleared. */
const optionalText = (max: number, code: "displayNameTooLong" | "bioTooLong") =>
  z
    .string()
    .trim()
    .max(max, { error: code })
    .transform((value) => (value === "" ? null : value));

export const profileSchema = z.object({
  username: usernameSchema,
  display_name: optionalText(60, "displayNameTooLong"),
  bio: optionalText(500, "bioTooLong"),
  locale: z.enum(routing.locales, { error: "required" }),
});

export const AVATAR_MAX_BYTES = 1024 * 1024; // after client-side resizing (~50 KB typical)
export const AVATAR_MIME_TYPES = ["image/webp", "image/jpeg", "image/png"] as const;
