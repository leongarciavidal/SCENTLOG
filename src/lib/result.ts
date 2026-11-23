/**
 * Result of a data query that may run before Supabase is configured.
 * Pages render a helpful state for each case instead of crashing.
 */
export type QueryResult<T> =
  { status: "ok"; data: T } | { status: "unconfigured" } | { status: "error"; message: string };
