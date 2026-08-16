import type { DbAiReceptionist, DbAiVoiceConfig } from "@/lib/database/types";
import { mockAiReceptionist, mockVoiceConfig } from "@/lib/mock/data";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/supabase/business";

export async function getAiReceptionist(): Promise<DbAiReceptionist> {
  const businessId = await getCurrentBusinessId();
  if (!businessId) return mockAiReceptionist;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("ai_receptionists")
    .select("*")
    .eq("business_id", businessId)
    .single();

  if (error || !data) return mockAiReceptionist;
  return data;
}

export async function getVoiceConfig(): Promise<DbAiVoiceConfig> {
  const businessId = await getCurrentBusinessId();
  if (!businessId) return mockVoiceConfig;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("ai_voice_configs")
    .select("*")
    .eq("business_id", businessId)
    .single();

  if (error || !data) return mockVoiceConfig;
  return data;
}
