import { createAdminClient } from "@/lib/supabase/admin";
import type {
  DbAiReceptionist,
  DbAiVoiceConfig,
  DbBusiness,
  DbBusinessHours,
  DbKnowledgeItem,
  DbService,
} from "@/lib/database/types";

/**
 * context.ts
 *
 * The ONE place that assembles everything Claude needs to know about a
 * business. Every AI entry point (Test Receptionist, phone calls) calls
 * loadBusinessContext(businessId) and nothing else — there is no
 * hardcoded business data anywhere in the AI layer.
 *
 * Uses the admin client because this runs in webhook/server contexts
 * (an inbound Twilio call, for instance) where there is no browser
 * session cookie to authenticate with — the businessId itself is
 * resolved from a trusted source before this is called (the phone
 * number that was dialed, or the logged-in owner's own business for
 * Test Receptionist), never taken from unverified client input.
 */

export interface BusinessContext {
  business: DbBusiness;
  hours: DbBusinessHours[];
  services: DbService[];
  ai: DbAiReceptionist;
  voice: DbAiVoiceConfig | null;
  knowledge: DbKnowledgeItem[];
}

export async function loadBusinessContext(businessId: string): Promise<BusinessContext | null> {
  const admin = createAdminClient();

  const [businessRes, hoursRes, servicesRes, aiRes, voiceRes, knowledgeRes] = await Promise.all([
    admin.from("businesses").select("*").eq("id", businessId).single(),
    admin.from("business_hours").select("*").eq("business_id", businessId),
    admin.from("services").select("*").eq("business_id", businessId).eq("is_active", true),
    admin.from("ai_receptionists").select("*").eq("business_id", businessId).single(),
    admin.from("ai_voice_configs").select("*").eq("business_id", businessId).maybeSingle(),
    admin.from("knowledge_items").select("*").eq("business_id", businessId),
  ]);

  if (businessRes.error || !businessRes.data) return null;
  if (aiRes.error || !aiRes.data) return null;

  return {
    business: businessRes.data,
    hours: hoursRes.data || [],
    services: servicesRes.data || [],
    ai: aiRes.data,
    voice: voiceRes.data || null,
    knowledge: knowledgeRes.data || [],
  };
}

/**
 * Resolves which business a Twilio call belongs to, based on the phone
 * number that was dialed (the GetMade number assigned to that
 * business). This is the trusted resolution path for inbound calls —
 * never trust a business_id sent in a request body for anything
 * call-related.
 */
export async function resolveBusinessIdFromPhoneNumber(dialedNumber: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("integrations")
    .select("business_id, metadata")
    .eq("provider", "twilio")
    .eq("status", "connected");

  if (error || !data) return null;

  const match = data.find((row) => {
    const meta = row.metadata as Record<string, unknown> | null;
    return meta && meta.phone_number === dialedNumber;
  });

  return match ? (match.business_id as string) : null;
}
