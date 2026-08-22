"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper, Phone, CheckCircle2, Loader2 } from "lucide-react";
import { useOnboarding } from "@/lib/onboarding/context";
import { completeOnboardingAction } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function CompleteStep() {
  const router = useRouter();
  const { draft } = useOnboarding();
  const [provisioning, setProvisioning] = useState(false);
  const [provisioned, setProvisioned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  function handleProvision() {
    setProvisioning(true);
    // Phase 2: calls lib/integrations/twilio provisionNumber() for real.
    setTimeout(() => {
      setProvisioning(false);
      setProvisioned(true);
    }, 1100);
  }

  async function handleGoLive() {
    setSaving(true);
    setError(null);
    const result = await completeOnboardingAction(draft);
    setSaving(false);

    if (!result.success) {
      setError(result.error || "Something went wrong saving your business.");
      return;
    }
    setDemoMode(!!result.demoMode);
    setSaved(true);
  }

  return (
    <div className="animate-fade-up">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
        <PartyPopper className="h-5 w-5" />
      </div>
      <h1 className="mt-4 font-display text-[24px] font-semibold text-ink">
        {draft.businessName || "You"}&apos;re almost live
      </h1>
      <p className="mt-1.5 text-[13.5px] text-text-muted">
        Get a HavnLine phone number, then turn your receptionist on.
      </p>

      <Card className="mt-8 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper text-text-muted">
              <Phone className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-[13.5px] font-semibold text-ink">HavnLine phone number</div>
              <div className="text-[12px] text-text-muted">
                {provisioned ? "(845) 555-0100 — demo number" : "Not provisioned yet"}
              </div>
            </div>
          </div>
          {provisioned ? (
            <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-success">
              <CheckCircle2 className="h-4 w-4" /> Ready
            </span>
          ) : (
            <Button size="sm" variant="brand" onClick={handleProvision} disabled={provisioning}>
              {provisioning ? "Provisioning…" : "Get a number"}
            </Button>
          )}
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <div className="text-[12px] font-semibold uppercase tracking-wide text-text-faint">
          Setup summary
        </div>
        <dl className="mt-3 space-y-2 text-[13px]">
          <div className="flex justify-between">
            <dt className="text-text-muted">Business</dt>
            <dd className="font-medium text-text">{draft.businessName || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Receptionist</dt>
            <dd className="font-medium text-text">{draft.receptionistName || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Services</dt>
            <dd className="font-medium text-text">{draft.services.length} added</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Calendar</dt>
            <dd className="font-medium text-text">
              {draft.calendarProvider ? draft.calendarProvider.replace("_", " ") : "Not connected"}
            </dd>
          </div>
        </dl>
      </Card>

      {error && (
        <div className="mt-4 rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-3 text-[12.5px] text-danger">
          {error}
        </div>
      )}

      {saved && (
        <div className="mt-4 rounded-lg border border-success/20 bg-success-soft px-3.5 py-3 text-[12.5px] text-success">
          {demoMode
            ? "You're in demo mode (Supabase isn't connected), so nothing was saved — but everything below is wired up and ready."
            : "Your business is saved. Taking you to the dashboard…"}
        </div>
      )}

      <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
        <span />
        {saved ? (
          <Button variant="brand" size="lg" onClick={() => router.push("/dashboard")}>
            Go to dashboard
          </Button>
        ) : (
          <Button variant="brand" size="lg" onClick={handleGoLive} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              "Turn receptionist on"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
