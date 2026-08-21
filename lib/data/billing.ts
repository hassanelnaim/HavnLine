import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/supabase/business";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export interface BillingInfo {
  status: "none" | "trialing" | "active" | "past_due" | "canceled";
  stripeCustomerId: string | null;
  currentPeriodEnd: string | null;
}

export async function getBillingInfo(): Promise<BillingInfo> {
  if (!isSupabaseConfigured()) {
    return { status: "active", stripeCustomerId: null, currentPeriodEnd: null };
  }

  const businessId = await getCurrentBusinessId();
  if (!businessId) {
    return { status: "none", stripeCustomerId: null, currentPeriodEnd: null };
  }

  const supabase = createClient();
  const { data } = await supabase
    .from("businesses")
    .select("subscription_status, stripe_customer_id, current_period_end")
    .eq("id", businessId)
    .single();

  return {
    status: (data?.subscription_status as BillingInfo["status"]) || "none",
    stripeCustomerId: data?.stripe_customer_id || null,
    currentPeriodEnd: data?.current_period_end || null,
  };
}

export function isSubscriptionOperational(status: BillingInfo["status"]): boolean {
  return status === "active" || status === "trialing";
}
