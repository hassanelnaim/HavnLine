"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentBusinessId } from "@/lib/supabase/business";
import { fetchWebsiteText, extractKnowledgeFromText } from "@/lib/ai/websiteImport";
import type { KnowledgeCategory } from "@/lib/database/types";
import type { ActionResult } from "./business";

async function requireBusinessId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const businessId = await getCurrentBusinessId();
  if (!businessId) throw new Error("No business found for this account.");
  return businessId;
}

export async function addKnowledgeItemAction(input: {
  category: KnowledgeCategory;
  question?: string;
  title?: string;
  content: string;
}): Promise<ActionResult> {
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
  // Scope the delete to this business explicitly, even though the admin
  // client bypasses RLS — never trust an id alone without this check.
  const { error } = await admin.from("knowledge_items").delete().eq("id", id).eq("business_id", businessId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard/knowledge");
  return { success: true };
}

export interface ImportWebsiteResult extends ActionResult {
  imported?: number;
}

/**
 * Fetches the business's website, has Claude extract genuine FAQs /
 * services / policies / general info from it, and saves each as a real
 * knowledge_items row — so the AI has real answers ready for questions
 * that were never manually typed into the Knowledge page.
 */
export async function importWebsiteKnowledgeAction(url: string): Promise<ImportWebsiteResult> {
  let businessId: string;
  try {
    businessId = await requireBusinessId();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  if (!url.trim()) {
    return { success: false, error: "Enter a website URL first." };
  }

  const admin = createAdminClient();
  const { data: business } = await admin.from("businesses").select("name").eq("id", businessId).single();

  let websiteText: string;
  try {
    websiteText = await fetchWebsiteText(url);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Could not read that website." };
  }

  let items;
  try {
    items = await extractKnowledgeFromText(business?.name || "this business", websiteText);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Could not process that website." };
  }

  if (items.length === 0) {
    return {
      success: false,
      error: "Couldn't find anything usable on that page. Try a different page (e.g. an FAQ or About page).",
    };
  }

  const rows = items.map((item) => ({
    business_id: businessId,
    category: item.category,
    question: item.question || null,
    title: item.title || null,
    content: item.content,
  }));

  const { error: insertError } = await admin.from("knowledge_items").insert(rows);
  if (insertError) return { success: false, error: insertError.message };

  // Save the site as the business's website on file too, if not set yet.
  await admin.from("businesses").update({ website: url.trim() }).eq("id", businessId).is("website", null);

  revalidatePath("/dashboard/knowledge");
  return { success: true, imported: rows.length };
}
