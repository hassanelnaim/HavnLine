"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentBusinessId } from "@/lib/supabase/business";
import { generateInstructions } from "@/lib/ai/generateInstructions";
import { provisionNumber, releaseNumber, createSubAccount } from "@/lib/integrations/telephony/twilioProvider";
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

/**
 * Blocks actions that cost real money (provisioning a real phone
 * number, etc.) from a business with no active or trialing
 * subscription. Without this, anyone could sign up and rack up real
 * Twilio charges against the platform without ever paying — the
 * subscription check on "turn AI online" alone doesn't prevent that,
 * since provisioning happens on a separate action.
 */
async function requireOperationalSubscription(businessId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("subscription_status")
    .eq("id", businessId)
    .single();

  const status = business?.subscription_status;
  const operational = status === "active" || status === "trialing" || status === "past_due";

  return operational
    ? null
    : "Start your free trial in Billing before setting up a phone number.";
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

export interface HoursInput {
  weekday: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

/**
 * Updates all 7 days of business hours in one save. Every business
 * already has 7 rows (one per weekday) from onboarding, so this is
 * always an update to existing rows, never a fresh insert.
 */
export async function updateBusinessHoursAction(hours: HoursInput[]): Promise<ActionResult> {
  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  const admin = createAdminClient();
  const rows = hours.map((h) => ({
    business_id: businessId,
    weekday: h.weekday,
    is_open: h.isOpen,
    open_time: h.isOpen ? h.openTime : null,
    close_time: h.isOpen ? h.closeTime : null,
  }));

  const { error } = await admin.from("business_hours").upsert(rows, { onConflict: "business_id,weekday" });
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/ai-employee");
  return { success: true };
}

export interface ProvisionResult extends ActionResult {
  phoneNumber?: string;
}

/**
 * Gets this business's existing Twilio sub-account, or creates one if
 * they don't have one yet. Every business gets exactly one — its own
 * isolated Twilio account, separate from every other business, even
 * though the actual bill still goes to your one master account.
 */
async function getOrCreateSubAccount(
  businessId: string,
  businessName: string
): Promise<{ accountSid: string; authToken: string } | { error: string }> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("integrations")
    .select("metadata")
    .eq("business_id", businessId)
    .eq("provider", "twilio")
    .maybeSingle();

  const meta = existing?.metadata as Record<string, unknown> | null;
  if (meta?.subaccount_sid && meta?.subaccount_auth_token) {
    return { accountSid: meta.subaccount_sid as string, authToken: meta.subaccount_auth_token as string };
  }

  const result = await createSubAccount(businessName);
  if (!result.success || !result.accountSid || !result.authToken) {
    return { error: result.reason || "Could not create a Twilio sub-account for this business." };
  }
  return { accountSid: result.accountSid, authToken: result.authToken };
}

export async function provisionPhoneNumberAction(areaCode?: string): Promise<ProvisionResult> {
  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  const subscriptionError = await requireOperationalSubscription(businessId);
  if (subscriptionError) return { success: false, error: subscriptionError };

  const admin = createAdminClient();
  const { data: business } = await admin.from("businesses").select("name").eq("id", businessId).single();

  const subAccount = await getOrCreateSubAccount(businessId, business?.name || "Business");
  if ("error" in subAccount) {
    return { success: false, error: subAccount.error };
  }

  const result = await provisionNumber(
    { accountSid: subAccount.accountSid, authToken: subAccount.authToken },
    areaCode
  );
  if (!result.success || !result.phoneNumber) {
    return { success: false, error: result.reason || "Could not provision a number." };
  }

  await admin.from("integrations").upsert(
    {
      business_id: businessId,
      provider: "twilio",
      status: "connected",
      connected_at: new Date().toISOString(),
      metadata: {
        phone_number: result.phoneNumber,
        subaccount_sid: subAccount.accountSid,
        subaccount_auth_token: subAccount.authToken,
      },
    },
    { onConflict: "business_id,provider" }
  );

  revalidatePath("/dashboard/integrations");
  revalidatePath("/dashboard/settings");
  return { success: true, phoneNumber: result.phoneNumber };
}

/**
 * Releases the business's current HavnLine number and provisions a new
 * one, ideally in the requested area code. Use this to fix a wrong
 * area code from a prior provisioning attempt. Keeps the same
 * sub-account — only the number itself changes.
 */
export async function changePhoneNumberAction(areaCode?: string): Promise<ProvisionResult> {
  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  const subscriptionError = await requireOperationalSubscription(businessId);
  if (subscriptionError) return { success: false, error: subscriptionError };

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("integrations")
    .select("metadata")
    .eq("business_id", businessId)
    .eq("provider", "twilio")
    .maybeSingle();

  const meta = existing?.metadata as Record<string, unknown> | null;
  const currentNumber = meta?.phone_number as string | undefined;
  const subAccountSid = meta?.subaccount_sid as string | undefined;
  const subAccountAuthToken = meta?.subaccount_auth_token as string | undefined;

  // Release the old number first. If it was provisioned before
  // sub-accounts existed, it still lives on the shared master account —
  // release it from there (null = master). Either way, we then create
  // (or reuse) this business's own sub-account for the NEW number, so
  // every business ends up properly isolated going forward.
  if (currentNumber) {
    const releaseCreds = subAccountSid && subAccountAuthToken ? { accountSid: subAccountSid, authToken: subAccountAuthToken } : null;
    await releaseNumber(releaseCreds, currentNumber);
  }

  const { data: business } = await admin.from("businesses").select("name").eq("id", businessId).single();
  const subAccount = await getOrCreateSubAccount(businessId, business?.name || "Business");
  if ("error" in subAccount) {
    return { success: false, error: subAccount.error };
  }

  const result = await provisionNumber(
    { accountSid: subAccount.accountSid, authToken: subAccount.authToken },
    areaCode
  );
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
      metadata: {
        phone_number: result.phoneNumber,
        subaccount_sid: subAccount.accountSid,
        subaccount_auth_token: subAccount.authToken,
      },
    },
    { onConflict: "business_id,provider" }
  );

  revalidatePath("/dashboard/integrations");
  revalidatePath("/dashboard/settings");
  return { success: true, phoneNumber: result.phoneNumber };
}
