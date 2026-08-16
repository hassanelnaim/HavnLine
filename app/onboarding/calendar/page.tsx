"use client";

import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { useOnboarding } from "@/lib/onboarding/context";
import { StepShell } from "@/components/onboarding/step-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { id: "google_calendar" as const, name: "Google Calendar", blurb: "Sync availability and bookings automatically." },
  { id: "microsoft_outlook" as const, name: "Microsoft Outlook", blurb: "Sync availability and bookings automatically." },
];

export default function CalendarStep() {
  const router = useRouter();
  const { draft, update } = useOnboarding();

  return (
    <StepShell
      title="Connect your calendar"
      description="Optional for now — you can also connect this later from Settings → Integrations."
      backHref="/onboarding/voice"
      onContinue={() => router.push("/onboarding/complete")}
      continueLabel="Continue"
    >
      <div className="space-y-3">
        {OPTIONS.map((opt) => (
          <Card
            key={opt.id}
            className={cn(
              "flex items-center justify-between p-4",
              draft.calendarProvider === opt.id && "border-brand"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper text-text-muted">
                <CalendarDays className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="text-[13.5px] font-semibold text-ink">{opt.name}</div>
                <div className="text-[12px] text-text-muted">{opt.blurb}</div>
              </div>
            </div>
            <Button
              variant={draft.calendarProvider === opt.id ? "brand" : "outline"}
              size="sm"
              onClick={() =>
                update({ calendarProvider: draft.calendarProvider === opt.id ? null : opt.id })
              }
            >
              {draft.calendarProvider === opt.id ? "Selected" : "Coming soon"}
            </Button>
          </Card>
        ))}
        <p className="text-[12px] text-text-faint">
          Real OAuth connections aren&apos;t wired up yet in this phase — selecting a provider
          just records your intent so setup is one click once it&apos;s live.
        </p>
      </div>
    </StepShell>
  );
}
