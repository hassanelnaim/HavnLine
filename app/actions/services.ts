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

export interface ImportServicesFromImageResult extends ActionResult {
  itemsAdded?: number;
}

/**
 * The dashboard equivalent of the onboarding photo-import feature —
 * for a business that's already live and wants to add more services
 * from a photo (a new menu, an updated price sheet, etc.), saving
 * directly to their real services list instead of a draft.
 */
export async function importServicesFromImageAction(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp"
): Promise<ImportServicesFromImageResult> {
  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  const admin = createAdminClient();
  const { data: business } = await admin.from("businesses").select("name").eq("id", businessId).single();

  const { extractServicesFromImage } = await import("@/lib/ai/websiteImport");

  let services;
  try {
    services = await extractServicesFromImage(business?.name || "this business", imageBase64, mediaType);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Could not process that photo." };
  }

  if (services.length === 0) {
    return { success: false, error: "Couldn't clearly read any services or prices in that photo — try a clearer, well-lit picture." };
  }

  const rows = services.map((s) => ({
    business_id: businessId,
    name: s.name,
    description: s.description || null,
    price_cents: Math.round((parseFloat(s.priceDollars) || 0) * 100),
    duration_minutes: s.durationMinutes,
    is_active: true,
  }));

  const { error } = await admin.from("services").insert(rows);
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/knowledge");
  revalidatePath("/dashboard/ai-employee");
  return { success: true, itemsAdded: services.length };
}
