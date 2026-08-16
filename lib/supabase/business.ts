import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Returns the business_id of the currently logged-in user, or null if:
 *  - Supabase isn't configured (demo mode), or
 *  - there's no logged-in user, or
 *  - the user hasn't finished onboarding (no business_members row yet).
 *
 * Every data-access function in lib/data/*.ts calls this first. When it
 * returns null, they fall back to the mock data layer — this is what
 * lets the app run in full demo mode with zero configuration, and
 * switch to real per-business data the moment Supabase is connected.
 */
export async function getCurrentBusinessId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.business_id;
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
