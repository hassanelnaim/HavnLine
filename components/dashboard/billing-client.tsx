"use client";

import { useState } from "react";
import { CreditCard, CheckCircle2, AlertTriangle } from "lucide-react";
import type { BillingInfo } from "@/lib/data/billing";
import { startCheckoutAction, openBillingPortalAction } from "@/app/actions/billing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATUS_META: Record<
  BillingInfo["status"],
  { label: string; variant: "success" | "brand" | "danger" | "neutral"; description: string }
> = {
  active: { label: "Active", variant: "success", description: "Your receptionist is fully operational." },
  trialing: { label: "Free trial", variant: "brand", description: "You're in your free trial — no charge until it ends." },
  past_due: { label: "Payment issue", variant: "danger", description: "Your last payment failed — update your payment method to keep your receptionist online." },
  canceled: { label: "Cancelled", variant: "neutral", description: "Your subscription has ended." },
  none: { label: "Not subscribed", variant: "neutral", description: "Start your 7-day free trial — no charge until it ends." },
};

export function BillingClient({
  billing,
  checkoutResult,
}: {
  billing: BillingInfo;
  checkoutResult?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = STATUS_META[billing.status];
  const hasSubscription = billing.status !== "none";

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    const result = await startCheckoutAction();
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.url) window.location.href = result.url;
  }

  async function handleManage() {
    setLoading(true);
    setError(null);
    const result = await openBillingPortalAction();
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.url) window.location.href = result.url;
  }

  return (
    <div className="max-w-xl">
      {checkoutResult === "success" && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-success/20 bg-success-soft px-3.5 py-2.5 text-[12.5px] text-success">
          <CheckCircle2 className="h-4 w-4" /> Subscription started — your receptionist is ready to go live.
        </div>
      )}
      {checkoutResult === "cancelled" && (
        <div className="mb-4 rounded-lg border border-border bg-paper px-3.5 py-2.5 text-[12.5px] text-text-muted">
          Checkout was cancelled — no charge was made.
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper text-text-muted">
              <CreditCard className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle>HavnLine — Full Access</CardTitle>
              <CardDescription>Everything included — one plan, no tiers or usage limits.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border-soft bg-paper px-4 py-3">
            <span className="text-[13px] font-medium text-text">Status</span>
            <Badge variant={meta.variant}>{meta.label}</Badge>
          </div>
          <p className="text-[13px] text-text-muted">{meta.description}</p>

          {billing.currentPeriodEnd && (billing.status === "active" || billing.status === "trialing") && (
            <p className="text-[12px] text-text-faint">
              Renews {new Date(billing.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            {hasSubscription ? (
              <Button variant="outline" onClick={handleManage} disabled={loading}>
                {loading ? "Opening…" : "Manage billing"}
              </Button>
            ) : (
              <Button variant="brand" onClick={handleSubscribe} disabled={loading}>
                {loading ? "Starting checkout…" : "Start 7-day free trial"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
