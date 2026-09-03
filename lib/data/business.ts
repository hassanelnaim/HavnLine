import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/supabase/business";
import { mockBusiness, mockBusinessHours, mockServices } from "@/lib/mock/data";
import type { DbBusiness, DbBusinessHours, DbService } from "@/lib/database/types";

export async function getBusiness(): Promise<DbBusiness> {
  if (!isSupabaseConfigured()) return mockBusiness;
  const businessId = await getCurrentBusinessId();
  if (!businessId) return mockBusiness;

  const supabase = createClient();
  const { data } = await supabase.from("businesses").select("*").eq("id", businessId).single();
  return data || mockBusiness;
}

export async function getBusinessHours(): Promise<DbBusinessHours[]> {
  if (!isSupabaseConfigured()) return mockBusinessHours;
  const businessId = await getCurrentBusinessId();
  if (!businessId) return mockBusinessHours;

  const supabase = createClient();
  const { data } = await supabase.from("business_hours").select("*").eq("business_id", businessId);
  return data || mockBusinessHours;
}

export async function getServices(): Promise<DbService[]> {
  if (!isSupabaseConfigured()) return mockServices;
  const businessId = await getCurrentBusinessId();
  if (!businessId) return mockServices;

  const supabase = createClient();
  const { data } = await supabase.from("services").select("*").eq("business_id", businessId).order("created_at");
  return data || mockServices;
}
