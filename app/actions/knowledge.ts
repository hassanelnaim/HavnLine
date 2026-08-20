"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentBusinessId } from "@/lib/supabase/business";
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
