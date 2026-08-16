import type { DbAppointment, DbCall, DbCustomer } from "@/lib/database/types";
import { mockAppointments, mockCalls, mockCustomers } from "@/lib/mock/data";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/supabase/business";

export async function getCustomers(): Promise<DbCustomer[]> {
  const businessId = await getCurrentBusinessId();
  if (!businessId) {
    return [...mockCustomers].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false });

  return error || !data ? [] : data;
}

export async function getCustomerById(id: string): Promise<DbCustomer | null> {
  const businessId = await getCurrentBusinessId();
  if (!businessId) return mockCustomers.find((c) => c.id === id) ?? null;

  const supabase = createClient();
  const { data, error } = await supabase.from("customers").select("*").eq("id", id).single();
  return error || !data ? null : data;
}

export async function getCustomerCalls(customerId: string): Promise<DbCall[]> {
  const businessId = await getCurrentBusinessId();
  if (!businessId) return mockCalls.filter((c) => c.customer_id === customerId);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("calls")
    .select("*")
    .eq("customer_id", customerId)
    .order("started_at", { ascending: false });

  return error || !data ? [] : data;
}

export async function getCustomerAppointments(customerId: string): Promise<DbAppointment[]> {
  const businessId = await getCurrentBusinessId();
  if (!businessId) return mockAppointments.filter((a) => a.customer_id === customerId);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("customer_id", customerId)
    .order("date", { ascending: true });

  return error || !data ? [] : data;
}
