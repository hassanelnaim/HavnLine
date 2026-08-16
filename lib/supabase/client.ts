import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Safe to use in Client Components.
 * Reads NEXT_PUBLIC_* env vars, which are safe to expose to the browser
 * (the anon key is designed for this — Row Level Security is what
 * actually protects the data, see lib/database/schema.sql).
 *
 * Note: not parameterized with the Database generic. Our own types in
 * lib/database/types.ts document the schema and type every function in
 * lib/data/*.ts, but strict end-to-end inference through supabase-js's
 * query builder needs types generated directly from a live project
 * (`supabase gen types typescript`) — swap that in once Supabase is
 * connected for full compile-time safety on every query.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
