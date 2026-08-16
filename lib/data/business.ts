/**
 * data/business.ts
 *
 * Data-access functions for business profile, hours, and services.
 * Each function tries a real Supabase query scoped to the logged-in
 * user's business first; if Supabase isn't configured or the user has
 * no business yet, it falls back to the mock demo data so the app
 * still looks fully functional.
 */

import type { DbBusiness, DbBusinessHours, DbService } from "@/lib/database/types";
import { mockBusiness, mockBusinessHours, mockServices } from "@/lib/mock/data";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/supabase/business";

export async function getBusiness(): Promise<DbBusiness> {
  const businessId = await getCurrentBusinessId();
  if (!businessId) return mockBusiness;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();

  if (error || !data) return mockBusiness;
  return data;
}

export async function getBusinessHours(): Promise<DbBusinessHours[]> {
  const businessId = await getCurrentBusinessId();
  if (!businessId) return mockBusinessHours;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("business_hours")
    .select("*")
    .eq("business_id", businessId);

  if (error || !data || data.length === 0) return mockBusinessHours;
  return data;
}

export async function getServices(): Promise<DbService[]> {
  const businessId = await getCurrentBusinessId();
  if (!businessId) return mockServices;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  if (error || !data) return mockServices;
  return data;
}
