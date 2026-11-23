"use client";

import { createBrowserClient } from "@supabase/ssr";

import { requireSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Supabase client for Client Components (runs in the browser).
 * Uses only the publishable key; Row Level Security protects the data.
 */
export function createClient() {
  const { url, publishableKey } = requireSupabaseConfig();
  return createBrowserClient<Database>(url, publishableKey);
}
