"use client";

import { useRouter } from "next/navigation";
import { CalendarDays, Apple } from "lucide-react";
import { StepShell } from "@/components/onboarding/step-shell";
import { Card } from "@/components/ui/card";

const OPTIONS = [
  { name: "Google Calendar", blurb: "Sync your real calendar and avoid double-bookings.", icon: CalendarDays },
  { name: "iCloud Calendar", blurb: "Same idea, for Apple/iCloud Calendar users.", icon: Apple },
];

export default function CalendarStep() {
  const router = useRouter();

  return (
    <StepShell
      title="Connect your calendar"
      description="Optional — your receptionist already checks real availability with zero setup. Connecting a calendar just adds two-way sync with the calendar you already use."
      backHref="/onboarding/voice"
      onContinue={() => router.push("/onboarding/complete")}
      continueLabel="Continue"
    >
      <div className="space-y-3">
        {OPTIONS.map((opt) => (
          <Card key={opt.name} className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper text-text-muted">
              <opt.icon className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-[13.5px] font-semibold text-ink">{opt.name}</div>
              <div className="text-[12px] text-text-muted">{opt.blurb}</div>
            </div>
          </Card>
        ))}
        <p className="text-[12px] text-text-faint">
          Both connect in one click from Dashboard → Integrations, right after setup — no need to do it now.
        </p>
      </div>
    </StepShell>
  );
}
