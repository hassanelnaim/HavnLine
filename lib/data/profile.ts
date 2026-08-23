import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
}

/**
 * Loads the currently logged-in user's own profile — separate from
 * their business. Falls back to a clearly-labeled demo profile when
 * Supabase isn't configured, consistent with the rest of the app's
 * mock-data behavior.
 */
export async function getCurrentUserProfile(): Promise<UserProfile> {
  if (!isSupabaseConfigured()) {
    return { id: "demo", email: "demo@havnline.example", fullName: "Demo User" };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { id: "demo", email: "demo@havnline.example", fullName: "Demo User" };
  }

  const { data: profileRow } = await supabase.from("users").select("full_name").eq("id", user.id).maybeSingle();

  const fullName =
    profileRow?.full_name || (user.user_metadata?.full_name as string | undefined) || user.email?.split("@")[0] || "";

  return { id: user.id, email: user.email || "", fullName };
}
