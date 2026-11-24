import "server-only";

import { cache } from "react";

import { getSupabaseConfig } from "@/lib/env";
import type { QueryResult } from "@/lib/result";
import { createClient } from "@/lib/supabase/server";

import { normalizeSearch, type CatalogueParams } from "./search-params";

/** Columns needed to render a FragranceCard. */
export const FRAGRANCE_CARD_COLUMNS = `
  id, slug, name, concentration, release_year, image_url, rating_avg, rating_count,
  brand:brands!inner ( name, slug ),
  family:fragrance_families ( slug, name_en, name_es )
` as const;

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Base query for fragrance cards. Deliberately synchronous: Supabase query
 * builders are "thenable", so returning one from an async function would run
 * the query before filters could be added.
 */
function cards(supabase: ServerClient) {
  return supabase.from("fragrances").select(FRAGRANCE_CARD_COLUMNS, { count: "exact" });
}

export type FragranceCardData = NonNullable<Awaited<ReturnType<typeof cards>>["data"]>[number];

// ---------------------------------------------------------------------------
// Homepage
// ---------------------------------------------------------------------------

/** Fragrances for the homepage: most logged first, then best rated. */
export async function getFeaturedFragrances(
  limit = 9,
): Promise<QueryResult<{ items: FragranceCardData[]; total: number }>> {
  if (!getSupabaseConfig()) return { status: "unconfigured" };

  const { data, error, count } = await cards(await createClient())
    .order("diary_count", { ascending: false })
    .order("rating_avg", { ascending: false, nullsFirst: false })
    .order("release_year", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) return { status: "error", message: error.message };
  return { status: "ok", data: { items: data, total: count ?? data.length } };
}

// ---------------------------------------------------------------------------
// Catalogue search
// ---------------------------------------------------------------------------
export const CATALOGUE_PAGE_SIZE = 24;

/** Escapes LIKE wildcards so user input is matched literally. */
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export async function searchCatalogue(
  params: CatalogueParams,
): Promise<QueryResult<{ items: FragranceCardData[]; total: number; pageCount: number }>> {
  if (!getSupabaseConfig()) return { status: "unconfigured" };
  const supabase = await createClient();

  // Filters by slug are resolved to ids first (small lookups, all indexed).
  const [family, brand, noteIds] = await Promise.all([
    params.family
      ? supabase.from("fragrance_families").select("id").eq("slug", params.family).maybeSingle()
      : null,
    params.brand
      ? supabase.from("brands").select("id").eq("slug", params.brand).maybeSingle()
      : null,
    params.note ? fragranceIdsWithNote(params.note) : null,
  ]);

  const empty = { status: "ok" as const, data: { items: [], total: 0, pageCount: 0 } };
  if ((params.family && !family?.data) || (params.brand && !brand?.data)) return empty;
  if (noteIds && noteIds.length === 0) return empty;

  let query = cards(supabase);
  if (params.q) query = query.ilike("search_text", `%${escapeLike(normalizeSearch(params.q))}%`);
  if (family?.data) query = query.eq("family_id", family.data.id);
  if (brand?.data) query = query.eq("brand_id", brand.data.id);
  if (params.concentration) query = query.eq("concentration", params.concentration);
  if (noteIds) query = query.in("id", noteIds);

  switch (params.sort) {
    case "rating":
      query = query
        .order("rating_avg", { ascending: false, nullsFirst: false })
        .order("rating_count", { ascending: false });
      break;
    case "newest":
      query = query.order("release_year", { ascending: false, nullsFirst: false });
      break;
    case "az":
      query = query.order("name");
      break;
    default:
      query = query
        .order("diary_count", { ascending: false })
        .order("rating_avg", { ascending: false, nullsFirst: false });
  }
  // Stable tie-breaker so pagination never repeats or skips items.
  query = query.order("id");

  const from = (params.page - 1) * CATALOGUE_PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + CATALOGUE_PAGE_SIZE - 1);

  if (error) {
    // Asking for a page beyond the end returns an empty page, not an error.
    if (error.code === "PGRST103") return empty;
    return { status: "error", message: error.message };
  }
  const total = count ?? 0;
  return {
    status: "ok",
    data: { items: data, total, pageCount: Math.ceil(total / CATALOGUE_PAGE_SIZE) },
  };
}

