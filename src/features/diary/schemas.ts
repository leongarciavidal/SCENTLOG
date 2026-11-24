import { z } from "zod";

export const DIARY_STATUSES = ["owned", "tested", "wishlist", "finished"] as const;
export type DiaryStatus = (typeof DIARY_STATUSES)[number];

/** "" → null; otherwise 0–5 in steps of 0.5 (same rule as the database). */
const rating = z
  .string()
  .transform((value) => (value === "" ? null : Number(value)))
  .refine((value) => value === null || (value >= 0 && value <= 5 && Number.isInteger(value * 2)), {
    error: "unknown",
  });

/** A date that is not in the future (one day of margin for time zones). */
const addedOn = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "dateInvalid" })
  .refine(
    (value) => {
      const date = new Date(`${value}T00:00:00Z`);
      const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
      return (
        !Number.isNaN(date.getTime()) && date.getTime() <= tomorrow && date.getUTCFullYear() >= 1900
      );
    },
    { error: "dateInvalid" },
  );

export const diaryEntrySchema = z.object({
  status: z.enum(DIARY_STATUSES, { error: "required" }),
  rating,
  notes: z
    .string()
    .trim()
    .max(2000, { error: "notesTooLong" })
    .transform((value) => (value === "" ? null : value)),
  is_private: z.boolean(),
  added_on: addedOn,
});

export type DiaryEntryInput = z.infer<typeof diaryEntrySchema>;
