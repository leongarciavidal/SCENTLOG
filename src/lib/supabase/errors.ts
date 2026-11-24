import type { PostgrestError } from "@supabase/supabase-js";

/** True when the database rejected a write because of a per-user rate limit. */
export function isRateLimited(error: PostgrestError | null | undefined) {
  return Boolean(error && error.code === "P0001" && error.message.includes("rate limit"));
}
