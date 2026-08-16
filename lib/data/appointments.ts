import type { DbAppointment } from "@/lib/database/types";
import { mockAppointments } from "@/lib/mock/data";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/supabase/business";

export async function getAppointments(): Promise<DbAppointment[]> {
  const businessId = await getCurrentBusinessId();
  if (!businessId) {
    return [...mockAppointments].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("business_id", businessId)
    .order("date", { ascending: true });

  return error || !data ? [] : data;
}

export async function getUpcomingAppointments(): Promise<DbAppointment[]> {
  const today = new Date().toISOString().slice(0, 10);
  const all = await getAppointments();
  return all.filter((a) => a.date >= today && a.status !== "cancelled");
}
