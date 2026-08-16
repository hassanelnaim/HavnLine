import type { DbKnowledgeItem } from "@/lib/database/types";
import { mockKnowledgeItems } from "@/lib/mock/data";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/supabase/business";

export async function getKnowledgeItems(): Promise<DbKnowledgeItem[]> {
  const businessId = await getCurrentBusinessId();
  if (!businessId) {
    return [...mockKnowledgeItems].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("knowledge_items")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  return error || !data ? [] : data;
}
