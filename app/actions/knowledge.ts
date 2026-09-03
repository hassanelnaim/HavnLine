"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentBusinessId } from "@/lib/supabase/business";
import { fetchWebsiteText, extractKnowledgeFromText } from "@/lib/ai/websiteImport";
import type { ActionResult } from "./business";
import type { KnowledgeCategory } from "@/lib/database/types";

async function requireBusinessId(): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const businessId = await getCurrentBusinessId();
  if (!businessId) throw new Error("No business found for this account.");
  return businessId;
}

export async function addKnowledgeItemAction(input: { category: KnowledgeCategory; question?: string; title?: string; content: string }): Promise<ActionResult> {
  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("knowledge_items").insert({
    business_id: businessId,
    category: input.category,
    question: input.question || null,
    title: input.title || null,
    content: input.content,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard/knowledge");
  return { success: true };
}

export async function deleteKnowledgeItemAction(id: string): Promise<ActionResult> {
  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("knowledge_items").delete().eq("id", id).eq("business_id", businessId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard/knowledge");
  return { success: true };
}

export interface ImportWebsiteResult extends ActionResult {
  itemsAdded?: number;
}

export async function importWebsiteKnowledgeAction(url: string): Promise<ImportWebsiteResult> {
  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  const admin = createAdminClient();
  const { data: business } = await admin.from("businesses").select("name").eq("id", businessId).single();

  let websiteText: string;
  try {
    websiteText = await fetchWebsiteText(url);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Could not load that website." };
  }

  let items;
  try {
    items = await extractKnowledgeFromText(business?.name || "this business", websiteText);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Could not process that website." };
  }

  if (items.length === 0) return { success: false, error: "Couldn't find any useful content on that page." };

  const rows = items.map((item) => ({ business_id: businessId, category: item.category, question: item.question || null, title: item.title || null, content: item.content }));
  const { error } = await admin.from("knowledge_items").insert(rows);
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/knowledge");
  return { success: true, itemsAdded: items.length };
}

export async function addPromotionAction(input: { title: string; description: string; appliesTo: string; startDate: string; endDate: string }): Promise<ActionResult> {
  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("promotions").insert({
    business_id: businessId,
    title: input.title,
    description: input.description,
    applies_to: input.appliesTo || null,
    start_date: input.startDate,
    end_date: input.endDate,
    is_active: true,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard/knowledge");
  return { success: true };
}

export async function togglePromotionAction(id: string, isActive: boolean): Promise<ActionResult> {
  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("promotions").update({ is_active: isActive }).eq("id", id).eq("business_id", businessId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard/knowledge");
  return { success: true };
}

export async function deletePromotionAction(id: string): Promise<ActionResult> {
  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("promotions").delete().eq("id", id).eq("business_id", businessId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard/knowledge");
  return { success: true };
}
