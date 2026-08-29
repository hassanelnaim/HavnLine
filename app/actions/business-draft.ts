"use server";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CreateBusinessDraftResult {
  success: boolean;
  businessId?: string;
  error?: string;
  demoMode?: boolean;
}

/**
 * Creates the real business + owner membership record as soon as the
 * business owner finishes the very first onboarding step (name, type,
 * address, phone, description) — rather than waiting until the final
 * "complete" step to save everything at once.
 *
 * Why this matters: real Google Calendar OAuth (and the iCloud
 * connect form) both require a real business_id to attach the
 * connection to. Creating the business this early is what makes
 * "actually connect your calendar during setup" possible at all —
 * every later onboarding action calls back to the SAME row updated
 * mid-flow, not a step-6 update, then final one insert.
 */
export async function createBusinessDraftAction(input: {
  businessName: string;
  businessType: string;
  address: string;
  phone: string;
  description: string;
}): Promise<CreateBusinessDraftResult> {
  if (!isSupabaseConfigured()) {
    return { success: true, demoMode: true };
  }

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "You need to be logged in." };
  }

  if (!input.businessName.trim()) {
    return { success: false, error: "Business name is required." };
  }

  const admin = createAdminClient();

  const { data: business, error: businessError } = await admin
    .from("businesses")
    .insert({
      name: input.businessName,
      business_type: input.businessType || null,
      address: input.address || null,
      phone: input.phone || null,
      description: input.description || null,
      onboarding_step: "hours",
    })
    .select()
    .single();

  if (businessError || !business) {
    return { success: false, error: businessError?.message || "Could not create business." };
  }

  await admin.from("users").upsert({ id: user.id, email: user.email || "" }, { onConflict: "id" });

  const { error: memberError } = await admin.from("business_members").insert({
    business_id: business.id,
    user_id: user.id,
    role: "owner",
  });
  if (memberError) {
    return { success: false, error: memberError.message };
  }

  return { success: true, businessId: business.id };
}
