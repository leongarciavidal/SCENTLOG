import { z } from "zod";

export const SORT_OPTIONS = ["popular", "rating", "newest", "az"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const CONCENTRATIONS = ["edc", "edt", "edp", "parfum", "extrait", "other"] as const;

const slug = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  .max(120);

/** Values that are invalid are simply ignored rather than causing an error page. */
const catalogueSchema = z.object({
  q: z.string().trim().max(100).catch(""),
  family: slug.optional().catch(undefined),
  brand: slug.optional().catch(undefined),
  note: slug.optional().catch(undefined),
  concentration: z.enum(CONCENTRATIONS).optional().catch(undefined),
  sort: z.enum(SORT_OPTIONS).catch("popular"),
  page: z.coerce.number().int().min(1).max(1000).catch(1),
});

export type CatalogueParams = z.infer<typeof catalogueSchema>;

export function parseCatalogueParams(raw: Record<string, string | string[] | undefined>) {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  return catalogueSchema.parse({
    q: first(raw.q) ?? "",
    family: first(raw.family) || undefined,
    brand: first(raw.brand) || undefined,
    note: first(raw.note) || undefined,
    concentration: first(raw.concentration) || undefined,
    sort: first(raw.sort) ?? "popular",
    page: first(raw.page) ?? 1,
  });
}

/** Builds a catalogue URL query string, dropping empty and default values. */
export function catalogueQuery(params: Partial<CatalogueParams>): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.family) search.set("family", params.family);
  if (params.brand) search.set("brand", params.brand);
  if (params.note) search.set("note", params.note);
  if (params.concentration) search.set("concentration", params.concentration);
  if (params.sort && params.sort !== "popular") search.set("sort", params.sort);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const value = search.toString();
  return value ? `?${value}` : "";
}

/** Same normalisation as public.normalize_search() in the database. */
export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
