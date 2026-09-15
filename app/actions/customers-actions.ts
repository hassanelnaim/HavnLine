"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentBusinessId } from "@/lib/supabase/business";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function deleteCustomerAction(customerId: string): Promise<ActionResult> {
  const businessId = await getCurrentBusinessId();
  if (!businessId) return { success: false, error: "Not authenticated." };

  const admin = createAdminClient();
  // Scoped to this business's own ID too, not just the customer ID —
  // a guessed or leaked customer ID from another business should
  // never be deletable from here.
  const { error } = await admin.from("customers").delete().eq("id", customerId).eq("business_id", businessId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/customers");
  return { success: true };
}

/**
 * Real spam/scam handling — blocking a number here means the voice
 * webhook can reject their next call before the AI is ever invoked,
 * not just a label on this page.
 */
export async function blockNumberAction(phone: string, reason: string): Promise<ActionResult> {
  const businessId = await getCurrentBusinessId();
  if (!businessId) return { success: false, error: "Not authenticated." };

  const admin = createAdminClient();
  const { error } = await admin.from("blocked_numbers").insert({ business_id: businessId, phone, reason: reason || null });
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/customers");
  return { success: true };
}
