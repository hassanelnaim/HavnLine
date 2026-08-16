"use client";

import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const STEPS = [
  { path: "/onboarding/business-info", label: "Business" },
  { path: "/onboarding/hours", label: "Hours" },
  { path: "/onboarding/services", label: "Services" },
  { path: "/onboarding/ai-receptionist", label: "AI Receptionist" },
  { path: "/onboarding/voice", label: "Voice" },
  { path: "/onboarding/calendar", label: "Calendar" },
  { path: "/onboarding/complete", label: "Go live" },
];

export function StepperNav() {
  const pathname = usePathname();
  const currentIndex = Math.max(
    STEPS.findIndex((s) => s.path === pathname),
    0
  );
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  return (
    <div className="mb-10">
      <div className="mb-3 flex items-center justify-between text-[12px] text-text-muted">
        <span>
          Step {currentIndex + 1} of {STEPS.length}
        </span>
        <span>{STEPS[currentIndex]?.label}</span>
      </div>
      <Progress value={progress} />
      <div className="mt-4 hidden items-center gap-1 sm:flex">
        {STEPS.map((step, i) => (
          <div key={step.path} className="flex flex-1 items-center gap-1">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10.5px] font-medium",
                i < currentIndex && "bg-brand text-white",
                i === currentIndex && "bg-ink text-white",
                i > currentIndex && "bg-paper text-text-faint border border-border"
              )}
            >
              {i < currentIndex ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-px flex-1", i < currentIndex ? "bg-brand" : "bg-border")} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
