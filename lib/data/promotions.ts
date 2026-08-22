import type { DbPromotion } from "@/lib/database/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/supabase/business";

export async function getPromotions(): Promise<DbPromotion[]> {
  const businessId = await getCurrentBusinessId();
  if (!businessId) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("business_id", businessId)
    .order("start_date", { ascending: false });

  return error || !data ? [] : data;
}
