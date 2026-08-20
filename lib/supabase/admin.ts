import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin (service role) Supabase client — SERVER-ONLY, never import this
 * from a Client Component or expose SUPABASE_SERVICE_ROLE_KEY with the
 * NEXT_PUBLIC_ prefix.
 *
 * This bypasses Row Level Security entirely. It exists for exactly one
 * purpose: server actions that have already verified the caller's
 * identity via the normal cookie-based Supabase Auth session (see
 * lib/supabase/server.ts's createClient().auth.getUser()), and now need
 * to perform a multi-table write on that verified user's behalf.
 *
 * Using this instead of the anon-key + RLS path for those specific
 * writes avoids depending on the browser's session cookie being present
 * and correctly parsed on every single write in the same request — a
 * verified identity check up front is enough, and the RLS policies on
 * every table still apply normally for every other read/write in the
 * app (dashboard pages, etc.), which continue to use the regular
 * cookie-based client in lib/supabase/server.ts.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (and NEXT_PUBLIC_SUPABASE_URL) must be set to use the admin client."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
