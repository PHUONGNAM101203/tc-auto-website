"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requirePublicEnv } from "./env";

let cached: SupabaseClient | null = null;

/** Singleton client cho phia browser (dung trong form dang nhap admin). */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!cached) {
    const { url, anonKey } = requirePublicEnv();
    cached = createBrowserClient(url, anonKey);
  }
  return cached;
}
