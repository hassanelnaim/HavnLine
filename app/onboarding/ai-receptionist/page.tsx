"use client";

import { useRouter } from "next/navigation";
import { useOnboarding } from "@/lib/onboarding/context";
import type { AiResponsibilities, Personality } from "@/lib/database/types";
import { StepShell } from "@/components/onboarding/step-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const PERSONALITIES: { id: Personality; label: string; blurb: string }[] = [
  { id: "professional", label: "Professional", blurb: "Polished and businesslike" },
  { id: "friendly", label: "Friendly", blurb: "Approachable and easygoing" },
  { id: "warm", label: "Warm", blurb: "Caring and reassuring" },
  { id: "energetic", label: "Energetic", blurb: "Upbeat, extra pep" },
  { id: "calm", label: "Calm", blurb: "Steady, never rattled" },
];

const RESPONSIBILITY_ITEMS: { key: keyof AiResponsibilities; label: string; hint: string }[] = [
  { key: "answer_questions", label: "Answering questions", hint: "Uses your business knowledge to respond" },
  { key: "schedule_appointments", label: "Scheduling appointments", hint: "Checks availability and books" },
  { key: "reschedule_appointments", label: "Rescheduling appointments", hint: "Moves existing bookings" },
  { key: "cancel_appointments", label: "Cancelling appointments", hint: "Cancels on the customer's request" },
  { key: "collect_customer_info", label: "Collecting customer info", hint: "Gets name and phone before booking" },
  { key: "escalate_to_human", label: "Escalating to a human", hint: "Hands off anything out of scope" },
];

export default function AiReceptionistStep() {
  const router = useRouter();
  const { draft, update } = useOnboarding();

  function toggleResponsibility(key: keyof AiResponsibilities) {
    update({
      responsibilities: { ...draft.responsibilities, [key]: !draft.responsibilities[key] },
    });
  }

  return (
    <StepShell
      title="Configure your AI receptionist"
      description="No prompt writing — pick a name, a personality, and what it's allowed to do."
      backHref="/onboarding/services"
      onContinue={() => router.push("/onboarding/voice")}
      continueDisabled={draft.receptionistName.trim().length === 0}
    >
      <div className="space-y-8">
        <div>
          <Label htmlFor="receptionistName">Receptionist name</Label>
          <Input
            id="receptionistName"
            className="mt-1.5 max-w-xs"
            placeholder="Alex"
            value={draft.receptionistName}
            onChange={(e) => update({ receptionistName: e.target.value })}
          />
        </div>

        <div>
          <Label>Personality</Label>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PERSONALITIES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => update({ personality: p.id })}
                className={cn(
                  "rounded-xl border px-3.5 py-3 text-left transition-colors",
                  draft.personality === p.id
                    ? "border-brand bg-brand-soft"
                    : "border-border bg-card hover:bg-paper"
                )}
              >
                <div
                  className={cn(
                    "text-[13px] font-medium",
                    draft.personality === p.id ? "text-brand-dark" : "text-text"
                  )}
                >
                  {p.label}
                </div>
                <div className="mt-0.5 text-[11.5px] text-text-muted">{p.blurb}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Main responsibilities</Label>
          <div className="mt-2 divide-y divide-border-soft rounded-2xl border border-border bg-card">
            {RESPONSIBILITY_ITEMS.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4 px-4 py-3.5">
                <div>
                  <div className="text-[13.5px] font-medium text-text">{item.label}</div>
                  <div className="text-[11.5px] text-text-muted">{item.hint}</div>
                </div>
                <Switch
                  checked={draft.responsibilities[item.key]}
                  onCheckedChange={() => toggleResponsibility(item.key)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </StepShell>
  );
}
