"use client";

import { useRouter } from "next/navigation";
import { useOnboarding } from "@/lib/onboarding/context";
import type { AiResponsibilities } from "@/lib/database/types";
import { StepShell } from "@/components/onboarding/step-shell";
import { Switch } from "@/components/ui/switch";

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
      title="What should your receptionist handle?"
      description="Pick what it's allowed to do. You can name it, pick its voice and tone, and fine-tune everything else afterward in your dashboard."
      backHref="/onboarding/services"
      onContinue={() => router.push("/onboarding/voice")}
    >
      <div className="divide-y divide-border-soft rounded-2xl border border-border bg-card">
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
    </StepShell>
  );
}
