import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { constructWebhookEvent } from "@/lib/billing/stripe";

/**
 * POST /api/webhooks/stripe
 *
 * This is the ONLY place subscription_status in the database gets
 * written. The Checkout success page (where the browser lands after
 * paying) never writes billing status itself — a browser redirect is
 * not proof of payment, only a verified webhook from Stripe is. This
 * also means refunds, failed renewals, and cancellations made directly
 * in Stripe's dashboard all stay correctly in sync automatically.
 *
 * Idempotent by design: re-applying the same subscription's latest
 * status is harmless even if Stripe redelivers an event.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing signature", { status: 400 });
  }

  const event = constructWebhookEvent(rawBody, signature);
  if (!event) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const businessId = session.client_reference_id || session.metadata?.business_id;
        if (businessId && session.customer) {
          await admin
            .from("businesses")
            .update({ stripe_customer_id: session.customer as string })
            .eq("id", businessId);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const businessId = subscription.metadata?.business_id;
        if (businessId) {
          // current_period_end lives per subscription item in this API
          // version, not on the subscription object itself — use the
          // first item's period end (a single-item subscription, which
          // is all HavnLine creates, only ever has one).
          const periodEndUnix = subscription.items.data[0]?.current_period_end;
          await admin
            .from("businesses")
            .update({
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              current_period_end: periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null,
            })
            .eq("id", businessId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const businessId = subscription.metadata?.business_id;
        if (businessId) {
          await admin
            .from("businesses")
            .update({ subscription_status: "canceled" })
            .eq("id", businessId);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        // Newer Stripe API versions nest the subscription reference
        // under invoice.parent.subscription_details rather than a
        // top-level field — read it defensively either way.
        const subscriptionRef =
          (invoice as any).subscription ??
          (invoice as any).parent?.subscription_details?.subscription;
        const subscriptionId =
          typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;

        if (subscriptionId) {
          await admin
            .from("businesses")
            .update({ subscription_status: "past_due" })
            .eq("stripe_subscription_id", subscriptionId);
        }
        break;
      }

      default:
        // Unhandled event types are fine to ignore — Stripe sends many
        // more events than we currently care about.
        break;
    }
  } catch (err) {
    console.error("Stripe webhook handler failed:", err);
    // Return 200 anyway for errors we've already logged, so Stripe
    // doesn't retry-storm us for a bug on our end — but genuinely
    // malformed/unverifiable events already returned 400 above.
  }

  return NextResponse.json({ received: true });
}
