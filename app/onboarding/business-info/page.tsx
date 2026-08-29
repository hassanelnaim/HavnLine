"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/lib/onboarding/context";
import { createBusinessDraftAction } from "@/app/actions/business-draft";
import { StepShell } from "@/components/onboarding/step-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const BUSINESS_TYPES = [
  "Auto Repair",
  "Salon & Spa",
  "Dental Practice",
  "Medical Practice",
  "Law Firm",
  "Home Services",
  "Restaurant",
  "Other",
];

export default function BusinessInfoStep() {
  const router = useRouter();
  const { draft, update } = useOnboarding();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = draft.businessName.trim().length > 0 && draft.phone.trim().length > 0;

  async function handleContinue() {
    setSaving(true);
    setError(null);
    const result = await createBusinessDraftAction({
      businessName: draft.businessName,
      businessType: draft.businessType,
      address: draft.address,
      phone: draft.phone,
      description: draft.description,
    });
    setSaving(false);

    if (!result.success) {
      setError(result.error || "Could not save your business info.");
      return;
    }
    if (result.businessId) {
      update({ businessId: result.businessId });
    }
    router.push("/onboarding/hours");
  }

  return (
    <StepShell
      title="Tell us about your business"
      description="This is what your AI receptionist will introduce itself with."
      onContinue={handleContinue}
      continueDisabled={!canContinue || saving}
      continueLabel={saving ? "Saving…" : "Continue"}
    >
      <div className="space-y-5">
        {error && (
          <div className="rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger">
            {error}
          </div>
        )}
        <div>
          <Label htmlFor="businessName">Business name</Label>
          <Input
            id="businessName"
            className="mt-1.5"
            placeholder="Riverside Auto & Tire"
            value={draft.businessName}
            onChange={(e) => update({ businessName: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="businessType">Business type</Label>
          <select
            id="businessType"
            className="mt-1.5 flex h-9 w-full rounded-lg border border-border bg-card px-3 text-[13.5px] text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
            value={draft.businessType}
            onChange={(e) => update({ businessType: e.target.value })}
          >
            <option value="">Select a type…</option>
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            className="mt-1.5"
            placeholder="412 Riverside Pkwy, Millbrook, NY"
            value={draft.address}
            onChange={(e) => update({ address: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="phone">Business phone</Label>
          <Input
            id="phone"
            className="mt-1.5"
            placeholder="(845) 555-0142"
            value={draft.phone}
            onChange={(e) => update({ phone: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="description">Business description</Label>
          <Textarea
            id="description"
            rows={3}
            className="mt-1.5"
            placeholder="A family-owned auto shop specializing in routine maintenance and brake work…"
            value={draft.description}
            onChange={(e) => update({ description: e.target.value })}
          />
        </div>
      </div>
    </StepShell>
  );
}
