import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/supabase/business";
import { mockAppointments } from "@/lib/mock/data";
import type { DbAppointment } from "@/lib/database/types";

export async function getAppointments(): Promise<DbAppointment[]> {
  if (!isSupabaseConfigured()) return mockAppointments;
  const businessId = await getCurrentBusinessId();
  if (!businessId) return mockAppointments;

  const supabase = createClient();
  const { data } = await supabase.from("appointments").select("*").eq("business_id", businessId).order("date", { ascending: true });
  return data || mockAppointments;
}
