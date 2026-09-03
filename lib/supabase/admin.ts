import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin (service role) Supabase client — SERVER-ONLY. Bypasses RLS.
 * Used for server actions that have already verified the caller's
 * identity via the normal cookie-based session, and now need to
 * perform writes/reads on that verified user's behalf.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY (and NEXT_PUBLIC_SUPABASE_URL) must be set to use the admin client.");
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
