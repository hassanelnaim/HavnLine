import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-paper text-text-faint"><Icon className="h-5 w-5" /></div>
      <div className="mt-3 font-display text-[15px] font-semibold text-ink">{title}</div>
      <p className="mt-1 text-[13px] text-text-muted">{description}</p>
    </div>
  );
}
