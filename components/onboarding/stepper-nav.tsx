"use client";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const STEPS = [
  { path: "/onboarding/business-info", label: "Business" },
  { path: "/onboarding/hours", label: "Hours" },
  { path: "/onboarding/services", label: "Services" },
  { path: "/onboarding/ai-receptionist", label: "AI" },
  { path: "/onboarding/voice", label: "Voice" },
  { path: "/onboarding/calendar", label: "Calendar" },
  { path: "/onboarding/complete", label: "Go live" },
];

export function StepperNav() {
  const pathname = usePathname();
  const currentIndex = STEPS.findIndex((s) => s.path === pathname);

  return (
    <div className="mb-8 flex items-center gap-1.5">
      {STEPS.map((step, i) => (
        <div key={step.path} className={cn("h-1.5 flex-1 rounded-full", i <= currentIndex ? "bg-brand" : "bg-border-soft")} />
      ))}
    </div>
  );
}
