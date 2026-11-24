import { z } from "zod";

export const REVIEW_DIMENSIONS = [
  "longevity",
  "projection",
  "sillage",
  "versatility",
  "value",
] as const;
export type ReviewDimension = (typeof REVIEW_DIMENSIONS)[number];

/** "" → null, otherwise an integer from 1 to 5. */
const dimension = z
  .string()
  .transform((value) => (value === "" ? null : Number(value)))
  .refine((value) => value === null || (Number.isInteger(value) && value >= 1 && value <= 5), {
    error: "unknown",
  });

export const reviewSchema = z.object({
  body: z.string().trim().min(1, { error: "required" }).max(10000, { error: "reviewTooLong" }),
  longevity: dimension,
  projection: dimension,
  sillage: dimension,
  versatility: dimension,
  value: dimension,
});

export const commentSchema = z.object({
  body: z.string().trim().min(1, { error: "required" }).max(2000, { error: "commentTooLong" }),
});
