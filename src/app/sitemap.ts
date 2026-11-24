import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { getSupabaseConfig, siteUrl } from "@/lib/env";
import type { Database } from "@/types/database";

// Regenerate at most once an hour.
export const revalidate = 3600;

function entry(
  path: string,
  lastModified?: string | null,
  priority = 0.5,
): MetadataRoute.Sitemap[number] {
  return {
    url: `${siteUrl}/${routing.defaultLocale}${path}`,
    lastModified: lastModified ? new Date(lastModified) : undefined,
    priority,
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, `${siteUrl}/${l}${path}`])),
    },
  };
}

/** Public pages only: catalogue, houses, perfumers, public lists and profiles. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = [
    entry("", null, 1),
    entry("/discover", null, 0.9),
    entry("/fragrances", null, 0.9),
    entry("/brands", null, 0.7),
    entry("/lists", null, 0.7),
    entry("/privacy", null, 0.1),
    entry("/terms", null, 0.1),
    entry("/cookies", null, 0.1),
  ];

  const config = getSupabaseConfig();
  if (!config) return pages;

  // Anonymous client (no cookies): only public data, exactly what search engines see.
  const supabase = createClient<Database>(config.url, config.publishableKey, {
    auth: { persistSession: false },
  });
  const [fragrances, brands, perfumers, lists, profiles] = await Promise.all([
    supabase.from("fragrances").select("slug, updated_at").limit(50000),
    supabase.from("brands").select("slug, updated_at").limit(10000),
    supabase.from("perfumers").select("slug").limit(10000),
    supabase
      .from("lists")
      .select("id, updated_at")
      .eq("is_public", true)
      .gt("item_count", 0)
      .limit(50000),
    supabase.from("profiles").select("username, updated_at").limit(50000),
  ]);

  return [
    ...pages,
    ...(fragrances.data ?? []).map((f) => entry(`/fragrances/${f.slug}`, f.updated_at, 0.8)),
    ...(brands.data ?? []).map((b) => entry(`/brands/${b.slug}`, b.updated_at, 0.6)),
    ...(perfumers.data ?? []).map((p) => entry(`/perfumers/${p.slug}`, null, 0.4)),
    ...(lists.data ?? []).map((l) => entry(`/lists/${l.id}`, l.updated_at, 0.5)),
    ...(profiles.data ?? []).map((p) => entry(`/${p.username}`, p.updated_at, 0.3)),
  ];
}
