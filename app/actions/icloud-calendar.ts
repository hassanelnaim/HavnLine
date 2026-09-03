"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentBusinessId } from "@/lib/supabase/business";
import { testICloudConnection } from "@/lib/integrations/calendar/icloudCalendarProvider";
import type { ActionResult } from "./business";

async function requireBusinessId(): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const businessId = await getCurrentBusinessId();
  if (!businessId) throw new Error("No business found for this account.");
  return businessId;
}

export async function connectICloudCalendarAction(appleId: string, appPassword: string): Promise<ActionResult> {
  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  if (!appleId.trim() || !appPassword.trim()) return { success: false, error: "Enter both your Apple ID and app-specific password." };

  const test = await testICloudConnection(appleId, appPassword);
  if (!test.success) return { success: false, error: test.reason || "Could not connect to iCloud Calendar." };

  const admin = createAdminClient();
  const { error } = await admin.from("integrations").upsert(
    { business_id: businessId, provider: "icloud_calendar", status: "connected", external_account_id: appleId, connected_at: new Date().toISOString(), metadata: { appleId, appPassword } },
    { onConflict: "business_id,provider" }
  );

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/integrations");
  return { success: true };
}

export async function disconnectICloudCalendarAction(): Promise<ActionResult> {
  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("integrations").update({ status: "not_connected", metadata: null, external_account_id: null }).eq("business_id", businessId).eq("provider", "icloud_calendar");

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/integrations");
  return { success: true };
}
