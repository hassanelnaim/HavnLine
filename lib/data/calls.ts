import type { DbCall, DbCallMessage } from "@/lib/database/types";
import { mockCallMessages, mockCalls } from "@/lib/mock/data";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/supabase/business";

export async function getCalls(): Promise<DbCall[]> {
  const businessId = await getCurrentBusinessId();
  if (!businessId) {
    return [...mockCalls].sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
  }

  // Real business: return real rows even if empty — a brand-new business
  // genuinely has no calls yet, and showing demo data here would be wrong.
  const supabase = createClient();
  const { data, error } = await supabase
    .from("calls")
    .select("*")
    .eq("business_id", businessId)
    .order("started_at", { ascending: false });

  return error || !data ? [] : data;
}

export async function getCallById(id: string): Promise<DbCall | null> {
  const businessId = await getCurrentBusinessId();
  if (!businessId) return mockCalls.find((c) => c.id === id) ?? null;

  const supabase = createClient();
  const { data, error } = await supabase.from("calls").select("*").eq("id", id).single();
  return error || !data ? null : data;
}

export async function getCallMessages(callId: string): Promise<DbCallMessage[]> {
  const businessId = await getCurrentBusinessId();
  if (!businessId) return mockCallMessages[callId] ?? [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("call_messages")
    .select("*")
    .eq("call_id", callId)
    .order("created_at", { ascending: true });

  return error || !data ? [] : data;
}
