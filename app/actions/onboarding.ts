"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { generateInstructions } from "@/lib/ai/generateInstructions";
import type { OnboardingDraft } from "@/lib/onboarding/context";

export interface CompleteOnboardingResult {
  success: boolean;
  error?: string;
  demoMode?: boolean;
}

/**
 * Persists the entire onboarding draft: creates the business, marks the
 * current user as its owner, and writes hours/services/AI config/voice.
 * Called once, from the final "Go live" step.
 *
 * In demo mode (no Supabase configured) this is a no-op that just tells
 * the caller to proceed — nothing is saved, matching the rest of the
 * app's mock-data behavior.
 */
export async function completeOnboardingAction(
  draft: OnboardingDraft
): Promise<CompleteOnboardingResult> {
  if (!isSupabaseConfigured()) {
    return { success: true, demoMode: true };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You need to be logged in to finish setup." };
  }

  if (!draft.businessName.trim()) {
    return { success: false, error: "Business name is required." };
  }

  // 1. Create the business.
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .insert({
      name: draft.businessName,
      business_type: draft.businessType || null,
      address: draft.address || null,
      phone: draft.phone || null,
      website: draft.website || null,
      description: draft.description || null,
      onboarding_step: "complete",
      onboarding_completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (businessError || !business) {
    return { success: false, error: businessError?.message || "Could not create business." };
  }

  const businessId = business.id as string;

  // 2. Make the current user the owner.
  const { error: memberError } = await supabase.from("business_members").insert({
    business_id: businessId,
    user_id: user.id,
    role: "owner",
  });
  if (memberError) {
    return { success: false, error: memberError.message };
  }

  // 3. Business hours.
  const hoursRows = draft.hours.map((h) => ({
    business_id: businessId,
    weekday: h.weekday,
    is_open: h.isOpen,
    open_time: h.isOpen ? h.openTime : null,
    close_time: h.isOpen ? h.closeTime : null,
  }));
  const { error: hoursError } = await supabase.from("business_hours").insert(hoursRows);
  if (hoursError) {
    return { success: false, error: hoursError.message };
  }

  // 4. Services.
  if (draft.services.length > 0) {
    const serviceRows = draft.services
      .filter((s) => s.name.trim())
      .map((s) => ({
        business_id: businessId,
        name: s.name,
        description: s.description || null,
        price_cents: Math.round((parseFloat(s.price) || 0) * 100),
        duration_minutes: s.durationMinutes,
      }));
    if (serviceRows.length > 0) {
      const { error: servicesError } = await supabase.from("services").insert(serviceRows);
      if (servicesError) {
        return { success: false, error: servicesError.message };
      }
    }
  }

  // 5. AI receptionist — instructions are generated now, from the same
  //    data just saved, and stored alongside the toggle config.
  const generatedInstructions = generateInstructions({
    business: { name: draft.businessName, description: draft.description },
    receptionistName: draft.receptionistName,
    personality: draft.personality,
    responsibilities: draft.responsibilities,
    services: draft.services
      .filter((s) => s.name.trim())
      .map((s) => ({
        name: s.name,
        price_cents: Math.round((parseFloat(s.price) || 0) * 100),
        duration_minutes: s.durationMinutes,
      })),
    hours: draft.hours.map((h) => ({
      weekday: h.weekday,
      is_open: h.isOpen,
      open_time: h.isOpen ? h.openTime : null,
      close_time: h.isOpen ? h.closeTime : null,
    })),
  });

  const { error: aiError } = await supabase.from("ai_receptionists").insert({
    business_id: businessId,
    name: draft.receptionistName || "Alex",
    personality: draft.personality,
    responsibilities: draft.responsibilities,
    status: "offline",
    generated_instructions: generatedInstructions,
  });
  if (aiError) {
    return { success: false, error: aiError.message };
  }

  // 6. Voice config.
  const { error: voiceError } = await supabase.from("ai_voice_configs").insert({
    business_id: businessId,
    voice_id: draft.voiceId,
  });
  if (voiceError) {
    return { success: false, error: voiceError.message };
  }

  // 7. Calendar integration intent (not actually connected yet).
  if (draft.calendarProvider) {
    await supabase.from("integrations").insert({
      business_id: businessId,
      provider: draft.calendarProvider,
      status: "not_connected",
    });
  }

  return { success: true };
}

export async function goToDashboardAction() {
  redirect("/dashboard");
}
