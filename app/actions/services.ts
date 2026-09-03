"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentBusinessId } from "@/lib/supabase/business";
import type { ActionResult } from "./business";

async function requireBusinessId(): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const businessId = await getCurrentBusinessId();
  if (!businessId) throw new Error("No business found for this account.");
  return businessId;
}

export async function addServiceAction(input: { name: string; description: string; priceDollars: string; durationMinutes: number }): Promise<ActionResult> {
  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  if (!input.name.trim()) return { success: false, error: "Service name is required." };

  const admin = createAdminClient();
  const { error } = await admin.from("services").insert({
    business_id: businessId,
    name: input.name,
    description: input.description || null,
    price_cents: Math.round((parseFloat(input.priceDollars) || 0) * 100),
    duration_minutes: input.durationMinutes || 30,
    is_active: true,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard/knowledge");
  revalidatePath("/dashboard/ai-employee");
  return { success: true };
}

export async function deleteServiceAction(id: string): Promise<ActionResult> {
  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("services").delete().eq("id", id).eq("business_id", businessId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard/knowledge");
  return { success: true };
}
