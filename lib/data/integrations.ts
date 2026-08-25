import type { DbIntegration, IntegrationProvider } from "@/lib/database/types";
import { mockIntegrations } from "@/lib/mock/data";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/supabase/business";

const ALL_PROVIDERS: IntegrationProvider[] = [
  "google_calendar",
  "icloud_calendar",
  "twilio",
  "sms",
  "voice_provider",
];

// Only Microsoft Outlook is genuinely unbuilt right now. SMS rides on
// whatever Twilio number is provisioned (no separate connection step),
// and voice selection is already built into the AI Employee page — 
// neither of those actually needs a "coming soon" state.
// Nothing is in "coming soon" state right now — every listed provider
// is either fully built or (SMS/Voice) automatically available.
const COMING_SOON: IntegrationProvider[] = [];

function defaultRow(businessId: string, provider: IntegrationProvider): DbIntegration {
  return {
    id: `default_${provider}`,
    business_id: businessId,
    provider,
    status: COMING_SOON.includes(provider) ? "coming_soon" : "not_connected",
    external_account_id: null,
    connected_at: null,
    metadata: null,
  };
}

export async function getIntegrations(): Promise<DbIntegration[]> {
  const businessId = await getCurrentBusinessId();
  if (!businessId) return mockIntegrations;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("business_id", businessId);

  const existing = error || !data ? [] : data;

  // Fill in any providers that don't have a row yet (e.g. the business
  // never touched the calendar step in onboarding) with sensible defaults
  // so the Integrations page always shows all five cards.
  const rows = ALL_PROVIDERS.map(
    (provider) => existing.find((i) => i.provider === provider) || defaultRow(businessId, provider)
  );

  // SMS isn't its own connection — it automatically works once a Twilio
  // number exists, since confirmations are sent from that same number.
  const twilioRow = rows.find((r) => r.provider === "twilio");
  const smsRow = rows.find((r) => r.provider === "sms");
  if (smsRow) {
    smsRow.status = twilioRow?.status === "connected" ? "connected" : "not_connected";
  }

  // Voice selection is always available — it's built into AI Employee,
  // not a separate service to connect.
  const voiceRow = rows.find((r) => r.provider === "voice_provider");
  if (voiceRow) {
    voiceRow.status = "connected";
  }

  return rows;
}
