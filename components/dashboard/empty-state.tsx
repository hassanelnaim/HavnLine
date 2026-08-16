import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-paper text-text-faint">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-display text-[15px] font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-xs text-[13px] text-text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
