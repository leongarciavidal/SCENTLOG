import { z } from "zod";

export const listSchema = z.object({
  title: z.string().trim().min(1, { error: "required" }).max(120, { error: "titleTooLong" }),
  description: z
    .string()
    .trim()
    .max(2000, { error: "descriptionTooLong" })
    .transform((value) => (value === "" ? null : value)),
  is_public: z.boolean(),
  is_ranked: z.boolean(),
});
