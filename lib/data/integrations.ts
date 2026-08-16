import type { DbIntegration, IntegrationProvider } from "@/lib/database/types";
import { mockIntegrations } from "@/lib/mock/data";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/supabase/business";

const ALL_PROVIDERS: IntegrationProvider[] = [
  "google_calendar",
  "microsoft_outlook",
  "twilio",
  "sms",
  "voice_provider",
];

const COMING_SOON: IntegrationProvider[] = ["twilio", "sms", "voice_provider"];

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
  return ALL_PROVIDERS.map(
    (provider) => existing.find((i) => i.provider === provider) || defaultRow(businessId, provider)
  );
}
