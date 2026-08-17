"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInstructions } from "@/lib/ai/generateInstructions";
import type { OnboardingDraft } from "@/lib/onboarding/context";

export interface CompleteOnboardingResult {
  success: boolean;
  error?: string;
  demoMode?: boolean;
}

export async function completeOnboardingAction(
  draft: OnboardingDraft
): Promise<CompleteOnboardingResult> {
  if (!isSupabaseConfigured()) {
    return { success: true, demoMode: true };
  }

  const authClient = createClient();
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "You need to be logged in to finish setup." };
  }

  if (!draft.businessName.trim()) {
    return { success: false, error: "Business name is required." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return {
      success: false,
      error:
        "Server isn't fully configured yet (missing SUPABASE_SERVICE_ROLE_KEY). Add it in your hosting provider's environment variables and redeploy.",
    };
  }

  const { data: business, error: businessError } = await admin
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

  await admin.from("users").upsert(
    { id: user.id, email: user.email || "" },
    { onConflict: "id" }
  );

  const { error: memberError } = await admin.from("business_members").insert({
    business_id: businessId,
    user_id: user.id,
    role: "owner",
  });
  if (memberError) {
    return { success: false, error: memberError.message };
  }

  const hoursRows = draft.hours.map((h) => ({
    business_id: businessId,
    weekday: h.weekday,
    is_open: h.isOpen,
    open_time: h.isOpen ? h.openTime : null,
    close_time: h.isOpen ? h.closeTime : null,
  }));
  const { error: hoursError } = await admin.from("business_hours").insert(hoursRows);
  if (hoursError) {
    return { success: false, error: hoursError.message };
  }

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
      const { error: servicesError } = await admin.from("services").insert(serviceRows);
      if (servicesError) {
        return { success: false, error: servicesError.message };
      }
    }
  }

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

  const { error: aiError } = await admin.from("ai_receptionists").insert({
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

  const { error: voiceError } = await admin.from("ai_voice_configs").insert({
    business_id: businessId,
    voice_id: draft.voiceId,
  });
  if (voiceError) {
    return { success: false, error: voiceError.message };
  }

  if (draft.calendarProvider) {
    await admin.from("integrations").insert({
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