async function fragranceIdsWithNote(noteSlug: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fragrance_notes")
    .select("fragrance_id, note:notes!inner ( slug )")
    .eq("note.slug", noteSlug);
  return [...new Set((data ?? []).map((row) => row.fragrance_id))];
}

/** Options for the catalogue filter selects. */
export const getCatalogueFilterOptions = cache(async () => {
  const supabase = await createClient();
  const [families, brands] = await Promise.all([
    supabase.from("fragrance_families").select("slug, name_en, name_es").order("name_en"),
    supabase.from("brands").select("slug, name").order("name"),
  ]);
  return { families: families.data ?? [], brands: brands.data ?? [] };
});

export const getNoteBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notes")
    .select("slug, name_en, name_es")
    .eq("slug", slug)
    .maybeSingle();
  return data;
});

// ---------------------------------------------------------------------------
// Fragrance detail
// ---------------------------------------------------------------------------
export const getFragranceBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fragrances")
    .select(
      `
      id, slug, name, concentration, release_year, image_url, image_credit,
      description_en, description_es, rating_avg, rating_count, review_count, diary_count,
      parent_id, brand_id,
      brand:brands!inner ( slug, name, country ),
      family:fragrance_families ( slug, name_en, name_es ),
      perfumers:fragrance_perfumers ( perfumer:perfumers ( slug, name ) ),
      notes:fragrance_notes ( layer, position, note:notes ( slug, name_en, name_es ) )
    `,
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
});

export type FragranceDetail = NonNullable<Awaited<ReturnType<typeof getFragranceBySlug>>>;

/**
 * Other concentrations / flankers of the same fragrance: its original
 * (parent), its siblings and its own children.
 */
export async function getRelatedEditions(fragrance: Pick<FragranceDetail, "id" | "parent_id">) {
  const rootId = fragrance.parent_id ?? fragrance.id;
  const { data } = await cards(await createClient())
    .or(`id.eq.${rootId},parent_id.eq.${rootId}`)
    .neq("id", fragrance.id)
    .order("release_year", { ascending: true, nullsFirst: false });
  return data ?? [];
}

export async function getMoreFromBrand(brandId: string, excludeIds: string[], limit = 4) {
  let query = cards(await createClient()).eq("brand_id", brandId);
  if (excludeIds.length > 0) query = query.not("id", "in", `(${excludeIds.join(",")})`);
  const { data } = await query
    .order("diary_count", { ascending: false })
    .order("release_year", { ascending: false, nullsFirst: false })
    .limit(limit);
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Brands & perfumers
// ---------------------------------------------------------------------------
export async function getBrandsWithCounts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .select("slug, name, country, fragrances ( count )")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((brand) => ({
    slug: brand.slug,
    name: brand.name,
    country: brand.country,
    count: brand.fragrances[0]?.count ?? 0,
  }));
}

export const getBrandBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id, slug, name, country, founded_year, website_url, description_en, description_es")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
});

export async function getBrandFragrances(brandId: string) {
  const { data } = await cards(await createClient())
    .eq("brand_id", brandId)
    .order("release_year", { ascending: false, nullsFirst: false })
    .order("name");
  return data ?? [];
}

export const getPerfumerBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("perfumers")
    .select("id, slug, name")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
});

export async function getPerfumerFragrances(perfumerId: string) {
  const supabase = await createClient();
  const { data: links } = await supabase
    .from("fragrance_perfumers")
    .select("fragrance_id")
    .eq("perfumer_id", perfumerId);
  const ids = (links ?? []).map((link) => link.fragrance_id);
  if (ids.length === 0) return [];
  const { data } = await cards(await createClient())
    .in("id", ids)
    .order("release_year", { ascending: false, nullsFirst: false });
  return data ?? [];
}
