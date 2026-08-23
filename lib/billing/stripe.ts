import Stripe from "stripe";

/**
 * lib/billing/stripe.ts
 *
 * The only file that imports the Stripe SDK directly. One flat
 * subscription — no tiers, no usage-based limits. Payment collection
 * itself always happens on Stripe's own hosted pages (Checkout, and
 * the Customer Portal for managing/cancelling) — GetMade never
 * collects or stores card details itself.
 */

function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

/**
 * Creates a Stripe Checkout session for the single GetMade
 * subscription price and returns the URL to redirect the owner to.
 * Reuses an existing Stripe customer if this business already has one
 * (e.g. from a previous cancelled subscription).
 */
/**
 * Creates a Stripe Checkout session for the single HavnLine
 * subscription price and returns the URL to redirect the owner to.
 * Reuses an existing Stripe customer if this business already has one
 * (e.g. from a previous cancelled subscription).
 *
 * Every new subscription automatically includes a free trial (see
 * TRIAL_PERIOD_DAYS below) — the customer is charged nothing for the
 * first week, and Stripe automatically starts billing the full price
 * at the end of it unless they cancel first. This is the standard,
 * correct way to run "1 week free, then $X/month" — no separate
 * "free version" of the product is needed, it's the same subscription
 * with a trial attached.
 */
const TRIAL_PERIOD_DAYS = parseInt(process.env.TRIAL_PERIOD_DAYS || "7", 10);

export async function createCheckoutSession(input: {
  businessId: string;
  businessName: string;
  customerEmail: string;
  existingStripeCustomerId: string | null;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string | null; error?: string }> {
  const stripe = getStripeClient();
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!stripe || !priceId) {
    return { url: null, error: "Billing is not configured yet." };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      customer: input.existingStripeCustomerId || undefined,
      customer_email: input.existingStripeCustomerId ? undefined : input.customerEmail,
      client_reference_id: input.businessId,
      subscription_data: {
        trial_period_days: TRIAL_PERIOD_DAYS,
        metadata: { business_id: input.businessId, business_name: input.businessName },
      },
      metadata: { business_id: input.businessId },
    });
    return { url: session.url };
  } catch (err) {
    console.error("Stripe checkout session creation failed:", err);
    return { url: null, error: "Could not start checkout." };
  }
}

/**
 * Creates a Stripe Customer Portal session — this is where the owner
 * updates their payment method, views invoices, or cancels. GetMade
 * never builds its own version of these screens; Stripe's own hosted
 * portal is the source of truth and handles the sensitive parts.
 */
export async function createPortalSession(input: {
  stripeCustomerId: string;
  returnUrl: string;
}): Promise<{ url: string | null; error?: string }> {
  const stripe = getStripeClient();
  if (!stripe) {
    return { url: null, error: "Billing is not configured yet." };
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: input.stripeCustomerId,
      return_url: input.returnUrl,
    });
    return { url: session.url };
  } catch (err) {
    console.error("Stripe portal session creation failed:", err);
    return { url: null, error: "Could not open billing management." };
  }
}

export function constructWebhookEvent(rawBody: string, signature: string): Stripe.Event | null {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) return null;

  try {
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return null;
  }
}

/** Statuses that mean "the receptionist is allowed to operate." */
export const OPERATIONAL_SUBSCRIPTION_STATUSES = ["active", "trialing"];
