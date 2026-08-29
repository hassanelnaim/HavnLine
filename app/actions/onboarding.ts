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

/**
 * Finishes onboarding: updates the business record that was already
 * created back on step 1 (see app/actions/business-draft.ts) with
 * everything collected since, and writes hours/services/AI
 * config/voice. Called once, from the final "Go live" step.
 *
 * Creating the business early (rather than one big insert at the very
 * end, like earlier versions of this flow) is what makes real Google
 * Calendar OAuth and the iCloud connect form usable DURING onboarding
 * — both require a real business_id to attach to, which didn't exist
 * yet under the old all-at-the-end design.
 *
 * Falls back to creating the business here if, for any reason, it
 * wasn't already created (e.g. draft.businessId is missing) — this
 * keeps the flow working even if someone reached this step in an
 * unexpected way.
 */
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

  let businessId = draft.businessId;

  if (businessId) {
    // Normal path: business already exists from step 1 — update it
    // with everything collected since (including website, which
    // moved to the services step).
    const { error: updateError } = await admin
      .from("businesses")
      .update({
        name: draft.businessName,
        business_type: draft.businessType || null,
        address: draft.address || null,
        phone: draft.phone || null,
        website: draft.website || null,
        description: draft.description || null,
        onboarding_step: "complete",
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", businessId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }
  } else {
    // Fallback path: no business created yet for some reason — create
    // it now, same as the original all-at-once flow.
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
    businessId = business.id as string;

    await admin.from("users").upsert({ id: user.id, email: user.email || "" }, { onConflict: "id" });

    const { error: memberError } = await admin.from("business_members").insert({
      business_id: businessId,
      user_id: user.id,
      role: "owner",
    });
    if (memberError) {
      return { success: false, error: memberError.message };
    }
  }

  // Business hours.
  const hoursRows = draft.hours.map((h) => ({
    business_id: businessId,
    weekday: h.weekday,
    is_open: h.isOpen,
    open_time: h.isOpen ? h.openTime : null,
    close_time: h.isOpen ? h.closeTime : null,
  }));
  const { error: hoursError } = await admin
    .from("business_hours")
    .upsert(hoursRows, { onConflict: "business_id,weekday" });
  if (hoursError) {
    return { success: false, error: hoursError.message };
  }

  // Services.
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

  // AI receptionist — instructions are generated now, from the same
  // data just saved, and stored alongside the toggle config. Name and
  // personality are no longer collected during onboarding — they
  // default here and stay fully editable afterward in AI Employee.
  const receptionistName = draft.receptionistName || "Alex";
  const personality = draft.personality || "professional";

  const generatedInstructions = generateInstructions({
    business: { name: draft.businessName, description: draft.description },
    receptionistName,
    personality,
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

  const { error: aiError } = await admin.from("ai_receptionists").upsert(
    {
      business_id: businessId,
      name: receptionistName,
      personality,
      responsibilities: draft.responsibilities,
      status: "offline",
      generated_instructions: generatedInstructions,
    },
    { onConflict: "business_id" }
  );
  if (aiError) {
    return { success: false, error: aiError.message };
  }

  // Voice config.
  const { error: voiceError } = await admin.from("ai_voice_configs").upsert(
    draft.customVoiceRef
      ? {
          business_id: businessId,
          voice_id: "custom",
          provider: "elevenlabs",
          provider_voice_ref: draft.customVoiceRef,
          provider_voice_name: draft.customVoiceName,
        }
      : {
          business_id: businessId,
          voice_id: draft.voiceId,
        },
    { onConflict: "business_id" }
  );
  if (voiceError) {
    return { success: false, error: voiceError.message };
  }

  return { success: true };
}

export async function goToDashboardAction() {
  redirect("/dashboard");
}
