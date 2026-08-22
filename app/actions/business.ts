"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentBusinessId } from "@/lib/supabase/business";
import { generateInstructions } from "@/lib/ai/generateInstructions";
import { provisionNumber, releaseNumber } from "@/lib/integrations/telephony/twilioProvider";
import type { AiResponsibilities, Personality, VoiceId } from "@/lib/database/types";

async function requireBusinessId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const businessId = await getCurrentBusinessId();
  if (!businessId) throw new Error("No business found for this account.");
  return businessId;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function updateAiEmployeeAction(input: {
  name: string;
  personality: Personality;
  responsibilities: AiResponsibilities;
  voiceId: VoiceId;
  bookingRules: string;
  escalationRules: string;
  customVoice?: { providerVoiceRef: string; providerVoiceName: string } | null;
}): Promise<ActionResult> {
  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  const admin = createAdminClient();

  const [{ data: business }, { data: hours }, { data: services }] = await Promise.all([
    admin.from("businesses").select("*").eq("id", businessId).single(),
    admin.from("business_hours").select("*").eq("business_id", businessId),
    admin.from("services").select("*").eq("business_id", businessId),
  ]);

  const generatedInstructions = generateInstructions({
    business: { name: business?.name || "", description: business?.description || "" },
    receptionistName: input.name,
    personality: input.personality,
    responsibilities: input.responsibilities,
    services: (services || []).map((s) => ({
      name: s.name,
      price_cents: s.price_cents,
      duration_minutes: s.duration_minutes,
    })),
    hours: (hours || []).map((h) => ({
      weekday: h.weekday,
      is_open: h.is_open,
      open_time: h.open_time,
      close_time: h.close_time,
    })),
    bookingRules: input.bookingRules,
    escalationRules: input.escalationRules,
  });

  const { error: aiError } = await admin
    .from("ai_receptionists")
    .update({
      name: input.name,
      personality: input.personality,
      responsibilities: input.responsibilities,
      booking_rules: input.bookingRules || null,
      escalation_rules: input.escalationRules || null,
      generated_instructions: generatedInstructions,
    })
    .eq("business_id", businessId);
  if (aiError) return { success: false, error: aiError.message };

  const { error: voiceError } = await admin.from("ai_voice_configs").upsert(
    input.customVoice
      ? {
          business_id: businessId,
          voice_id: "custom",
          provider: "elevenlabs",
          provider_voice_ref: input.customVoice.providerVoiceRef,
          provider_voice_name: input.customVoice.providerVoiceName,
        }
      : {
          business_id: businessId,
          voice_id: input.voiceId,
          provider: null,
          provider_voice_ref: null,
          provider_voice_name: null,
        },
    { onConflict: "business_id" }
  );
  if (voiceError) return { success: false, error: voiceError.message };

  revalidatePath("/dashboard/ai-employee");
  return { success: true };
}

export async function toggleAiStatusAction(online: boolean): Promise<ActionResult> {
  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  const admin = createAdminClient();

  // The backend, not the frontend, decides whether a business is
  // actually allowed to go live — a business with no active
  // subscription can't turn its receptionist on no matter what the UI
  // shows. Turning OFF is always allowed (e.g. to stop billing usage
  // or pause during a payment issue).
  if (online) {
    const { data: business } = await admin
      .from("businesses")
      .select("subscription_status")
      .eq("id", businessId)
      .single();

    const status = business?.subscription_status;
    const operational = status === "active" || status === "trialing" || status === "past_due";
    // past_due still gets a grace period rather than an abrupt cutoff —
    // see billing enforcement note in lib/billing/stripe.ts.

    if (!operational) {
      return {
        success: false,
        error:
          status === "canceled"
            ? "Your subscription has ended — resubscribe in Billing to turn your receptionist back on."
            : "Subscribe in Billing to turn your receptionist on.",
      };
    }
  }

  const { error } = await admin
    .from("ai_receptionists")
    .update({ status: online ? "online" : "offline" })
    .eq("business_id", businessId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateBusinessProfileAction(input: {
  name: string;
  description: string;
  address: string;
  phone: string;
}): Promise<ActionResult> {
  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("businesses")
    .update({
      name: input.name,
      description: input.description || null,
      address: input.address || null,
      phone: input.phone || null,
    })
    .eq("id", businessId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export interface ProvisionResult extends ActionResult {
  phoneNumber?: string;
}

export async function provisionPhoneNumberAction(areaCode?: string): Promise<ProvisionResult> {
  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  const result = await provisionNumber(areaCode);
  if (!result.success || !result.phoneNumber) {
    return { success: false, error: result.reason || "Could not provision a number." };
  }

  const admin = createAdminClient();
  await admin.from("integrations").upsert(
    {
      business_id: businessId,
      provider: "twilio",
      status: "connected",
      connected_at: new Date().toISOString(),
      metadata: { phone_number: result.phoneNumber },
    },
    { onConflict: "business_id,provider" }
  );

  revalidatePath("/dashboard/integrations");
  revalidatePath("/dashboard/settings");
  return { success: true, phoneNumber: result.phoneNumber };
}

/**
 * Releases the business's current GetMade number and provisions a new
 * one, ideally in the requested area code. Use this to fix a wrong
 * area code from a prior provisioning attempt.
 */
export async function changePhoneNumberAction(areaCode?: string): Promise<ProvisionResult> {
  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("integrations")
    .select("metadata")
    .eq("business_id", businessId)
    .eq("provider", "twilio")
    .maybeSingle();

  const currentNumber = (existing?.metadata as Record<string, unknown> | null)?.phone_number as
    | string
    | undefined;

  if (currentNumber) {
    await releaseNumber(currentNumber);
  }

  const result = await provisionNumber(areaCode);
  if (!result.success || !result.phoneNumber) {
    // Old number is already released at this point — clear the row so the
    // UI doesn't show a stale "connected" state for a number that's gone.
    await admin
      .from("integrations")
      .update({ status: "not_connected", metadata: null })
      .eq("business_id", businessId)
      .eq("provider", "twilio");
    revalidatePath("/dashboard/integrations");
    return { success: false, error: result.reason || "Could not provision a new number." };
  }

  await admin.from("integrations").upsert(
    {
      business_id: businessId,
      provider: "twilio",
      status: "connected",
      connected_at: new Date().toISOString(),
      metadata: { phone_number: result.phoneNumber },
    },
    { onConflict: "business_id,provider" }
  );

  revalidatePath("/dashboard/integrations");
  revalidatePath("/dashboard/settings");
  return { success: true, phoneNumber: result.phoneNumber };
}
