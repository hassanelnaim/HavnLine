import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  foot,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "neutral" | "brand" | "danger";
  foot?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-faint">
          {label}
        </span>
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            tone === "brand" && "bg-brand-soft text-brand-dark",
            tone === "danger" && "bg-danger-soft text-danger",
            tone === "neutral" && "bg-paper text-text-muted"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-3 font-display text-[26px] font-semibold text-ink">{value}</div>
      {foot && <div className="mt-1 text-[11.5px] text-text-faint">{foot}</div>}
    </div>
  );
}
