"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentBusinessId } from "@/lib/supabase/business";
import { createCheckoutSession, createPortalSession } from "@/lib/billing/stripe";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export interface BillingActionResult {
  url?: string;
  error?: string;
}

async function requireAuth(): Promise<{ businessId: string; email: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const businessId = await getCurrentBusinessId();
  if (!businessId) throw new Error("No business found for this account.");

  return { businessId, email: user.email || "" };
}

export async function startCheckoutAction(): Promise<BillingActionResult> {
  let auth: { businessId: string; email: string };
  try {
    auth = await requireAuth();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Not authenticated." };
  }

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("name, stripe_customer_id")
    .eq("id", auth.businessId)
    .single();

  const result = await createCheckoutSession({
    businessId: auth.businessId,
    businessName: business?.name || "HavnLine business",
    customerEmail: auth.email,
    existingStripeCustomerId: business?.stripe_customer_id || null,
    successUrl: `${SITE_URL}/dashboard/billing?checkout=success`,
    cancelUrl: `${SITE_URL}/dashboard/billing?checkout=cancelled`,
  });

  if (!result.url) {
    return { error: result.error || "Could not start checkout." };
  }
  return { url: result.url };
}

export async function openBillingPortalAction(): Promise<BillingActionResult> {
  let auth: { businessId: string; email: string };
  try {
    auth = await requireAuth();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Not authenticated." };
  }

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("stripe_customer_id")
    .eq("id", auth.businessId)
    .single();

  if (!business?.stripe_customer_id) {
    return { error: "No billing account found yet — subscribe first." };
  }

  const result = await createPortalSession({
    stripeCustomerId: business.stripe_customer_id,
    returnUrl: `${SITE_URL}/dashboard/billing`,
  });

  if (!result.url) {
    return { error: result.error || "Could not open billing management." };
  }
  return { url: result.url };
}
